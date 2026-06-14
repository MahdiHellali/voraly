import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  normalizeRoadmap,
  QUESTION_BRIEF_LABELS,
  type RoadmapStep,
} from '@/lib/roadmap/types'

// POST /api/roadmap/generate
// Proxies the diagnostic to the n8n "generate-roadmap" workflow.
// n8n retourne { roadmap_steps, marketing_strategy } — les deux sont persistés
// dans profiles.ai_roadmap et retournés au client pour affichage immédiat.

const N8N_WEBHOOK_URL =
  process.env.N8N_ROADMAP_WEBHOOK_URL ??
  'http://localhost:5678/webhook/generate-roadmap'

// n8n's test webhook only fires while the editor is "listening"; give the
// request a generous but bounded window so the UI never hangs forever.
const N8N_TIMEOUT_MS = 90_000

interface GenerateBody {
  answers?: Record<string, string>
}

export async function POST(request: NextRequest) {
  // 1. Authenticated session required; user_id is derived here, not trusted.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // 2. Parse + lightly validate the questionnaire answers.
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

  // 3. Pull any stored professional background to enrich the brief.
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, linkedin_profile_text')
    .eq('id', user.id)
    .maybeSingle()

  const linkedinProfileText = buildBrief(
    profile?.linkedin_profile_text ?? null,
    answers,
  )

  // 4. Call the n8n workflow.
  let webhookJson: unknown = null
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), N8N_TIMEOUT_MS)
    const res = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        linkedin_profile_text: linkedinProfileText,
      }),
      cache: 'no-store',
      signal: controller.signal,
    }).finally(() => clearTimeout(timer))

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error(`[roadmap] n8n ${res.status}: ${detail.slice(0, 300)}`)
      // 404 from the test webhook = the workflow isn't listening in the editor.
      return NextResponse.json(
        {
          error:
            res.status === 404 ? 'workflow_not_listening' : 'workflow_failed',
        },
        { status: 502 },
      )
    }

    // The webhook may legitimately return an empty body in some configs.
    const text = await res.text()
    webhookJson = text ? JSON.parse(text) : null
  } catch (error) {
    console.error('[roadmap] n8n request failed', error)
    return NextResponse.json({ error: 'workflow_unreachable' }, { status: 502 })
  }

  // 5. Extraire roadmap_steps et marketing_strategy depuis la réponse n8n.
  const payload = webhookJson as {
    roadmap_steps?: unknown
    roadmap?: unknown
    marketing_strategy?: unknown
  } | null

  let steps: RoadmapStep[] = normalizeRoadmap(
    payload?.roadmap_steps ?? payload?.roadmap ?? webhookJson,
  )
  let marketingStrategy: unknown = payload?.marketing_strategy ?? null

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

  // 6. Persister le résultat complet dans profiles.ai_roadmap.
  const aiRoadmapPayload = { roadmap_steps: steps, marketing_strategy: marketingStrategy }
  const { error: saveError } = await supabase
    .from('profiles')
    .update({ ai_roadmap: aiRoadmapPayload, completed_steps: [] })
    .eq('id', user.id)
  if (saveError) {
    console.error('[roadmap] failed to persist ai_roadmap', saveError)
  }

  return NextResponse.json({ roadmap_steps: steps, marketing_strategy: marketingStrategy })
}

/**
 * Serialises the stored background + questionnaire answers into a single
 * readable brief for the strategist agent.
 */
function buildBrief(
  storedText: string | null,
  answers: Record<string, string>,
): string {
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
