// ─── Voraly Sync Engine · Détecteur de connexion plateforme (content script) ──
// Tourne EN PAGE sur fiverr / upwork / malt. Détecte quand le freelance est
// connecté, puis prévient le service worker (PLATFORM_LOGGED_IN) qui, si la
// fenêtre était une popup de connexion qu'il a ouverte, la ferme et enregistre
// l'état « connecté ». Aucune donnée sensible ne transite : seul le nom de la
// plateforme est envoyé.
//
// Stratégies de détection :
//   • Fiverr  → lecture SSR globals via MAIN-world probe (fiverr-session-probe.js)
//   • Upwork  → DOM polling (bouton login absent = connecté) + endpoint JSON fallback
//   • Malt    → endpoint JSON same-origin /api/me
//
// Content script = script classique (pas de module) → config inlinée (doit
// rester aligné avec src/lib/config.js).

;(() => {
  // Garde anti double-injection (re-navigations SPA, ré-exécutions).
  if (window.__voralyLoginDetectorActive) return
  window.__voralyLoginDetectorActive = true

  const HOSTNAME_TO_PLATFORM = [
    { test: /(^|\.)fiverr\.com$/i, platform: 'fiverr' },
    { test: /(^|\.)upwork\.com$/i, platform: 'upwork' },
    { test: /(^|\.)malt\.(fr|com)$/i, platform: 'malt' },
  ]
  // Canal partagé avec fiverr-session-probe.js (monde MAIN).
  const FIVERR_CHANNEL = 'voraly:fiverr-session'
  // Endpoint JSON same-origin pour Malt uniquement.
  // Upwork n'a pas d'endpoint JSON exploitable → détection DOM (plus bas).
  const SESSION_CHECK_PATH = {
    malt: '/api/me',
  }

  const POLL_INTERVAL_MS = 3000
  const MAX_DURATION_MS = 5 * 60 * 1000 // aligné sur CONNECT_TIMEOUT_MS

  const match = HOSTNAME_TO_PLATFORM.find((m) => m.test.test(location.hostname))
  if (!match) return
  const platform = match.platform

  let reported = false
  let timer = null

  function stop() {
    if (timer) clearInterval(timer)
    timer = null
  }

  function reportConnected() {
    if (reported) return
    reported = true
    stop()
    try {
      chrome.runtime.sendMessage({ type: 'PLATFORM_LOGGED_IN', platform })
    } catch {
      // Service worker indisponible : sans gravité, la détection est best-effort.
    }
  }

  // ── Fiverr : la sonde MAIN-world nous relaie l'état de session (zéro réseau). ──
  if (platform === 'fiverr') {
    window.addEventListener('message', (event) => {
      // N'accepte que les messages de NOTRE page, même origine, même fenêtre.
      if (event.source !== window || event.origin !== location.origin) return
      const data = event.data
      if (data?.channel === FIVERR_CHANNEL && data.loggedIn === true) {
        reportConnected()
      }
    })
    return
  }

  // ── Upwork : détection DOM (pas d'API JSON exploitable) ──
  if (platform === 'upwork') {
    const UPWORK_POLL_MS = 2500 // sondage un peu plus rapide que le défaut
    let elapsed = 0

    /** Vérifie si le DOM montre un utilisateur connecté (pas de bouton login visible). */
    function isDomLoggedIn() {
      try {
        // Stratégie 1 : bouton "Log In" / "Sign In" visible = non connecté
        const loginButtons = document.querySelectorAll(
          'a[href*="login"], button[href*="login"], a[href*="sign-in"], a[href*="signin"]'
        )
        for (const btn of loginButtons) {
          if (btn.offsetParent !== null) return false // bouton visible → non connecté
        }

        // Stratégie 2 : bouton/zone utilisateur avec nom ou avatar
        const userElements = document.querySelectorAll(
          '[data-test*="user"], [data-test*="profile"], [class*="user-menu"], [class*="user-avatar"], button[aria-label*="profile"], button[aria-label*="account"]'
        )
        if (userElements.length > 0) return true

        // Stratégie 3 : liens de navigation post-login (ex: My Jobs, Messages)
        const navLinks = document.querySelectorAll('a[href*="/messages"], a[href*="/my-jobs"], a[href*="/reports"], a[class*="navbar"]')
        for (const link of navLinks) {
          if (link.offsetParent !== null) return true
        }

        return false
      } catch {
        return false
      }
    }

    async function tickUpwork() {
      if (reported) return
      if (isDomLoggedIn()) {
        // Vérification supplémentaire : l'endpoint JSON (même si pas JSON) existe → on tente
        // un fetch pour confirmer que le user n'est PAS en redirection vers login.
        try {
          const res = await fetch(location.origin + '/freelance/api/v3/profile/me', {
            credentials: 'same-origin',
            cache: 'no-store',
            redirect: 'manual',
          })
          if (res.type === 'opaqueredirect') return // redirection → non connecté
          // Si status OK (200) et DOM connecté → on valide
          if (res.ok) {
            reportConnected()
            return
          }
          // Même avec 403, si le DOM montre un user connecté (parfois Upwork protège l'API),
          // on considère le user logged-in après quelques ticks pour être sûr.
          if (elapsed >= UPWORK_POLL_MS * 3) {
            reportConnected()
            return
          }
        } catch {
          // Réseau/DOM → on continue de poller
        }
      }
      elapsed += UPWORK_POLL_MS
      if (elapsed >= MAX_DURATION_MS) stop()
    }

    tickUpwork()
    timer = setInterval(tickUpwork, UPWORK_POLL_MS)
    return
  }

  // ── Malt : endpoint JSON same-origin, polling borné, stop si 404. ──
  if (platform === 'malt') {
    const path = SESSION_CHECK_PATH[platform]
    if (!path) return
    const endpoint = location.origin + path
    let elapsed = 0

    /** @returns {Promise<'yes'|'no'|'missing'>} état de session via l'endpoint. */
    async function probeEndpoint() {
      try {
        const res = await fetch(endpoint, {
          method: 'GET',
          credentials: 'same-origin', // cookies de session de la plateforme
          cache: 'no-store',
          headers: { Accept: 'application/json' },
          redirect: 'manual', // une redirection = non authentifié (login)
        })
        if (res.status === 404) return 'missing'
        if (res.type === 'opaqueredirect') return 'no'
        if (res.status === 401 || res.status === 403 || res.status === 0) return 'no'
        if (!res.ok) return 'no'
        const ct = res.headers.get('content-type') ?? ''
        return ct.includes('json') ? 'yes' : 'no'
      } catch {
        return 'no'
      }
    }

    async function tickMalt() {
      if (reported) return
      const state = await probeEndpoint()
      if (state === 'yes') {
        reportConnected()
        return
      }
      if (state === 'missing') {
        stop()
        return
      }
      elapsed += POLL_INTERVAL_MS
      if (elapsed >= MAX_DURATION_MS) stop()
    }

    tickMalt()
    timer = setInterval(tickMalt, POLL_INTERVAL_MS)
    return
  }
})()
