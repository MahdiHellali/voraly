// ─── Voraly · Dashboard · Types ──────────────────────────────────────────────
// Types partagés entre la couche serveur (data.ts) et les composants client.

import type { BentoItem } from '@/components/ui/bento-grid'

export type { BentoItem }

// ─── Deadline ────────────────────────────────────────────────────────────────

/**
 * Livraison imminente — issue de Google Calendar ou Notion (table `deadlines`).
 * Quand la table est vide ou absente, le dashboard affiche un empty state.
 */
export interface Deadline {
  id: string
  title: string
  client?: string | null
  dueAt: string          // ISO 8601 — formaté côté client
  progress: number       // 0-100
  source: 'google_calendar' | 'notion'
}

// ─── AiTask ──────────────────────────────────────────────────────────────────

/**
 * Tâche issue de la roadmap IA (`profiles.ai_roadmap`).
 * Quand `ai_roadmap` est vide, `tasks` est null et AiTaskCard affiche l'état B.
 */
export interface AiTask {
  id: string            // "${step_number}-${day}-${taskIndex}" ou String(step_number)
  text: string          // tâche quotidienne ou step.title
  done: boolean
  priority: 'high' | 'medium' | 'low'
  dayLabel?: string     // "Lundi", "Mardi"… (présent quand daily_plan disponible)
  weekLabel?: string    // "Semaine 1" (présent quand daily_plan disponible)
}

// ─── Revenue ─────────────────────────────────────────────────────────────────

export interface RevenueData {
  monthTotal: number
  deltaPct: number
  activePlatforms: number
}

export interface ChipsData {
  revenueToday?: string
  newProposals?: number
  pendingReplies?: number
}

// ─── Série graphique ─────────────────────────────────────────────────────────

export interface RevenueSeries {
  months: string[]
  series: Array<{
    platform: string
    color: string
    values: number[]
  }>
}

// ─── Intégrations (Google Calendar / Notion) ─────────────────────────────────

export type IntegrationStatus = 'connect' | 'soon' | 'connected'

export interface IntegrationsState {
  googleCalendar: IntegrationStatus
  notion: IntegrationStatus
}

// ─── DashboardData ───────────────────────────────────────────────────────────

/**
 * Données agrégées côté serveur et passées à DashboardContent.
 * Chaque champ nullable signifie "donnée indisponible → empty state".
 */
export interface DashboardData {
  /** Nb plateformes OAuth connectées — issu de `platform_connections`. */
  connectedPlatformsCount: number

  /** Revenus agrégés du mois en cours — null si aucune métrique disponible. */
  revenue: RevenueData | null

  /** Chips statistiques rapides — null si aucune métrique disponible. */
  chips: ChipsData | null

  /** Score freelance — null tant que la source n'est pas construite. */
  score: number | null

  /** Éléments KPI (BentoGrid) — null si aucune métrique disponible. */
  kpiItems: BentoItem[] | null

  /** Série pour le graphique revenus — null si aucune métrique disponible. */
  revenueSeries: RevenueSeries | null

  /** Livraisons imminentes — [] si table absente ou vide. */
  deadlines: Deadline[]

  /** Statut des intégrations Calendar/Notion. */
  integrations: IntegrationsState

  /** Tâches IA — null si ai_roadmap vide (état B : "générer"). */
  todos: AiTask[] | null

  /** Label affiché sous le titre de la to-do list quand elle est générée. */
  roadmapGeneratedLabel?: string
}
