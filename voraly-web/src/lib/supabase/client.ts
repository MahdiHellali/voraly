import { createBrowserClient } from '@supabase/ssr'

// ─── Voraly · Client Supabase (navigateur) ───────────────────────────────────
// Utilisé dans les Client Components ('use client').
// Les variables d'environnement NEXT_PUBLIC_* sont exposées côté client.

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
