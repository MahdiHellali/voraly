import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { QUESTIONS, type Question } from '@/lib/roadmap/types'

const N8N_QUESTIONS_URL =
  process.env.N8N_QUESTIONS_WEBHOOK_URL ??
  (process.env.N8N_ROADMAP_WEBHOOK_URL
    ? process.env.N8N_ROADMAP_WEBHOOK_URL.replace('generate-roadmap', 'generate-questions')
    : 'http://localhost:5678/webhook/generate-questions')

const N8N_TIMEOUT_MS = 30_000

// GET /api/roadmap/questions
// Agrège les données du freelance (plateformes, revenus, Calendar, Notion)
// et appelle le workflow n8n pour générer 4 questions diagnostiques sur-mesure.
// Si n8n est injoignable ou échoue, retourne les questions statiques par défaut.
export async function GET() {
  // 1. Session requise — user_id dérivé ici, jamais du client.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // 2. Collecter les données disponibles en parallèle (tout est best-effort).
  const [platformsResult, metricsResult, integrationsResult, profileResult] =
    await Promise.allSettled([
      supabase
        .from('platform_connections')
        .select('platform_name, username')
        .eq('user_id', user.id),
      supabase
        .from('platform_metrics')
        .select('platform_name, metric_name, metric_value, recorded_at')
        .eq('user_id', user.id)
        .gte('recorded_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('recorded_at', { ascending: false })
        .limit(50),
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

  // 3. Tenter de lire les events Google Calendar (best-effort).
  let calendarEvents: string[] = []
  const googleIntegration = integrations.find((i) => i.provider === 'google_calendar')
  if (googleIntegration) {
    try {
      let accessToken = googleIntegration.access_token
      // Refresh si expiré
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
      if (accessToken) {
        const timeMin = new Date().toISOString()
        const calCtrl = new AbortController()
        const calTimer = setTimeout(() => calCtrl.abort(), 8_000)
        const calRes = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?orderBy=startTime&singleEvents=true&timeMin=${encodeURIComponent(timeMin)}&maxResults=10`,
          { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store', signal: calCtrl.signal },
        ).finally(() => clearTimeout(calTimer))
        if (calRes.ok) {
          const calData = (await calRes.json()) as { items?: { summary?: string; start?: { dateTime?: string; date?: string } }[] }
          calendarEvents = (calData.items ?? []).map(
            (e) => `${e.summary ?? 'Événement'} (${e.start?.dateTime ?? e.start?.date ?? ''})`,
          )
        }
      }
    } catch (err) {
      console.warn('[questions] google calendar fetch failed:', err)
    }
  }

  // 4. Tenter de lire les pages Notion récentes (best-effort).
  let notionPages: string[] = []
  const notionIntegration = integrations.find((i) => i.provider === 'notion')
  if (notionIntegration?.access_token) {
    try {
      const notionCtrl = new AbortController()
      const notionTimer = setTimeout(() => notionCtrl.abort(), 8_000)
      const notionRes = await fetch('https://api.notion.com/v1/search', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${notionIntegration.access_token}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify({ filter: { value: 'page', property: 'object' }, page_size: 10 }),
        cache: 'no-store',
        signal: notionCtrl.signal,
      }).finally(() => clearTimeout(notionTimer))
      if (notionRes.ok) {
        const notionData = (await notionRes.json()) as {
          results?: { properties?: { title?: { title?: { plain_text?: string }[] }[] }; object?: string }[]
        }
        notionPages = (notionData.results ?? [])
          .map((p) => {
            const titleProp = p.properties?.title
            if (Array.isArray(titleProp)) {
              return titleProp.flatMap((t) => t?.title ?? []).map((t) => t.plain_text ?? '').join('') || 'Page Notion'
            }
            return 'Page Notion'
          })
          .filter(Boolean)
      }
    } catch (err) {
      console.warn('[questions] notion fetch failed:', err)
    }
  }

  // 5. Agréger en un résumé texte pour le prompt.
  const userDataSummary = buildUserDataSummary({
    platforms,
    metrics,
    calendarEvents,
    notionPages,
    profileName: profile?.full_name ?? null,
    linkedinText: profile?.linkedin_profile_text ?? null,
  })

  // 6. Appeler le webhook n8n generate-questions.
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), N8N_TIMEOUT_MS)
    const res = await fetch(N8N_QUESTIONS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, user_data: userDataSummary }),
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
    console.warn('[questions] n8n unreachable, falling back to static questions:', err)
  }

  // 7. Fallback : questions statiques.
  return NextResponse.json({ questions: QUESTIONS, source: 'static' })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildUserDataSummary(ctx: {
  platforms: { platform_name: string; username?: string | null }[]
  metrics: { platform_name: string; metric_name: string; metric_value: number }[]
  calendarEvents: string[]
  notionPages: string[]
  profileName: string | null
  linkedinText: string | null
}): string {
  const lines: string[] = []

  if (ctx.profileName) lines.push(`Nom : ${ctx.profileName}`)
  if (ctx.linkedinText?.trim()) lines.push(`Profil LinkedIn : ${ctx.linkedinText.trim().slice(0, 500)}`)

  if (ctx.platforms.length > 0) {
    lines.push(
      `Plateformes connectées : ${ctx.platforms.map((p) => `${p.platform_name}${p.username ? ` (${p.username})` : ''}`).join(', ')}`,
    )
  } else {
    lines.push('Plateformes connectées : aucune')
  }

  if (ctx.metrics.length > 0) {
    const revenueTotal = ctx.metrics
      .filter((m) => m.metric_name === 'revenue')
      .reduce((s, m) => s + (m.metric_value ?? 0), 0)
    if (revenueTotal > 0) lines.push(`Revenus des 30 derniers jours : ${revenueTotal.toFixed(0)} €`)
  }

  if (ctx.calendarEvents.length > 0) {
    lines.push(`Prochains événements agenda : ${ctx.calendarEvents.slice(0, 5).join(' | ')}`)
  }

  if (ctx.notionPages.length > 0) {
    lines.push(`Pages Notion récentes : ${ctx.notionPages.slice(0, 5).join(' | ')}`)
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
    const refreshCtrl = new AbortController()
    const refreshTimer = setTimeout(() => refreshCtrl.abort(), 8_000)
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
      signal: refreshCtrl.signal,
    }).finally(() => clearTimeout(refreshTimer))
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
