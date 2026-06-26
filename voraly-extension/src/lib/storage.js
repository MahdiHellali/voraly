// ─── Voraly Sync Engine · Helpers chrome.storage.local ────────────────────────
// chrome.storage.local (pas .sync) : le sync de session n'a de sens que sur
// la machine où le freelance est connecté aux plateformes.

import { STORAGE_KEYS } from './config.js'

export async function getToken() {
  const v = await chrome.storage.local.get([
    STORAGE_KEYS.token,
    STORAGE_KEYS.tokenExpiresAt,
  ])
  return {
    token: v[STORAGE_KEYS.token] ?? null,
    expiresAt: v[STORAGE_KEYS.tokenExpiresAt] ?? null,
  }
}

export async function setToken(token, expiresAt) {
  await chrome.storage.local.set({
    [STORAGE_KEYS.token]: token,
    [STORAGE_KEYS.tokenExpiresAt]: expiresAt ?? null,
  })
}

export async function clearToken() {
  await chrome.storage.local.remove([
    STORAGE_KEYS.token,
    STORAGE_KEYS.tokenExpiresAt,
  ])
}

// ── État de connexion plateforme (flow popup « OAuth-like », Phase 1) ──────────

/** Renvoie la map { platform: { connectedAt } } des plateformes connectées. */
export async function getConnections() {
  const v = await chrome.storage.local.get(STORAGE_KEYS.connections)
  return v[STORAGE_KEYS.connections] ?? {}
}

/** Marque une plateforme comme connectée (idempotent). */
export async function setConnected(platform) {
  const map = await getConnections()
  map[platform] = { connectedAt: new Date().toISOString() }
  await chrome.storage.local.set({ [STORAGE_KEYS.connections]: map })
}

export async function clearConnection(platform) {
  const map = await getConnections()
  delete map[platform]
  await chrome.storage.local.set({ [STORAGE_KEYS.connections]: map })
}

// ── Fenêtres popup en attente de connexion (survit à la mort du SW) ────────────
// Map { windowId: platform } : permet de ne fermer QUE les popups qu'on a
// ouvertes (jamais un onglet plateforme que le freelance utilise lui-même).

export async function getPendingConnections() {
  const v = await chrome.storage.local.get(STORAGE_KEYS.pendingConnections)
  return v[STORAGE_KEYS.pendingConnections] ?? {}
}

export async function setPendingConnection(windowId, platform) {
  const map = await getPendingConnections()
  map[String(windowId)] = platform
  await chrome.storage.local.set({ [STORAGE_KEYS.pendingConnections]: map })
}

export async function clearPendingConnection(windowId) {
  const map = await getPendingConnections()
  delete map[String(windowId)]
  await chrome.storage.local.set({ [STORAGE_KEYS.pendingConnections]: map })
}
