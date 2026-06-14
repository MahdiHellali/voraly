import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  normalizeRoadmap,
  QUESTION_BRIEF_LABELS,
  type RoadmapStep,
} from '@/lib/roadmap/types'

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

  // 3. Enrichir le brief avec le profil existant.
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, linkedin_profile_text')
    .eq('id', user.id)
    .maybeSingle()

  const linkedinProfileText = buildBrief(profile?.linkedin_profile_text ?? null, answers)

  // 4. Appel n8n.
  let webhookJson: unknown = null
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), N8N_TIMEOUT_MS)
    const res = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, linkedin_profile_text: linkedinProfileText }),
      cache: 'no-store',
      signal: controller.signal,
    }).finally(() => clearTimeout(timer))

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error(`[roadmap] n8n ${res.status}: ${detail.slice(0, 300)}`)
      return NextResponse.json(
        { error: res.status === 404 ? 'workflow_not_listening' : 'workflow_failed' },
        { status: 502 },
      )
    }

    const text = await res.text()
    webhookJson = text ? JSON.parse(text) : null
  } catch (error) {
    console.error('[roadmap] n8n request failed', error)
    return NextResponse.json({ error: 'workflow_unreachable' }, { status: 502 })
  }

  // 5. Extraire steps + marketing_strategy.
  const unwrapped = unwrapEnvelope(webhookJson)
  let steps: RoadmapStep[] = normalizeRoadmap(
    unwrapped?.roadmap_steps ?? unwrapped?.roadmap ?? webhookJson,
  )
  let marketingStrategy: unknown = unwrapped?.marketing_strategy ?? null

  if (steps.length === 0) {
    const { data: refreshed } = await supabase
      .from('profiles')
      .select('ai_roadmap')
      .eq('id', user.id)
      .maybeSingle()
    const stored = refreshed?.ai_roadmap as { roadmap_steps?: unknown; marketing_strategy?: unknown } | null
    steps = normalizeRoadmap(stored?.roadmap_steps ?? stored)
    if (!marketingStrategy) marketingStrategy = stored?.marketing_strategy ?? null
  }

  if (steps.length === 0) {
    return NextResponse.json({ error: 'empty_roadmap' }, { status: 502 })
  }

  const aiRoadmapPayload = { roadmap_steps: steps, marketing_strategy: marketingStrategy }

  // 6 & 7. Persist via admin client (bypass GRANT — authenticated role non configuré).
  const admin = createAdminClient()

  try {
    await admin.from('roadmaps').delete().eq('user_id', user.id)
    await admin.from('roadmaps').insert({
      user_id: user.id,
      roadmap_data: aiRoadmapPayload,
      is_active: true,
    })
  } catch (err) {
    console.warn('[roadmap] roadmaps versioning failed', err)
  }

  const { error: saveError } = await admin
    .from('profiles')
    .update({ ai_roadmap: aiRoadmapPayload, completed_steps: [], completed_daily_tasks: [] })
    .eq('id', user.id)

  if (saveError) {
    console.error('[roadmap] failed to persist ai_roadmap', saveError)
  }

  return NextResponse.json({ roadmap_steps: steps, marketing_strategy: marketingStrategy })
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
