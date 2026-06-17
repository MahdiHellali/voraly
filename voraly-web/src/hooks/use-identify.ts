'use client'

import { useEffect } from 'react'
import posthog from 'posthog-js'
import { createClient } from '@/lib/supabase/client'

// ─── Voraly · Hook identification PostHog ─────────────────────────────────────
// Au mount, si l'utilisateur Supabase est connecté, l'identifie dans PostHog.
// Utilise le singleton browser (clé anon + RLS) — jamais le service_role.

export function useIdentify() {
  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      posthog.identify(user.id, {
        email: user.email,
      })
    })
  }, [])
}
