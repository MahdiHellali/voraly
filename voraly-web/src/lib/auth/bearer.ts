import 'server-only'

import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'

// ─── Voraly · Authentification par Bearer token (extension Chrome) ────────────
// Le dashboard web s'authentifie par cookie de session. L'extension, elle,
// envoie le JWT Supabase dans l'en-tête `Authorization: Bearer <token>`.
//
// Ce helper :
//   1. extrait le token de l'en-tête Authorization,
//   2. le valide auprès du serveur d'auth Supabase (getUser),
//   3. renvoie un client Supabase *request-scoped* dont toutes les requêtes
//      portent ce JWT → la RLS (auth.uid() = user_id) reste pleinement appliquée.
//
// ⚠ On NE dérive JAMAIS user_id du body de la requête : il vient de getUser().

export interface BearerAuthResult {
  user: { id: string; email?: string }
  /** Client Supabase portant le JWT de l'utilisateur → RLS active. */
  supabase: SupabaseClient
}

/** Extrait le token brut de l'en-tête `Authorization: Bearer <token>`. */
export function extractBearerToken(request: Request): string | null {
  const header = request.headers.get('authorization') ?? request.headers.get('Authorization')
  if (!header) return null
  const match = /^Bearer\s+(.+)$/i.exec(header.trim())
  return match ? match[1].trim() : null
}

/**
 * Valide le Bearer token et renvoie l'utilisateur + un client RLS-scoped.
 * Renvoie `null` si le token est absent, invalide ou expiré (→ 401 côté route).
 */
export async function authenticateBearer(
  request: Request,
): Promise<BearerAuthResult | null> {
  const token = extractBearerToken(request)
  if (!token) return null

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error('Bearer auth requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  // Client request-scoped : le JWT est injecté dans chaque requête → RLS active.
  const supabase = createSupabaseClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // Valide le token auprès du serveur d'auth (vérifie signature + expiration).
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token)

  if (error || !user) return null

  return { user: { id: user.id, email: user.email ?? undefined }, supabase }
}
