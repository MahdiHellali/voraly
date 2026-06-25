// ─── Voraly · CORS pour les endpoints consommés par l'extension Chrome ────────
// L'extension appelle ces routes depuis une origine `chrome-extension://<id>`.
// L'authentification se fait par Bearer token (PAS par cookie), donc on n'a
// pas besoin de `Access-Control-Allow-Credentials` ni d'une origine fixe :
// `*` est sûr ici car aucune donnée n'est servie sans un JWT valide.

export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Max-Age': '86400',
}

/** Réponse au préflight CORS (OPTIONS). */
export function corsPreflight(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}
