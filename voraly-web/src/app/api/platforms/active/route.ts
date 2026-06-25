import { NextResponse, type NextRequest } from 'next/server'
import { authenticateBearer } from '@/lib/auth/bearer'
import { CORS_HEADERS, corsPreflight } from '@/lib/http/cors'

// GET /api/platforms/active
// Renvoie les plateformes connectées de l'utilisateur authentifié (Bearer JWT).
// Consommé par l'extension pour savoir lesquelles synchroniser.
//
// Sécurité : user_id dérivé du token (jamais du client) ; RLS owner-only sur
// platform_connections. Ne renvoie AUCUNE colonne de token.

export const runtime = 'nodejs'

export function OPTIONS() {
  return corsPreflight()
}

export async function GET(request: NextRequest) {
  const auth = await authenticateBearer(request)
  if (!auth) {
    return NextResponse.json(
      { error: 'unauthorized' },
      { status: 401, headers: CORS_HEADERS },
    )
  }

  const { supabase } = auth

  // RLS garantit qu'on ne lit que les lignes de l'utilisateur du token.
  const { data, error } = await supabase
    .from('platform_connections')
    .select('platform_name, sync_status, last_sync_at')

  if (error) {
    console.error('[platforms/active] db error', error.message)
    return NextResponse.json(
      { error: 'db_error' },
      { status: 500, headers: CORS_HEADERS },
    )
  }

  return NextResponse.json(
    {
      active: (data ?? []).map((r) => r.platform_name),
      connections: data ?? [],
      lastChecked: new Date().toISOString(),
    },
    { status: 200, headers: CORS_HEADERS },
  )
}
