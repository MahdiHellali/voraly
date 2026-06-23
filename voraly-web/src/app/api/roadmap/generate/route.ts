import { NextResponse, type NextRequest, after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  normalizeRoadmap,
  QUESTION_BRIEF_LABELS,
  type RoadmapStep,
} from '@/lib/roadmap/types'
import { rateLimit, acquireLock, releaseLock } from '@/lib/rate-limit'
import { setJobStatus, getJobStatus } from '@/lib/roadmap-jobs'

const N8N_WEBHOOK_URL =
  process.env.N8N_ROADMAP_WEBHOOK_URL ??
  (process.env.NODE_ENV === 'production'
    ? 'http://n8n:5678/webhook/generate-roadmap'
    : 'http://localhost:5678/webhook/generate-roadmap')

const N8N_TIMEOUT_MS = 90_000

interface GenerateBody {
  answers?: Record<string, string>
}

export async function POST(request: NextRequest) {
  // 1. Authenticated session — user_id dérivé ici, jamais du body.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // 2. Parse answers.
  let body: GenerateBody
  try {
    body = (await request.json()) as GenerateBody
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  const answers = body.answers ?? {}
  if (Object.keys(answers).length === 0) {
    return NextResponse.json({ error: 'missing_answers' }, { status: 400 })
  }

  // 2bis. Anti-abus : cooldown + verrou « 1 génération en vol par user ».
  // Protège le quota Gemini et les slots bloquants de 90 s (double-clic, spam).
  const limitKey = `generate:${user.id}`
  const rl = rateLimit(limitKey, 5, 10 * 60_000)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
    )
  }
  if (!acquireLock(limitKey)) {
    return NextResponse.json({ error: 'generation_in_progress' }, { status: 409 })
  }

  // 3. Enrichir le brief avec le profil existant (lecture en contexte requête).
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, linkedin_profile_text')
    .eq('id', user.id)
    .maybeSingle()
  const linkedinProfileText = buildBrief(profile?.linkedin_profile_text ?? null, answers)

  // 4. Génération asynchrone : on répond tout de suite (202). Le travail lourd
  //    (n8n ~90 s + persistance) tourne dans after(), après l'envoi de la réponse,
  //    donc plus aucun blocage HTTP de 90 s. Le front poll GET /api/roadmap/generate.
  const userId = user.id
  setJobStatus(userId, 'pending')

  after(async () => {
    try {
      const webhookJson = process.env.GEMINI_API_KEY
        ? await callGeminiRoadmap(linkedinProfileText)
        : await callRoadmapWorkflow(userId, linkedinProfileText)
      const { steps, marketingStrategy } = await resolveRoadmap(userId, webhookJson)
      if (steps.length === 0) {
        setJobStatus(userId, 'error', 'empty_roadmap')
        return
      }
      await persistRoadmap(userId, steps, marketingStrategy)
      setJobStatus(userId, 'done')
    } catch (error) {
      const code = error instanceof RoadmapError ? error.code : 'workflow_unreachable'
      if (!(error instanceof RoadmapError)) {
        console.error('[roadmap] generation failed', error)
      }
      setJobStatus(userId, 'error', code)
    } finally {
      releaseLock(limitKey)
    }
  })

  return NextResponse.json({ status: 'started' }, { status: 202 })
}

// GET /api/roadmap/generate — état de la génération asynchrone (polling front).
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const job = getJobStatus(user.id)
  if (!job) return NextResponse.json({ status: 'unknown' })
  if (job.status === 'pending') return NextResponse.json({ status: 'pending' })
  if (job.status === 'error') {
    return NextResponse.json({ status: 'error', error: job.error ?? 'workflow_failed' })
  }

  // done → renvoyer la roadmap persistée.
  const { data: profile } = await supabase
    .from('profiles')
    .select('ai_roadmap')
    .eq('id', user.id)
    .maybeSingle()
  const stored = profile?.ai_roadmap as
    | { roadmap_steps?: unknown; marketing_strategy?: unknown }
    | null
  return NextResponse.json({
    status: 'done',
    roadmap_steps: normalizeRoadmap(stored?.roadmap_steps ?? stored),
    marketing_strategy: stored?.marketing_strategy ?? null,
  })
}

// Erreur typée pour propager un code métier depuis le travail asynchrone.
class RoadmapError extends Error {
  code: string
  constructor(code: string) {
    super(code)
    this.code = code
  }
}

async function callRoadmapWorkflow(userId: string, linkedinProfileText: string): Promise<unknown> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), N8N_TIMEOUT_MS)
  let res: Response
  try {
    res = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, linkedin_profile_text: linkedinProfileText }),
      cache: 'no-store',
      signal: controller.signal,
    }).finally(() => clearTimeout(timer))
  } catch (error) {
    console.error('[roadmap] n8n request failed', error)
    throw new RoadmapError('workflow_unreachable')
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    console.error(`[roadmap] n8n ${res.status}: ${detail.slice(0, 300)}`)
    throw new RoadmapError(res.status === 404 ? 'workflow_not_listening' : 'workflow_failed')
  }
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

const ROADMAP_MODEL = 'gemini-2.5-flash-lite'

