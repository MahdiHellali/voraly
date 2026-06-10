'use client'

import { motion } from 'framer-motion'
import HeroBento    from './HeroBento'
import KpiGrid      from './KpiGrid'
import RevenueChart from './RevenueChart'
import DeadlineCard from './DeadlineCard'
import AiTaskCard   from './AiTaskCard'

// PricingCard blur-reveal pattern from inspiration.txt:
// initial: blur(4px) → whileInView: blur(0px)
const blurReveal = (delay = 0) => ({
  initial:    { filter: 'blur(4px)', opacity: 0, y: 18 },
  whileInView: { filter: 'blur(0px)', opacity: 1, y: 0  },
  viewport:   { once: true, margin: '-40px' } as const,
  transition: {
    duration: 0.58,
    ease: [0.22, 1, 0.36, 1] as const,
    delay,
  },
})

export default function DashboardContent({ firstName }: { firstName: string }) {
  return (
    <div className="flex w-full flex-col gap-12 md:gap-16">

      {/* ── HERO — typographic, no card, pure negative space ── */}
      <HeroBento firstName={firstName} />

      {/* ── Divider ── */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent origin-center"
      />

      {/* ── KPI BENTO ── */}
      <motion.div {...blurReveal(0.08)}>
        <KpiGrid />
      </motion.div>

      {/* ── REVENUE + DEADLINES ── */}
      <motion.div
        {...blurReveal(0.12)}
        className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5"
      >
        <RevenueChart />
        <DeadlineCard />
      </motion.div>

      {/* ── AI TASKS ── */}
      <motion.div {...blurReveal(0.08)}>
        <AiTaskCard />
      </motion.div>

    </div>
  )
}
