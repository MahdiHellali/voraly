// ─── Voraly · CORS pour les endpoints consommés par l'extension Chrome ────────
// L'extension appelle ces routes depuis une origine `chrome-extension://<id>`.
// L'auth se fait par Bearer token (PAS par cookie). On N'utilise PAS `*` :
// defence-in-depth, on n'autorise que l'extension (`chrome-extension://`) et le
// dashboard (`https://voraly.net`). Toute autre origine web reçoit une origine
// non-correspondante → le navigateur bloque l'appel cross-origin, ce qui empêche
// un site tiers de driver l'API même avec un token volé.

const STATIC_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Max-Age': '86400',
}

const VORALY_ORIGIN = 'https://voraly.net'

/** N'autorise que le dashboard Voraly et les extensions Chrome (id non figé). */
function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false
  return origin === VORALY_ORIGIN || origin.startsWith('chrome-extension://')
}

/**
 * En-têtes CORS pour une requête donnée. On écho l'origine SI elle est autorisée,
 * sinon on renvoie l'origine Voraly (qui ne matchera pas une origine tierce →
 * blocage navigateur). Jamais `*`.
 */
export function corsHeaders(origin: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin(origin) ? (origin as string) : VORALY_ORIGIN,
    Vary: 'Origin',
    ...STATIC_HEADERS,
  }
}

/** Réponse au préflight CORS (OPTIONS). */
export function corsPreflight(request: Request): Response {
  return new Response(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) })
}
