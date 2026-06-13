import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getProvider,
  getProviderCredentials,
  isProviderConfigured,
  buildRedirectUri,
  getSiteOrigin,
  OAUTH_STATE_COOKIE,
  type ProviderConfig,
} from '@/lib/oauth/providers'

// GET /api/platforms/[provider]/callback
// Receives ?code & ?state from the provider, verifies the CSRF state, exchanges
// the code for tokens, and UPSERTs them into platform_connections (user_id taken
// from the authenticated session — never from the request). Always redirects
// back to /dashboard/platforms with a success or error flag.

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
    res.cookies.set({ name: OAUTH_STATE_COOKIE, value: '', path: '/', maxAge: 0 })
    return res
  }

  // 1. Authenticated session required; user_id comes from here, not the client.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', siteOrigin))

  // 2. Provider allowlist + configuration.
  const provider = getProvider(providerId)
  if (!provider) return back({ error: 'unknown_provider' })
  if (!isProviderConfigured(provider)) {
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
  const cookieState = request.cookies.get(OAUTH_STATE_COOKIE)?.value
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

  // 6. Exchange the authorization code for tokens. MUST use the exact same
  //    redirect_uri as the connect step (and the value registered in the portal).
  const redirectUri = buildRedirectUri(provider.id)
  console.log('🚀 EXCHANGE REDIRECT URI (must match connect):', redirectUri)

  let tokens: TokenResponse
  try {
    tokens =
      provider.id === 'linkedin'
        ? await exchangeLinkedInToken(code, redirectUri)
        : await exchangeCodeForTokens(provider, code, redirectUri)
  } catch (error) {
    // Comprehensive logging so any network or serialization failure is visible
    // directly in the server terminal.
    console.error('━━━━━━━━━━ OAUTH TOKEN EXCHANGE FAILURE ━━━━━━━━━━')
    console.error(`[oauth:${provider.id}] redirect_uri = ${redirectUri}`)
    console.error(error)
    return back({ error: 'exchange_failed', platform: provider.id })
  }

  if (!tokens.access_token) {
    console.error(`[oauth:${provider.id}] no access_token in response`, tokens)
    return back({ error: 'exchange_failed', platform: provider.id })
  }

  // Accurately compute the ABSOLUTE expiry timestamp from expires_in (seconds).
  const expiresAt =
    typeof tokens.expires_in === 'number' && Number.isFinite(tokens.expires_in)
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null

  // 7. Securely UPSERT. RLS (auth.uid() = user_id) + explicit user.id make it
  //    impossible to write tokens for any other user.
  const { error: dbError } = await supabase
    .from('platform_connections')
    .upsert(
      {
        user_id: user.id,
        platform_name: provider.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,platform_name' },
    )

  if (dbError) {
    console.error(`[oauth:${provider.id}] db upsert failed`, dbError)
    return back({ error: 'save_failed', platform: provider.id })
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
 * LinkedIn OAuth 2.0 token exchange (production).
 * POST https://www.linkedin.com/oauth/v2/accessToken
 * Body: application/x-www-form-urlencoded with grant_type, code, redirect_uri,
 * client_id, client_secret. redirect_uri MUST exactly match the registered URI.
 */
async function exchangeLinkedInToken(
  code: string,
  redirectUri: string,
): Promise<TokenResponse> {
  const clientId = process.env.LINKEDIN_CLIENT_ID
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('Missing LINKEDIN_CLIENT_ID / LINKEDIN_CLIENT_SECRET env vars')
  }

  // Strict x-www-form-urlencoded stringification.
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  }).toString()

  const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  })

  // Read the raw body once so we can surface LinkedIn's exact error payload.
  const rawBody = await res.text()
  if (!res.ok) {
    throw new Error(`LinkedIn token endpoint ${res.status}: ${rawBody}`)
  }

  let json: TokenResponse
  try {
    json = JSON.parse(rawBody) as TokenResponse
  } catch {
    throw new Error(`LinkedIn returned non-JSON token response: ${rawBody.slice(0, 300)}`)
  }
  return json
}

/**
 * Generic OAuth2 token exchange (RFC 6749 §4.1.3) for other providers.
 * Adjust per provider (some require HTTP Basic auth instead of body credentials).
 */
async function exchangeCodeForTokens(
  provider: ProviderConfig,
  code: string,
  redirectUri: string,
): Promise<TokenResponse> {
  const { clientId, clientSecret } = getProviderCredentials(provider)

  const res = await fetch(provider.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId!,
      client_secret: clientSecret!,
    }),
    // Never cache token responses.
    cache: 'no-store',
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`token endpoint ${res.status}: ${detail.slice(0, 200)}`)
  }

  return (await res.json()) as TokenResponse
}
