'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Wallet, ArrowRight } from 'lucide-react'
import { LiquidButton } from '@/components/ui/liquid-glass-button'

export function KpiEmptyState({ className }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`glass relative overflow-hidden rounded-2xl px-8 py-12 text-center ${className ?? ''}`}
      style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
    >
      {/* Lueur de fond violet */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.22), transparent 70%)' }}
      />
      {/* Grille pointillée */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(circle_at_center,black,transparent_75%)] bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.07)_1px,transparent_1px)] bg-[length:7px_7px]"
      />

      <div className="relative flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.05]"
          style={{ boxShadow: '0 0 28px rgba(139,92,246,0.35)' }}
        >
          <Wallet className="h-6 w-6 text-violet-300" />
        </motion.div>

        <h3 className="mt-5 text-[19px] font-bold tracking-tight text-white">
          Vos revenus apparaîtront ici
        </h3>
        <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-zinc-400">
          Connectez vos plateformes (Upwork, Fiverr, Malt, LinkedIn) pour suivre revenus,
          commandes et conversion en temps réel.
        </p>

        <Link href="/dashboard/platforms" className="mt-6 inline-block">
          <LiquidButton size="lg" className="group/liquid text-[13px] font-semibold text-zinc-100">
            <span className="flex items-center justify-center gap-2">
              Connecter une plateforme
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
