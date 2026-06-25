// ─── Voraly Sync Engine · Service Worker (MV3) — BACKGROUND SILENT FETCH ──────
// Cycle 100% en tâche de fond (aucune ouverture de page requise) :
//   alarme 6h + jitter 0-25 min
//     → GET /api/platforms/active (backend)
//     → pour chaque plateforme : fetch direct credentialed + parse + POST /sync
//       (délai 5-10 s entre plateformes ; retry backoff 1/5/15 min sur échec)
//
// ⚠ Voir platforms.js : si la session plateforme est SameSite=Lax/Strict, le
// fetch cross-site renverra une page login → marqué `session_expired` (visible).

import {
  ALARM_PERIOD_MIN,
  JITTER_MAX_MS,
  INTER_PLATFORM_MIN_MS,
  INTER_PLATFORM_MAX_MS,
  RETRY_DELAYS_MIN,
  MAX_ATTEMPTS,
  SUPPORTED_PLATFORMS,
  PLATFORM_LOGIN_URLS,
} from '../lib/config.js'
import {
  setToken,
  isStale,
  setLastSync,
  getRetryQueue,
  setRetryEntry,
  clearRetryEntry,
  getConnections,
  setConnected,
  getPendingConnections,
  setPendingConnection,
  clearPendingConnection,
} from '../lib/storage.js'
import { getValidToken, getActivePlatforms, postSync } from '../lib/backend.js'
import { fetchPlatform, FETCH_RESULT } from '../lib/platforms.js'
import { parseMetrics } from '../lib/parser.js'
import { log, warn, error, describeMetrics } from '../lib/logger.js'

const SYNC_ALARM = 'voraly-sync'
const RETRY_ALARM_PREFIX = 'voraly-retry:'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const jitter = (min, max) => min + Math.random() * (max - min)

// ── Enregistrement de l'alarme périodique au démarrage ────────────────────────
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(SYNC_ALARM, { periodInMinutes: ALARM_PERIOD_MIN })
  log('Extension installée. Cycle de sync programmé toutes les 6h.')
})
chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create(SYNC_ALARM, { periodInMinutes: ALARM_PERIOD_MIN })
})

// ── Messages : bridge (voraly.net) + détecteur de connexion (plateformes) ─────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg?.type) {
    // Token émis par le dashboard, relayé par le bridge.
    case 'SET_TOKEN':
      setToken(msg.token, msg.expiresAt)
        .then(() => {
          log('Token reçu et stocké.')
          sendResponse({ ok: true })
        })
        .catch((e) => {
          error('SET_TOKEN', e?.message)
          sendResponse({ ok: false })
        })
      return true

    // Demande de connexion émise par le dashboard (via le bridge) : ouvre la
    // popup de login de la plateforme et la marque « en attente ».
    case 'CONNECT_PLATFORM':
      openConnectPopup(msg.platform)
        .then((ok) => sendResponse({ ok }))
        .catch((e) => {
          error('CONNECT_PLATFORM', e?.message)
          sendResponse({ ok: false })
        })
      return true

    // Le détecteur in-page signale une session plateforme active.
    case 'PLATFORM_LOGGED_IN':
      handlePlatformLoggedIn(msg.platform, sender)
        .then(() => sendResponse({ ok: true }))
        .catch((e) => {
          error('PLATFORM_LOGGED_IN', e?.message)
          sendResponse({ ok: false })
        })
      return true

    // Le dashboard interroge l'état de connexion (via le bridge).
    case 'GET_CONNECTIONS':
      getConnections()
        .then((connections) => sendResponse({ ok: true, connections }))
        .catch((e) => {
          error('GET_CONNECTIONS', e?.message)
          sendResponse({ ok: false, connections: {} })
        })
      return true

    default:
      return false
  }
})

/**
 * Ouvre la page de login de la plateforme dans une popup et l'enregistre comme
 * « connexion en attente » (pour pouvoir la fermer une fois la session détectée).
 */
async function openConnectPopup(platform) {
  const url = PLATFORM_LOGIN_URLS[platform]
  if (!url || !SUPPORTED_PLATFORMS.includes(platform)) {
    warn(`CONNECT_PLATFORM : plateforme inconnue (${platform}).`)
    return false
  }
  const win = await chrome.windows.create({
    url,
    type: 'popup',
    width: 520,
    height: 720,
  })
  if (win?.id != null) {
    await setPendingConnection(win.id, platform)
    log(`[${platform}] popup de connexion ouverte (window ${win.id}).`)
  }
  return true
}

/**
 * Enregistre la plateforme comme connectée. Si la détection vient d'une popup
 * qu'on a nous-mêmes ouverte, on la ferme ; sinon (onglet du freelance), on n'y
 * touche pas.
 */
async function handlePlatformLoggedIn(platform, sender) {
  if (!SUPPORTED_PLATFORMS.includes(platform)) return
  await setConnected(platform)
  log(`[${platform}] session détectée : marquée connectée.`)

  const windowId = sender?.tab?.windowId
  if (windowId == null) return
  const pending = await getPendingConnections()
  if (pending[String(windowId)] === platform) {
    await clearPendingConnection(windowId)
    try {
      await chrome.windows.remove(windowId)
      log(`[${platform}] popup de connexion fermée (window ${windowId}).`)
    } catch {
      // Fenêtre déjà fermée par l'utilisateur : rien à faire.
    }
  }
}

