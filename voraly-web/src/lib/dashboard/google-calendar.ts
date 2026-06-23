// ─── Voraly · Dashboard · Google Calendar → Deadlines ────────────────────────
// Récupère en live les prochains événements Google Calendar de l'utilisateur et
// les mappe en `Deadline[]` pour la carte "Urgences & Deadlines".
// Best-effort : toute erreur renvoie [] sans casser le dashboard.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Deadline } from './types'

const FETCH_TIMEOUT_MS = 8_000
// Fenêtre d'anticipation utilisée pour calculer la barre de progression :
// un événement imminent affiche une barre quasi pleine, un événement lointain une barre courte.
const LEAD_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

interface GoogleCalendarEvent {
  id?: string
  summary?: string
  start?: { dateTime?: string; date?: string }
}

/** Convertit l'échéance en pourcentage de progression visuel (0-100). */
function computeProgress(dueAt: string): number {
  const msLeft = new Date(dueAt).getTime() - Date.now()
  if (msLeft <= 0) return 100
  const ratio = 1 - msLeft / LEAD_WINDOW_MS
  return Math.max(8, Math.min(100, Math.round(ratio * 100)))
}

export async function fetchGoogleCalendarDeadlines(
  supabase: SupabaseClient,
  userId: string,
): Promise<Deadline[]> {
  // 1. Récupérer la connexion google_calendar (tokens serveur-only).
  let connection: {
    access_token: string | null
    refresh_token: string | null
    expires_at: string | null
  } | null = null
  try {
    const { data, error } = await supabase
      .from('integration_connections')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', userId)
      .eq('provider', 'google_calendar')
      .maybeSingle()
    if (error || !data) return []
    connection = data
  } catch {
    return []
  }

  // 2. Rafraîchir le token si nécessaire.
  let accessToken = connection.access_token
  const expiresAt = connection.expires_at ? new Date(connection.expires_at).getTime() : 0
  if (expiresAt < Date.now() + 60_000 && connection.refresh_token) {
    const refreshed = await refreshGoogleToken(connection.refresh_token, userId, supabase)
    if (refreshed) accessToken = refreshed
  }
  if (!accessToken) return []

  // 3. Lire les prochains événements de l'agenda principal.
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?orderBy=startTime&singleEvents=true&timeMin=${encodeURIComponent(
        new Date().toISOString(),
      )}&maxResults=10`,
      { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store', signal: ctrl.signal },
    ).finally(() => clearTimeout(timer))

    if (!res.ok) return []

    const data = (await res.json()) as { items?: GoogleCalendarEvent[] }
    return (data.items ?? [])
      .map((event, index): Deadline | null => {
        const due = event.start?.dateTime ?? event.start?.date
        if (!due) return null
        return {
          id: event.id ?? `gcal-${index}`,
          title: event.summary?.trim() || 'Événement sans titre',
          client: null,
          dueAt: due,
          progress: computeProgress(due),
          source: 'google_calendar',
        }
      })
      .filter((d): d is Deadline => d !== null)
  } catch {
    return []
  }
}

/** Échange le refresh_token contre un access_token frais et le persiste. */
async function refreshGoogleToken(
  refreshToken: string,
  userId: string,
  supabase: SupabaseClient,
): Promise<string | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) return null

  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
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

    const newExpiresAt = new Date(Date.now() + (data.expires_in ?? 3600) * 1000).toISOString()
    await supabase
      .from('integration_connections')
      .update({ access_token: data.access_token, expires_at: newExpiresAt })
      .eq('user_id', userId)
      .eq('provider', 'google_calendar')

    return data.access_token
  } catch {
    return null
  }
}
