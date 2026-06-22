'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Plug, TrendingUp, BarChart3, Zap } from 'lucide-react'

const FEATURE_HINTS = [
  { icon: TrendingUp, label: 'Revenus en temps réel' },
  { icon: BarChart3, label: 'KPIs toutes plateformes' },
  { icon: Zap, label: 'Roadmap IA personnalisée' },
]

export default function DashboardEmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      className="glass relative overflow-hidden rounded-3xl px-8 py-16 flex flex-col items-center text-center"
      style={{ boxShadow: '0 8px 48px rgba(0,0,0,0.35)' }}
    >
      {/* Fond ambiant */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 -translate-y-1/3 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.18), transparent 70%)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 bottom-0 h-64 w-64 translate-x-1/3 translate-y-1/3 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12), transparent 70%)' }}
      />

      {/* Grille pointillée */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_80%)] bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.07)_1px,transparent_1px)] bg-[length:8px_8px]"
      />

      {/* Illustration SVG — dashboard schématique */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        className="relative mb-8"
      >
        <svg
          width="220"
          height="140"
          viewBox="0 0 220 140"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          {/* Cadre principal */}
          <rect x="8" y="8" width="204" height="124" rx="14" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" strokeWidth="1.2" />

          {/* Barre supérieure */}
          <rect x="20" y="20" width="60" height="8" rx="4" fill="rgba(139,92,246,0.25)" />
          <rect x="86" y="20" width="40" height="8" rx="4" fill="rgba(255,255,255,0.06)" />

          {/* KPI boxes */}
          <rect x="20" y="36" width="52" height="36" rx="8" fill="rgba(139,92,246,0.12)" stroke="rgba(139,92,246,0.2)" strokeWidth="1" />
          <rect x="78" y="36" width="52" height="36" rx="8" fill="rgba(99,102,241,0.10)" stroke="rgba(99,102,241,0.18)" strokeWidth="1" />
          <rect x="136" y="36" width="52" height="36" rx="8" fill="rgba(255,102,204,0.08)" stroke="rgba(255,102,204,0.15)" strokeWidth="1" />

          {/* Lignes KPI — vides, stylisées */}
          <rect x="28" y="45" width="24" height="4" rx="2" fill="rgba(139,92,246,0.35)" />
          <rect x="28" y="53" width="36" height="3" rx="1.5" fill="rgba(255,255,255,0.08)" />
          <rect x="86" y="45" width="24" height="4" rx="2" fill="rgba(99,102,241,0.35)" />
          <rect x="86" y="53" width="36" height="3" rx="1.5" fill="rgba(255,255,255,0.08)" />
          <rect x="144" y="45" width="24" height="4" rx="2" fill="rgba(255,102,204,0.3)" />
          <rect x="144" y="53" width="36" height="3" rx="1.5" fill="rgba(255,255,255,0.08)" />

          {/* Zone graphique vide avec ligne ondulée */}
          <rect x="20" y="80" width="120" height="44" rx="8" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          {/* Ligne de graphique stylisée */}
          <path
            d="M28 112 C44 100 56 108 72 98 C88 88 100 96 116 90 C128 86 132 88 132 90"
            stroke="rgba(139,92,246,0.4)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="3 3"
            fill="none"
          />
          {/* Zone remplie sous la ligne */}
          <path
            d="M28 112 C44 100 56 108 72 98 C88 88 100 96 116 90 C128 86 132 88 132 90 L132 116 L28 116 Z"
            fill="rgba(139,92,246,0.06)"
          />

          {/* Carte latérale */}
          <rect x="148" y="80" width="52" height="44" rx="8" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          <rect x="156" y="90" width="36" height="3" rx="1.5" fill="rgba(255,255,255,0.08)" />
          <rect x="156" y="98" width="28" height="3" rx="1.5" fill="rgba(255,255,255,0.05)" />
          <rect x="156" y="106" width="32" height="3" rx="1.5" fill="rgba(255,255,255,0.05)" />

          {/* Icône centrale pulsante */}
          <circle cx="110" cy="96" r="6" fill="rgba(139,92,246,0.15)" stroke="rgba(139,92,246,0.4)" strokeWidth="1" />
          <circle cx="110" cy="96" r="2.5" fill="rgba(139,92,246,0.6)" />
        </svg>

        {/* Halo pulsant */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-3xl"
          style={{ boxShadow: '0 0 40px rgba(139,92,246,0.2)' }}
          aria-hidden
        />
      </motion.div>

      {/* Texte principal */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        className="relative max-w-lg"
      >
        <h2 className="text-[22px] sm:text-[26px] font-black text-white tracking-tight leading-[1.2] mb-3">
          Votre tour de contrôle est prête.
        </h2>
        <p className="text-[14px] text-zinc-400 leading-relaxed">
          Connectez votre premier canal ou importez vos revenus pour voir vos indicateurs s&apos;animer.
        </p>
      </motion.div>

      {/* Feature hints */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        className="relative flex gap-3 mt-6 flex-wrap justify-center"
      >
        {FEATURE_HINTS.map(({ icon: Icon, label }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, delay: 0.35 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.04] px-3.5 py-2"
          >
            <Icon size={13} className="text-violet-400" />
            <span className="text-[12px] text-zinc-400 font-medium">{label}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.42 }}
        className="relative mt-8"
      >
        <Link
          href="/dashboard/platforms"
          className="group inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-[14px] font-bold text-white shadow-lg transition-all duration-200 hover:from-violet-500 hover:to-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60"
          style={{ boxShadow: '0 0 32px rgba(139,92,246,0.4), 0 4px 16px rgba(0,0,0,0.3)' }}
        >
          <Plug size={15} />
          Connecter ma première plateforme
          <ArrowRight
            size={14}
            className="transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </Link>
      </motion.div>
    </motion.div>
  )
}
