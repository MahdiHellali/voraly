import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Used by the Chrome extension to obtain the current user's access token.
// The extension sends cookies via credentials:'include', which this endpoint reads.
// Returns the short-lived access_token — never the refresh token.
export async function GET() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  }

  return NextResponse.json(
    { access_token: session.access_token },
    {
      headers: {
        // Allow Chrome extension origins to call this endpoint
        'Access-Control-Allow-Origin':      'null',
        'Access-Control-Allow-Methods':     'GET',
        'Access-Control-Allow-Credentials': 'true',
      },
    }
  )
}
