// ─── Voraly Sync Engine · Détecteur de connexion plateforme (content script) ──
// Tourne EN PAGE sur fiverr / upwork / malt. Détecte quand le freelance est
// connecté, puis prévient le service worker (PLATFORM_LOGGED_IN) qui, si la
// fenêtre était une popup de connexion qu'il a ouverte, la ferme et enregistre
// l'état « connecté ». Aucune donnée sensible ne transite : seul le nom de la
// plateforme est envoyé.
//
// Deux stratégies de détection selon la plateforme :
//   • Fiverr  → PAS d'API /me publique. On lit la session dans les globals SSR
//     (window.__PERSEUS__initialProps.userData). Comme un content script tourne
//     dans un monde JS isolé et ne voit pas ces globals, la lecture est faite par
//     fiverr-session-probe.js (monde MAIN) qui nous relaie l'état par postMessage.
//     → AUCUNE requête réseau, donc plus de spam 404 sur un endpoint inexistant.
//   • Upwork / Malt → endpoint JSON same-origin, polling BORNÉ qui s'arrête net si
//     l'endpoint répond 404 (inexistant) pour ne jamais marteler les logs.
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
  // Endpoints JSON same-origin (Upwork/Malt uniquement — Fiverr n'en a pas). À CALIBRER.
  const SESSION_CHECK_PATH = {
    upwork: '/api/auth/v1/info.json',
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

  // ── Upwork / Malt : endpoint JSON same-origin, polling borné, stop si 404. ──
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
      if (res.status === 404) return 'missing' // endpoint inexistant → ne pas réessayer
      // 'manual' renvoie un type 'opaqueredirect' (status 0) si redirigé.
      if (res.type === 'opaqueredirect') return 'no'
      if (res.status === 401 || res.status === 403 || res.status === 0) return 'no'
      if (!res.ok) return 'no'
      const ct = res.headers.get('content-type') ?? ''
      // Une réponse JSON exploitable suffit : on ne lit PAS le contenu (vie privée).
      return ct.includes('json') ? 'yes' : 'no'
    } catch {
      return 'no' // CSP / réseau : on réessaiera dans la fenêtre bornée.
    }
  }

  async function tick() {
    if (reported) return
    const state = await probeEndpoint()
    if (state === 'yes') {
      reportConnected()
      return
    }
    if (state === 'missing') {
      stop() // endpoint absent : inutile de marteler (anti-spam logs).
      return
    }
    elapsed += POLL_INTERVAL_MS
    if (elapsed >= MAX_DURATION_MS) stop()
  }

  // Vérification immédiate (session déjà ouverte) puis polling borné.
  tick()
  timer = setInterval(tick, POLL_INTERVAL_MS)
})()
