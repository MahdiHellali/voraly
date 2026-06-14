import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Use getUser() — NOT getSession(). getSession() reads only from the cookie and
  // can be spoofed. getUser() re-validates the JWT with Supabase's auth server.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Check Authenticator Assurance Level (MFA)
  let isMfaRequired = false
  if (user) {
    const { data: mfaData, error: mfaError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (!mfaError && mfaData) {
      const { currentLevel, nextLevel } = mfaData
      if (currentLevel === 'aal1' && nextLevel === 'aal2') {
        isMfaRequired = true
      }
    }
  }

  // Unauthenticated: only /dashboard routes are forced to /login. The root '/'
  // stays PUBLIC and renders the marketing landing (page.tsx). Do NOT intercept
  // '/' here, otherwise anonymous visitors never reach the landing.
  if (!user && pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Authenticated but MFA challenge not completed: redirect /dashboard access to /login?mfa=true
  if (user && isMfaRequired && pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('mfa', 'true')
    return NextResponse.redirect(url)
  }

  // Authenticated (and MFA verified or not required): the root and the auth pages send the user into the app.
  if (user && !isMfaRequired && (pathname === '/' || pathname === '/login' || pathname === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
