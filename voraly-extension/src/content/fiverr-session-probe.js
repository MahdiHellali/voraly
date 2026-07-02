// ─── Voraly Sync Engine · Sonde de session Fiverr (monde MAIN) ────────────────
// Tourne dans le MONDE MAIN de la page (les globals Fiverr sont accessibles),
// contrairement au content script isolé (platform-login.js) qui ne les voit PAS.
// Fiverr n'expose pas d'API /me publique : on lit la session directement dans
// window.__PERSEUS__initialProps (JSON injecté SSR par Fiverr, contient userData
// quand l'utilisateur est connecté) et on la relaie au content script isolé via
// window.postMessage. AUCUNE requête réseau → zéro 404, zéro bruit console.
//
// Le monde MAIN ne peut PAS utiliser chrome.* : la seule voie vers l'extension
// est postMessage, capté côté isolé par platform-login.js.

;(() => {
  const CHANNEL = 'voraly:fiverr-session'
  const INTERVAL_MS = 2000
  const MAX_CHECKS = 30 // ~60 s borné (couvre la connexion en cours), puis arrêt

  let checks = 0
  let posted = 0
  let timer = null

  /** @returns {boolean} true si les données SSR portent un utilisateur connecté. */
  function isLoggedIn() {
    try {
      const raw = window.__PERSEUS__initialProps
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw
      return !!data?.userData?.id
    } catch {
      return false
    }
  }

  function stop() {
    if (timer) clearInterval(timer)
    timer = null
  }

  function check() {
    checks += 1
    if (isLoggedIn()) {
      // Relaie au content script isolé (même origine, même fenêtre). Émis quelques
      // fois pour couvrir la course d'attachement du listener, puis on arrête.
      window.postMessage({ channel: CHANNEL, loggedIn: true }, window.location.origin)
      posted += 1
      if (posted >= 3) stop()
      return
    }
    if (checks >= MAX_CHECKS) stop()
  }

  check()
  timer = setInterval(check, INTERVAL_MS)
})()
