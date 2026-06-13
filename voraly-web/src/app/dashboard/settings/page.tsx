import type { Metadata } from 'next'
import Link from 'next/link'
import { User, Bell, Shield, CreditCard, ChevronRight, type LucideIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Paramètres — Voraly',
  description: 'Gérez votre compte, préférences et abonnement Voraly.',
}

type Section = {
  icon: LucideIcon
  label: string
  desc: string
  color: string
  bg: string
  /** Si défini, la section devient un lien (ex. Abonnement → /pricing). */
  href?: string
}

const sections: Section[] = [
  {
    icon: User,
    label: 'Profil',
    desc: 'Informations personnelles et photo de profil',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
  },
  {
    icon: Bell,
    label: 'Notifications',
    desc: 'Alertes deadlines, nouvelles offres, sync',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
  },
  {
    icon: Shield,
    label: 'Sécurité',
    desc: 'Mot de passe, 2FA et sessions actives',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: CreditCard,
    label: 'Abonnement',
    desc: 'Gérer votre plan, facturation et historique',
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    href: '/pricing',
  },
]

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_premium')
    .eq('id', user?.id ?? '')
    .maybeSingle()
  const isPremium = Boolean(profile?.is_premium)

  const fullName   = user?.user_metadata?.full_name?.trim() || user?.email?.split('@')[0] || 'Utilisateur'
  const email      = user?.email ?? ''
  const initials   = (() => {
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
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black text-white flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            boxShadow: '0 0 20px rgba(139,92,246,0.4)',
          }}
        >
          {initials}
        </div>
        <div>
          <div className="text-base font-bold text-zinc-100">{fullName}</div>
          <div className="text-[12px] text-zinc-400 mt-0.5">{email}</div>
          <div className={`text-[10px] mt-1 font-semibold ${isPremium ? 'text-pink-400' : 'text-indigo-400'}`}>
            {isPremium ? 'Plan Pro · À vie' : 'Plan Gratuit · Actif'}
          </div>
        </div>
      </div>

      {/* Settings sections */}
      <div className="flex flex-col gap-3 fade-3">
        {sections.map(({ icon: Icon, label, desc, color, bg, href }) => {
          const cls =
            'glass rounded-2xl p-5 flex items-center gap-4 text-left group hover:border-white/20 w-full transition-all duration-200'
          const inner = (
            <>
              <div className={`w-10 h-10 rounded-xl ${bg} border border-white/[0.08] flex items-center justify-center flex-shrink-0`}>
                <Icon size={16} className={color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-zinc-200">{label}</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">{desc}</div>
              </div>
              <ChevronRight size={15} className="text-zinc-600 flex-shrink-0 group-hover:text-zinc-400 transition-colors" />
            </>
          )
          return href ? (
            <Link key={label} href={href} className={cls}>
              {inner}
            </Link>
          ) : (
            <button key={label} className={cls}>
              {inner}
            </button>
          )
        })}
      </div>

      {/* Danger zone */}
      <div className="glass rounded-2xl p-5 border border-rose-500/15 fade-4">
        <div className="text-[11px] font-bold text-rose-400 uppercase tracking-[0.12em] mb-3">Zone sensible</div>
        <button className="text-[12px] font-semibold text-rose-400 hover:text-rose-300 transition-colors">
          Supprimer mon compte
        </button>
      </div>
    </div>
  )
}
