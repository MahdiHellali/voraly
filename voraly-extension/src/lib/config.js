// ─── Voraly Sync Engine · Configuration ───────────────────────────────────────
// Un seul endroit pour pointer vers le backend (prod vs staging/local).
// Pour tester en local : remplacez BACKEND_URL par "http://localhost:3000"
// et ajoutez l'origine correspondante dans manifest.json > host_permissions.

export const BACKEND_URL = 'https://voraly.net'

// Origine STRICTE acceptée pour le postMessage du token (jamais "*").
export const VORALY_ORIGIN = 'https://voraly.net'

// Fréquence minimale entre deux syncs d'une même plateforme (anti-spam, 6h).
// Conservé pour la Phase 2 (sync in-page) et les helpers de staleness.
export const SYNC_STALE_MS = 6 * 60 * 60 * 1000

// ── Flow de connexion « OAuth-like » (Phase 1) ────────────────────────────────
// Pages ouvertes en popup pour que le freelance se connecte naturellement à la
// plateforme. Si la session existe déjà, la page charge directement connectée.
export const PLATFORM_LOGIN_URLS = {
  fiverr: 'https://www.fiverr.com/',
  upwork: 'https://www.upwork.com/nx/find-work/',
  malt: 'https://www.malt.fr/dashboard/inbox',
}

// Plateformes supportées (doit rester aligné avec l'allowlist backend + BDD).
export const SUPPORTED_PLATFORMS = ['fiverr', 'upwork', 'malt']

// Clés de stockage local.
export const STORAGE_KEYS = {
  token: 'voraly_token',
  tokenExpiresAt: 'voraly_token_expires_at',
  lastSync: 'voraly_last_sync', // map { platform: ISOString }
  retryQueue: 'voraly_retry_queue', // map { platform: { payload, attempt } }
  connections: 'voraly_connections', // map { platform: { connectedAt: ISOString } }
  pendingConnections: 'voraly_pending_connections', // map { windowId: platform }
}

// Délai max d'attente d'une connexion via popup avant abandon silencieux (ms).
export const CONNECT_TIMEOUT_MS = 5 * 60 * 1000
