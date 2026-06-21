import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { getDashboardData } from '@/lib/dashboard/data'
import DashboardContent from '@/components/dashboard/DashboardContent'

export const metadata: Metadata = {
  title: 'Dashboard — Voraly',
  description: "Vue d'ensemble de vos performances freelance sur toutes les plateformes.",
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const t = await getTranslations('dashboard.hero')
  const firstName =
    user?.user_metadata?.full_name?.trim().split(/\s+/)[0] ??
    user?.email?.split('@')[0] ??
    t('freelanceFallback')

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
        agenda: [],
        integrations: { googleCalendar: 'soon' as const, notion: 'soon' as const },
        todos: null,
        roadmapGeneratedLabel: undefined,
      }

  return (
    <DashboardContent
      firstName={firstName}
      data={data}
      userId={user?.id ?? null}
    />
  )
}
