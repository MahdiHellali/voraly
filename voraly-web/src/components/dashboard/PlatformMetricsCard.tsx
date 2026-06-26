import Image from 'next/image'
import { Wallet, Clock3, Package, Star, RefreshCw, AlertTriangle } from 'lucide-react'

// ─── Voraly · Carte de métriques plateforme (Phase 3) ─────────────────────────
// Présentation pure (aucun fetch ici) : reçoit les 4 KPIs déjà archivés par le
// moteur de sync (extension → POST /api/platforms/sync → platform_metrics) et
// les affiche en DA liquid-glass. Les libellés sont passés traduits par la page.

export interface PlatformMetrics {
  totalEarnings: number
  pendingBalance: number
  activeOrders: number
  rating: number
}

interface PlatformMetricsCardProps {
  label: string
  icon: string
  /** Tints liquid-glass réutilisés depuis PLATFORM_META de la page. */
  accent: { color: string; border: string; glow: string }
  metrics: PlatformMetrics | null
  /** Ex. « il y a 5 min » — null si jamais synchronisé. */
  lastSyncedText: string | null
  sessionExpired: boolean
  labels: {
    totalEarnings: string
    pendingBalance: string
    activeOrders: string
    rating: string
    syncedPrefix: string
    neverSynced: string
    sessionExpired: string
  }
}

const money = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

export function PlatformMetricsCard({
  label,
  icon,
  accent,
  metrics,
  lastSyncedText,
  sessionExpired,
  labels,
}: PlatformMetricsCardProps) {
  const m = metrics ?? { totalEarnings: 0, pendingBalance: 0, activeOrders: 0, rating: 0 }

  const kpis = [
    { key: 'earn', icon: Wallet, label: labels.totalEarnings, value: money.format(m.totalEarnings) },
    { key: 'pend', icon: Clock3, label: labels.pendingBalance, value: money.format(m.pendingBalance) },
    { key: 'ord', icon: Package, label: labels.activeOrders, value: String(m.activeOrders) },
    {
      key: 'rate',
      icon: Star,
      label: labels.rating,
      value: m.rating > 0 ? `${m.rating.toFixed(1)} / 5` : '—',
    },
  ]

  return (
    <div
      className={`glass group relative overflow-hidden rounded-3xl border p-6 transition-all duration-300 ${accent.border}`}
    >
      {/* Background glow tint */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br ${accent.color} opacity-60`}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: `radial-gradient(circle, ${accent.glow} 0%, transparent 70%)`, filter: 'blur(20px)' }}
      />

      <div className="relative z-10">
        {/* Header : plateforme + état de sync */}
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-zinc-900/60 p-0.5">
              <Image src={icon} alt={label} width={24} height={24} className="select-none object-contain" />
            </div>
            <div className="truncate text-base font-bold text-zinc-100">{label}</div>
          </div>

          {sessionExpired ? (
            <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-[#FF66CC]/30 bg-[#FF66CC]/10 px-2.5 py-1 text-[10px] font-bold text-[#FF66CC]">
              <AlertTriangle size={10} className="shrink-0" /> {labels.sessionExpired}
            </span>
          ) : (
            <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium text-zinc-400">
              <RefreshCw size={10} className="shrink-0" />
              {lastSyncedText ? `${labels.syncedPrefix} ${lastSyncedText}` : labels.neverSynced}
            </span>
          )}
        </div>

        {/* 4 KPIs */}
        <div className="grid grid-cols-2 gap-3">
          {kpis.map((k) => {
            const KIcon = k.icon
            return (
              <div
                key={k.key}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3.5"
              >
                <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                  <KIcon size={11} className="shrink-0 text-indigo-400" />
                  <span className="truncate">{k.label}</span>
                </div>
                <div className="text-lg font-bold tracking-tight text-zinc-100">{k.value}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
