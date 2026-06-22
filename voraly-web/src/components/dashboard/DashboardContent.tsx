'use client'

import { motion } from 'framer-motion'
import HeroBento    from './HeroBento'
import KpiGrid      from './KpiGrid'
import RevenueChart from './RevenueChart'
import DeadlineCard from './DeadlineCard'
import AiTaskCard   from './AiTaskCard'
import type { DashboardData } from '@/lib/dashboard/types'

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

interface DashboardContentProps {
  firstName: string
  data: DashboardData
  userId?: string | null
}

export default function DashboardContent({ firstName, data, userId }: DashboardContentProps) {
  const hasMetrics = !!data.revenueSeries

  return (
    <div className="flex w-full flex-col gap-12 md:gap-16">

      {/* ── HERO ── */}
      <HeroBento
        firstName={firstName}
        connectedPlatformsCount={data.connectedPlatformsCount}
        revenue={data.revenue}
        score={data.score}
        chips={data.chips}
      />

      {/* ── Divider ── */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent origin-center"
      />

      {/* ── KPI BENTO ou empty state ── */}
      <motion.div {...blurReveal(0.08)}>
        <KpiGrid items={data.kpiItems} />
      </motion.div>

      {/* ── REVENUE + DEADLINES ── */}
      {hasMetrics ? (
        /* Grille deux colonnes : graphique + deadlines */
        <motion.div
          {...blurReveal(0.12)}
          className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5"
        >
          <RevenueChart series={data.revenueSeries!} />
          <DeadlineCard
            deadlines={data.deadlines}
            integrations={data.integrations}
          />
        </motion.div>
      ) : (
        /* Pas de métriques → DeadlineCard pleine largeur, RevenueChart non monté */
        <motion.div {...blurReveal(0.12)}>
          <DeadlineCard
            deadlines={data.deadlines}
            integrations={data.integrations}
          />
        </motion.div>
      )}

      {/* ── AI TASKS ── */}
      <motion.div {...blurReveal(0.08)}>
        <AiTaskCard
          tasks={data.todos}
          generatedLabel={data.roadmapGeneratedLabel}
          userId={userId}
        />
      </motion.div>

    </div>
  )
}
