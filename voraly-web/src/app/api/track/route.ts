import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── Voraly · API Track — POST /api/track ─────────────────────────────────────
// Enregistre un événement analytics dans la table analytics_events.
// user_id dérivé de la session (jamais du body).
// Silencieux si erreur — ne bloque pas le client.

// Rate-limit simple par user_id ou par IP : max 60 req/min en mémoire
const rlMap = new Map<string, { count: number; reset: number }>()
function isRateLimited(key: string): boolean {
  const now = Date.now()
  const entry = rlMap.get(key)
  if (!entry || now > entry.reset) {
    rlMap.set(key, { count: 1, reset: now + 60_000 })
    return false
  }
  if (entry.count >= 60) return true
  entry.count++
  return false
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      event?: string
      page?: string
      metadata?: Record<string, unknown>
    }

    // Validation et assainissement du payload
    const event = String(body.event ?? '').slice(0, 100)
    const page = body.page ? String(body.page).slice(0, 200) : null
    const metaStr = JSON.stringify(body.metadata ?? {})
    const metadata = metaStr.length <= 2048 ? (body.metadata ?? {}) : {}

    if (!event) {
      return NextResponse.json({ ok: false, error: 'event requis' }, { status: 400 })
    }

    // Récupère user depuis la session — ne jamais faire confiance au body
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Rate-limit par user_id ou par IP
    const headersList = await headers()
    const rlKey = user?.id ?? (headersList.get('x-forwarded-for') ?? 'anon')
    if (isRateLimited(rlKey)) {
      return NextResponse.json({ ok: false }, { status: 429 })
    }

    const adminClient = createAdminClient()

    await adminClient.from('analytics_events').insert({
      user_id: user?.id ?? null,
      event_name: event,
      page,
      metadata,
      user_agent: request.headers.get('user-agent'),
    })
  } catch {
    // Silencieux — le tracking ne doit jamais bloquer le client
  }

  return NextResponse.json({ ok: true })
}
