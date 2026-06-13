// ─── Voraly · Dashboard · Couche serveur ─────────────────────────────────────
// Agrège toutes les données pour le dashboard.
// RÉSILIENCE : les 3 nouvelles tables (platform_metrics, integration_connections,
// deadlines) peuvent ne pas encore exister si les migrations n'ont pas été
// lancées. Chaque requête est enveloppée dans un try/catch + fallback pour
// que le dashboard s'affiche toujours, même sans données.

import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizeRoadmap, normalizeCompletedSteps } from '@/lib/roadmap/types'
import type { DashboardData, AiTask, Deadline, IntegrationsState } from './types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mapPriority(stepNumber: number): 'high' | 'medium' | 'low' {
  if (stepNumber <= 2) return 'high'
  if (stepNumber <= 4) return 'medium'
  return 'low'
}

// ─── Fonction principale ──────────────────────────────────────────────────────

/**
 * Récupère et agrège toutes les données du dashboard pour l'utilisateur.
 * Ne lève jamais d'exception : tout échec est absorbé avec un fallback vide.
 */
export async function getDashboardData(
  supabase: SupabaseClient,
  userId: string,
): Promise<DashboardData> {

  // ── 1. Nb plateformes connectées ──────────────────────────────────────────
  let connectedPlatformsCount = 0
  try {
    const { count, error } = await supabase
      .from('platform_connections')
      .select('*', { head: true, count: 'exact' })
      .eq('user_id', userId)

    if (!error && count != null) {
      connectedPlatformsCount = count
    }
  } catch (err) {
    console.error('[dashboard] platform_connections count failed', err)
  }

  // ── 2. To-do IA (profiles.ai_roadmap + completed_steps) ──────────────────
  let todos: AiTask[] | null = null
  let roadmapGeneratedLabel: string | undefined

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('ai_roadmap, completed_steps')
      .eq('id', userId)
      .single()

    if (!error && profile) {
      const steps = normalizeRoadmap(profile.ai_roadmap)
      if (steps.length > 0) {
        const completedSteps = normalizeCompletedSteps(profile.completed_steps)
        todos = steps.map((step) => ({
          id: String(step.step_number),
          text: step.title,
          done: completedSteps.includes(step.step_number),
          priority: mapPriority(step.step_number),
        }))
        roadmapGeneratedLabel = 'Générée par Voraly AI'
      }
      // Si steps vide → todos reste null (état B : "générer")
    }
  } catch (err) {
    console.error('[dashboard] profiles roadmap fetch failed', err)
  }

  // ── 3. Métriques revenus (platform_metrics) — RÉSILIENT ──────────────────
  // La table peut ne pas exister si la migration n'a pas encore été lancée.
  // Dans ce cas (ou si 0 ligne), tout reste null → empty states.
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

    // Si la table n'existe pas encore, Supabase renvoie une erreur postgres.
    // On absorbe silencieusement → toutes les métriques restent null.
    if (error) {
      if (!error.message?.includes('does not exist')) {
        console.error('[dashboard] platform_metrics fetch failed', error)
      }
      // Pas de données disponibles → empty states
    } else if (metrics && metrics.length > 0) {
      // Logique d'agrégation (placeholder) — sera complétée quand les syncs
      // API seront construits et que des lignes réelles seront présentes.
      // Pour l'instant, même avec des lignes, on ne reconstruit pas encore
      // les agrégats complexes (mois courant vs précédent par plateforme).
      // Décommenter et compléter cette section quand les syncs seront prêts.
      //
      // Exemple de structure future :
      //   revenue = { monthTotal: ..., deltaPct: ..., activePlatforms: ... }
      //   chips   = { revenueToday: ..., newProposals: ..., pendingReplies: ... }
      //   kpiItems = [...]
      //   revenueSeries = { months: [...], series: [...] }
      //
      // En attendant → null (empty states maintenus).
      void metrics // évite le warning "assigned but never used"
    }
  } catch (err) {
    // La table n'existe pas encore (migration non lancée) → ok, empty states.
    console.error('[dashboard] platform_metrics unexpected error', err)
  }

  // ── 4. Deadlines (table deadlines) — RÉSILIENT ────────────────────────────
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

  // ── 5. Intégrations (integration_connections) — RÉSILIENT ────────────────
  const integrations: IntegrationsState = {
    googleCalendar: 'soon',
    notion: 'soon',
  }

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

  // ── Assemblage ────────────────────────────────────────────────────────────
  return {
    connectedPlatformsCount,
    revenue,
    chips,
    score: null,        // Aucune source calculée pour le score
    kpiItems,
    revenueSeries,
    deadlines,
    integrations,
    todos,
    roadmapGeneratedLabel,
  }
}