const ROADMAP_SYSTEM_PROMPT = `Tu es Voraly, stratège d'élite pour freelances. À partir PRÉCISÉMENT du profil et des réponses au questionnaire fournis, génère un plan de croissance personnalisé. Ne donne jamais de conseils génériques : adapte tout au profil réel.

Réponds UNIQUEMENT avec un JSON valide (aucun markdown, aucun texte autour) respectant EXACTEMENT ce schéma :
{
  "roadmap_steps": [
    {
      "step_number": 1,
      "title": "Semaine 1 : <titre court et concret>",
      "actionable_advice": "<conseil détaillé et actionnable, 2-3 phrases, spécifique au profil>",
      "daily_plan": [
        { "day": "Lundi", "tasks": ["<micro-tâche>", "<micro-tâche>"] },
        { "day": "Mardi", "tasks": ["...", "..."] },
        { "day": "Mercredi", "tasks": ["...", "..."] },
        { "day": "Jeudi", "tasks": ["...", "..."] },
        { "day": "Vendredi", "tasks": ["...", "..."] }
      ]
    }
  ],
  "marketing_strategy": {
    "organic": "<tactiques de contenu organique spécifiques au profil>",
    "paid": "<tactiques d'acquisition payante spécifiques au profil>",
    "shorts_scripts": [
      { "topic": "<sujet>", "structure": "<structure>", "hook": "<accroche>", "body": "<corps>", "cta": "<appel à l'action>" }
    ]
  }
}

Règles strictes : exactement 5 semaines (step_number 1 à 5) ; chaque daily_plan couvre Lundi à Vendredi avec 2-3 micro-tâches par jour ; exactement 3 scripts dans shorts_scripts ; tout le contenu en français.`

// Génération directe via Gemini (mode JSON), plus fiable et rapide que l'agent
// n8n + outputParserStructured avec le modèle disponible sur le tier actuel.
async function callGeminiRoadmap(linkedinProfileText: string): Promise<unknown> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new RoadmapError('workflow_unreachable')
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${ROADMAP_MODEL}:generateContent?key=${apiKey}`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), N8N_TIMEOUT_MS)
  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: ROADMAP_SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: linkedinProfileText }] }],
        generationConfig: { temperature: 0.6, responseMimeType: 'application/json' },
      }),
      cache: 'no-store',
      signal: controller.signal,
    }).finally(() => clearTimeout(timer))
  } catch (error) {
    console.error('[roadmap] gemini request failed', error)
    throw new RoadmapError('workflow_unreachable')
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    console.error(`[roadmap] gemini ${res.status}: ${detail.slice(0, 300)}`)
    throw new RoadmapError('workflow_failed')
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new RoadmapError('empty_roadmap')
  try {
    return JSON.parse(text)
  } catch {
    console.error('[roadmap] gemini returned non-JSON output')
    throw new RoadmapError('empty_roadmap')
  }
}

async function resolveRoadmap(
  userId: string,
  webhookJson: unknown,
): Promise<{ steps: RoadmapStep[]; marketingStrategy: unknown }> {
  const unwrapped = unwrapEnvelope(webhookJson)
  let steps: RoadmapStep[] = normalizeRoadmap(
    unwrapped?.roadmap_steps ?? unwrapped?.roadmap ?? webhookJson,
  )
  let marketingStrategy: unknown = unwrapped?.marketing_strategy ?? null

  if (steps.length === 0) {
    // n8n a pu écrire directement en base et renvoyer une enveloppe vide.
    const admin = createAdminClient()
    const { data: refreshed } = await admin
      .from('profiles')
      .select('ai_roadmap')
      .eq('id', userId)
      .maybeSingle()
    const stored = refreshed?.ai_roadmap as
      | { roadmap_steps?: unknown; marketing_strategy?: unknown }
      | null
    steps = normalizeRoadmap(stored?.roadmap_steps ?? stored)
    if (!marketingStrategy) marketingStrategy = stored?.marketing_strategy ?? null
  }
  return { steps, marketingStrategy }
}

async function persistRoadmap(
  userId: string,
  steps: RoadmapStep[],
  marketingStrategy: unknown,
): Promise<void> {
  const aiRoadmapPayload = { roadmap_steps: steps, marketing_strategy: marketingStrategy }
  const admin = createAdminClient()

  try {
    await admin.from('roadmaps').delete().eq('user_id', userId)
    await admin.from('roadmaps').insert({
      user_id: userId,
      roadmap_data: aiRoadmapPayload,
      is_active: true,
    })
  } catch (err) {
    console.warn('[roadmap] roadmaps versioning failed', err)
  }

  const { error: saveError } = await admin
    .from('profiles')
    .update({ ai_roadmap: aiRoadmapPayload, completed_steps: [], completed_daily_tasks: [] })
    .eq('id', userId)

  if (saveError) {
    console.error('[roadmap] failed to persist ai_roadmap', saveError)
  }
}

function unwrapEnvelope(raw: unknown): Record<string, unknown> | null {
  if (raw == null || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>
  if ('roadmap_steps' in obj || 'marketing_strategy' in obj || 'roadmap' in obj) return obj
  if ('output' in obj) {
    let inner = obj.output
    if (typeof inner === 'string') {
      try { inner = JSON.parse(inner) } catch { return obj }
    }
    if (inner != null && typeof inner === 'object') return inner as Record<string, unknown>
  }
  return obj
}

function buildBrief(storedText: string | null, answers: Record<string, string>): string {
  const lines: string[] = []

  if (storedText?.trim()) {
    lines.push('Profil professionnel :', storedText.trim(), '')
  }

  lines.push('Réponses au diagnostic stratégique :')
  for (const [id, value] of Object.entries(answers)) {
    if (!value?.trim()) continue
    const label = QUESTION_BRIEF_LABELS[id] ?? id
    lines.push(`- ${label} : ${value.trim()}`)
  }

  return lines.join('\n')
}
