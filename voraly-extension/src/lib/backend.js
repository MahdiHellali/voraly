// ─── Voraly Sync Engine · Communication backend Voraly ────────────────────────
// Toutes les requêtes vers voraly.net portent le Bearer JWT de l'utilisateur.

import { BACKEND_URL } from './config.js'
import { getToken } from './storage.js'
import { log, warn } from './logger.js'

/**
 * Récupère le token stocké s'il est encore valide.
 *
 * Pas de refresh côté extension : rafraîchir un JWT Supabase nécessite le
 * refresh_token, qu'on NE transmet PAS à l'extension (seul l'access_token,
 * court, est partagé — surface d'attaque minimale). Le renouvellement se fait
 * par RÉ-ÉMISSION : le dashboard ré-émet le token via onAuthStateChange
 * (événement TOKEN_REFRESHED de Supabase). Voir README.
 *
 * Renvoie null si aucun token, ou si le token stocké est déjà expiré
 * (inutile d'envoyer une requête vouée au 401).
 */
export async function getValidToken() {
  const { token, expiresAt } = await getToken()
  if (!token) return null

  if (expiresAt && Date.now() > new Date(expiresAt).getTime()) {
    warn('Token expiré : ré-ouvrez voraly.net pour le renouveler.')
    return null
  }
  return token
}

/** GET /api/platforms/active → liste des plateformes connectées. */
export async function getActivePlatforms(token) {
  const res = await fetch(`${BACKEND_URL}/api/platforms/active`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 401) return { unauthorized: true, active: [] }
  if (!res.ok) throw new Error(`active HTTP ${res.status}`)
  const data = await res.json()
  return { active: Array.isArray(data.active) ? data.active : [] }
}

/**
 * POST /api/platforms/sync.
 * Renvoie { ok: true } si 200, { unauthorized: true } si 401,
 * sinon lève (déclenche le retry côté appelant).
 */
export async function postSync(payload, token) {
  const res = await fetch(`${BACKEND_URL}/api/platforms/sync`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  if (res.status === 401) return { unauthorized: true }
  if (!res.ok) throw new Error(`sync HTTP ${res.status}`)
  const result = await res.json().catch(() => ({}))
  log(`[${payload.platform}] sync OK`, result?.archivedAt ?? '')
  return { ok: true }
}
