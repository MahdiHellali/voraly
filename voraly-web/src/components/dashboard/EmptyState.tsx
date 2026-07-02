'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { Puzzle, ArrowRight } from 'lucide-react'
import { LiquidButton } from '@/components/ui/liquid-glass-button'

/**
 * Empty state du dashboard : affiché quand l'utilisateur n'a AUCUNE plateforme
 * connectée. Remplace les cartes de métriques (revenus, KPI) pour lever
 * l'ambiguïté du « 0 $ » (absence de donnée vs vraie donnée à zéro).
 * DA liquid-glass, centré, mobile-friendly. Le CTA renvoie vers la page
 * Plateformes où se fait la connexion (via extension ou OAuth).
 */
export function EmptyState() {
  const t = useTranslations('dashboard.emptyState')

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="glass relative flex min-h-[340px] items-center justify-center overflow-hidden rounded-3xl px-6 py-16 text-center sm:px-10"
      style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
    >
      {/* Lueur de fond violet/indigo */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.22), transparent 70%)' }}
      />
      {/* Grille pointillée */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(circle_at_center,black,transparent_75%)] bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.07)_1px,transparent_1px)] bg-[length:7px_7px]"
      />

      <div className="relative flex max-w-md flex-col items-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.08] bg-gradient-to-br from-violet-500/15 to-indigo-500/10"
          style={{ boxShadow: '0 0 32px rgba(139,92,246,0.35)' }}
        >
          <Puzzle className="h-7 w-7 text-violet-300" />
        </motion.div>

        <h3 className="mt-6 text-[21px] font-bold tracking-tight text-white">
          {t('title')}
        </h3>
        <p className="mt-2.5 text-[14px] leading-relaxed text-zinc-400">
          {t('body')}
        </p>

        <Link href="/dashboard/platforms" className="mt-7 inline-block">
          <LiquidButton size="lg" className="group/liquid text-[13px] font-semibold text-zinc-100">
            <span className="flex items-center justify-center gap-2">
              {t('connect')}
              <ArrowRight
                size={14}
                className="text-violet-300 transition-transform duration-200 group-hover/liquid:translate-x-0.5"
              />
            </span>
          </LiquidButton>
        </Link>
      </div>
    </motion.div>
  )
}
