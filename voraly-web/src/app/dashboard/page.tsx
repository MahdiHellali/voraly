import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import DashboardContent from '@/components/dashboard/DashboardContent'

export const metadata: Metadata = {
  title: 'Dashboard — Voraly',
  description: "Vue d'ensemble de vos performances freelance sur toutes les plateformes.",
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const firstName = user?.user_metadata?.full_name?.trim().split(/\s+/)[0]
    ?? user?.email?.split('@')[0]
    ?? 'Freelance'

  return <DashboardContent firstName={firstName} />
}
