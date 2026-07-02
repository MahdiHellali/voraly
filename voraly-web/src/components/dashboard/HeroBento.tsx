'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import { Plug, ArrowRight } from 'lucide-react'

interface HeroBentoProps {
  firstName?: string
  connectedPlatformsCount: number
  revenue?: { monthTotal: number; deltaPct: number; activePlatforms: number } | null
  score?: number | null
  chips?: { revenueToday?: string; newProposals?: number; pendingReplies?: number } | null
  /** Masque le CTA « Connecter » inline quand un empty state dédié le porte déjà. */
  showConnectCta?: boolean
}

export default function HeroBento({
  firstName = 'Freelance',
  connectedPlatformsCount,
  revenue = null,
  score = null,
  chips = null,
  showConnectCta = true,
}: HeroBentoProps) {
  const t = useTranslations('dashboard.hero')
  const locale = useLocale()
  const numberLocale = locale === 'en' ? 'en-US' : 'fr-FR'
  const ringRef = useRef<SVGCircleElement>(null)

  useEffect(() => {
    if (score == null || !ringRef.current) return
    const circumference = 2 * Math.PI * 45
    ringRef.current.style.strokeDashoffset = String(circumference - (score / 100) * circumference)
  }, [score])

  const hasChips =
    !!chips &&
    (chips.revenueToday || chips.newProposals != null || chips.pendingReplies != null)

  return (
    <div className="pt-2 pb-6">
      {/* ── Greeting ── */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.04 }}
        className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.18em] mb-5"
      >
        {t('greeting', { name: firstName })}
      </motion.p>

      {/* ── Hero row: metric ou bienvenue + score ring ── */}
      <div className="flex items-center justify-between gap-8 flex-wrap mb-6">
        {revenue ? (
          /* État A — données de revenus disponibles */
          <div>
            <motion.p
              initial={{ opacity: 0, filter: 'blur(4px)', y: 6 }}
              animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
              className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-2"
            >
              {t('revenueThisMonth')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, filter: 'blur(8px)', y: 12 }}
              animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
              className="flex items-baseline gap-2.5"
            >
              <span className="text-[58px] font-black text-white tracking-tight leading-none tabular-nums">
                {revenue.monthTotal.toLocaleString(numberLocale)}
              </span>
              <span className="text-[26px] font-bold text-zinc-400">€</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.18 }}
              className="flex items-center gap-3 mt-2.5"
            >
              <span
                className={`text-[13px] font-bold ${revenue.deltaPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
              >
                {revenue.deltaPct >= 0 ? '▲' : '▼'}{' '}
                {revenue.deltaPct >= 0 ? '+' : ''}
                {revenue.deltaPct}%
              </span>
              <span className="text-[13px] text-zinc-400">{t('vsLastMonth')}</span>
              <span className="text-zinc-800 select-none">·</span>
              <span className="text-[13px] text-zinc-400">
                {t('activePlatforms', { count: revenue.activePlatforms })}
              </span>
            </motion.div>
          </div>
        ) : (
          /* État B — empty state (aucune métrique) */
          <motion.div
            initial={{ opacity: 0, filter: 'blur(8px)', y: 12 }}
            animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="max-w-md"
          >
            <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-2">
              {t('dashboardLabel')}
            </p>
            <h2 className="text-[28px] sm:text-[32px] font-black text-white tracking-tight leading-[1.1]">
              {t('welcome')}
            </h2>
            {connectedPlatformsCount > 0 ? (
              <p className="text-[14px] text-zinc-400 mt-3 leading-relaxed">
                {t.rich('connectedIntro', {
                  count: connectedPlatformsCount,
                  b: (chunks) => <span className="font-bold text-violet-300">{chunks}</span>,
                })}
              </p>
            ) : (
              <>
                <p className="text-[14px] text-zinc-400 mt-3 leading-relaxed">
                  {t('emptyIntro')}
                </p>
                {showConnectCta && (
                  <Link
                    href="/dashboard/platforms"
                    className="group inline-flex items-center gap-2 mt-4 rounded-2xl border border-violet-500/30 bg-violet-500/10 px-4 py-2.5 text-[13px] font-semibold text-violet-200 transition-all duration-200 hover:bg-violet-500/15 hover:border-violet-500/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
                    style={{ boxShadow: '0 0 24px rgba(139,92,246,0.18)' }}
                  >
                    <Plug size={15} className="text-violet-300" />
                    {t('connectPlatform')}
                    <ArrowRight
                      size={14}
                      className="transition-transform duration-200 group-hover:translate-x-0.5"
                    />
                  </Link>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* Score ring — uniquement si score != null */}
        {score != null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, filter: 'blur(6px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.22 }}
            whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
            className="flex flex-col items-center gap-2.5 flex-shrink-0 cursor-default"
          >
            <div className="relative w-[86px] h-[86px]">
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full -rotate-90"
                style={{ filter: 'drop-shadow(0 0 14px rgba(139,92,246,0.6))' }}
              >
                <defs>
                  <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#4338ca" />
                  </linearGradient>
                </defs>
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="rgba(255,255,255,0.04)"
                  strokeWidth="7"
                />
                <circle
                  ref={ringRef}
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="url(#scoreGrad)"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray="282.743"
                  strokeDashoffset="282.743"
                  className="score-ring-fill"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[25px] font-black text-white leading-none tracking-tight">
                  {score}
                </span>
                <span className="text-[9px] text-zinc-400 font-semibold mt-0.5 uppercase tracking-wider">
                  {t('score')}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Chips — uniquement si données disponibles ── */}
      {hasChips && (
        <div className="flex gap-3 flex-wrap">
          {[
            chips!.revenueToday && {
              label: t('chips.revenueToday'),
              value: chips!.revenueToday!,
              accent: 'text-emerald-400',
            },
            chips!.newProposals != null && {
              label: t('chips.newProposals'),
              value: String(chips!.newProposals),
              accent: 'text-violet-300',
            },
            chips!.pendingReplies != null && {
              label: t('chips.pendingReplies'),
              value: String(chips!.pendingReplies),
              accent: 'text-amber-400',
            },
          ]
            .filter(Boolean)
            .map((s, i) => {
              const chip = s as { label: string; value: string; accent: string }
              return (
                <motion.div
                  key={chip.label}
                  initial={{ opacity: 0, y: 10, scale: 0.93, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                  transition={{
                    duration: 0.45,
                    ease: [0.22, 1, 0.36, 1],
                    delay: 0.3 + i * 0.07,
                  }}
                  whileHover={{ scale: 1.04, y: -2, transition: { duration: 0.18 } }}
                  whileTap={{ scale: 0.96, transition: { duration: 0.1 } }}
                  className="glass rounded-2xl px-5 py-4 min-w-[148px] cursor-default"
                >
                  <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mb-1.5">
                    {chip.label}
                  </div>
                  <div className={`text-[22px] font-bold tracking-tight ${chip.accent}`}>
                    {chip.value}
                  </div>
                </motion.div>
              )
            })}
        </div>
      )}
    </div>
  )
}
