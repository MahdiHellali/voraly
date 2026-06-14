import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import SettingsForm from '@/components/dashboard/SettingsForm'

export const metadata: Metadata = {
  title: 'Paramètres — Voraly',
  description: 'Gérez votre compte, préférences et abonnement Voraly.',
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_premium, avatar_url')
    .eq('id', user.id)
    .maybeSingle()
  const isPremium = Boolean(profile?.is_premium)
  const avatarUrl = (profile?.avatar_url as string | null) ?? null

  const fullName = user.user_metadata?.full_name?.trim() || user.email?.split('@')[0] || 'Utilisateur'
  const email = user.email ?? ''
  const initials = (() => {
    const parts = fullName.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return fullName.slice(0, 2).toUpperCase()
  })()

  return (
    <div className="max-w-[720px] w-full mx-auto flex flex-col gap-8 fade-1">
      {/* Header */}
      <div>
        <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.15em] mb-2">
          ⚙️ Configuration
        </p>
        <h1 className="text-2xl font-extrabold text-white tracking-tight mb-2">Paramètres</h1>
        <p className="text-sm text-zinc-400">Gérez votre compte et vos préférences Voraly.</p>
      </div>

      {/* User preview card */}
      <div className="glass-hero rounded-3xl p-6 flex items-center gap-5 fade-2">
        <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0" style={{ boxShadow: '0 0 20px rgba(139,92,246,0.4)' }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-lg font-black text-white"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              {initials}
            </div>
          )}
        </div>
        <div>
          <div className="text-base font-bold text-zinc-100">{fullName}</div>
          <div className="text-[12px] text-zinc-400 mt-0.5">{email}</div>
          <div className={`text-[10px] mt-1 font-semibold ${isPremium ? 'text-pink-400' : 'text-indigo-400'}`}>
            {isPremium ? 'Plan Pro · À vie' : 'Plan Gratuit · Actif'}
          </div>
        </div>
      </div>

      {/* Interactive Settings Form sections */}
      <div className="fade-3">
        <SettingsForm user={user} isPremium={isPremium} avatarUrl={avatarUrl} />
      </div>
    </div>
  )
}
