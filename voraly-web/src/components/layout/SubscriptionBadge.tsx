'use client'

import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import { Infinity as InfinityIcon, Crown, Clock } from 'lucide-react'

// Badge d'abonnement affiché dans le Topbar, à côté des notifications.
// 3 états : non abonné (CTA animé « Passer à Pro »), abonné avec renouvellement
// (compte à rebours), abonné à vie (logo infini).
interface SubscriptionBadgeProps {
  isPremium: boolean
  /** Date ISO du prochain renouvellement. Absente/null = abonnement à vie. */
  renewalDate?: string | null
}

function daysUntil(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000))
}

export default function SubscriptionBadge({
  isPremium,
  renewalDate,
}: SubscriptionBadgeProps) {
  const t = useTranslations('dashboard.subscription')
  const locale = useLocale()
  // ── Non abonné → CTA animé vers /pricing ──
  if (!isPremium) {
    return (
      <Link href="/pricing" aria-label={t('upgrade')}>
        <motion.span
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-full border border-pink-500/40 bg-pink-500/10 px-3.5 py-1.5 text-[12px] font-bold text-pink-100 backdrop-blur-xl"
          style={{ boxShadow: '0 0 16px rgba(255,102,204,0.25)' }}
        >
          {/* halo pulsant */}
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full"
            animate={{ opacity: [0.3, 0.65, 0.3] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ boxShadow: '0 0 18px rgba(255,102,204,0.45)' }}
          />
          {/* éclat qui balaie */}
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-12"
            initial={{ x: '-100%' }}
            animate={{ x: '500%' }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: 'easeInOut',
              repeatDelay: 1.4,
            }}
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
            }}
          />
          <Crown size={13} className="relative text-pink-300" />
          <span className="relative">{t('upgrade')}</span>
        </motion.span>
      </Link>
    )
  }

  // ── Abonné avec renouvellement → compte à rebours ──
  if (renewalDate) {
    const d = daysUntil(renewalDate)
    return (
      <span
        title={t('renewalOn', { date: new Date(renewalDate).toLocaleDateString(locale === 'en' ? 'en-US' : 'fr-FR') })}
        className="inline-flex items-center gap-1.5 rounded-full border border-pink-500/30 bg-pink-500/10 px-3.5 py-1.5 text-[12px] font-bold text-pink-100 backdrop-blur-xl"
        style={{ boxShadow: '0 0 14px rgba(255,102,204,0.2)' }}
      >
        <Clock size={13} className="text-pink-300" />
        {t('proDays', { count: d })}
      </span>
    )
  }

  // ── Abonné à vie → logo infini ──
  return (
    <span
      title={t('lifetimeTitle')}
      className="inline-flex items-center gap-1.5 rounded-full border border-pink-500/30 bg-pink-500/10 px-3.5 py-1.5 text-[12px] font-bold text-pink-100 backdrop-blur-xl"
      style={{ boxShadow: '0 0 14px rgba(255,102,204,0.22)' }}
    >
      <InfinityIcon size={14} className="text-pink-300" />
      {t('proLifetime')}
    </span>
  )
}
