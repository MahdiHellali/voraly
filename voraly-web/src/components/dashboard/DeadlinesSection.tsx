import { createClient } from '@/lib/supabase/server'
import { getTodayAgenda } from '@/lib/integrations/agenda'
import DeadlineCard from './DeadlineCard'
import type { IntegrationsState } from '@/lib/dashboard/types'

interface DeadlinesSectionProps {
  userId: string | null
  integrations: Pick<IntegrationsState, 'googleCalendar' | 'notion'>
}

export default async function DeadlinesSection({
  userId,
  integrations,
}: DeadlinesSectionProps) {
  const agenda = userId
    ? await (async () => {
        const supabase = await createClient()
        return getTodayAgenda(supabase, userId)
      })().catch(() => [])
    : []

  return <DeadlineCard agenda={agenda} integrations={integrations} />
}
