import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import FloatingNav from '@/components/layout/FloatingNav'
import Topbar from '@/components/layout/Topbar'
import { ExtensionTokenBridge } from '@/components/dashboard/ExtensionTokenBridge'

// ─── Dashboard Layout ─────────────────────────────────────────────────────────
// Defense-in-depth: middleware is layer 1, this getUser() is layer 2.
// z-index: 10 → sits ABOVE body mouse-glow (z-index: 0).
// FloatingNav is fixed at bottom; main has pb-32 to clear it.

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Statut Pro pour le badge d'abonnement du Topbar (RLS : ligne du propriétaire).
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_premium')
    .eq('id', user.id)
    .maybeSingle()
  const isPremium = Boolean(profile?.is_premium)

  return (
    <div
      className="relative flex h-screen w-full flex-col overflow-hidden"
      style={{ zIndex: 10 }}
    >
      {/* Single centered column — header + every page share this width,
          so nothing hugs the left edge and the layout reads centered. */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl px-6 pt-8 pb-44 sm:px-8 md:pt-12">
          <Topbar isPremium={isPremium} />
          {children}
        </div>
      </main>

      <FloatingNav />

      {/* Émet le JWT vers l'extension (Bearer backend) — invisible. */}
      <ExtensionTokenBridge />
    </div>
  )
}
