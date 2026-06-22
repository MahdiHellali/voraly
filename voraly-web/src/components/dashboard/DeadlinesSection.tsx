// ─── Voraly · Dashboard · DeadlinesSection (Server Component streamé) ─────────
// Fetch les événements Google Calendar en live HORS du chemin SSR principal :
// rendu sous <Suspense>, le dashboard s'affiche immédiatement et cette carte
// se stream dès que l'agenda répond (ou retombe sur l'état vide).

import { createClient } from '@/lib/supabase/server'
import { fetchGoogleCalendarDeadlines } from '@/lib/dashboard/google-calendar'
import DeadlineCard from './DeadlineCard'
import type { Deadline, IntegrationsState } from '@/lib/dashboard/types'

interface DeadlinesSectionProps {
  userId: string | null
  integrations: Pick<IntegrationsState, 'googleCalendar' | 'notion'>
  tableDeadlines: Deadline[]
}

export default async function DeadlinesSection({
  userId,
  integrations,
  tableDeadlines,
}: DeadlinesSectionProps) {
  let deadlines = tableDeadlines

  if (userId) {
    const supabase = await createClient()
    const calendarDeadlines = await fetchGoogleCalendarDeadlines(supabase, userId)
    if (calendarDeadlines.length > 0) {
      deadlines = [...tableDeadlines, ...calendarDeadlines]
        .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
        .slice(0, 10)
    }
  }

  return <DeadlineCard deadlines={deadlines} integrations={integrations} />
}
