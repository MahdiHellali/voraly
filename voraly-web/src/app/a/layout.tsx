import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// ─── Voraly · Layout Admin (/a) ───────────────────────────────────────────────
// Guard double : authentifié + email admin uniquement.
// Ne pas exposer ce layout sans vérification email côté serveur.

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail || user.email !== adminEmail) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      {children}
    </div>
  )
}
