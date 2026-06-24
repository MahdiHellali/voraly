import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { streamGemini } from '@/lib/gemini'

const N8N_TIMEOUT_MS = 30_000

// In-memory quota for free users — resets on server restart (single Docker instance)
// Format: userId → { count, windowStart (ms) }
const freeQuota = new Map<string, { count: number; windowStart: number }>()
const FREE_QUOTA_LIMIT = 1
const FREE_QUOTA_WINDOW_MS = 24 * 60 * 60 * 1000 // 24h

let lastFreeQuotaPrune = 0
function pruneFreeQuota(now: number): void {
  if (now - lastFreeQuotaPrune < 60 * 60_000) return
  lastFreeQuotaPrune = now
  for (const [key, entry] of freeQuota) {
    if (now - entry.windowStart > FREE_QUOTA_WINDOW_MS) freeQuota.delete(key)
  }
}

function checkFreeQuota(userId: string): boolean {
  const now = Date.now()
  pruneFreeQuota(now)
  const entry = freeQuota.get(userId)
  if (!entry || now - entry.windowStart > FREE_QUOTA_WINDOW_MS) {
    freeQuota.set(userId, { count: 1, windowStart: now })
    return true
  }
  if (entry.count >= FREE_QUOTA_LIMIT) return false
  entry.count++
  return true
}

const N8N_CHAT_URL =
  process.env.N8N_CHAT_WEBHOOK_URL ??
  (process.env.N8N_ROADMAP_WEBHOOK_URL
    ? process.env.N8N_ROADMAP_WEBHOOK_URL.replace('generate-roadmap', 'marketing-chat')
    : process.env.NODE_ENV === 'production'
      ? 'http://n8n:5678/webhook/marketing-chat'
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

  // Anti-abus : limite de débit par user (premium inclus), en plus du quota
  // free 24h ci-dessous. Protège le quota Gemini contre le spam de messages.
  const rl = rateLimit(`chat:${user.id}`, 20, 60_000)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
    )
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

  // 3. Récupérer le profil (is_premium + marketing_strategy).
  const { data: profile } = await supabase
    .from('profiles')
    .select('ai_roadmap, is_premium')
    .eq('id', user.id)
    .maybeSingle()

  const isPremium = Boolean(profile?.is_premium)

  // Quota serveur pour utilisateurs gratuits — 1 message / 24h (in-memory).
  // Vérifié avant l'appel n8n pour ne pas consommer de quota Gemini.
  if (!isPremium && !checkFreeQuota(user.id)) {
    return NextResponse.json({ error: 'free_limit_reached' }, { status: 402 })
  }

  let marketingStrategy: unknown = null
  marketingStrategy = extractMarketingStrategy(profile?.ai_roadmap)

  // Borner l'historique pour éviter des payloads n8n trop lourds.
  const boundedHistory = Array.isArray(history) ? history.slice(-20) : []

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

  // 4. Génération de la réponse.
  // Si GEMINI_API_KEY est configurée → streaming direct token par token (Gemini).
  // Sinon → fallback n8n (réponse complète d'un coup), comportement historique.
  if (process.env.GEMINI_API_KEY) {
    return streamFromGemini({
      message: message.trim(),
      history: boundedHistory as ChatHistoryItem[],
      marketingStrategy,
    })
  }

  // 4bis. Fallback n8n chatbot (marketing_strategy peut être null → mode générique).
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), N8N_TIMEOUT_MS)

    const res = await fetch(N8N_CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        message: message.trim(),
        history: boundedHistory,
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

type ChatHistoryItem = { role?: string; message?: string; content?: string }

function buildSystemPrompt(marketingStrategy: unknown): string {
  const strategy =
    marketingStrategy != null ? JSON.stringify(marketingStrategy) : 'aucune (mode générique)'
  return [
    'Tu es le conseiller marketing exclusif de Voraly pour freelances.',
    `Contexte stratégie: ${strategy}`,
    '',
    'Réponds uniquement aux questions de marketing freelance (acquisition clients, réseaux sociaux, contenu, branding).',
    'Réponds en texte clair et concis, en français, sans markdown lourd.',
  ].join('\n')
}

function toGeminiContents(
  history: ChatHistoryItem[],
  message: string,
): { role: string; parts: { text: string }[] }[] {
  const contents = history
    .map((h) => {
      const text = (h.message ?? h.content ?? '').toString().trim()
      if (!text) return null
      return { role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text }] }
    })
    .filter((c): c is { role: string; parts: { text: string }[] } => c !== null)
  contents.push({ role: 'user', parts: [{ text: message }] })
  return contents
}

function streamFromGemini(args: {
  message: string
  history: ChatHistoryItem[]
  marketingStrategy: unknown
}): Response {
  const { message, history, marketingStrategy } = args
  const stream = streamGemini({
    system: buildSystemPrompt(marketingStrategy),
    contents: toGeminiContents(history, message),
  })
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Stream': '1',
    },
  })
}
