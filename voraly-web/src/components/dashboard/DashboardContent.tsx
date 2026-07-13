'use client'

import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import HeroBento    from './HeroBento'
import KpiGrid      from './KpiGrid'
import RevenueChart from './RevenueChart'
import AiTaskCard   from './AiTaskCard'
import type { DashboardData } from '@/lib/dashboard/types'
import { useLiveConnectionCount } from './useLiveConnectionCount'

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
  deadlineSlot?: ReactNode
}

export default function DashboardContent({ firstName, data, userId, deadlineSlot }: DashboardContentProps) {
  const { connectedPlatformsCount, revenue, chips, score, kpiItems, revenueSeries, todos, roadmapGeneratedLabel } = data
  const extCount = useLiveConnectionCount()
  // Source de vérité = max(DB, extension locale) pour ne jamais afficher 0 si l'extension rapporte des connexions
  const liveCount = Math.max(connectedPlatformsCount, extCount)

  return (
    <div className="flex w-full flex-col gap-12 md:gap-16">

      {/* ── HERO ── */}
      <HeroBento
        firstName={firstName}
        connectedPlatformsCount={liveCount}
        revenue={revenue}
        score={score}
        chips={chips}
        showConnectCta={liveCount === 0}
      />

      {/* ── Divider ── */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent origin-center"
      />

      {/* ── KPI BENTO — affiché seulement s'il y a des données ── */}
      {kpiItems && kpiItems.length > 0 && (
        <motion.div {...blurReveal(0.08)}>
          <KpiGrid items={kpiItems} />
        </motion.div>
      )}

      {/* ── REVENUE + DEADLINES ── */}
      {revenueSeries ? (
        <motion.div
          {...blurReveal(0.12)}
          className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5"
        >
          <div className="hidden md:block">
            <RevenueChart series={revenueSeries} />
          </div>
          {deadlineSlot}
        </motion.div>
      ) : (
        <motion.div {...blurReveal(0.12)}>
          {deadlineSlot}
        </motion.div>
      )}

      {/* ── AI TASKS — caché sur mobile ── */}
      <div className="hidden md:block">
        <motion.div {...blurReveal(0.08)}>
          <AiTaskCard
            tasks={todos}
            generatedLabel={roadmapGeneratedLabel}
            userId={userId}
          />
        </motion.div>
      </div>

    </div>
  )
}
