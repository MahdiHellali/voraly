// ─── Voraly Sync Engine · Configuration ───────────────────────────────────────
// Un seul endroit pour pointer vers le backend (prod vs staging/local).
// Pour tester en local : remplacez BACKEND_URL par "http://localhost:3000"
// et ajoutez l'origine correspondante dans manifest.json > host_permissions.

export const BACKEND_URL = 'https://voraly.net'

// Origine STRICTE acceptée pour le postMessage du token (jamais "*").
export const VORALY_ORIGIN = 'https://voraly.net'

// Fréquence minimale entre deux syncs d'une même plateforme (anti-spam, 6h).
export const SYNC_STALE_MS = 6 * 60 * 60 * 1000

// Cycle d'alarme (PRD §5) : toutes les 6h + jitter 0-25 min + délai inter-plateforme.
export const ALARM_PERIOD_MIN = 360
export const JITTER_MAX_MS = 25 * 60 * 1000
export const INTER_PLATFORM_MIN_MS = 5000
export const INTER_PLATFORM_MAX_MS = 10000

// ── Flow de connexion « OAuth-like » (Phase 1) ────────────────────────────────
// Pages ouvertes en popup pour que le freelance se connecte naturellement à la
// plateforme. Si la session existe déjà, la page charge directement connectée.
export const PLATFORM_LOGIN_URLS = {
  fiverr: 'https://www.fiverr.com/',
  upwork: 'https://www.upwork.com/nx/find-work/',
  malt: 'https://www.malt.fr/dashboard/inbox',
}

// Endpoint same-origin léger interrogé EN PAGE (content script) pour détecter si
// la session plateforme est active : 200 + JSON exploitable → connecté.
// (À CONFIRMER par reverse-engineering ; same-origin → les cookies HttpOnly
// circulent normalement, contrairement au fetch cross-site du service worker.)
export const PLATFORM_SESSION_CHECK = {
  fiverr: 'https://www.fiverr.com/api/v1/me',
  upwork: 'https://www.upwork.com/api/auth/v1/info.json',
  malt: 'https://www.malt.fr/api/me',
}

// Détection de plateforme depuis le hostname (content script multi-domaines).
export const HOSTNAME_TO_PLATFORM = [
  { test: /(^|\.)fiverr\.com$/i, platform: 'fiverr' },
  { test: /(^|\.)upwork\.com$/i, platform: 'upwork' },
  { test: /(^|\.)malt\.(fr|com)$/i, platform: 'malt' },
]

// Endpoints JSON internes par plateforme (À CONFIRMER par reverse-engineering :
// DevTools → Network → filtre XHR/Fetch sur la page earnings réelle).
// On vise l'API JSON interne (pas le HTML) : le service worker n'a pas de DOM.
export const PLATFORM_ENDPOINTS = {
  fiverr: 'https://www.fiverr.com/api/v1/me/earnings',
  upwork: 'https://www.upwork.com/api/v3/freelancer/earnings',
  malt: 'https://www.malt.fr/api/freelancer/insights',
}

// Backoff exponentiel pour les échecs d'envoi vers le backend (minutes).
export const RETRY_DELAYS_MIN = [1, 5, 15]
export const MAX_ATTEMPTS = 3

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
