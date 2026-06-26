// ─── Voraly Sync Engine · Token Bearer utilisateur ───────────────────────────
// Validité du JWT Supabase partagé par le dashboard. Les appels backend de
// synchronisation (POST /sync, GET /active) ont été retirés au profit du flow
// popup-login sans risque de ban — voir README (Phase 3 les réintroduira).

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
