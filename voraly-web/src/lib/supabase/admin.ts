import 'server-only'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// ─── Voraly · Client Supabase ADMIN (service role) ───────────────────────────
// BYPASSES Row-Level Security. Import ONLY from trusted server contexts that
// authenticate the caller by other means (e.g. the Whop webhook, which is
// authenticated by its signature). NEVER import from a Client Component —
// the `server-only` import above makes that a build-time error.

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY',
    )
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      // No user session: this client acts as the service role, per-request.
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
