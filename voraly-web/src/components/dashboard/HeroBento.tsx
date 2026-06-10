'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface HeroBentoProps {
  firstName?: string
}

const quickStats = [
  { label: "Revenus aujourd'hui",    value: '480 €', accent: 'text-emerald-400' },
  { label: 'Nouvelles propositions', value: '12',    accent: 'text-violet-300'  },
  { label: 'Réponses en attente',    value: '3',     accent: 'text-amber-400'   },
]

export default function HeroBento({ firstName = 'Freelance' }: HeroBentoProps) {
  const ringRef = useRef<SVGCircleElement>(null)

  useEffect(() => {
    const score = 92
    const circumference = 2 * Math.PI * 45
    const offset = circumference - (score / 100) * circumference
    if (ringRef.current) ringRef.current.style.strokeDashoffset = String(offset)
  }, [])

  return (
    <div className="pt-2 pb-6">
      {/* ── Greeting ── */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.04 }}
        className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.18em] mb-5"
      >
        Bonjour, {firstName}
      </motion.p>

      {/* ── Hero row: giant number + score ring ── */}
      <div className="flex items-center justify-between gap-8 flex-wrap mb-6">
        {/* Main metric */}
        <div>
          <motion.p
            initial={{ opacity: 0, filter: 'blur(4px)', y: 6 }}
            animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
            className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-2"
          >
            Revenus ce mois
          </motion.p>

          <motion.div
            initial={{ opacity: 0, filter: 'blur(8px)', y: 12 }}
            animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
            className="flex items-baseline gap-2.5"
          >
            <span className="text-[58px] font-black text-white tracking-tight leading-none tabular-nums">
              12&nbsp;450
            </span>
            <span className="text-[26px] font-bold text-zinc-400">€</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.18 }}
            className="flex items-center gap-3 mt-2.5"
          >
            <span className="text-[13px] font-bold text-emerald-400">▲ +14%</span>
            <span className="text-[13px] text-zinc-400">vs. mois dernier</span>
            <span className="text-zinc-800 select-none">·</span>
            <span className="text-[13px] text-zinc-400">3 plateformes actives</span>
          </motion.div>
        </div>

        {/* Score ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, filter: 'blur(6px)' }}
          animate={{ opacity: 1, scale: 1,   filter: 'blur(0px)' }}
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
                  <stop offset="0%"   stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#4338ca" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="7" />
              <circle
                ref={ringRef}
                cx="50" cy="50" r="45"
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
              <span className="text-[25px] font-black text-white leading-none tracking-tight">92</span>
              <span className="text-[9px] text-zinc-400 font-semibold mt-0.5 uppercase tracking-wider">score</span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            ▲ +7% cette sem.
          </span>
        </motion.div>
      </div>

      {/* ── Quick stat chips ── */}
      <div className="flex gap-3 flex-wrap">
        {quickStats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10, scale: 0.93, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0,  scale: 1,    filter: 'blur(0px)' }}
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
              {s.label}
            </div>
            <div className={`text-[22px] font-bold tracking-tight ${s.accent}`}>
              {s.value}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
