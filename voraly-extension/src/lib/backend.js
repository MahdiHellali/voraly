// ─── Voraly Sync Engine · Token Bearer utilisateur ───────────────────────────
// Validité du JWT Supabase partagé par le dashboard. Les appels backend de
// synchronisation (POST /sync, GET /active) ont été retirés au profit du flow
// popup-login sans risque de ban — voir README (Phase 3 les réintroduira).

import { BACKEND_URL } from './config.js'
import { getToken } from './storage.js'
import { warn } from './logger.js'

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

/**
 * POST /api/platforms/sync — pousse un snapshot de métriques (ou un signal
 * d'erreur) au backend Voraly. Le user_id est dérivé serveur-side du Bearer
 * token (jamais envoyé dans le body). L'allowlist plateforme + le rate-limit 5h
 * + le clamp des valeurs sont appliqués côté serveur (defence-in-depth).
 *
 * @param {{ platform: string, metrics?: object, error?: string }} payload
 * @returns {Promise<{ ok: boolean, status?: number, reason?: string }>}
 */
export async function postSync({ platform, metrics, error: errorCode }) {
  const token = await getValidToken()
  if (!token) {
    warn('Sync ignoré : aucun token valide (ré-ouvrez voraly.net).')
    return { ok: false, reason: 'no_token' }
  }

  const body = errorCode
    ? { platform, error: errorCode }
    : { platform, timestamp: new Date().toISOString(), metrics }

  try {
    const res = await fetch(`${BACKEND_URL}/api/platforms/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })
    return { ok: res.ok, status: res.status }
  } catch (e) {
    warn('Sync réseau échoué', e?.message)
    return { ok: false, reason: 'network' }
  }
}
