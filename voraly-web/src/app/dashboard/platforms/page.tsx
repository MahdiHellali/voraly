import type { Metadata } from 'next'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { CheckCircle2, Clock, Plus, ArrowRight, Unplug, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { OAUTH_PROVIDERS, type ProviderId } from '@/lib/oauth/providers'
import {
  INTEGRATION_PROVIDERS,
  isIntegrationConfigured,
  type IntegrationId,
} from '@/lib/integrations/providers'
import { disconnectPlatform, disconnectIntegration } from './actions'
import { ExtensionConnect } from '@/components/dashboard/ExtensionConnect'

export const metadata: Metadata = {
  title: 'Plateformes Connectées — Voraly',
  description: 'Connectez vos plateformes freelance via OAuth : Upwork, LinkedIn, Fiverr, Malt.',
}

// Force fresh data on every visit (connection state changes after OAuth redirects).
export const dynamic = 'force-dynamic'

// ─── Visual metadata (presentation only) ──────────────────────────────────────
const PLATFORM_META: Record<
  ProviderId,
  { icon: string; color: string; border: string; glow: string }
> = {
  upwork: {
    icon: '/platforms/upwork.png',
    color: 'from-green-600/20 to-emerald-500/10',
    border: 'border-green-500/20 hover:border-green-500/40',
    glow: 'rgba(34,197,94,0.15)',
  },
  linkedin: {
    icon: '/platforms/linkedin.png',
    color: 'from-blue-600/20 to-indigo-500/10',
    border: 'border-blue-500/20 hover:border-blue-500/40',
    glow: 'rgba(59,130,246,0.15)',
  },
  fiverr: {
    icon: '/platforms/fiverr.png',
    color: 'from-emerald-600/20 to-teal-500/10',
    border: 'border-teal-500/20 hover:border-teal-500/40',
    glow: 'rgba(20,184,166,0.15)',
  },
  malt: {
    icon: '/platforms/malt.png',
    color: 'from-rose-600/20 to-pink-500/10',
    border: 'border-rose-500/20 hover:border-rose-500/40',
    glow: 'rgba(244,63,94,0.15)',
  },
}

const ORDER: ProviderId[] = ['upwork', 'linkedin', 'fiverr', 'malt']

// ─── Integration visual metadata ──────────────────────────────────────────────
const INTEGRATION_META: Record<
  IntegrationId,
  { icon: string; color: string; border: string; glow: string }
> = {
  google_calendar: {
    icon: '/integrations/google_calendar.png',
    color: 'from-indigo-600/20 to-blue-500/10',
    border: 'border-indigo-500/20 hover:border-indigo-500/40',
    glow: 'rgba(99,102,241,0.15)',
  },
  notion: {
    icon: '/integrations/notion.png',
    color: 'from-zinc-600/20 to-zinc-500/10',
    border: 'border-zinc-500/20 hover:border-zinc-500/40',
    glow: 'rgba(161,161,170,0.12)',
  },
}

const INTEGRATION_ORDER: IntegrationId[] = ['google_calendar', 'notion']

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function PlatformsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const t = await getTranslations('dashboard.platforms')
  const tInteg = await getTranslations('dashboard.integrations')
  const sp = await searchParams
  const errCode = first(sp.error) ?? ''
  const okCode = first(sp.success) ?? ''
  const errorMsg = errCode && t.has(`errors.${errCode}`) ? t(`errors.${errCode}`) : undefined
  const successMsg = okCode && t.has(`success.${okCode}`) ? t(`success.${okCode}`) : undefined

  // Live connection state — token columns are intentionally NOT selected.
  const supabase = await createClient()
  const [{ data: connections }, { data: integrationConnections }] = await Promise.all([
    supabase.from('platform_connections').select('platform_name, expires_at, updated_at'),
    // Never select token columns — only the provider identifier is needed for UI state.
    supabase.from('integration_connections').select('provider'),
  ])

  const connectedSet = new Set((connections ?? []).map((c) => c.platform_name))
  const connectedIntegrationSet = new Set((integrationConnections ?? []).map((c) => c.provider))

  const cards = ORDER.map((id) => {
    const provider = OAUTH_PROVIDERS[id]
    // "Connectable" = the provider exposes a real OAuth endpoint. Missing client
    // credentials are handled gracefully by the connect route (?error=config).
    const connectable = Boolean(provider.authorizeUrl && provider.tokenUrl)
    const connected = connectedSet.has(id)
    return {
      id,
      label: provider.label,
      desc: t(`platforms.${id}.desc`),
      ...PLATFORM_META[id],
      // 'connected' | 'disconnected' (connectable) | 'coming_soon' (no endpoint yet)
      state: connected ? 'connected' : connectable ? 'disconnected' : 'coming_soon',
    }
  })

  const connectableCount = cards.filter((c) => c.state !== 'coming_soon').length
  const connectedCount = cards.filter((c) => c.state === 'connected').length

  // Build integration cards — state derived from live DB + env config.
  const integrationCards = INTEGRATION_ORDER.map((id) => {
    const provider = INTEGRATION_PROVIDERS[id]
    const connected = connectedIntegrationSet.has(id)
    const configured = isIntegrationConfigured(provider)
    // Explicit cast to literal union — TS cannot narrow ternary chains automatically.
    const state: 'connected' | 'configured' | 'soon' = connected
      ? 'connected'
      : configured
        ? 'configured'
        : 'soon'
    return {
      id,
      label: provider.label,
      desc: tInteg(`providers.${id}.description`),
      ...INTEGRATION_META[id],
      state,
    }
  })

  return (
    <div className="flex w-full flex-col gap-8 fade-1">
      {/* ── Header ── */}
      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-indigo-400">
          {t('eyebrow')}
        </p>
        <h1 className="mb-2 text-2xl font-extrabold tracking-tight text-white">
          {t('title')}
        </h1>
        <p className="text-sm leading-relaxed text-zinc-400">
          {t('subtitle')}
        </p>
      </div>

      {/* ── Extension Voraly (connexion via popup, sync arrière-plan) ── */}
      <ExtensionConnect />

      {/* ── Status banner ── */}
      {(errorMsg || successMsg) && (
        <div
          role="status"
          className={
            'flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-[13px] font-medium ' +
            (errorMsg
              ? 'border-rose-500/20 bg-rose-500/10 text-rose-300'
              : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300')
          }
        >
          {errorMsg ? (
            <AlertTriangle size={15} className="shrink-0" />
          ) : (
            <CheckCircle2 size={15} className="shrink-0" />
          )}
          <span>{errorMsg ?? successMsg}</span>
        </div>
      )}

      {/* ── Stats summary ── */}
      <div className="grid grid-cols-3 gap-4 fade-2">
        {[
          { label: t('stats.active'), value: `${connectedCount} / ${connectableCount}`, color: 'text-indigo-300' },
          { label: t('stats.oauth'), value: String(connectedCount), color: 'text-emerald-400' },
          { label: t('stats.available'), value: String(connectableCount), color: 'text-indigo-300' },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl p-5 text-center">
            <div className={`mb-1 text-2xl font-bold tracking-tight ${s.color}`}>{s.value}</div>
            <div className="text-[11px] text-zinc-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Platform cards grid ── */}
      <div className="grid grid-cols-1 gap-5 fade-3 md:grid-cols-2">
        {cards.map((p) => (
          <div
            key={p.id}
            className={`glass group relative overflow-hidden rounded-3xl border p-6 transition-all duration-300 ${p.border}`}
          >
            {/* Background glow tint */}
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br ${p.color} opacity-60`}
            />
            {/* Inner glow orb */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{ background: `radial-gradient(circle, ${p.glow} 0%, transparent 70%)`, filter: 'blur(20px)' }}
            />

            <div className="relative z-10">
              {/* Header row */}
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-lg overflow-hidden bg-zinc-900/60 border border-white/10 p-0.5">
                    <Image
                      src={p.icon}
                      alt={p.label}
                      width={24}
                      height={24}
                      className="object-contain select-none"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-base font-bold text-zinc-100">{p.label}</div>
                  </div>
                </div>
                <StatusBadge state={p.state} t={t} />
              </div>

              {/* Description */}
              <p className="mb-5 text-[12px] leading-relaxed text-zinc-400">{p.desc}</p>

              {/* CTA */}
              {p.state === 'connected' ? (
                <form action={disconnectPlatform}>
                  <input type="hidden" name="provider" value={p.id} />
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 py-2.5 text-[12px] font-semibold text-rose-300 transition-all duration-200 hover:bg-rose-500/20"
                  >
                    <Unplug size={13} /> {t('disconnect')}
                  </button>
                </form>
              ) : p.state === 'disconnected' ? (
                <a
                  href={`/api/platforms/${p.id}/connect`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/10 py-2.5 text-[12px] font-semibold text-indigo-300 transition-all duration-200 hover:bg-indigo-500/20 group-hover:border-indigo-400/40"
                >
                  <Plus size={13} /> {t('connect', { label: p.label })}
                  <ArrowRight size={12} className="ml-auto opacity-0 transition-opacity group-hover:opacity-100" />
                </a>
              ) : (
                <div className="w-full rounded-xl border border-white/[0.04] bg-white/[0.02] py-2.5 text-center text-[12px] text-zinc-500">
                  {t('comingSoon')}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {/* ── Agenda & Outils section ── */}
      <div className="mt-2 fade-4">
        <div className="mb-5">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.15em] text-indigo-400">
            {t('toolsTitle')}
          </p>
          <p className="text-[12px] leading-relaxed text-zinc-500">
            {t('toolsSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {integrationCards.map((p) => (
            <div
              key={p.id}
              className={`glass group relative overflow-hidden rounded-3xl border p-6 transition-all duration-300 ${p.border}`}
            >
              {/* Background glow tint */}
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br ${p.color} opacity-60`}
              />
              {/* Inner glow orb */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: `radial-gradient(circle, ${p.glow} 0%, transparent 70%)`, filter: 'blur(20px)' }}
              />

              <div className="relative z-10">
                {/* Header row */}
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-lg overflow-hidden bg-zinc-900/60 border border-white/10 p-0.5">
                      <Image
                        src={p.icon}
                        alt={p.label}
                        width={24}
                        height={24}
                        className="object-contain select-none"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-base font-bold text-zinc-100">{p.label}</div>
                    </div>
                  </div>
                  <IntegrationStatusBadge state={p.state} t={t} />
                </div>

                {/* Description */}
                <p className="mb-5 text-[12px] leading-relaxed text-zinc-400">{p.desc}</p>

                {/* CTA */}
                {p.state === 'connected' ? (
                  <form action={disconnectIntegration}>
                    <input type="hidden" name="provider" value={p.id} />
                    <button
                      type="submit"
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 py-2.5 text-[12px] font-semibold text-rose-300 transition-all duration-200 hover:bg-rose-500/20"
                    >
                      <Unplug size={13} /> {t('disconnect')}
                    </button>
                  </form>
                ) : p.state === 'configured' ? (
                  <a
                    href={`/api/integrations/${p.id}/connect`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/10 py-2.5 text-[12px] font-semibold text-indigo-300 transition-all duration-200 hover:bg-indigo-500/20 group-hover:border-indigo-400/40"
                  >
                    <Plus size={13} /> {t('connect', { label: p.label })}
                    <ArrowRight size={12} className="ml-auto opacity-0 transition-opacity group-hover:opacity-100" />
                  </a>
                ) : (
                  // 'soon' — configuration env manquante : bloc inerte, pas de lien mort
                  <div className="w-full rounded-xl border border-white/[0.04] bg-white/[0.02] py-2.5 text-center text-[12px] text-zinc-500">
                    {t('configRequired')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────
type PlatformsT = Awaited<ReturnType<typeof getTranslations>>

function StatusBadge({ state, t }: { state: string; t: PlatformsT }) {
  if (state === 'connected') {
    return (
      <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-400">
        <CheckCircle2 size={10} className="shrink-0" /> {t('badge.connected')}
      </span>
    )
  }
  if (state === 'coming_soon') {
    return (
      <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-[10px] font-bold text-indigo-400">
        <Clock size={10} className="shrink-0" /> {t('badge.soon')}
      </span>
    )
  }
  return (
    <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold text-zinc-500">
      {t('badge.notConnected')}
    </span>
  )
}

function IntegrationStatusBadge({ state, t }: { state: 'connected' | 'configured' | 'soon'; t: PlatformsT }) {
  if (state === 'connected') {
    return (
      <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-400">
        <CheckCircle2 size={10} className="shrink-0" /> {t('badge.connected')}
      </span>
    )
  }
  if (state === 'soon') {
    return (
      <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-[10px] font-bold text-indigo-400">
        <Clock size={10} className="shrink-0" /> {t('badge.soon')}
      </span>
    )
  }
  // 'configured' — prêt à connecter
  return (
    <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold text-zinc-500">
      {t('badge.notConnected')}
    </span>
  )
}
