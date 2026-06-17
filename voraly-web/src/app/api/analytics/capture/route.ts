import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const rateMap = new Map<string, number>()
setInterval(() => rateMap.clear(), 60_000)

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://voraly.net',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

interface CaptureBody {
  event_type: string
  session_id: string
  page_url: string
  referrer?: string
  event_data?: Record<string, unknown>
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(request: NextRequest) {
  let body: CaptureBody
  try {
    body = await request.json() as CaptureBody
  } catch {
    return new NextResponse(null, { status: 400, headers: CORS_HEADERS })
  }

  const { event_type, session_id, page_url, referrer, event_data } = body

  if (!event_type || !session_id || !page_url) {
    return new NextResponse(null, { status: 400, headers: CORS_HEADERS })
  }

  // Rate-limit: 1 requête / session_id / 5s
  const now = Date.now()
  const last = rateMap.get(session_id)
  if (last && now - last < 5_000) {
    return new NextResponse(null, { status: 429, headers: CORS_HEADERS })
  }
  rateMap.set(session_id, now)

  // user_id depuis la session, jamais du body
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Anonymiser le dernier octet de l'IP
  const rawIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? ''
  const ip_anonymized = rawIp ? rawIp.replace(/\.\d+$/, '.xxx') : null

  const admin = createAdminClient()
  await admin.from('analytics_events').insert({
    event_type,
    user_id: user?.id ?? null,
    session_id,
    page_url,
    referrer: referrer ?? null,
    user_agent: request.headers.get('user-agent') ?? null,
    event_data: event_data ?? {},
    ip_anonymized,
  })

  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}
