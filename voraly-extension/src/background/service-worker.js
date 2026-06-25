// ─── Voraly Sync Engine · Service Worker (MV3) — PHASE 1 : CONNEXION PLATEFORMES
// Flow « OAuth-like » sans credentials stockés :
//   dashboard → CONNECT_PLATFORM → popup de login plateforme (chrome.windows)
//   content script in-page détecte la session → PLATFORM_LOGGED_IN
//   → on marque « connecté » (chrome.storage.local) et on ferme NOTRE popup.
//
// ⚠ Le cycle de sync périodique des métriques est volontairement ABSENT en
// Phase 1 : il sera fait EN PAGE (content script same-origin) en Phase 2, jamais
// par un fetch credentialed cross-site depuis le service worker (cf. décision
// projet : approche background credentialed rejetée — SameSite + surface trop
// large). Aucune permission `alarms`, aucun `host_permissions` plateforme requis.

import { SUPPORTED_PLATFORMS, PLATFORM_LOGIN_URLS } from '../lib/config.js'
import {
  setToken,
  getConnections,
  setConnected,
  getPendingConnections,
  setPendingConnection,
  clearPendingConnection,
} from '../lib/storage.js'
import { log, warn, error } from '../lib/logger.js'

chrome.runtime.onInstalled.addListener(() => {
  log('Extension installée (Phase 1 : connexion plateformes via popup).')
})

// ── Messages : bridge (voraly.net) + détecteur de connexion (plateformes) ─────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg?.type) {
    // Token émis par le dashboard, relayé par le bridge (stocké pour la Phase 2).
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
