'use client'

// ─── Voraly · AdminAnimated — wrapper Client pour les animations ─────────────
// Reçoit les stats pré-chargées par le Server Component AdminPage.
// Tout framer-motion ici, zéro fetch côté client.

import { motion, type Transition } from 'framer-motion'
import { Users, Star, UserPlus, TrendingUp, ExternalLink, type LucideIcon } from 'lucide-react'
import type { AdminStats } from './page'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateFr(dateStr: string): string {
  return new Date(dateStr).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function todayFr(): string {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// ─── Variants framer-motion ───────────────────────────────────────────────────

function blurReveal(delay = 0): {
  initial: { filter: string; opacity: number; y: number }
  animate: { filter: string; opacity: number; y: number }
  transition: Transition
} {
  return {
    initial: { filter: 'blur(4px)', opacity: 0, y: 18 },
    animate: { filter: 'blur(0px)', opacity: 1, y: 0 },
    transition: { duration: 0.5, delay, ease: 'easeOut' as const },
  }
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  Icon,
  accent,
}: {
  label: string
  value: number
  Icon: LucideIcon
  accent: string
}) {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col gap-3">
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${accent}`}>
        <Icon size={20} className="text-white" />
      </div>
      <p className="text-3xl font-bold text-white">{value.toLocaleString('fr-FR')}</p>
      <p className="text-sm text-white/50">{label}</p>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function AdminAnimated({ stats }: { stats: AdminStats }) {
  const { totalUsers, premiumUsers, new7d, new30d, recentEvents, topPages } = stats

  return (
    <div className="mx-auto max-w-6xl space-y-10">

      {/* Section 1 — Header */}
      <motion.div {...blurReveal(0)}>
        <h1 className="text-3xl font-bold text-white">Admin — Voraly</h1>
        <p className="mt-1 text-white/40 text-sm capitalize">{todayFr()}</p>
      </motion.div>

      {/* Section 2 — KPI Grid */}
      <motion.div {...blurReveal(0.1)} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Utilisateurs total"
          value={totalUsers}
          Icon={Users}
          accent="bg-violet-500/30"
        />
        <KpiCard
          label="Utilisateurs Pro"
          value={premiumUsers}
          Icon={Star}
          accent="bg-pink-500/30"
        />
        <KpiCard
          label="Nouveaux 7 jours"
          value={new7d}
          Icon={UserPlus}
          accent="bg-indigo-500/30"
        />
        <KpiCard
          label="Nouveaux 30 jours"
          value={new30d}
          Icon={TrendingUp}
          accent="bg-violet-500/30"
        />
      </motion.div>

      {/* Section 3 — Top pages */}
      <motion.div {...blurReveal(0.2)}>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Top pages — 7 derniers jours</h2>
          {topPages.length === 0 ? (
            <p className="text-white/30 text-sm">Aucun événement tracké cette semaine.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-white/40 font-normal pb-2">Route</th>
                  <th className="text-right text-white/40 font-normal pb-2">Vues</th>
                </tr>
              </thead>
              <tbody>
                {topPages.map(({ page, views }) => (
                  <tr key={page} className="border-b border-white/5 last:border-0">
                    <td className="py-2 text-white/70 font-mono text-xs">{page}</td>
                    <td className="py-2 text-right text-white font-semibold">{views}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>

      {/* Section 4 — Flux d'événements récents */}
      <motion.div {...blurReveal(0.3)}>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Événements récents</h2>
          <div className="overflow-y-auto max-h-96">
            {recentEvents.length === 0 ? (
              <p className="text-white/30 text-sm">Aucun événement enregistré.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-zinc-900/90 backdrop-blur-sm">
                  <tr className="border-b border-white/10">
                    <th className="text-left text-white/40 font-normal pb-2 pr-4">Date</th>
                    <th className="text-left text-white/40 font-normal pb-2 pr-4">Utilisateur</th>
                    <th className="text-left text-white/40 font-normal pb-2 pr-4">Événement</th>
                    <th className="text-left text-white/40 font-normal pb-2">Page</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEvents.map((ev) => (
                    <tr key={ev.id} className="border-b border-white/5 last:border-0">
                      <td className="py-2 pr-4 text-white/40 text-xs whitespace-nowrap">
                        {formatDateFr(ev.created_at)}
                      </td>
                      <td className="py-2 pr-4 text-white/60 text-xs truncate max-w-[160px]">
                        {ev.user_email ?? '—'}
                      </td>
                      <td className="py-2 pr-4">
                        <span className="bg-violet-500/20 text-violet-300 text-xs px-2 py-0.5 rounded-full">
                          {ev.event_name}
                        </span>
                      </td>
                      <td className="py-2 text-white/40 font-mono text-xs">{ev.page ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </motion.div>

      {/* Section 5 — PostHog */}
      <motion.div {...blurReveal(0.4)}>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">PostHog</h2>
            <p className="text-white/50 text-sm max-w-xl">
              Tracking comportemental complet disponible dans PostHog. Ajoute{' '}
              <code className="bg-white/10 px-1 rounded text-xs text-violet-300">
                NEXT_PUBLIC_POSTHOG_KEY
              </code>{' '}
              dans{' '}
              <code className="bg-white/10 px-1 rounded text-xs text-violet-300">.env.local</code>{' '}
              pour activer.
            </p>
          </div>
          <a
            href="https://us.posthog.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors text-white text-sm px-4 py-2 rounded-2xl whitespace-nowrap"
          >
            Ouvrir PostHog
            <ExternalLink size={14} />
          </a>
        </div>
      </motion.div>

    </div>
  )
}
