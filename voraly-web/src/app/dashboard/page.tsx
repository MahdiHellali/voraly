import type { Metadata } from 'next'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getDashboardData } from '@/lib/dashboard/data'
import DashboardContent from '@/components/dashboard/DashboardContent'
import DeadlinesSection from '@/components/dashboard/DeadlinesSection'
import DeadlineCardSkeleton from '@/components/dashboard/DeadlineCardSkeleton'

export const metadata: Metadata = {
  title: 'Dashboard — Voraly',
  description: "Vue d'ensemble de vos performances freelance sur toutes les plateformes.",
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const firstName =
    user?.user_metadata?.full_name?.trim().split(/\s+/)[0] ??
    user?.email?.split('@')[0] ??
    'Freelance'

  const data = user
    ? await getDashboardData(supabase, user.id)
    : {
        connectedPlatformsCount: 0,
        revenue: null,
        chips: null,
        score: null,
        kpiItems: null,
        revenueSeries: null,
        deadlines: [],
        integrations: { googleCalendar: 'soon' as const, notion: 'soon' as const },
        todos: null,
        roadmapGeneratedLabel: undefined,
      }

  const deadlineSlot = (
    <Suspense fallback={<DeadlineCardSkeleton />}>
      <DeadlinesSection
        userId={user?.id ?? null}
        integrations={data.integrations}
        tableDeadlines={data.deadlines}
      />
    </Suspense>
  )

  return (
    <DashboardContent
      firstName={firstName}
      data={data}
      userId={user?.id ?? null}
      deadlineSlot={deadlineSlot}
    />
  )
}
