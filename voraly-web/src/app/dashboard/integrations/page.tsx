// Page stub — Intégrations
// Les flux OAuth Google Calendar & Notion ne sont pas encore construits.
// Cette page affiche un état "bientôt disponible" pour éviter les liens morts.
// TODO : implémenter les routes OAuth connect/callback et brancher les providers.

import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarDays, FileText, ArrowLeft } from 'lucide-react'
import { INTEGRATION_PROVIDERS } from '@/lib/integrations/providers'

export const metadata: Metadata = {
  title: 'Intégrations — Voraly',
  description: 'Connectez Google Calendar et Notion à votre dashboard Voraly.',
}

export default function IntegrationsPage() {
  return (
    <div className="flex flex-col gap-8 max-w-xl">
      {/* ── En-tête ── */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-[12px] text-zinc-500 hover:text-zinc-300 transition-colors mb-6"
        >
          <ArrowLeft size={13} />
          Retour au dashboard
        </Link>
        <h1 className="text-[26px] font-black text-white tracking-tight">Intégrations</h1>
        <p className="mt-2 text-[13.5px] text-zinc-400 leading-relaxed">
          Connectez vos outils pour importer deadlines et livrables directement dans votre dashboard.
        </p>
      </div>

      {/* ── Liste des providers ── */}
      <div className="flex flex-col gap-3">
        {INTEGRATION_PROVIDERS.map((provider) => {
          const Icon = provider.id === 'google_calendar' ? CalendarDays : FileText
          return (
            <div
              key={provider.id}
              className="glass rounded-2xl p-5 flex items-center gap-4"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}
            >
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.05]">
                <Icon className={`h-5 w-5 ${provider.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold text-zinc-100">{provider.label}</div>
                <div className="text-[12px] text-zinc-500 mt-0.5 leading-relaxed">
                  {provider.description}
                </div>
              </div>
              <span className="flex-shrink-0 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                Bientôt
              </span>
            </div>
          )
        })}
      </div>

      <p className="text-[12px] text-zinc-600 leading-relaxed">
        Les flux de connexion OAuth seront disponibles prochainement.
        En attendant, vos données de plateformes (Upwork, Fiverr, Malt) sont accessibles via{' '}
        <Link href="/dashboard/platforms" className="text-violet-400 hover:text-violet-300 transition-colors">
          la page Plateformes
        </Link>
        .
      </p>
    </div>
  )
}
