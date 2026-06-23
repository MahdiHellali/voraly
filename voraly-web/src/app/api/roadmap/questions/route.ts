import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { QUESTIONS, normalizeRoadmap, type Question } from '@/lib/roadmap/types'
import { rateLimit } from '@/lib/rate-limit'

const N8N_QUESTIONS_URL =
  process.env.N8N_QUESTIONS_WEBHOOK_URL ??
  (process.env.N8N_ROADMAP_WEBHOOK_URL
    ? process.env.N8N_ROADMAP_WEBHOOK_URL.replace('generate-roadmap', 'generate-questions')
    : process.env.NODE_ENV === 'production'
      ? 'http://n8n:5678/webhook/generate-questions'
      : 'http://localhost:5678/webhook/generate-questions')

const N8N_TIMEOUT_MS = 30_000

// GET /api/roadmap/questions
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // Anti-abus : limiter la fréquence (protège le quota Gemini de generate-questions).
  const rl = rateLimit(`questions:${user.id}`, 10, 60_000)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
    )
  }

  // Collecter toutes les données en parallèle (best-effort).
  const [platformsResult, metricsResult, integrationsResult, profileResult] =
    await Promise.allSettled([
      supabase
        .from('platform_connections')
        .select('platform_name, username')
        .eq('user_id', user.id),

      // Colonnes correctes de la table platform_metrics
      supabase
        .from('platform_metrics')
        .select(
          'platform_name, metric_date, revenue, new_proposals, pending_replies, active_orders, conversion_rate',
        )
        .eq('user_id', user.id)
        .gte(
          'metric_date',
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        )
        .order('metric_date', { ascending: false })
        .limit(200),

      supabase
        .from('integration_connections')
        .select('provider, access_token, refresh_token, expires_at, metadata')
        .eq('user_id', user.id),

      supabase
        .from('profiles')
        .select('full_name, linkedin_profile_text, ai_roadmap')
        .eq('id', user.id)
        .maybeSingle(),
    ])

  const platforms =
    platformsResult.status === 'fulfilled' ? (platformsResult.value.data ?? []) : []
  const metrics =
    metricsResult.status === 'fulfilled' ? (metricsResult.value.data ?? []) : []
  const integrations =
    integrationsResult.status === 'fulfilled' ? (integrationsResult.value.data ?? []) : []
  const profile =
    profileResult.status === 'fulfilled' ? profileResult.value.data : null

  // Extraire la roadmap précédente pour contextualiser les nouvelles questions.
  const previousSteps = normalizeRoadmap(profile?.ai_roadmap)
  const previousRoadmap =
    previousSteps.length > 0
      ? {
          total_weeks: previousSteps.length,
          first_step_title: previousSteps[0]?.title ?? '',
          last_step_title: previousSteps[previousSteps.length - 1]?.title ?? '',
        }
      : null

  // Lire Google Calendar + Notion en parallèle (best-effort, indépendants).
  const googleIntegration = integrations.find((i) => i.provider === 'google_calendar')
  const notionIntegration = integrations.find((i) => i.provider === 'notion')

  const [calendarEvents, notionPages] = await Promise.all([
    (async (): Promise<string[]> => {
      if (!googleIntegration) return []
      try {
        let accessToken = googleIntegration.access_token
        const expiresAt = googleIntegration.expires_at
          ? new Date(googleIntegration.expires_at).getTime()
          : 0
        if (expiresAt < Date.now() + 60_000 && googleIntegration.refresh_token) {
          const refreshed = await refreshGoogleToken(
            googleIntegration.refresh_token,
            user.id,
            supabase,
          )
          if (refreshed) accessToken = refreshed
        }
        if (!accessToken) return []
        const ctrl = new AbortController()
        const timer = setTimeout(() => ctrl.abort(), 8_000)
        const calRes = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?orderBy=startTime&singleEvents=true&timeMin=${encodeURIComponent(new Date().toISOString())}&maxResults=10`,
          { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store', signal: ctrl.signal },
        ).finally(() => clearTimeout(timer))
        if (!calRes.ok) return []
        const calData = (await calRes.json()) as {
          items?: { summary?: string; start?: { dateTime?: string; date?: string } }[]
        }
        return (calData.items ?? []).map(
          (e) => `${e.summary ?? 'Événement'} (${e.start?.dateTime ?? e.start?.date ?? ''})`,
        )
      } catch (err) {
        console.warn('[questions] google calendar fetch failed:', err)
        return []
      }
    })(),
    (async (): Promise<string[]> => {
      if (!notionIntegration?.access_token) return []
      try {
        const ctrl = new AbortController()
        const timer = setTimeout(() => ctrl.abort(), 8_000)
        const notionRes = await fetch('https://api.notion.com/v1/search', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${notionIntegration.access_token}`,
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28',
          },
          body: JSON.stringify({ filter: { value: 'page', property: 'object' }, page_size: 10 }),
          cache: 'no-store',
          signal: ctrl.signal,
        }).finally(() => clearTimeout(timer))
        if (!notionRes.ok) return []
        const notionData = (await notionRes.json()) as {
          results?: {
            properties?: { title?: { title?: { plain_text?: string }[] }[] }
          }[]
        }
        return (notionData.results ?? [])
          .map((p) => {
            const titleProp = p.properties?.title
            if (Array.isArray(titleProp)) {
              return titleProp
                .flatMap((t) => t?.title ?? [])
                .map((t) => t.plain_text ?? '')
                .join('')
            }
            return 'Page Notion'
          })
          .filter(Boolean)
      } catch (err) {
        console.warn('[questions] notion fetch failed:', err)
        return []
      }
    })(),
  ])

  // Calculer revenus cumulés + réponses en attente.
  const typedMetrics = metrics as Array<{
    revenue?: number | null
    pending_replies?: number | null
  }>
  const cumulativeRevenue = typedMetrics.reduce((sum, m) => sum + (m.revenue ?? 0), 0)
  const pendingRepliesTotal = typedMetrics.reduce((sum, m) => sum + (m.pending_replies ?? 0), 0)

  const userDataSummary = buildUserDataSummary({
    platforms,
    cumulativeRevenue,
    pendingRepliesTotal,
    calendarEvents,
    notionPages,
    profileName: profile?.full_name ?? null,
    linkedinText: profile?.linkedin_profile_text ?? null,
    previousRoadmap,
  })

  // Appeler n8n generate-questions.
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), N8N_TIMEOUT_MS)
    const res = await fetch(N8N_QUESTIONS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        user_data: userDataSummary,
        previous_roadmap: previousRoadmap,
      }),
      cache: 'no-store',
      signal: controller.signal,
    }).finally(() => clearTimeout(timer))

    if (res.ok) {
      const json = (await res.json().catch(() => null)) as { questions?: Question[] } | null
      const questions = json?.questions
      if (Array.isArray(questions) && questions.length >= 2) {
        return NextResponse.json({ questions, source: 'dynamic' })
      }
    } else {
      console.warn(`[questions] n8n responded with ${res.status}`)
    }
  } catch (err) {
    console.warn('[questions] n8n unreachable, falling back to static:', err)
  }

  return NextResponse.json({ questions: QUESTIONS, source: 'static' })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildUserDataSummary(ctx: {
  platforms: { platform_name: string; username?: string | null }[]
  cumulativeRevenue: number
  pendingRepliesTotal: number
  calendarEvents: string[]
  notionPages: string[]
  profileName: string | null
  linkedinText: string | null
  previousRoadmap: {
    total_weeks: number
    first_step_title: string
    last_step_title: string
  } | null
}): string {
  const lines: string[] = []

  if (ctx.profileName) lines.push(`Nom : ${ctx.profileName}`)
  if (ctx.linkedinText?.trim())
    lines.push(`Profil LinkedIn : ${ctx.linkedinText.trim().slice(0, 500)}`)

  if (ctx.platforms.length > 0) {
    lines.push(
      `Plateformes connectées : ${ctx.platforms
        .map((p) => `${p.platform_name}${p.username ? ` (${p.username})` : ''}`)
        .join(', ')}`,
    )
  } else {
    lines.push('Plateformes connectées : aucune')
  }

  if (ctx.cumulativeRevenue > 0)
    lines.push(`Revenus cumulés (30 derniers jours) : ${ctx.cumulativeRevenue.toFixed(0)} €`)

  if (ctx.pendingRepliesTotal > 0)
    lines.push(`Réponses/messages en attente : ${ctx.pendingRepliesTotal}`)

  if (ctx.calendarEvents.length > 0)
    lines.push(`Prochains événements agenda : ${ctx.calendarEvents.slice(0, 5).join(' | ')}`)

  if (ctx.notionPages.length > 0)
    lines.push(`Pages Notion récentes : ${ctx.notionPages.slice(0, 5).join(' | ')}`)

  if (ctx.previousRoadmap) {
    lines.push(
      `Roadmap précédente : ${ctx.previousRoadmap.total_weeks} semaines — de "${ctx.previousRoadmap.first_step_title}" à "${ctx.previousRoadmap.last_step_title}"`,
    )
  }

  return lines.join('\n')
}

async function refreshGoogleToken(
  refreshToken: string,
  userId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
): Promise<string | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) return null

  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 8_000)
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
      cache: 'no-store',
      signal: ctrl.signal,
    }).finally(() => clearTimeout(timer))
    if (!res.ok) return null
    const data = (await res.json()) as { access_token?: string; expires_in?: number }
    if (!data.access_token) return null

    const expiresAt = new Date(Date.now() + (data.expires_in ?? 3600) * 1000).toISOString()
    await supabase
      .from('integration_connections')
      .update({ access_token: data.access_token, expires_at: expiresAt })
      .eq('user_id', userId)
      .eq('provider', 'google_calendar')

    return data.access_token
  } catch {
    return null
  }
}
