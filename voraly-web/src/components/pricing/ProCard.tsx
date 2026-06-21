'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { ArrowRight, Check, ShieldCheck } from 'lucide-react'

// Phase 'idle' — la carte de conversion « Voraly Pro ». Plan unique : le prix
// réel est affiché par l'embed Whop, jamais codé en dur ici.

export default function ProCard({
  isAuthenticated,
  isPremium,
  onUpgrade,
}: {
  isAuthenticated: boolean
  /** Membre Pro confirmé — affiche l'état calme « déjà membre », sans CTA. */
  isPremium: boolean
  onUpgrade: () => void
}) {
  const t = useTranslations('pricingPage.pro')
  const benefits = t.raw('benefits') as string[]
  return (
    <motion.section
      initial={{ filter: 'blur(6px)', opacity: 0, y: 20 }}
      animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
      exit={{ filter: 'blur(6px)', opacity: 0, y: -20 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl sm:p-12"
    >
      {/* Halo décoratif façon glow-sphere, accordé au rose néon */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(255,102,204,0.14) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      <div className="relative z-10 flex flex-col gap-9">
        {/* ── En-tête ── */}
        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-pink-400">
            {t('eyebrow')}
          </p>
          <h1 className="text-balance text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {t('title')}
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-zinc-400">
            {t('subtitle')}
          </p>
        </div>

        {/* ── Avantages ── */}
        <ul className="flex flex-col gap-3.5">
          {benefits.map((benefit) => (
            <li
              key={benefit}
              className="flex items-start gap-3 text-sm text-zinc-200"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-pink-500/40 bg-pink-500/10">
                <Check size={12} className="text-pink-400" />
              </span>
              {benefit}
            </li>
          ))}
        </ul>

        {/* ── Action ── */}
        <div className="flex flex-col items-center gap-4 pt-1">
          {isPremium ? (
            <>
              <span
                className="inline-flex items-center rounded-full border border-pink-500/40 bg-pink-500/10 px-5 py-2.5 text-sm font-semibold text-pink-300"
                style={{ boxShadow: '0 0 28px rgba(255,102,204,0.25)' }}
              >
                {t('alreadyMember')}
              </span>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-200"
              >
                {t('backToDashboard')} →
              </Link>
            </>
          ) : isAuthenticated ? (
            <motion.button
              type="button"
              onClick={onUpgrade}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              className="group inline-flex items-center gap-3 rounded-full border border-pink-500/40 bg-pink-500/10 px-8 py-4 text-base font-semibold text-pink-100 backdrop-blur-xl transition-colors hover:bg-pink-500/20"
              style={{ boxShadow: '0 0 28px rgba(255,102,204,0.25)' }}
            >
              {t('upgrade')}
              <ArrowRight
                size={18}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </motion.button>
          ) : (
            <Link
              href="/login"
              className="group inline-flex items-center gap-3 rounded-full border border-pink-500/40 bg-pink-500/10 px-8 py-4 text-base font-semibold text-pink-100 backdrop-blur-xl transition-colors hover:bg-pink-500/20 active:scale-95"
              style={{ boxShadow: '0 0 28px rgba(255,102,204,0.25)' }}
            >
              {t('signInToContinue')}
              <ArrowRight
                size={18}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          )}

          {!isPremium && (
            <p className="flex items-center gap-1.5 text-xs text-zinc-500">
              <ShieldCheck size={14} className="shrink-0" />
              {t('billingNote')}
            </p>
          )}
        </div>
      </div>
    </motion.section>
  )
}
