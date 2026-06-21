import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { getIntegrationProvider, getIntegrationCredentials } from './providers'
import type { AgendaEvent } from '@/lib/dashboard/types'

// Récupère les événements du JOUR EN COURS depuis les intégrations connectées
// (Google Calendar + Notion). Tokens lus via la session RLS (jamais service_role) ;
// le refresh Google est persisté. Tout échec d'un provider est isolé → [].
type Conn = { provider: string; access_token: string | null; refresh_token: string | null; expires_at: string | null }

export async function getTodayAgenda(supabase: SupabaseClient, userId: string): Promise<AgendaEvent[]> {
  const { data: conns } = await supabase
    .from('integration_connections')
    .select('provider, access_token, refresh_token, expires_at')
    .eq('user_id', userId)
  if (!conns?.length) return []

  const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(); dayEnd.setHours(23, 59, 59, 999)

  const lists = await Promise.all(
    (conns as Conn[]).map((c) =>
      c.provider === 'google_calendar' ? fetchGoogle(c, supabase, userId, dayStart, dayEnd).catch(() => [])
        : c.provider === 'notion' ? fetchNotion(c, dayStart, dayEnd).catch(() => [])
          : Promise.resolve([] as AgendaEvent[]),
    ),
  )

  const now = Date.now()
  return lists
    .flat()
    .filter((e) => e.allDay || new Date(e.end ?? e.start).getTime() >= now)
    .sort((a, b) => a.start.localeCompare(b.start))
}

// ─── Google Calendar ──────────────────────────────────────────────────────────
async function fetchGoogle(c: Conn, supabase: SupabaseClient, userId: string, dayStart: Date, dayEnd: Date): Promise<AgendaEvent[]> {
  let token = c.access_token
  if (c.expires_at && new Date(c.expires_at).getTime() < Date.now() + 60_000) token = await refreshGoogle(c, supabase, userId)
  if (!token) return []

  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events')
  url.search = new URLSearchParams({
    timeMin: dayStart.toISOString(), timeMax: dayEnd.toISOString(),
    singleEvents: 'true', orderBy: 'startTime', maxResults: '50',
  }).toString()

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
  if (!res.ok) return []
  const json = await res.json()
  return (json.items ?? [])
    .map((it: { id: string; summary?: string; start?: { dateTime?: string; date?: string }; end?: { dateTime?: string; date?: string } }) => ({
      id: `gc-${it.id}`,
      title: it.summary?.trim() || 'Sans titre',
      start: it.start?.dateTime ?? it.start?.date ?? '',
      end: it.end?.dateTime ?? it.end?.date ?? null,
      allDay: !it.start?.dateTime,
      source: 'google_calendar' as const,
    }))
    .filter((e: AgendaEvent) => e.start)
}

async function refreshGoogle(c: Conn, supabase: SupabaseClient, userId: string): Promise<string | null> {
  const provider = getIntegrationProvider('google_calendar')
  const { clientId, clientSecret } = provider ? getIntegrationCredentials(provider) : { clientId: undefined, clientSecret: undefined }
  if (!c.refresh_token || !provider || !clientId || !clientSecret) return null

  const res = await fetch(provider.tokenUrl, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: c.refresh_token, client_id: clientId, client_secret: clientSecret }),
    cache: 'no-store',
  })
  if (!res.ok) return null
  const json = await res.json() as { access_token?: string; expires_in?: number }
  if (!json.access_token) return null

  const expiresAt = json.expires_in ? new Date(Date.now() + json.expires_in * 1000).toISOString() : null
  await supabase.from('integration_connections').update({ access_token: json.access_token, expires_at: expiresAt }).eq('user_id', userId).eq('provider', 'google_calendar')
  return json.access_token
}

// ─── Notion ───────────────────────────────────────────────────────────────────
// Cherche les pages partagées avec une propriété date tombant aujourd'hui.
async function fetchNotion(c: Conn, dayStart: Date, dayEnd: Date): Promise<AgendaEvent[]> {
  if (!c.access_token) return []
  const res = await fetch('https://api.notion.com/v1/search', {
    method: 'POST',
    headers: { Authorization: `Bearer ${c.access_token}`, 'Content-Type': 'application/json', 'Notion-Version': '2022-06-28' },
    body: JSON.stringify({ filter: { property: 'object', value: 'page' }, page_size: 50 }),
    cache: 'no-store',
  })
  if (!res.ok) return []
  const json = await res.json()

  const out: AgendaEvent[] = []
  for (const page of json.results ?? []) {
    let date: string | undefined, title = 'Sans titre'
    for (const v of Object.values(page.properties ?? {}) as Array<{ type?: string; date?: { start?: string }; title?: Array<{ plain_text?: string }> }>) {
      if (v?.type === 'date' && v.date?.start) date = v.date.start
      if (v?.type === 'title' && v.title?.length) title = v.title.map((t) => t.plain_text ?? '').join('') || title
    }
    if (!date) continue
    const t = new Date(date).getTime()
    if (t >= dayStart.getTime() && t <= dayEnd.getTime())
      out.push({ id: `nt-${page.id}`, title, start: date, end: null, allDay: date.length <= 10, source: 'notion' })
  }
  return out
}
