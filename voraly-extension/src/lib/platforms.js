// ─── Voraly Sync Engine · Fetch direct des plateformes (background) ────────────
// Fait la requête credentialed vers l'API interne de la plateforme depuis le
// service worker, et distingue 3 issues : données / session expirée / erreur.
//
// ⚠ RÉALITÉ TECHNIQUE : un fetch cross-site depuis le SW n'envoie PAS les
// cookies de session `SameSite=Lax/Strict`. Si la plateforme protège sa session
// ainsi (cas le plus courant), la réponse sera une redirection login / 401 →
// détectée ici comme `sessionExpired`. C'est volontairement explicite pour que
// l'échec soit VISIBLE et non masqué. Voir README §"Test empirique".
//
// On ne définit PAS User-Agent ni Referer : ce sont des forbidden headers,
// ignorés par fetch(). Le navigateur envoie un UA réel automatiquement.

import { PLATFORM_ENDPOINTS } from './config.js'

export const FETCH_RESULT = {
  DATA: 'data',
  SESSION_EXPIRED: 'session_expired',
}

/**
 * @returns {Promise<{kind:'data', data:object} | {kind:'session_expired'}>}
 * @throws en cas d'erreur réseau / 5xx (→ retry côté appelant).
 */
export async function fetchPlatform(platform) {
  const url = PLATFORM_ENDPOINTS[platform]
  if (!url) return { kind: FETCH_RESULT.SESSION_EXPIRED }

  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include', // injecte la session locale SI SameSite l'autorise
    redirect: 'follow',
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  })

  // 401/403 explicites → session expirée / non authentifié.
  if (res.status === 401 || res.status === 403) {
    return { kind: FETCH_RESULT.SESSION_EXPIRED }
  }

  // Redirigé vers une page de login → non authentifié.
  if (res.redirected && /login|signin|sign-in|connexion/i.test(res.url)) {
    return { kind: FETCH_RESULT.SESSION_EXPIRED }
  }

  // 5xx / autres erreurs → on lève pour déclencher le retry.
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  // Réponse HTML au lieu de JSON = page de login déconnectée renvoyée en 200.
  const contentType = res.headers.get('content-type') ?? ''
  if (!contentType.includes('json')) {
    return { kind: FETCH_RESULT.SESSION_EXPIRED }
  }

  let data
  try {
    data = await res.json()
  } catch {
    return { kind: FETCH_RESULT.SESSION_EXPIRED }
  }
  return { kind: FETCH_RESULT.DATA, data }
}
