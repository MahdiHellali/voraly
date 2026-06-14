import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const N8N_TIMEOUT_MS = 60_000

const N8N_CHAT_URL =
  process.env.N8N_CHAT_WEBHOOK_URL ??
  (process.env.N8N_ROADMAP_WEBHOOK_URL
    ? process.env.N8N_ROADMAP_WEBHOOK_URL.replace('generate-roadmap', 'marketing-chat')
    : 'http://localhost:5678/webhook/marketing-chat')

// Extrait marketing_strategy depuis n'importe quelle forme que prend ai_roadmap.
function extractMarketingStrategy(raw: unknown): unknown {
  if (raw == null) return null

  let data: unknown = raw
  // Dépaqueter si c'est une string JSON
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch {
      return null
    }
  }

  if (typeof data !== 'object' || data === null) return null

  // Unwrap { output: ... }
  const asObj = data as Record<string, unknown>
  if ('output' in asObj && !('marketing_strategy' in asObj)) {
    const inner = asObj.output
    if (typeof inner === 'string') {
      try {
        data = JSON.parse(inner)
      } catch {
        return null
      }
    } else {
      data = inner
    }
  }

  const result = data as Record<string, unknown>
  return result.marketing_strategy ?? null
}

export async function POST(request: NextRequest) {
  // 1. Session authentifiée requise.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // 2. Parse body.
  let body: { message: string; history?: unknown[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const { message, history = [] } = body
  if (!message?.trim()) {
    return NextResponse.json({ error: 'missing_message' }, { status: 400 })
  }

  // 3. Récupérer la marketing_strategy — profiles.ai_roadmap en premier,
  //    puis fallback sur la roadmap active dans la table `roadmaps`.
  let marketingStrategy: unknown = null

  const { data: profile } = await supabase
    .from('profiles')
    .select('ai_roadmap')
    .eq('id', user.id)
    .maybeSingle()

  marketingStrategy = extractMarketingStrategy(profile?.ai_roadmap)

  if (!marketingStrategy) {
    try {
      const { data: activeRoadmap } = await supabase
        .from('roadmaps')
        .select('roadmap_data')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (activeRoadmap?.roadmap_data) {
        marketingStrategy = extractMarketingStrategy(activeRoadmap.roadmap_data)
      }
    } catch (err) {
      console.warn('[chat] roadmaps table fallback failed', err)
    }
  }

  if (!marketingStrategy) {
    return NextResponse.json(
      {
        error: 'no_marketing_strategy_found',
        message: "Veuillez d'abord générer votre diagnostic IA pour obtenir une stratégie marketing.",
      },
      { status: 400 },
    )
  }

  // 4. Appel n8n chatbot.
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), N8N_TIMEOUT_MS)

    const res = await fetch(N8N_CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        message: message.trim(),
        history,
        marketing_strategy: marketingStrategy,
      }),
      cache: 'no-store',
      signal: controller.signal,
    }).finally(() => clearTimeout(timer))

    if (!res.ok) {
      console.error(`[chat] n8n responded with ${res.status}`)
      return NextResponse.json({ error: 'chatbot_failed' }, { status: 502 })
    }

    const json = await res.json()
    const reply =
      json.reply ?? json.response ?? json.output ?? (typeof json === 'string' ? json : '')

    if (!reply) {
      return NextResponse.json({ error: 'empty_response' }, { status: 502 })
    }

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('[chat] failed to call chatbot webhook', error)
    return NextResponse.json({ error: 'chatbot_unreachable' }, { status: 502 })
  }
}
