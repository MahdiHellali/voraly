import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://voraly.net',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

const VALID_PERIODS = new Set(['7d', '30d', '90d', 'all'])

function periodToDate(period: string): string | null {
  if (period === '7d') return new Date(Date.now() - 7 * 86_400_000).toISOString()
  if (period === '30d') return new Date(Date.now() - 30 * 86_400_000).toISOString()
  if (period === '90d') return new Date(Date.now() - 90 * 86_400_000).toISOString()
  return null // 'all' → pas de filtre date
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: CORS_HEADERS })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403, headers: CORS_HEADERS })
  }

  const rawPeriod = new URL(request.url).searchParams.get('period') ?? '7d'
  const period = VALID_PERIODS.has(rawPeriod) ? rawPeriod : '7d'
  const since = periodToDate(period)

  const admin = createAdminClient()

  let q = admin
    .from('analytics_events')
    .select('event_type, session_id, page_url, created_at')

  if (since) q = q.gte('created_at', since)

  const { data: events, error } = await q
    .limit(10_000)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[analytics/stats]', error)
    return NextResponse.json({ error: 'query_failed' }, { status: 500, headers: CORS_HEADERS })
  }

  const rows = events ?? []

  // ── Agrégations en mémoire ────────────────────────────────────────────────
  const pageViews = rows.filter(e => e.event_type === 'page_view')

  const uniqueVisitors = new Set(rows.map(e => e.session_id)).size

  const pageCounts: Record<string, number> = {}
  for (const e of pageViews) {
    pageCounts[e.page_url] = (pageCounts[e.page_url] ?? 0) + 1
  }
  const topPages = Object.entries(pageCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([page_url, count]) => ({ page_url, count }))

  const typeCounts: Record<string, number> = {}
  for (const e of rows) {
    typeCounts[e.event_type] = (typeCounts[e.event_type] ?? 0) + 1
  }
  const eventsByType = Object.entries(typeCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([event_type, count]) => ({ event_type, count }))

  const dailyCounts: Record<string, number> = {}
  for (const e of pageViews) {
    const day = e.created_at.slice(0, 10)
    dailyCounts[day] = (dailyCounts[day] ?? 0) + 1
  }
  const dailyViews = Object.entries(dailyCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }))

  const signups = rows.filter(e => e.event_type === 'signup').length
  const premiumConversions = rows.filter(e => e.event_type === 'premium_upgrade').length

  return NextResponse.json(
    {
      period,
      totalPageViews: pageViews.length,
      uniqueVisitors,
      topPages,
      eventsByType,
      dailyViews,
      signups,
      premiumConversions,
    },
    { headers: CORS_HEADERS }
  )
}
