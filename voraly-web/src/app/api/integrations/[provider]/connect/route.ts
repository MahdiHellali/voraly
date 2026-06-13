import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getIntegrationProvider,
  getIntegrationCredentials,
  isIntegrationConfigured,
  buildIntegrationRedirectUri,
  INTEGRATION_STATE_COOKIE,
} from '@/lib/integrations/providers'
import { getSiteOrigin } from '@/lib/oauth/providers'

// GET /api/integrations/[provider]/connect
// Builds the provider's OAuth 2.0 authorization URL and redirects the user to it.
// Security: requires an authenticated session, validates the provider against an
// allowlist (google_calendar | notion), and sets a CSRF `state` token in an
// httpOnly cookie distinct from the platforms cookie (INTEGRATION_STATE_COOKIE).

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider: providerId } = await params
  // Use the trusted site origin (NEXT_PUBLIC_SITE_URL) — never request.nextUrl.origin,
  // which resolves to Docker's internal address (0.0.0.0:3000) in production.
  const siteOrigin = getSiteOrigin()
  const platformsUrl = new URL('/dashboard/platforms', siteOrigin)

  // 1. Must be authenticated (also enforced by middleware, belt-and-suspenders).
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/login', siteOrigin))
  }

  // 2. Provider must be in the allowlist (google_calendar | notion only).
  const provider = getIntegrationProvider(providerId)
  if (!provider) {
    platformsUrl.searchParams.set('error', 'unknown_provider')
    return NextResponse.redirect(platformsUrl)
  }

  // 3. Provider must be fully configured (endpoints + env credentials present).
  if (!isIntegrationConfigured(provider)) {
    platformsUrl.searchParams.set('error', 'config')
    platformsUrl.searchParams.set('platform', provider.id)
    return NextResponse.redirect(platformsUrl)
  }

  const { clientId } = getIntegrationCredentials(provider)
  const redirectUri = buildIntegrationRedirectUri(provider.id)

  // 4. Generate an unguessable CSRF state, bound to the provider.
  const state = crypto.randomUUID()

  // 5. Build the authorization URL.
  const authUrl = new URL(provider.authorizeUrl)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('client_id', clientId!)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  if (provider.scopes) authUrl.searchParams.set('scope', provider.scopes)
  authUrl.searchParams.set('state', state)
  for (const [k, v] of Object.entries(provider.extraAuthParams ?? {})) {
    authUrl.searchParams.set(k, v)
  }

  // 6. Redirect to the provider, persisting the state in an httpOnly cookie.
  // Cookie name is DISTINCT from OAUTH_STATE_COOKIE used by platforms routes.
  const response = NextResponse.redirect(authUrl)
  response.cookies.set({
    name: INTEGRATION_STATE_COOKIE,
    value: `${provider.id}.${state}`,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // sent on the top-level GET redirect back from the provider
    path: '/',
    maxAge: 60 * 10, // 10 minutes
  })
  return response
}
