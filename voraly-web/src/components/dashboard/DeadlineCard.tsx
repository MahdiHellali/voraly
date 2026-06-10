'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

type Urgency = 'red' | 'orange' | 'green'
type Platform = 'Upwork' | 'Fiverr' | 'Malt'

interface Deadline {
  id: string
  project: string
  client: string
  platform: Platform
  timeLeft: string
  progress: number
  urgency: Urgency
}

const deadlines: Deadline[] = [
  { id: '1', project: 'Intégration API Stripe',  client: 'TechStart SAS', platform: 'Upwork', timeLeft: '11h 20m', progress: 92, urgency: 'red'    },
  { id: '2', project: 'Refonte UI E-commerce',   client: 'NovaMobile',   platform: 'Fiverr', timeLeft: '23h 05m', progress: 75, urgency: 'red'    },
  { id: '3', project: 'Audit SEO complet',       client: 'DataVision',   platform: 'Malt',   timeLeft: '38h 00m', progress: 48, urgency: 'orange' },
  { id: '4', project: 'Optimisation de Base',    client: 'CloudPulse',   platform: 'Upwork', timeLeft: '72h 00m', progress: 8,  urgency: 'green'  },
]

const urgencyConfig: Record<Urgency, { bg: string; dot: string; bar: string; time: string }> = {
  red:    { bg: 'bg-rose-500/5',    dot: 'bg-rose-500',    bar: 'bg-rose-500',    time: 'text-rose-400'    },
  orange: { bg: 'bg-orange-500/5',  dot: 'bg-orange-500',  bar: 'bg-orange-500',  time: 'text-orange-400'  },
  green:  { bg: 'bg-emerald-500/5', dot: 'bg-emerald-400', bar: 'bg-emerald-400', time: 'text-emerald-400' },
}

const platformColors: Record<Platform, string> = {
  Upwork: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/25',
  Fiverr: 'bg-violet-500/15 text-violet-300 border-violet-500/25',
  Malt:   'bg-orange-500/15 text-orange-300 border-orange-500/25',
}

export default function DeadlineCard() {
  const urgentCount = deadlines.filter((d) => d.urgency === 'red').length

  return (
    <div
      className="glass rounded-2xl p-6 flex flex-col"
      style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-sm font-bold text-zinc-100">⚡ Urgences &amp; Deadlines</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">Livraisons imminentes</div>
        </div>
        <span className="text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/25 px-2.5 py-1 rounded-full">
          {urgentCount} urgents
        </span>
      </div>

      {/* ── List ── */}
      <div className="flex flex-col gap-2">
        {deadlines.map((d, index) => {
          const cfg = urgencyConfig[d.urgency]
          return (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: 0.1 + index * 0.07, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ x: 2, transition: { duration: 0.15 } }}
              className={cn('flex items-center gap-3 rounded-xl px-3 py-3', cfg.bg)}
            >
              {/* Urgency dot */}
              <motion.div
                className={cn('w-2 h-2 rounded-full flex-shrink-0', cfg.dot)}
                animate={d.urgency === 'red' ? { scale: [1, 1.4, 1] } : {}}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-semibold text-zinc-200 truncate">{d.project}</div>
                <div className="text-[10px] text-zinc-500 truncate mt-0.5">{d.client}</div>
                {/* Progress bar */}
                <div className="mt-1.5 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className={cn('h-full rounded-full', cfg.bar)}
                    initial={{ width: 0 }}
                    animate={{ width: `${d.progress}%` }}
                    transition={{ duration: 1.0, delay: 0.3 + index * 0.07, ease: [0.34, 1.56, 0.64, 1] }}
                  />
                </div>
              </div>

              {/* Right: platform + time */}
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-full border', platformColors[d.platform])}>
                  {d.platform}
                </span>
                <span className={cn('text-[10px] font-bold', cfg.time)}>⏱ {d.timeLeft}</span>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
