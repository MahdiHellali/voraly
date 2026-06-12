import { NextResponse, type NextRequest } from 'next/server'
import { getWhopClient, isWhopWebhookConfigured } from '@/lib/whop/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { VORALY_USER_ID_METADATA_KEY } from '@/lib/whop/types'

// POST /api/webhooks/whop
// Receives Whop webhook events, verifies the Standard-Webhooks signature, and
// on payment.succeeded grants Voraly Pro to the user whose id was embedded in
// the checkout metadata. Service-role Supabase is safe HERE (and only here)
// because the caller is authenticated by the webhook signature, not a user
// session. Retry strategy: Whop retries non-2xx (3x at 10/20/40s), so we
// return 200 for everything unrecoverable (ignored events, missing metadata,
// unknown user) and 5xx only for transient DB failures worth retrying.
// Duplicate deliveries are safe: the UPDATE is naturally idempotent for
// access (is_premium stays true).

/** Strict UUID shape check (version-agnostic) for the metadata user id. */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: NextRequest) {
  // 1. Misconfiguration must be loud — a 503 (not a 200) so events are not
  //    silently acknowledged and lost while the secret is missing.
  if (!isWhopWebhookConfigured()) {
    console.error(
      '[whop-webhook] WHOP_WEBHOOK_SECRET is not set — refusing to acknowledge events',
    )
    return new NextResponse('Webhook not configured', { status: 503 })
  }

  // 2. Read the RAW body before any parsing — the signature is computed over
  //    the exact bytes Whop sent.
  const rawBody = await request.text()

  // 3. Verify the signature. unwrap() throws on an invalid or tampered
  //    payload; nothing past this point runs for unverified input.
  let event
  try {
    event = getWhopClient().webhooks.unwrap(rawBody, {
      headers: Object.fromEntries(request.headers.entries()),
    })
  } catch (err) {
    console.error('[whop-webhook] signature verification failed', err)
    return new NextResponse('Invalid signature', { status: 401 })
  }

  // 4. Only payment.succeeded grants Pro. Acknowledge everything else with a
  //    200 immediately — Whop retries non-2xx, and we don't want retries for
  //    events we deliberately ignore. (Early return also narrows the union.)
  if (event.type !== 'payment.succeeded') {
    console.info(`[whop-webhook] ignoring event ${event.type}`)
    return new NextResponse('OK', { status: 200 })
  }

  // 5. The checkout configuration copied our user id into payment metadata.
  //    If it's absent or malformed the event is unrecoverable — retrying won't
  //    add metadata — so log for forensics and ack with 200 to stop retries.
  const voralyUserId = event.data.metadata?.[VORALY_USER_ID_METADATA_KEY]
  if (typeof voralyUserId !== 'string' || !UUID_REGEX.test(voralyUserId)) {
    console.error(
      `[whop-webhook] payment ${event.data.id} has missing/invalid ${VORALY_USER_ID_METADATA_KEY} metadata`,
    )
    return new NextResponse('OK', { status: 200 })
  }

  // 6. Grant Pro via the service-role client (RLS bypass justified above).
  //    A duplicate delivery overwrites premium_since/whop_receipt_id — that's
  //    acceptable: the operation is naturally idempotent for access
  //    (is_premium stays true), which is our duplicate-event strategy
  //    (Whop sends duplicate deliveries; same outcome = safe).
  const { data, error } = await createAdminClient()
    .from('profiles')
    .update({
      is_premium: true,
      plan: 'pro',
      premium_since: new Date().toISOString(),
      whop_receipt_id: event.data.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', voralyUserId)
    .select('id')

  if (error) {
    // Transient DB failure: return 500 so Whop retries the delivery.
    console.error(
      `[whop-webhook] db update failed for payment ${event.data.id}`,
      error,
    )
    return new NextResponse('Database error', { status: 500 })
  }

  if (!data || data.length !== 1) {
    // No matching profile: unrecoverable (retrying won't create the user),
    // so log it and ack to stop retries.
    console.error(
      `[whop-webhook] no profile row for user ${voralyUserId} (payment ${event.data.id})`,
    )
    return new NextResponse('OK', { status: 200 })
  }

  // Deliberate trade-off: we respond AFTER the DB write rather than
  // fire-and-forget, because returning 200 before a failed write would lose
  // the upgrade with no retry. The handler stays lean — a single UPDATE — so
  // the 200 still lands well within Whop's timeout.
  return new NextResponse('OK', { status: 200 })
}
