import { NextResponse, type NextRequest } from 'next/server'
import { Resend } from 'resend'

// In-memory rate limit by IP — 5 req/hour (single Docker instance)
const ipRateLimit = new Map<string, { count: number; windowStart: number }>()
const RATE_LIMIT = 5
const RATE_WINDOW_MS = 60 * 60 * 1000 // 1h

function checkIpRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = ipRateLimit.get(ip)
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    ipRateLimit.set(ip, { count: 1, windowStart: now })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  if (!checkIpRateLimit(ip)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  let body: { name: string; email: string; message: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const { name, email, message } = body

  if (
    !name?.trim() ||
    !email?.trim() ||
    !message?.trim()
  ) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }

  if (name.length > 120 || email.length > 254 || message.length > 5000) {
    return NextResponse.json({ error: 'fields_too_long' }, { status: 400 })
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('[contact] RESEND_API_KEY not configured')
    return NextResponse.json({ error: 'email_not_configured' }, { status: 503 })
  }

  const resend = new Resend(apiKey)
  const toEmail = process.env.CONTACT_TO_EMAIL ?? 'contact@voraly.net'
  const safeName = name.trim().replace(/[\r\n]/g, ' ')

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('resend_timeout')), 8_000),
  )

  try {
    await Promise.race([
      resend.emails.send({
        from: 'Voraly Contact <onboarding@resend.dev>',
        to: toEmail,
        replyTo: email,
        subject: `Message de ${safeName} via voraly.net`,
        text: `Nom : ${safeName}\nEmail : ${email}\n\nMessage :\n${message.trim()}`,
      }),
      timeout,
    ])
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[contact] failed to send email', err)
    return NextResponse.json({ error: 'send_failed' }, { status: 502 })
  }
}
