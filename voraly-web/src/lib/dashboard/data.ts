// ─── Voraly · Dashboard · Couche serveur ─────────────────────────────────────
// Agrège toutes les données pour le dashboard.

import type { SupabaseClient } from '@supabase/supabase-js'
import { getTranslations } from 'next-intl/server'
import { normalizeRoadmap, normalizeCompletedSteps } from '@/lib/roadmap/types'
import { getTodayAgenda } from '@/lib/integrations/agenda'
import type { DashboardData, AiTask, Deadline, IntegrationsState } from './types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mapPriority(dayIndex: number): 'high' | 'medium' | 'low' {
  if (dayIndex <= 1) return 'high'
  if (dayIndex <= 3) return 'medium'
  return 'low'
}

// Normalise completed_daily_tasks depuis JSONB (array de strings).
function normalizeCompletedDailyTasks(raw: unknown): string[] {
  let data: unknown = raw
  if (typeof data === 'string') {
    try { data = JSON.parse(data) } catch { return [] }
  }
  if (!Array.isArray(data)) return []
  return data.filter((v) => typeof v === 'string')
}

/** KPIs par défaut quand aucune métrique n'est disponible. */
function buildDefaultKpis(count: number) {
  return [
    { title: '0', description: '€ de revenus ce mois', icon: null, colSpan: 2, tags: [`${count} plateformes`] },
    { title: '0', description: 'Commandes actives', icon: null, colSpan: 1, tags: [] },
    { title: '—', description: 'Note moyenne', icon: null, colSpan: 1, tags: [] },
  ] as NonNullable<DashboardData['kpiItems']>
}

// ─── Fonction principale ──────────────────────────────────────────────────────

