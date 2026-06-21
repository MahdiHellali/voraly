// ─── Voraly · Dashboard · Couche serveur ─────────────────────────────────────
// Agrège toutes les données pour le dashboard.

import type { SupabaseClient } from '@supabase/supabase-js'
import { getTranslations } from 'next-intl/server'
import { normalizeRoadmap, normalizeCompletedSteps } from '@/lib/roadmap/types'
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

  // ── 3. Métriques revenus — RÉSILIENT ──────────────────────────────────────
  const revenue = null
  const chips = null
  const kpiItems = null
  const revenueSeries = null

  try {
    const { data: metrics, error } = await supabase
      .from('platform_metrics')
      .select('platform_name, metric_date, revenue, new_proposals, pending_replies, active_orders, conversion_rate')
      .eq('user_id', userId)
      .order('metric_date', { ascending: false })
      .limit(200)

    if (error) {
      if (!error.message?.includes('does not exist')) {
        console.error('[dashboard] platform_metrics fetch failed', error)
      }
    } else if (metrics && metrics.length > 0) {
      void metrics
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

  return {
    connectedPlatformsCount,
    revenue,
    chips,
    score: null,
    kpiItems,
    revenueSeries,
    deadlines,
    integrations,
    todos,
    roadmapGeneratedLabel,
  }
}
