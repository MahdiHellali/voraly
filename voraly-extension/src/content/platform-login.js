// ─── Voraly Sync Engine · Détecteur de connexion plateforme (content script) ──
// Tourne EN PAGE sur fiverr / upwork / malt. Détecte quand le freelance est
// connecté en interrogeant un endpoint /me same-origin (les cookies HttpOnly
// circulent normalement ici, contrairement au fetch cross-site du SW).
// Au premier succès, prévient le service worker (PLATFORM_LOGGED_IN) qui, si la
// fenêtre était une popup de connexion qu'il a ouverte, la ferme et enregistre
// l'état « connecté ». Aucune donnée sensible ne transite : seul le nom de la
// plateforme est envoyé.
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
  const SESSION_CHECK = {
    fiverr: 'https://www.fiverr.com/api/v1/me',
    upwork: 'https://www.upwork.com/api/auth/v1/info.json',
    malt: 'https://www.malt.fr/api/me',
  }

  const POLL_INTERVAL_MS = 3000
  const MAX_DURATION_MS = 5 * 60 * 1000 // aligné sur CONNECT_TIMEOUT_MS

  const match = HOSTNAME_TO_PLATFORM.find((m) => m.test.test(location.hostname))
  if (!match) return
  const platform = match.platform
  const endpoint = SESSION_CHECK[platform]
  if (!endpoint) return

  let reported = false
  let elapsed = 0
  let timer = null

  /** @returns {Promise<boolean>} true si la session plateforme est active. */
  async function isLoggedIn() {
    try {
      const res = await fetch(endpoint, {
        method: 'GET',
        credentials: 'same-origin', // cookies de session de la plateforme
        cache: 'no-store',
        headers: { Accept: 'application/json' },
        redirect: 'manual', // une redirection = non authentifié (login)
      })
      // 'manual' renvoie un type 'opaqueredirect' (status 0) si redirigé.
      if (res.type === 'opaqueredirect') return false
      if (res.status === 401 || res.status === 403 || res.status === 0) return false
      if (!res.ok) return false
      const ct = res.headers.get('content-type') ?? ''
      if (!ct.includes('json')) return false
      // Une réponse JSON exploitable suffit : on ne lit PAS le contenu (vie privée).
      return true
    } catch {
      return false // CSP / réseau / endpoint à recalibrer : on réessaiera.
    }
  }

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

  async function tick() {
    if (reported) return
    if (await isLoggedIn()) {
      reportConnected()
      return
    }
    elapsed += POLL_INTERVAL_MS
    if (elapsed >= MAX_DURATION_MS) stop()
  }

  // Vérification immédiate (session déjà ouverte) puis polling.
  tick()
  timer = setInterval(tick, POLL_INTERVAL_MS)
})()