export async function getDashboardData(
  supabase: SupabaseClient,
  userId: string,
): Promise<DashboardData> {
  const t = await getTranslations('dashboard.aiTasks')

  // ── 1. Nb plateformes connectées ──────────────────────────────────────────
  let connectedPlatformsCount = 0
  try {
    const { count, error } = await supabase
      .from('platform_connections')
      .select('*', { head: true, count: 'exact' })
      .eq('user_id', userId)
    if (!error && count != null) connectedPlatformsCount = count
  } catch (err) {
    console.error('[dashboard] platform_connections count failed', err)
  }

  // ── 2. To-do IA (tâches quotidiennes de la semaine en cours) ─────────────
  let todos: AiTask[] | null = null
  let roadmapGeneratedLabel: string | undefined

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('ai_roadmap, completed_steps')
      .eq('id', userId)
      .single()

    // completed_daily_tasks en requête séparée : best-effort si la colonne n'existe pas encore.
    let rawDailyTasks: unknown = null
    if (!error && profile) {
      const { data: dtRow } = await supabase
        .from('profiles')
        .select('completed_daily_tasks')
        .eq('id', userId)
        .single()
      rawDailyTasks = dtRow?.completed_daily_tasks ?? null
    }

    if (!error && profile) {
      const steps = normalizeRoadmap(profile.ai_roadmap)
      if (steps.length > 0) {
        const completedSteps = normalizeCompletedSteps(profile.completed_steps)
        const completedDailyTasks = normalizeCompletedDailyTasks(rawDailyTasks)

        // Trouver la première semaine non complétée avec un daily_plan.
        const currentStep =
          steps.find((s) => !completedSteps.includes(s.step_number) && (s.daily_plan?.length ?? 0) > 0) ??
          steps.find((s) => !completedSteps.includes(s.step_number)) ??
          steps[steps.length - 1]

        if (currentStep?.daily_plan && currentStep.daily_plan.length > 0) {
          // Une seule tâche par jour (la première) — évite les doublons visuels.
          todos = currentStep.daily_plan.flatMap((day, dayIndex) => {
            const firstTask = day.tasks[0]
            if (!firstTask) return []
            const id = `${currentStep.step_number}-${day.day}-0`
            return [{
              id,
              text: firstTask,
              done: completedDailyTasks.includes(id),
              priority: mapPriority(dayIndex),
              dayLabel: day.day,
              weekLabel: t('weekLabel', { n: currentStep.step_number }),
            } satisfies AiTask]
          })
        } else {
          // Fallback : afficher les étapes hebdomadaires (pas encore de daily_plan).
          todos = steps.map((step) => ({
            id: String(step.step_number),
            text: step.title,
            done: completedSteps.includes(step.step_number),
            priority: mapPriority(step.step_number - 1),
          }))
        }
        roadmapGeneratedLabel = t('generatedByAi')
      }
    }
  } catch (err) {
    console.error('[dashboard] profiles roadmap fetch failed', err)
  }

  // ── 3. Métriques revenus — calculées depuis platform_metrics ──────────────
  let revenue: DashboardData['revenue'] = null
  let chips: DashboardData['chips'] = null
  let kpiItems: DashboardData['kpiItems'] = null
  let revenueSeries: DashboardData['revenueSeries'] = null

  try {
    const { data: metrics, error } = await supabase
      .from('platform_metrics')
      .select('platform_name, metric_date, revenue, new_proposals, pending_replies, active_orders, conversion_rate, rating')
      .eq('user_id', userId)
      .order('metric_date', { ascending: false })
      .limit(200)

    if (error) {
      if (!error.message?.includes('does not exist')) {
        console.error('[dashboard] platform_metrics fetch failed', error)
      }
      // Table absente → KPIs par défaut à 0
      kpiItems = buildDefaultKpis(connectedPlatformsCount)
    } else if (metrics && metrics.length > 0) {
      // Calculer les métriques à partir des données réelles
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
      const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

      let monthTotal = 0
      let prevMonthTotal = 0
      const activePlatforms = new Set<string>()
      const platformRevenues: Record<string, number[]> = {}
      const platformColors: Record<string, string> = {
        upwork: '#22c55e',
        fiverr: '#14b8a6',
        malt: '#f43f5e',
        linkedin: '#3b82f6',
      }
      let totalActiveOrders = 0
      let totalNewProposals = 0
      let totalPendingReplies = 0
      let ratingsSum = 0
      let ratingsCount = 0

      for (const m of metrics) {
        const date = new Date(m.metric_date)
        const month = date.getMonth()
        const year = date.getFullYear()

        if (m.revenue) {
          if (month === currentMonth && year === currentYear) {
            monthTotal += Number(m.revenue)
            activePlatforms.add(m.platform_name)
          } else if (month === prevMonth && year === prevMonthYear) {
            prevMonthTotal += Number(m.revenue)
          }

          // Série temporelle pour le graphique
          if (!platformRevenues[m.platform_name]) platformRevenues[m.platform_name] = []
        }

        if (m.active_orders) totalActiveOrders += Number(m.active_orders)
        if (m.new_proposals) totalNewProposals += Number(m.new_proposals)
        if (m.pending_replies) totalPendingReplies += Number(m.pending_replies)
        if (m.rating) { ratingsSum += Number(m.rating); ratingsCount++ }
      }

      // Revenu
      const deltaPct = prevMonthTotal > 0
        ? Math.round(((monthTotal - prevMonthTotal) / prevMonthTotal) * 100)
        : 0

      revenue = {
        monthTotal: Math.round(monthTotal),
        deltaPct,
        activePlatforms: activePlatforms.size,
      }

      // Chips
      chips = {
        revenueToday: `${Math.round(monthTotal / 30)} €`,
        newProposals: totalNewProposals,
        pendingReplies: totalPendingReplies,
      }

      // Score — calculé mais non exposé pour l'instant (type BentoItem incompatible)
      const avgRating = ratingsCount > 0 ? Math.round((ratingsSum / ratingsCount) * 10) / 10 : 0
      const score = Math.round(
        (activePlatforms.size * 15) + (Math.min(monthTotal / 100, 30)) + (avgRating * 10) + (totalActiveOrders * 2)
      )
      void score // réservé pour usage futur

      // KPI items
      kpiItems = [
        {
          title: String(Math.round(monthTotal)),
          description: '€ de revenus ce mois',
          icon: null as unknown as React.ReactNode,
          colSpan: 2,
          tags: [`${activePlatforms.size} plateformes`],
        },
        {
          title: String(totalActiveOrders),
          description: 'Commandes actives',
          icon: null as unknown as React.ReactNode,
          colSpan: 1,
          tags: [],
        },
        {
          title: avgRating > 0 ? `${avgRating}/5` : '—',
          description: 'Note moyenne',
          icon: null as unknown as React.ReactNode,
          colSpan: 1,
          tags: [],
        },
      ]

      // Revenue Series (simple: par plateforme ce mois)
      revenueSeries = {
        months: ['Ce mois'],
        series: Object.entries(platformRevenues).map(([platform]) => ({
          platform,
          color: platformColors[platform] || '#6366f1',
          values: [Math.round(metrics
            .filter(m => m.platform_name === platform)
            .reduce((sum, m) => sum + Number(m.revenue || 0), 0))],
        })),
      }
    } else {
      // Aucune métrique → KPIs par défaut à 0
      kpiItems = buildDefaultKpis(connectedPlatformsCount)
    }
  } catch (err) {
    console.error('[dashboard] platform_metrics unexpected error', err)
  }

  // ── 4. Deadlines — RÉSILIENT ───────────────────────────────────────────────
  let deadlines: Deadline[] = []

  try {
    const { data: rows, error } = await supabase
      .from('deadlines')
      .select('id, title, client, due_at, progress, source')
      .eq('user_id', userId)
      .order('due_at', { ascending: true })
      .limit(10)

    if (error) {
      if (!error.message?.includes('does not exist')) {
        console.error('[dashboard] deadlines fetch failed', error)
      }
    } else if (rows && rows.length > 0) {
      deadlines = rows.map((row) => ({
        id: row.id as string,
        title: row.title as string,
        client: row.client as string | null,
        dueAt: row.due_at as string,
        progress: row.progress as number,
        source: row.source as 'google_calendar' | 'notion',
      }))
    }
  } catch (err) {
    console.error('[dashboard] deadlines unexpected error', err)
  }
  // Note : les événements Google Calendar live sont fetchés à part, en streaming
  // via <Suspense> (DeadlinesSection), pour ne pas bloquer le SSR du dashboard.

  // ── 5. Intégrations — RÉSILIENT ───────────────────────────────────────────
  const integrations: IntegrationsState = { googleCalendar: 'soon', notion: 'soon' }

  try {
    const { data: rows, error } = await supabase
      .from('integration_connections')
      .select('provider')
      .eq('user_id', userId)

    if (error) {
      if (!error.message?.includes('does not exist')) {
        console.error('[dashboard] integration_connections fetch failed', error)
      }
    } else if (rows) {
      for (const row of rows) {
        if (row.provider === 'google_calendar') integrations.googleCalendar = 'connected'
        if (row.provider === 'notion') integrations.notion = 'connected'
      }
    }
  } catch (err) {
    console.error('[dashboard] integration_connections unexpected error', err)
  }

  // ── 6. Agenda du jour (Google Calendar + Notion) — RÉSILIENT ──────────────
  const agenda = await getTodayAgenda(supabase, userId).catch((err) => {
    console.error('[dashboard] agenda fetch failed', err)
    return []
  })

  return {
    connectedPlatformsCount,
    revenue,
    chips,
    score: null,
    kpiItems,
    revenueSeries,
    deadlines,
    agenda,
    integrations,
    todos,
    roadmapGeneratedLabel,
  }
}