// Nettoyage si l'utilisateur ferme la popup de connexion à la main.
chrome.windows.onRemoved.addListener((windowId) => {
  clearPendingConnection(windowId).catch(() => {})
})

// ── Alarmes : cycle de sync + retries ─────────────────────────────────────────
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === SYNC_ALARM) {
    await runSyncCycle()
    return
  }
  if (alarm.name.startsWith(RETRY_ALARM_PREFIX)) {
    const platform = alarm.name.slice(RETRY_ALARM_PREFIX.length)
    const entry = (await getRetryQueue())[platform]
    if (!entry) return
    log(`[${platform}] reprise du retry (tentative ${entry.attempt}).`)
    await processPlatform(platform, entry.attempt, /* isRetry */ true)
  }
})

/** Cycle complet : jitter, plateformes actives, sync séquentiel. */
async function runSyncCycle() {
  const token = await getValidToken()
  if (!token) {
    log('Pas de token : cycle ignoré (visitez voraly.net pour vous connecter).')
    return
  }

  // Jitter anti-empreinte (PRD §5.2).
  await sleep(Math.random() * JITTER_MAX_MS)

  let active
  try {
    const res = await getActivePlatforms(token)
    if (res.unauthorized) {
      warn('Token Voraly invalide (401) : attente d’un refresh via le bridge.')
      return
    }
    active = res.active.filter((p) => SUPPORTED_PLATFORMS.includes(p))
  } catch (e) {
    warn('Récupération des plateformes actives échouée :', e?.message)
    return
  }

  if (active.length === 0) {
    log('Aucune plateforme active : fin du cycle.')
    return
  }

  for (const platform of active) {
    await processPlatform(platform, 0, false)
    await sleep(jitter(INTER_PLATFORM_MIN_MS, INTER_PLATFORM_MAX_MS))
  }
}

/**
 * Synchronise UNE plateforme : fetch direct → parse → POST backend.
 * @param isRetry true si appelé depuis une alarme de retry (ignore la staleness).
 */
async function processPlatform(platform, attempt, isRetry) {
  const token = await getValidToken()
  if (!token) {
    await clearRetryEntry(platform)
    return
  }

  // Sur le cycle normal, on saute les plateformes synchronisées il y a < 6h.
  if (!isRetry && !(await isStale(platform))) {
    log(`[${platform}] sync récent (< 6h) : ignoré.`)
    return
  }

  // 1. Fetch direct credentialed.
  let result
  try {
    result = await fetchPlatform(platform)
  } catch (e) {
    return scheduleRetry(platform, attempt, e?.message)
  }

  // 2. Session expirée / non authentifié → signal au backend, pas de retry.
  if (result.kind === FETCH_RESULT.SESSION_EXPIRED) {
    warn(`[${platform}] session expirée / non authentifié (cookie non transmis ?).`)
    await sendSessionExpired(platform, token)
    await clearRetryEntry(platform)
    return
  }

  // 3. Parse des KPIs.
  const metrics = parseMetrics(platform, result.data)
  if (!metrics) {
    warn(`[${platform}] réponse non exploitable (structure JSON à confirmer).`)
    await clearRetryEntry(platform)
    return
  }

  // 4. Envoi au backend (avec retry réseau).
  log(`[${platform}] métriques :`, describeMetrics(metrics))
  const payload = { platform, timestamp: new Date().toISOString(), metrics }
  try {
    const res = await postSync(payload, token)
    if (res.unauthorized) {
      warn(`[${platform}] 401 backend : token Voraly invalide.`)
      await clearRetryEntry(platform)
      return
    }
    await setLastSync(platform, new Date().toISOString())
    await clearRetryEntry(platform)
  } catch (e) {
    await scheduleRetry(platform, attempt, e?.message)
  }
}

async function sendSessionExpired(platform, token) {
  const payload = {
    platform,
    timestamp: new Date().toISOString(),
    error: 'session_expired',
  }
  try {
    await postSync(payload, token)
  } catch (e) {
    warn(`[${platform}] envoi session_expired échoué :`, e?.message)
  }
}

/** Planifie un retry via alarme (backoff 1/5/15 min, max 3 tentatives). */
async function scheduleRetry(platform, attempt, reason) {
  const next = attempt + 1
  if (next >= MAX_ATTEMPTS) {
    error(`[${platform}] ${MAX_ATTEMPTS} tentatives échouées, abandon.`, reason)
    await clearRetryEntry(platform)
    return
  }
  const delay = RETRY_DELAYS_MIN[attempt] ?? RETRY_DELAYS_MIN[RETRY_DELAYS_MIN.length - 1]
  log(`[${platform}] échec (${reason}). Retry #${next} dans ${delay} min.`)
  await setRetryEntry(platform, { attempt: next })
  chrome.alarms.create(RETRY_ALARM_PREFIX + platform, { delayInMinutes: delay })
}
