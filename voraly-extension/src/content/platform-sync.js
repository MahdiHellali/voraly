// ─── Voraly Sync Engine · Lecteur de métriques in-page (content script) ───────
// PHASE 3. Tourne EN PAGE sur fiverr / upwork / malt (jamais en arrière-plan
// credentialed cross-site — approche rejetée, cf. décision projet). Quand le
// freelance navigue sur sa plateforme (déjà connecté depuis la Phase 1), ce
// script lit ses métriques via un endpoint same-origin (les cookies HttpOnly
// circulent normalement ici) puis les transmet au service worker, qui les POST
// au backend Voraly avec le Bearer token de l'utilisateur.
//
// Confidentialité / sécurité :
//   • Lecture SAME-ORIGIN uniquement (aucun host_permissions plateforme requis).
//   • On extrait 4 KPIs seulement (revenus, solde, commandes, note), jamais le
//     payload brut côté client.
//   • Garde client souple (6h) pour ne pas re-fetcher l'API plateforme à chaque
//     navigation ; le serveur impose la vraie limite (5h, non contournable).
//
// Content script = script classique (pas de module) → tout est inliné (doit
// rester aligné avec src/lib/config.js).

;(() => {
  // Garde anti double-injection (re-navigations SPA, ré-exécutions).
  if (window.__voralySyncEngineActive) return
  window.__voralySyncEngineActive = true

  const HOSTNAME_TO_PLATFORM = [
    { test: /(^|\.)fiverr\.com$/i, platform: 'fiverr' },
    { test: /(^|\.)upwork\.com$/i, platform: 'upwork' },
    { test: /(^|\.)malt\.(fr|com)$/i, platform: 'malt' },
  ]

  // ⚠ TODO(calibrate) : ces endpoints sont des HYPOTHÈSES à vérifier via
  // DevTools › Network sur une vraie session de chaque plateforme (chercher la
  // requête XHR qui renvoie le JSON de revenus). Chemins RELATIFS → construits
  // sur l'origine courante de la page → toujours same-origin.
  const EARNINGS_PATH = {
    fiverr: '/api/v1/me/earnings',
    upwork: '/api/v3/freelancer/earnings',
    malt: '/api/freelancer/insights',
  }

  // Garde client souple : ne pas re-interroger l'API plateforme si un sync a
  // déjà eu lieu il y a moins de 6h (> la borne serveur de 5h pour rester sous
  // le seuil et éviter un 429 systématique).
  const CLIENT_MIN_INTERVAL_MS = 6 * 60 * 60 * 1000
  const LAST_SYNC_KEY = 'voraly_last_sync' // = STORAGE_KEYS.lastSync

  const match = HOSTNAME_TO_PLATFORM.find((m) => m.test.test(location.hostname))
  if (!match) return
  const platform = match.platform
  const path = EARNINGS_PATH[platform]
  if (!path) return
  const endpoint = location.origin + path

  /** @returns {Promise<boolean>} true si un sync récent (<6h) existe déjà. */
  async function recentlySynced() {
    try {
      const v = await chrome.storage.local.get(LAST_SYNC_KEY)
      const last = (v[LAST_SYNC_KEY] ?? {})[platform]
      if (!last) return false
      return Date.now() - new Date(last).getTime() < CLIENT_MIN_INTERVAL_MS
    } catch {
      return false // en cas de doute, on autorise le sync (le serveur arbitre).
    }
  }

  /** Coerce en nombre fini, sinon 0. Le clamp/validation final est côté serveur. */
  function n(value) {
    const x = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(x) ? x : 0
  }

  // ⚠ TODO(calibrate) : adapter ces chemins d'extraction au schéma JSON réel de
  // chaque plateforme (à relever en DevTools). On lit défensivement plusieurs
  // alias plausibles pour maximiser les chances sans casser si un champ manque.
  function parseMetrics(data) {
    if (!data || typeof data !== 'object') return null
    const d = data
    switch (platform) {
      case 'fiverr':
        return {
          totalEarnings: n(d.totalEarnings ?? d.total_earnings ?? d.earnings?.total),
          pendingBalance: n(d.pendingBalance ?? d.pending ?? d.earnings?.pending),
          activeOrders: n(d.activeOrders ?? d.active_orders ?? d.orders?.active),
          rating: n(d.rating ?? d.seller_rating ?? d.ratings?.average),
        }
      case 'upwork':
        return {
          totalEarnings: n(d.totalEarnings ?? d.total ?? d.earnings?.lifetime),
          pendingBalance: n(d.pendingBalance ?? d.inProgress ?? d.earnings?.inProgress),
          activeOrders: n(d.activeContracts ?? d.activeOrders ?? d.contracts?.active),
          rating: n(d.jss ?? d.rating ?? d.successScore),
        }
      case 'malt':
        return {
          totalEarnings: n(d.totalEarnings ?? d.revenue ?? d.insights?.revenue),
          pendingBalance: n(d.pendingBalance ?? d.pending ?? d.insights?.pending),
          activeOrders: n(d.activeMissions ?? d.activeOrders ?? d.missions?.active),
          rating: n(d.rating ?? d.averageRating ?? d.reviews?.average),
        }
      default:
        return null
    }
  }

  /** Transmet un message au service worker en avalant proprement les erreurs. */
  function report(payload) {
    try {
      chrome.runtime.sendMessage({ type: 'SYNC_METRICS', platform, ...payload }, () => {
        // Avale lastError (service worker endormi) sans throw.
        void chrome.runtime.lastError
      })
    } catch {
      // Service worker indisponible : best-effort, on réessaiera à la prochaine visite.
    }
  }

  async function sync() {
    if (await recentlySynced()) return

    let res
    try {
      res = await fetch(endpoint, {
        method: 'GET',
        credentials: 'same-origin', // cookies de session de la plateforme
        cache: 'no-store',
        headers: { Accept: 'application/json' },
        redirect: 'manual', // une redirection = session expirée (page de login)
      })
    } catch {
      return // CSP / réseau / endpoint à recalibrer : on réessaiera plus tard.
    }

    // Session expirée → on le signale (le backend marque sync_status).
    if (res.type === 'opaqueredirect' || res.status === 401 || res.status === 403) {
      report({ error: 'session_expired' })
      return
    }
    if (!res.ok) return
    const ct = res.headers.get('content-type') ?? ''
    if (!ct.includes('json')) return

    let data
    try {
      data = await res.json()
    } catch {
      return
    }

    const metrics = parseMetrics(data)
    if (!metrics) return
    report({ metrics })
  }

  // On-demand : une seule tentative au chargement de la page (pas de polling).
  sync()
})()
