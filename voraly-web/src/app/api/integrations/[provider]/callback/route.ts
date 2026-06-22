import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getIntegrationProvider,
  getIntegrationCredentials,
  isIntegrationConfigured,
  buildIntegrationRedirectUri,
  INTEGRATION_STATE_COOKIE,
  type IntegrationProviderConfig,
} from '@/lib/integrations/providers'
import { getSiteOrigin } from '@/lib/oauth/providers'
import { bootstrapNotionVoralyCalendar } from '@/lib/integrations/notion-bootstrap'

// GET /api/integrations/[provider]/callback
// Receives ?code & ?state from the provider, verifies the CSRF state, exchanges
// the code for tokens, and UPSERTs them into integration_connections.
// user_id comes from the authenticated session — never from the request.
// Always redirects back to /dashboard/platforms with a success or error flag.

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider: providerId } = await params
  // Use the trusted site origin (NEXT_PUBLIC_SITE_URL) — never request.nextUrl.origin,
  // which resolves to Docker's internal address (0.0.0.0:3000) in production.
  const siteOrigin = getSiteOrigin()
  const { searchParams } = request.nextUrl

  const back = (flag: Record<string, string>) => {
    const url = new URL('/dashboard/platforms', siteOrigin)
    for (const [k, v] of Object.entries(flag)) url.searchParams.set(k, v)
    // Clear the one-time CSRF cookie on every terminal response.
    const res = NextResponse.redirect(url)
    res.cookies.set({ name: INTEGRATION_STATE_COOKIE, value: '', path: '/', maxAge: 0 })
    return res
  }

  // 1. Authenticated session required; user_id comes from here, not the client.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', siteOrigin))

  // 2. Provider allowlist + configuration.
  const provider = getIntegrationProvider(providerId)
  if (!provider) return back({ error: 'unknown_provider' })
  if (!isIntegrationConfigured(provider)) {
    return back({ error: 'config', platform: provider.id })
  }

  // 3. The provider may report the user denied access (or another OAuth error).
  const oauthError = searchParams.get('error')
  if (oauthError) {
    return back({
      error: oauthError === 'access_denied' ? 'access_denied' : 'provider_error',
      platform: provider.id,
    })
  }

  // 4. CSRF protection: the returned state must match our httpOnly cookie.
  const returnedState = searchParams.get('state')
  const cookieState = request.cookies.get(INTEGRATION_STATE_COOKIE)?.value
  const expectedPrefix = `${provider.id}.`
  if (
    !returnedState ||
    !cookieState ||
    cookieState !== `${expectedPrefix}${returnedState}`
  ) {
    return back({ error: 'invalid_state', platform: provider.id })
  }

  // 5. Authorization code is required.
  const code = searchParams.get('code')
  if (!code) return back({ error: 'missing_code', platform: provider.id })

  // 6. Exchange the authorization code for tokens.
  // redirect_uri MUST be identical in connect + callback and match the portal registration.
  const redirectUri = buildIntegrationRedirectUri(provider.id)

  let tokens: TokenResponse
  try {
    tokens =
      provider.id === 'notion'
        ? await exchangeNotionToken(provider, code, redirectUri)
        : await exchangeGoogleToken(provider, code, redirectUri)
  } catch (error) {
    // Log the failure without ever exposing access_token or client_secret.
    console.error('━━━━━━━━━━ INTEGRATION TOKEN EXCHANGE FAILURE ━━━━━━━━━━')
    console.error(`[integration:${provider.id}] redirect_uri = ${redirectUri}`)
    console.error(error)
    return back({ error: 'exchange_failed', platform: provider.id })
  }

  if (!tokens.access_token) {
    console.error(`[integration:${provider.id}] no access_token in response`)
    return back({ error: 'exchange_failed', platform: provider.id })
  }

  // Accurately compute the ABSOLUTE expiry timestamp from expires_in (seconds).
  // Notion does not return expires_in → null stored.
  const expiresAt =
    typeof tokens.expires_in === 'number' && Number.isFinite(tokens.expires_in)
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null

  // 7. Securely UPSERT into integration_connections.
  // RLS (auth.uid() = user_id) + explicit user.id prevent cross-user writes.
  const { error: dbError } = await supabase
    .from('integration_connections')
    .upsert(
      {
        user_id: user.id,
        provider: provider.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        expires_at: expiresAt,
      },
      { onConflict: 'user_id,provider' },
    )

  if (dbError) {
    console.error(`[integration:${provider.id}] db upsert failed`, dbError.message)
    return back({ error: 'save_failed', platform: provider.id })
  }

  // Pour Notion : créer la page "Voraly" + calendrier editorial dans le workspace.
  // Best-effort : échec non-bloquant, la connexion est quand même validée.
  if (provider.id === 'notion' && tokens.access_token) {
    bootstrapNotionVoralyCalendar(tokens.access_token).catch((err: unknown) =>
      console.error('[notion-bootstrap] calendar setup failed (non-blocking)', err),
    )
  }

  return back({ success: 'connected', platform: provider.id })
}

// ─── Token exchange ───────────────────────────────────────────────────────────

interface TokenResponse {
  access_token?: string
  refresh_token?: string
  /** seconds until access_token expiry */
  expires_in?: number
  token_type?: string
  scope?: string
}

/**
 * Google OAuth 2.0 token exchange.
 * POST https://oauth2.googleapis.com/token
 * Body: application/x-www-form-urlencoded.
 * Réponse : { access_token, refresh_token, expires_in }.
 */
async function exchangeGoogleToken(
  provider: IntegrationProviderConfig,
  code: string,
  redirectUri: string,
): Promise<TokenResponse> {
  const { clientId, clientSecret } = getIntegrationCredentials(provider)
  if (!clientId || !clientSecret) {
    throw new Error(`Missing ${provider.clientIdEnv} / ${provider.clientSecretEnv} env vars`)
  }

  const res = await fetch(provider.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
    cache: 'no-store',
  })

  const rawBody = await res.text()
  if (!res.ok) {
    throw new Error(`Google token endpoint ${res.status}: ${rawBody.slice(0, 300)}`)
  }

  let json: TokenResponse
  try {
    json = JSON.parse(rawBody) as TokenResponse
  } catch {
    throw new Error(`Google returned non-JSON token response: ${rawBody.slice(0, 300)}`)
  }
  return json
}

/**
 * Notion OAuth 2.0 token exchange.
 * POST https://api.notion.com/v1/oauth/token
 * Auth: HTTP Basic (client_id:client_secret) — credentials NOT in the body.
 * Headers: Content-Type: application/json + Notion-Version.
 * Body: JSON { grant_type, code, redirect_uri }.
 * Réponse : { access_token } — pas d'expires_in (token permanent).
 */
async function exchangeNotionToken(
  provider: IntegrationProviderConfig,
  code: string,
  redirectUri: string,
): Promise<TokenResponse> {
  const { clientId, clientSecret } = getIntegrationCredentials(provider)
  if (!clientId || !clientSecret) {
    throw new Error(`Missing ${provider.clientIdEnv} / ${provider.clientSecretEnv} env vars`)
  }

  // HTTP Basic auth: base64(client_id:client_secret)
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const res = await fetch(provider.tokenUrl, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
    cache: 'no-store',
  })

  const rawBody = await res.text()
  if (!res.ok) {
    throw new Error(`Notion token endpoint ${res.status}: ${rawBody.slice(0, 300)}`)
  }

  let json: TokenResponse
  try {
    json = JSON.parse(rawBody) as TokenResponse
  } catch {
    throw new Error(`Notion returned non-JSON token response: ${rawBody.slice(0, 300)}`)
  }
  return json
}
