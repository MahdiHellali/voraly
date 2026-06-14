// ─── Voraly · Roadmap · Types & questionnaire config ─────────────────────────
// Shared by the server route handler and the client experience components.

/** The phases of the diagnostic experience. */
export type Phase = 'empty' | 'analyzing' | 'questionnaire' | 'loading' | 'roadmap'

/** A single day's action items inside a weekly step. */
export interface DailyTask {
  day: string   // 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi'
  tasks: string[]
}

/** One actionable step of the generated growth roadmap. */
export interface RoadmapStep {
  step_number: number
  title: string
  actionable_advice: string
  daily_plan?: DailyTask[]
}

/** The structured payload produced by the n8n agent + output parser. */
export interface Roadmap {
  roadmap_steps: RoadmapStep[]
}

// ─── Questionnaire ───────────────────────────────────────────────────────────

export type QuestionKind = 'text' | 'select' | 'toggle'

export interface Question {
  id: string
  kind: QuestionKind
  /** Short eyebrow label shown above the question. */
  eyebrow: string
  label: string
  placeholder?: string
  /** Choices for 'select' and 'toggle' kinds. */
  options?: string[]
}

/**
 * Exactly four high-value questions tailored for freelancers. The collected
 * answers are folded into `linkedin_profile_text` server-side before being sent
 * to the strategist agent.
 */
export const QUESTIONS: Question[] = [
  {
    id: 'niche',
    kind: 'text',
    eyebrow: 'Positionnement',
    label: 'Quelle est votre niche ou votre spécialité principale en freelance ?',
    placeholder: 'ex : Développeur Next.js fullstack, Copywriter SEO…',
  },
  {
    id: 'revenue_goal',
    kind: 'select',
    eyebrow: 'Ambition',
    label: 'Quel est votre objectif de chiffre d’affaires mensuel idéal ?',
    options: ['2k – 5k€', '5k – 10k€', '10k€ +'],
  },
  {
    id: 'blocker',
    kind: 'select',
    eyebrow: 'Frein principal',
    label: 'Quel est votre plus grand blocage actuel pour trouver des clients ?',
    options: [
      'Manque de visibilité',
      'Tarification trop basse',
      'Prospection trop chronophage',
    ],
  },
  {
    id: 'offer_model',
    kind: 'toggle',
    eyebrow: 'Modèle de vente',
    label:
      'Avez-vous des offres packagées ou vendez-vous principalement au temps passé (TJM) ?',
    options: ['Offres au forfait', 'TJM régulier'],
  },
]

/** Human-readable prompt label used when serialising answers into the brief. */
export const QUESTION_BRIEF_LABELS: Record<string, string> = {
  niche: 'Niche / spécialité',
  revenue_goal: 'Objectif de CA mensuel',
  blocker: 'Blocage principal pour trouver des clients',
  offer_model: 'Modèle de vente',
}

// ─── Normalisation ───────────────────────────────────────────────────────────

/**
 * Coerces whatever the workflow returns (object, JSON string, `{ output: … }`
 * wrapper, or a bare array) into a clean `RoadmapStep[]`. Never throws.
 */
export function normalizeRoadmap(raw: unknown): RoadmapStep[] {
  if (raw == null) return []

  let data: unknown = raw
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch {
      return []
    }
  }

  // Unwrap the agent's `{ output: … }` envelope if present.
  if (
    data &&
    typeof data === 'object' &&
    'output' in data &&
    !('roadmap_steps' in data)
  ) {
    data = (data as { output: unknown }).output
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data)
      } catch {
        /* keep as-is */
      }
    }
  }

  const steps = Array.isArray(data)
    ? data
    : (data as { roadmap_steps?: unknown })?.roadmap_steps

  if (!Array.isArray(steps)) return []

  return steps
    .map((s, i) => {
      const step = (s ?? {}) as Record<string, unknown>
      const rawDaily = step.daily_plan
      let daily_plan: DailyTask[] | undefined
      if (Array.isArray(rawDaily)) {
        daily_plan = rawDaily
          .filter((d): d is Record<string, unknown> => d != null && typeof d === 'object')
          .map((d) => ({
            day: String(d.day ?? ''),
            tasks: Array.isArray(d.tasks) ? d.tasks.map((t: unknown) => String(t)) : [],
          }))
          .filter((d) => d.day && d.tasks.length > 0)
        if (daily_plan.length === 0) daily_plan = undefined
      }
      return {
        step_number: Number(step.step_number ?? i + 1),
        title: String(step.title ?? ''),
        actionable_advice: String(step.actionable_advice ?? ''),
        daily_plan,
      }
    })
    .filter((s) => s.title || s.actionable_advice)
}

/**
 * Coerces the stored `completed_steps` column (JSONB array, JSON string, or
 * Postgres text[]) into a clean, de-duplicated list of step numbers.
 */
export function normalizeCompletedSteps(raw: unknown): number[] {
  let data: unknown = raw
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch {
      return []
    }
  }
  if (!Array.isArray(data)) return []
  const nums = data
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n))
  return Array.from(new Set(nums))
}
