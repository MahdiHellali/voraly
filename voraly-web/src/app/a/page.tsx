// ─── Voraly · Page Admin — /a ─────────────────────────────────────────────────
// Server Component async — utilise createAdminClient() (bypass RLS).
// Accès garanti par AdminLayout (email admin vérifié côté serveur).
// Les animations framer-motion sont déléguées au composant client AdminAnimated.

import { createAdminClient } from '@/lib/supabase/admin'
import AdminAnimated from './AdminAnimated'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AnalyticsEvent {
  id: number
  event_name: string
  page: string | null
  created_at: string
  user_email: string | null
}

export interface TopPage {
  page: string
  views: number
}

export interface AdminStats {
  totalUsers: number
  premiumUsers: number
  new7d: number
  new30d: number
  recentEvents: AnalyticsEvent[]
  topPages: TopPage[]
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminPage() {
  const admin = createAdminClient()

  // eslint-disable-next-line react-hooks/purity
  const now = Date.now()
  const since7d = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()
  const since30d = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: totalUsers },
    { count: premiumUsers },
    { count: new7d },
    { count: new30d },
    { data: eventsRaw },
    { data: topPagesRaw },
  ] = await Promise.all([
    admin.from('profiles').select('*', { count: 'exact', head: true }),
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('is_premium', true),
    admin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', since7d),
    admin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', since30d),
    // Événements sans jointure — la FK pointe vers auth.users, pas public.profiles
    admin
      .from('analytics_events')
      .select('id, user_id, event_name, page, created_at')
      .order('created_at', { ascending: false })
      .limit(20),
    // Agrégation top pages côté DB via RPC
    admin.rpc('top_pages_7d'),
  ])

  // Résolution des emails via public.profiles (où la colonne email existe)
  const userIds = [...new Set((eventsRaw ?? []).map((e) => e.user_id).filter(Boolean))] as string[]
  let emailMap: Record<string, string> = {}
  if (userIds.length > 0) {
    const { data: profilesData } = await admin
      .from('profiles')
      .select('id, email')
      .in('id', userIds)
    for (const p of profilesData ?? []) {
      if (p.id && p.email) emailMap[p.id as string] = p.email as string
    }
  }

  const recentEvents: AnalyticsEvent[] = (eventsRaw ?? []).map((ev) => ({
    id: ev.id as number,
    event_name: ev.event_name as string,
    page: ev.page as string | null,
    created_at: ev.created_at as string,
    user_email: ev.user_id ? (emailMap[ev.user_id as string] ?? null) : null,
  }))

  const topPages: TopPage[] = (topPagesRaw ?? []) as { page: string; views: number }[]

  const stats: AdminStats = {
    totalUsers: totalUsers ?? 0,
    premiumUsers: premiumUsers ?? 0,
    new7d: new7d ?? 0,
    new30d: new30d ?? 0,
    recentEvents,
    topPages,
  }

  return <AdminAnimated stats={stats} />
}
