import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { getIntegrationProvider, getIntegrationCredentials } from './providers'
import type { AgendaEvent } from '@/lib/dashboard/types'

// Récupère les événements du JOUR EN COURS depuis les intégrations connectées
// (Google Calendar + Notion). Tokens lus via la session RLS (jamais service_role) ;
// le refresh Google est persisté. Tout échec d'un provider est isolé → [].
type Conn = { provider: string; access_token: string | null; refresh_token: string | null; expires_at: string | null }

// Coupe-circuit : un provider lent ne doit jamais bloquer le rendu du dashboard.
const timeout = () => AbortSignal.timeout(5_000)

export async function getTodayAgenda(supabase: SupabaseClient, userId: string): Promise<AgendaEvent[]> {
  const { data: conns } = await supabase
    .from('integration_connections')
    .select('provider, access_token, refresh_token, expires_at')
    .eq('user_id', userId)
  if (!conns?.length) return []

  // Fenêtre large (±36h) : le VPS est en UTC mais l'utilisateur peut être dans un
  // autre fuseau. Le filtrage sur « aujourd'hui » est fait côté client (DeadlineCard),
  // qui connaît le vrai fuseau du navigateur.
  const winMin = new Date(Date.now() - 36 * 3_600_000)
  const winMax = new Date(Date.now() + 36 * 3_600_000)

  const lists = await Promise.all(
    (conns as Conn[]).map((c) =>
      c.provider === 'google_calendar' ? fetchGoogle(c, supabase, userId, winMin, winMax).catch(() => [])
        : c.provider === 'notion' ? fetchNotion(c, winMin, winMax).catch(() => [])
          : Promise.resolve([] as AgendaEvent[]),
    ),
  )

  return lists.flat().sort((a, b) => a.start.localeCompare(b.start))
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

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', signal: timeout() })
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
    cache: 'no-store', signal: timeout(),
  })
  if (!res.ok) return null
  const json = await res.json() as { access_token?: string; expires_in?: number }
  if (!json.access_token) return null

  const expiresAt = json.expires_in ? new Date(Date.now() + json.expires_in * 1000).toISOString() : null
  await supabase.from('integration_connections').update({ access_token: json.access_token, expires_at: expiresAt }).eq('user_id', userId).eq('provider', 'google_calendar')
  return json.access_token
}

// ─── Notion ───────────────────────────────────────────────────────────────────
// 1. Requête les entrées du calendrier editorial Voraly (base de données Notion).
// 2. Cherche aussi les pages partagées avec une propriété date (comportement original).
async function fetchNotion(c: Conn, dayStart: Date, dayEnd: Date): Promise<AgendaEvent[]> {
  if (!c.access_token) return []
  const h = {
    Authorization: `Bearer ${c.access_token}`,
    'Content-Type': 'application/json',
    'Notion-Version': '2022-06-28',
  }
  const out: AgendaEvent[] = []
  const seenIds = new Set<string>()

  // ── 1. Calendrier editorial Voraly (base de données) ──────────────────────
  await (async () => {
    // Chercher les bases de données dont le titre contient "Voraly"
    const searchRes = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        query: 'Voraly',
        filter: { property: 'object', value: 'database' },
        page_size: 5,
      }),
      cache: 'no-store',
      signal: timeout(),
    })
    if (!searchRes.ok) return
    const { results: dbs = [] } = (await searchRes.json()) as { results: Array<{ id: string; properties?: Record<string, unknown> }> }

    await Promise.allSettled(
      dbs.map(async (db) => {
        // Filtrer les entrées dont "Date de publication" tombe dans la fenêtre
        const qRes = await fetch(`https://api.notion.com/v1/databases/${db.id}/query`, {
          method: 'POST',
          headers: h,
          body: JSON.stringify({
            filter: {
              and: [
                {
                  property: 'Date de publication',
                  date: { on_or_after: dayStart.toISOString().slice(0, 10) },
                },
                {
                  property: 'Date de publication',
                  date: { on_or_before: dayEnd.toISOString().slice(0, 10) },
                },
              ],
            },
            page_size: 50,
          }),
          cache: 'no-store',
          signal: timeout(),
        })
        if (!qRes.ok) return
        const { results: entries = [] } = (await qRes.json()) as {
          results: Array<{ id: string; properties?: Record<string, { type?: string; title?: Array<{ plain_text?: string }>; date?: { start?: string } }> }>
        }

        for (const entry of entries) {
          let title = 'Sans titre', date: string | undefined
          let status: string | null = null, type: string | null = null, notes: string | null = null
          for (const [, prop] of Object.entries(entry.properties ?? {})) {
            const p = prop as {
              type?: string
              title?: Array<{ plain_text?: string }>
              date?: { start?: string }
              select?: { name?: string }
              rich_text?: Array<{ plain_text?: string }>
            }
            if (p.type === 'title' && p.title?.length)
              title = p.title.map((t) => t.plain_text ?? '').join('') || title
            if (p.type === 'date' && p.date?.start)
              date = p.date.start
            if (p.type === 'select' && p.select?.name) {
              // Statut : "Idée" | "En cours" | "Rédigé" | "Publié"
              const v = p.select.name
              if (['Idée', 'En cours', 'Rédigé', 'Publié'].includes(v)) status = v
              // Type : "Blog" | "Réseau social" | "Newsletter" | "Vidéo"
              else if (['Blog', 'Réseau social', 'Newsletter', 'Vidéo'].includes(v)) type = v
            }
            if (p.type === 'rich_text' && p.rich_text?.length)
              notes = p.rich_text.map((t) => t.plain_text ?? '').join('') || null
          }
          if (!date) continue
          const id = `nt-${entry.id}`
          if (seenIds.has(id)) continue
          seenIds.add(id)
          out.push({
            id,
            title,
            start: date,
            end: null,
            allDay: date.length <= 10,
            source: 'notion',
            notionPageId: entry.id,
            status,
            type,
            notes,
          })
        }
      }),
    )
  })().catch(() => { /* calendrier Voraly indisponible, on continue */ })

  // ── 2. Pages partagées avec propriété date (comportement original) ─────────
  const pageRes = await fetch('https://api.notion.com/v1/search', {
    method: 'POST',
    headers: h,
    body: JSON.stringify({ filter: { property: 'object', value: 'page' }, page_size: 50 }),
    cache: 'no-store', signal: timeout(),
  })
  if (!pageRes.ok) return out
  const { results: pages = [] } = (await pageRes.json()) as { results: Array<{ id: string; properties?: Record<string, { type?: string; date?: { start?: string }; title?: Array<{ plain_text?: string }> }> }> }

  for (const page of pages) {
    let date: string | undefined, title = 'Sans titre'
    for (const v of Object.values(page.properties ?? {})) {
      if (v?.type === 'date' && v.date?.start) date = v.date.start
      if (v?.type === 'title' && v.title?.length) title = v.title.map((t) => t.plain_text ?? '').join('') || title
    }
    if (!date) continue
    const ms = new Date(date).getTime()
    if (ms < dayStart.getTime() || ms > dayEnd.getTime()) continue
    const id = `nt-${page.id}`
    if (seenIds.has(id)) continue
    seenIds.add(id)
    out.push({ id, title, start: date, end: null, allDay: date.length <= 10, source: 'notion' })
  }

  return out
}
