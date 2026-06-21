'use client'

import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { Compass, ArrowRight } from 'lucide-react'

// Phase 'empty' — a clean, minimal canvas with a single high-end floating CTA.
export default function EmptyState({
  onStart,
  regenerate = false,
}: {
  onStart: () => void
  /** When a roadmap already exists, the copy invites a fresh diagnostic. */
  regenerate?: boolean
}) {
  const t = useTranslations('roadmap.empty')
  return (
    <motion.div
      initial={{ filter: 'blur(6px)', opacity: 0, y: 20 }}
      animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
      exit={{ filter: 'blur(6px)', opacity: 0, y: -20 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="flex min-h-[52vh] w-full flex-col items-center justify-center gap-8 text-center"
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-3xl border border-pink-500/30 bg-pink-500/10"
          style={{ boxShadow: '0 0 30px rgba(255,102,204,0.25)' }}
        >
          <Compass size={28} className="text-pink-400" />
        </div>
        <h2 className="max-w-md text-balance text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {regenerate ? t('titleRegenerate') : t('title')}
        </h2>
        <p className="max-w-sm text-sm leading-relaxed text-zinc-400">
          {regenerate ? t('subtitleRegenerate') : t('subtitle')}
        </p>
      </div>

      <motion.button
        onClick={onStart}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        className="group inline-flex items-center gap-3 rounded-full border border-pink-500/40 bg-pink-500/10 px-8 py-4 text-base font-semibold text-pink-100 backdrop-blur-xl transition-colors hover:bg-pink-500/20"
        style={{ boxShadow: '0 0 28px rgba(255,102,204,0.25)' }}
      >
        {regenerate ? t('ctaRegenerate') : t('cta')}
        <ArrowRight
          size={18}
          className="transition-transform duration-300 group-hover:translate-x-1"
        />
      </motion.button>
    </motion.div>
  )
}
