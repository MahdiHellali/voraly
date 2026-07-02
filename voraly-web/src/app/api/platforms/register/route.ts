import { NextResponse, type NextRequest } from 'next/server'
import { authenticateBearer } from '@/lib/auth/bearer'
import { corsHeaders, corsPreflight } from '@/lib/http/cors'

// POST /api/platforms/register
// Enregistre une connexion plateforme établie via l'extension (flow popup-login,
// sans OAuth). Crée la ligne platform_connections manquante pour que le dashboard
// (connectedPlatformsCount) et la page Plateformes reflètent l'état réel.
//
// Sécurité :
//   • user_id dérivé du Bearer token, jamais du body.
//   • RLS owner-only (auth.uid() = user_id) sur platform_connections.
//   • Allowlist stricte des plateformes (defence-in-depth applicatif + BDD).
//   • ignoreDuplicates : n'écrase JAMAIS une connexion OAuth existante (token réel).

export const runtime = 'nodejs'

// Seules les plateformes gérées par l'extension (popup-login).
const ALLOWED_PLATFORMS = new Set(['upwork', 'fiverr', 'malt'])

export function OPTIONS(request: NextRequest) {
  return corsPreflight(request)
}

export async function POST(request: NextRequest) {
  const cors = corsHeaders(request.headers.get('origin'))
  const auth = await authenticateBearer(request)
  if (!auth) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: cors })
  }
  const { user, supabase } = auth

  let body: { platform?: unknown }
  try {
    body = (await request.json()) as { platform?: unknown }
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400, headers: cors })
  }

  const platform = typeof body.platform === 'string' ? body.platform : ''
  if (!ALLOWED_PLATFORMS.has(platform)) {
    return NextResponse.json({ error: 'invalid_platform' }, { status: 400, headers: cors })
  }

  // Insert-if-absent : l'extension n'a pas de token OAuth (login popup), on pose
  // un sentinel non sensible dans access_token (NOT NULL). ignoreDuplicates évite
  // d'écraser une éventuelle connexion OAuth réelle déjà en place.
  const { error } = await supabase.from('platform_connections').upsert(
    {
      user_id: user.id,
      platform_name: platform,
      access_token: 'extension',
      sync_status: 'idle',
    },
    { onConflict: 'user_id,platform_name', ignoreDuplicates: true },
  )

  if (error) {
    console.error('[platforms/register] upsert failed', error.message)
    return NextResponse.json({ error: 'db_error' }, { status: 500, headers: cors })
  }

  return NextResponse.json({ success: true, platform }, { status: 200, headers: cors })
}
