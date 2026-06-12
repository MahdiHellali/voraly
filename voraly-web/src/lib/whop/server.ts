import 'server-only'

import Whop from '@whop/sdk'

// ─── Voraly · Whop server SDK ─────────────────────────────────────────────────
// Single source of truth for the server-side Whop client. WHOP_API_KEY and
// WHOP_WEBHOOK_SECRET are server-only env vars — this module is guarded by
// `server-only` so it can never be bundled into client code.

/** The Whop plan purchased by "Voraly Pro" upgrades (public identifier). */
export function getWhopPlanId(): string | null {
  return process.env.NEXT_PUBLIC_WHOP_PLAN_ID ?? null
}

/** True only when every env var needed for checkout creation is present. */
export function isWhopConfigured(): boolean {
  return Boolean(process.env.WHOP_API_KEY && getWhopPlanId())
}

/** True only when the webhook secret needed to verify signatures is present. */
export function isWhopWebhookConfigured(): boolean {
  return Boolean(process.env.WHOP_WEBHOOK_SECRET)
}

let cachedClient: Whop | null = null

/**
 * Lazily-initialised singleton Whop client.
 *
 * - apiKey: pass the RAW key. The SDK builds the header itself as
 *   `Authorization: Bearer ${apiKey}` (see @whop/sdk client.js authHeaders),
 *   so we must NOT add our own `Bearer ` prefix — doing so yields
 *   `Bearer Bearer <key>` and a 401. We defensively strip a leading `Bearer `
 *   in case the env var was pasted with it.
 * - webhookKey: the dashboard secret must be base64-encoded for the
 *   Standard-Webhooks verifier (per Whop's official Next.js example).
 */
export function getWhopClient(): Whop {
  if (cachedClient) return cachedClient

  const rawKey = process.env.WHOP_API_KEY
  if (!rawKey) {
    throw new Error('WHOP_API_KEY is not set')
  }

  const webhookSecret = process.env.WHOP_WEBHOOK_SECRET

  cachedClient = new Whop({
    apiKey: rawKey.replace(/^Bearer\s+/i, '').trim(),
    webhookKey: webhookSecret
      ? Buffer.from(webhookSecret, 'utf8').toString('base64')
      : null,
  })
  return cachedClient
}
