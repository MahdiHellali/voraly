import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getWhopClient, getWhopPlanId, isWhopConfigured } from '@/lib/whop/server'
import {
  VORALY_USER_ID_METADATA_KEY,
  type CheckoutErrorResponse,
  type CheckoutSessionResponse,
} from '@/lib/whop/types'

// POST /api/checkout
// Creates a Whop embedded-checkout session for the "Voraly Pro" upgrade.
// Security: the user id is taken from the authenticated Supabase session — never
// from the request body (which is not read at all) — and attached as checkout
// metadata so the payment webhook can map the purchase back to the right account.
// Errors are machine codes only (see @/lib/whop/types); the UI owns the copy.

export async function POST() {
  // 1. Must be authenticated — the session is the only source of identity.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json<CheckoutErrorResponse>(
      { error: 'unauthorized' },
      { status: 401 },
    )
  }

  // 2. Whop must be fully configured (API key + plan id).
  const planId = getWhopPlanId()
  if (!isWhopConfigured() || !planId) {
    console.error(
      '[checkout] Whop is not configured — set WHOP_API_KEY and NEXT_PUBLIC_WHOP_PLAN_ID',
    )
    return NextResponse.json<CheckoutErrorResponse>(
      { error: 'not_configured' },
      { status: 503 },
    )
  }

  // 3. Already-premium users have nothing to buy. A profile read error (e.g.
  //    the is_premium column not migrated yet) is logged but never blocks
  //    checkout — only a truthy flag does.
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_premium')
    .eq('id', user.id)
    .maybeSingle()
  if (profileError) {
    console.error('[checkout] profile read failed, continuing', profileError)
  } else if (profile?.is_premium) {
    return NextResponse.json<CheckoutErrorResponse>(
      { error: 'already_premium' },
      { status: 409 },
    )
  }

  // 4. Create the checkout session, binding it to the user via metadata.
  try {
    const config = await getWhopClient().checkoutConfigurations.create({
      plan_id: planId,
      mode: 'payment',
      metadata: { [VORALY_USER_ID_METADATA_KEY]: user.id },
    })
    if (!config.id) {
      console.error('[checkout] whop session creation failed', config)
      return NextResponse.json<CheckoutErrorResponse>(
        { error: 'whop_error' },
        { status: 502 },
      )
    }
    return NextResponse.json<CheckoutSessionResponse>({
      sessionId: config.id,
      planId,
    })
  } catch (error) {
    console.error('[checkout] whop session creation failed', error)
    return NextResponse.json<CheckoutErrorResponse>(
      { error: 'whop_error' },
      { status: 502 },
    )
  }
}
