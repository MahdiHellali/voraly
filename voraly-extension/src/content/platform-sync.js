// ─── Voraly Sync Engine · Lecteur de métriques in-page (content script) ───────
// PHASE 3. Tourne EN PAGE sur fiverr / upwork / malt (jamais en arrière-plan
// credentialed cross-site — approche rejetée, cf. décision projet). Quand le
// freelance navigue sur sa plateforme (déjà connecté depuis la Phase 1), ce
// script lit ses métriques SAME-ORIGIN puis les transmet au service worker, qui
// les POST au backend Voraly avec le Bearer token de l'utilisateur.
//
// Deux modes d'acquisition selon la plateforme (cf. reverse-engineering 2026-06) :
//   • 'ssr'   : la plateforme rend déjà les KPIs dans un <script type=json> du
//               DOM (hydratation SSR). On le lit directement — pas de fetch, pas
//               d'injection main-world (le content script lit le DOM, pas le
//               window de la page). Cas Fiverr : #perseus-initial-props sur
//               /earnings (aucun endpoint JSON de résumé n'existe, tout est SSR).
//   • 'fetch' : un endpoint XHR same-origin renvoie le JSON de revenus.
//
// Confidentialité / sécurité :
//   • Lecture SAME-ORIGIN uniquement (aucun host_permissions plateforme requis).
//   • On extrait 4 KPIs seulement (revenus, solde, commandes, note), jamais le
//     payload brut côté client.
//   • Garde client souple (6h) pour ne pas re-lire à chaque navigation ; le
//     serveur impose la vraie limite (5h, non contournable).
//   • Une source NON calibrée (calibrated:false) est ignorée : on préfère ne
//     rien remonter plutôt que des zéros qui écraseraient des données réelles.
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

  // Garde client souple : ne pas re-lire si un sync a déjà eu lieu il y a moins
  // de 6h (> la borne serveur de 5h pour rester sous le seuil et éviter un 429
  // systématique).
  const CLIENT_MIN_INTERVAL_MS = 6 * 60 * 60 * 1000
  const LAST_SYNC_KEY = 'voraly_last_sync' // = STORAGE_KEYS.lastSync

  const match = HOSTNAME_TO_PLATFORM.find((m) => m.test.test(location.hostname))
  if (!match) return
  const platform = match.platform

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

  /** Lit un <script type="application/json"> du DOM et le parse (mode 'ssr'). */
  function readJsonScript(selector) {
    const el = document.querySelector(selector)
    if (!el) return null
    try {
      const parsed = JSON.parse((el.textContent || '').trim())
      // Perseus encapsule parfois en double (string-dans-string) → 2e parse.
      return typeof parsed === 'string' ? JSON.parse(parsed) : parsed
    } catch {
      return null
    }
  }

  // ── Descripteurs par plateforme ────────────────────────────────────────────
  // mode 'ssr'   : { selector } → lecture DOM, aucun fetch.
  // mode 'fetch' : { path }     → GET same-origin sur location.origin + path.
  // calibrated   : false ⇒ source ignorée (ni lecture ni report) tant que le
  //                schéma réel n'a pas été vérifié sur une session connectée.
  const SOURCES = {
    // Fiverr — VÉRIFIÉ (2026-06-26, session réelle). Aucun endpoint JSON de
    // résumé n'existe (/api/earnings/* → 404 sauf /transactions qui est vide) :
    // tout est hydraté SSR dans #perseus-initial-props sur https://www.fiverr.com/earnings.
    // activeOrders & rating ne figurent PAS sur la page financière → 0 (le
    // dashboard commandes/profil est une autre source, hors scope ici).
    fiverr: {
      calibrated: true,
      mode: 'ssr',
      selector: '#perseus-initial-props',
      parse: (d) => {
        const stats = d?.overview?.counters?.data?.stats
        if (!stats) return null // pas sur /earnings → on n'est pas sur la bonne page
        const ee = stats.earningsAndExpenses?.sinceJoining?.earnings
        const clearing = stats.futurePayments?.clearingPayments?.amountInCents
        const inProgress = stats.futurePayments?.inProgressEarnings?.amountInCents
        return {
          totalEarnings: n(ee?.amount), // unités majeures (USD base Fiverr)
          pendingBalance: (n(clearing) + n(inProgress)) / 100, // cents → unités
          activeOrders: 0, // non disponible sur la page financière
          rating: 0, // non disponible sur la page financière
        }
      },
    },

    // ⚠ Upwork — NON calibré (recon faite 2026-06-26, session réelle). SPA Nuxt :
    // PAS de JSON SSR exploitable (#__NUXT_DATA__ minimal) ; les données arrivent
    // par XHR GraphQL POST /api/graphql/v1?alias=payments-reports-current. KPIs
    // éclatés sur plusieurs pages → DOM scraping nécessaire :
    //   • Soldes : /nx/payments/reports/transaction-history/ (redirige vers
    //     /nx/payments/reports/transactions/<id>) → ancres STABLES data-qa :
    //       pendingBalance = [data-qa="pending_earnings_card"] [data-qa="amount"]
    //       (dispo)         = [data-qa="available_balance_card"] [data-qa="amount"]
    //   • totalEarnings (12 mois) + rating (Job Success Score) : /nx/my-stats/
    //     → PAS d'ancre data-qa fiable (scraping texte fragile, à fiabiliser).
    // Pré-requis avant calibrated:true : (a) merge non destructif côté backend
    // (sinon les zéros d'une page écrasent les valeurs d'une autre), (b) parser
    // n'émettant que les KPIs réellement lus, (c) validation sur compte non vide.
    upwork: {
      calibrated: false,
      mode: 'dom',
      selector: null,
      parse: () => null,
    },

    // ⚠ Malt — NON calibré (recon faite 2026-06-26, session réelle). SPA Nuxt,
    // données par XHR (pas de JSON SSR). Stats : /dashboard/freelancer/analytics/.
    // Reste à mapper les ancres DOM des KPIs (aucune ancre stable relevée encore)
    // et à valider sur compte non vide. Mêmes pré-requis que upwork (merge backend
    // + parser partiel). Tant que false → ignoré (no-op).
    malt: {
      calibrated: false,
      mode: 'dom',
      selector: null,
      parse: () => null,
    },
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

  /** Acquiert le payload brut via fetch same-origin (mode 'fetch'). */
  async function acquireViaFetch(path) {
    let res
    try {
      res = await fetch(location.origin + path, {
        method: 'GET',
        credentials: 'same-origin', // cookies de session de la plateforme
        cache: 'no-store',
        headers: { Accept: 'application/json' },
        redirect: 'manual', // une redirection = session expirée (page de login)
      })
    } catch {
      return { data: null } // CSP / réseau : on réessaiera plus tard.
    }
    // Session expirée → on le signale (le backend marque sync_status).
    if (res.type === 'opaqueredirect' || res.status === 401 || res.status === 403) {
      return { data: null, sessionExpired: true }
    }
    if (!res.ok) return { data: null }
    const ct = res.headers.get('content-type') ?? ''
    if (!ct.includes('json')) return { data: null }
    try {
      return { data: await res.json() }
    } catch {
      return { data: null }
    }
  }

  async function sync() {
    const source = SOURCES[platform]
    if (!source || !source.calibrated) return // source non vérifiée → no-op
    if (await recentlySynced()) return

    let data = null
    if (source.mode === 'ssr') {
      // Lecture DOM synchrone : pas de réseau, pas de cookies, pas de redirection.
      data = readJsonScript(source.selector)
    } else if (source.mode === 'fetch') {
      const out = await acquireViaFetch(source.path)
      if (out.sessionExpired) {
        report({ error: 'session_expired' })
        return
      }
      data = out.data
    }
    if (!data) return // mauvaise page (SSR absent) ou acquisition échouée → silence

    const metrics = source.parse(data)
    if (!metrics) return // schéma inattendu / KPIs absents → on ne remonte rien
    report({ metrics })
  }

  // On-demand : une seule tentative au chargement de la page (pas de polling).
  sync()
})()
