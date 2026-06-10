import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getProvider,
  getProviderCredentials,
  isProviderConfigured,
  buildRedirectUri,
  OAUTH_STATE_COOKIE,
} from '@/lib/oauth/providers'

// GET /api/platforms/[provider]/connect
// Builds the provider's OAuth 2.0 authorization URL and redirects the user to it.
// Security: requires an authenticated session, validates the provider against an
// allowlist, and sets a CSRF `state` token in an httpOnly cookie (verified on callback).

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider: providerId } = await params
  const origin = request.nextUrl.origin
  const platformsUrl = new URL('/dashboard/platforms', origin)

  // 1. Must be authenticated (also enforced by middleware, belt-and-suspenders).
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/login', origin))
  }

  // 2. Provider must be in the allowlist.
  const provider = getProvider(providerId)
  if (!provider) {
    platformsUrl.searchParams.set('error', 'unknown_provider')
    return NextResponse.redirect(platformsUrl)
  }

  // 3. Provider must be fully configured (endpoints + env credentials present).
  if (!isProviderConfigured(provider)) {
    platformsUrl.searchParams.set('error', 'config')
    platformsUrl.searchParams.set('platform', provider.id)
    return NextResponse.redirect(platformsUrl)
  }

  const { clientId } = getProviderCredentials(provider)
  const redirectUri = buildRedirectUri(provider.id)

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
  console.log('🚀 SENDING REDIRECT URI TO LINKEDIN:', redirectUri)
  const response = NextResponse.redirect(authUrl)
  response.cookies.set({
    name: OAUTH_STATE_COOKIE,
    value: `${provider.id}.${state}`,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // sent on the top-level GET redirect back from the provider
    path: '/',
    maxAge: 60 * 10, // 10 minutes
  })
  return response
}
