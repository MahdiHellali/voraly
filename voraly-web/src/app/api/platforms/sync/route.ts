import { NextResponse, type NextRequest } from 'next/server'
import { authenticateBearer } from '@/lib/auth/bearer'
import { CORS_HEADERS, corsPreflight } from '@/lib/http/cors'

// POST /api/platforms/sync
// Reçoit un snapshot de métriques (ou un signal d'erreur) depuis l'extension,
// l'archive dans platform_metrics et met à jour l'état de sync de la connexion.
//
// Sécurité :
//   • user_id dérivé du Bearer token, jamais du body.
//   • RLS owner-only sur platform_metrics et platform_connections.
//   • Allowlist stricte des plateformes (defence-in-depth applicatif + BDD).
//   • Validation/clamp des valeurs numériques (anti-payload abusif).

export const runtime = 'nodejs'

const ALLOWED_PLATFORMS = new Set(['upwork', 'linkedin', 'fiverr', 'malt'])
const ALLOWED_ERRORS = new Set(['session_expired'])

export function OPTIONS() {
  return corsPreflight()
}

interface SyncBody {
  platform?: unknown
  timestamp?: unknown
  error?: unknown
  metrics?: {
    totalEarnings?: unknown
    pendingBalance?: unknown
    activeOrders?: unknown
    rating?: unknown
  }
}

/** Coerce en nombre fini >= 0, sinon fallback. Borne le haut pour éviter l'abus. */
function num(value: unknown, fallback = 0, max = 1_000_000_000): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n) || n < 0) return fallback
  return Math.min(n, max)
}

export async function POST(request: NextRequest) {
  const auth = await authenticateBearer(request)
  if (!auth) {
    return NextResponse.json(
      { error: 'unauthorized' },
      { status: 401, headers: CORS_HEADERS },
    )
  }
  const { user, supabase } = auth

  let body: SyncBody
  try {
    body = (await request.json()) as SyncBody
  } catch {
    return NextResponse.json(
      { error: 'invalid_json' },
      { status: 400, headers: CORS_HEADERS },
    )
  }

  const platform = typeof body.platform === 'string' ? body.platform : ''
  if (!ALLOWED_PLATFORMS.has(platform)) {
    return NextResponse.json(
      { error: 'invalid_platform' },
      { status: 400, headers: CORS_HEADERS },
    )
  }

  const nowIso = new Date().toISOString()

  // ── Cas erreur (ex. session_expired) : on marque la connexion, pas de snapshot.
  if (body.error !== undefined) {
    const errorCode = typeof body.error === 'string' ? body.error : ''
    if (!ALLOWED_ERRORS.has(errorCode)) {
      return NextResponse.json(
        { error: 'invalid_error_code' },
        { status: 400, headers: CORS_HEADERS },
      )
    }

    const { error: connErr } = await supabase
      .from('platform_connections')
      .update({ sync_status: 'session_expired', updated_at: nowIso })
      .eq('user_id', user.id)
      .eq('platform_name', platform)

    if (connErr) {
      console.error('[platforms/sync] conn update (error path) failed', connErr.message)
      return NextResponse.json(
        { error: 'db_error' },
        { status: 500, headers: CORS_HEADERS },
      )
    }

    return NextResponse.json(
      { success: true, platform, status: 'session_expired', archivedAt: nowIso },
      { status: 200, headers: CORS_HEADERS },
    )
  }

  // ── Cas nominal : archive le snapshot du jour (upsert idempotent).
  const m = body.metrics ?? {}
  const metricDate = nowIso.slice(0, 10) // YYYY-MM-DD (un snapshot/jour/plateforme)

  const { error: metricsErr } = await supabase.from('platform_metrics').upsert(
    {
      user_id: user.id,
      platform_name: platform,
      metric_date: metricDate,
      revenue: num(m.totalEarnings),
      active_orders: Math.round(num(m.activeOrders, 0, 1_000_000)),
      raw_metrics: {
        totalEarnings: num(m.totalEarnings),
        pendingBalance: num(m.pendingBalance),
        activeOrders: Math.round(num(m.activeOrders, 0, 1_000_000)),
        rating: num(m.rating, 0, 5),
      },
      updated_at: nowIso,
    },
    { onConflict: 'user_id,platform_name,metric_date' },
  )

  if (metricsErr) {
    console.error('[platforms/sync] metrics upsert failed', metricsErr.message)
    return NextResponse.json(
      { error: 'db_error' },
      { status: 500, headers: CORS_HEADERS },
    )
  }

  // Met à jour l'état de la connexion (alimente « Synchronisé il y a X min »).
  const { error: connErr } = await supabase
    .from('platform_connections')
    .update({ last_sync_at: nowIso, sync_status: 'synced', updated_at: nowIso })
    .eq('user_id', user.id)
    .eq('platform_name', platform)

  if (connErr) {
    console.error('[platforms/sync] conn update failed', connErr.message)
    // Le snapshot est archivé ; on ne casse pas la réponse pour autant.
  }

  return NextResponse.json(
    { success: true, platform, archivedAt: nowIso },
    { status: 200, headers: CORS_HEADERS },
  )
}
