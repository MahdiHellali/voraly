// ─── Voraly Sync Engine · Bridge (content script sur voraly.net) ──────────────
// Pont entre le dashboard (page voraly.net) et le service worker. Relaie :
//   • le token d'auth        → SET_TOKEN
//   • une demande de connexion plateforme → CONNECT_PLATFORM (ouvre la popup)
//   • une requête d'état     → GET_CONNECTIONS (réponse re-postée à la page)
// Content script = script classique (pas de module).
//
// Côté dashboard, émettre (origine cible = https://voraly.net) :
//   window.postMessage({ type: "VORALY_AUTH_TOKEN", token, expiresAt }, origin)
//   window.postMessage({ type: "VORALY_CONNECT_PLATFORM", platform }, origin)
//   window.postMessage({ type: "VORALY_GET_CONNECTIONS" }, origin)
// et écouter la réponse :
//   { type: "VORALY_CONNECTIONS", connections: { fiverr: {...}, ... } }

;(() => {
  // Allowlist STRICTE des origines acceptées (jamais "*"). Pour un test local,
  // ajouter temporairement 'http://localhost:3000' (+ manifest host_permissions
  // et content_scripts matches), puis le retirer avant le push prod.
  const ALLOWED_ORIGINS = ['https://voraly.net']
  // Origine de la page courante, utilisée pour re-poster vers le dashboard.
  const PAGE_ORIGIN = ALLOWED_ORIGINS.includes(window.location.origin)
    ? window.location.origin
    : null
  const SUPPORTED = ['fiverr', 'upwork', 'malt']

  window.addEventListener('message', (event) => {
    // Validation STRICTE de l'origine (jamais "*") + message émis par la page.
    if (!ALLOWED_ORIGINS.includes(event.origin)) return
    if (event.source !== window) return

    const data = event.data
    if (!data || typeof data.type !== 'string') return

    switch (data.type) {
      case 'VORALY_AUTH_TOKEN': {
        if (typeof data.token !== 'string' || data.token.length < 10) return
        chrome.runtime.sendMessage({
          type: 'SET_TOKEN',
          token: data.token,
          expiresAt: typeof data.expiresAt === 'string' ? data.expiresAt : null,
        })
        return
      }

      case 'VORALY_CONNECT_PLATFORM': {
        if (!SUPPORTED.includes(data.platform)) return
        chrome.runtime.sendMessage({
          type: 'CONNECT_PLATFORM',
          platform: data.platform,
        })
        return
      }

      case 'VORALY_GET_CONNECTIONS': {
        // Confirme la PRÉSENCE de l'extension à chaque ping (robuste même si le
        // READY initial a été émis avant que le dashboard n'écoute, ou si le SW
        // dort et ne renvoie pas les connexions).
        if (PAGE_ORIGIN) window.postMessage({ type: 'VORALY_EXTENSION_READY' }, PAGE_ORIGIN)
        chrome.runtime.sendMessage({ type: 'GET_CONNECTIONS' }, (res) => {
          // Avale une éventuelle erreur de canal (SW endormi) sans throw.
          if (chrome.runtime.lastError) return
          if (!PAGE_ORIGIN) return
          window.postMessage(
            {
              type: 'VORALY_CONNECTIONS',
              connections: res?.connections ?? {},
            },
            PAGE_ORIGIN,
          )
        })
        return
      }
    }
  })

  // Signale au dashboard que l'extension est présente (pour afficher le bon CTA).
  if (PAGE_ORIGIN) window.postMessage({ type: 'VORALY_EXTENSION_READY' }, PAGE_ORIGIN)
})()
