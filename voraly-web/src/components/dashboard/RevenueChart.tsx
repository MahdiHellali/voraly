'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import type { RevenueSeries } from '@/lib/dashboard/types'

type Period = '6M' | '3M' | '1M'

interface RevenueChartProps {
  series: RevenueSeries
}

function normalizeY(value: number, max: number, chartHeight = 160, yTop = 20): number {
  return yTop + chartHeight - (value / max) * chartHeight
}

function buildPath(xs: number[], ys: number[]): string {
  return xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x},${ys[i]}`).join(' ')
}

function buildArea(xs: number[], ys: number[], baseline: number): string {
  const line = buildPath(xs, ys)
  return `${line} L${xs[xs.length - 1]},${baseline} L${xs[0]},${baseline} Z`
}

export default function RevenueChart({ series }: RevenueChartProps) {
  const t = useTranslations('dashboard.revenueChart')
  const [period, setPeriod] = useState<Period>('6M')

  // Détermine les périodes disponibles depuis la série de données
  const allPeriods: Period[] = ['6M', '3M', '1M']

  // Pour chaque période, on prend les N derniers mois de la série
  const periodSlices: Record<Period, number> = { '6M': 6, '3M': 3, '1M': 1 }
  const slice = periodSlices[period]
  const months = series.months.slice(-slice)

  const W = 500
  const xStart = 40
  const xEnd = 480
  const yBaseline = 180
  const n = months.length
  const step = n > 1 ? (xEnd - xStart) / (n - 1) : 0
  const xs = months.map((_, i) => xStart + i * step)

  // Slices par plateforme
  const slicedSeries = series.series.map((s) => ({
    ...s,
    values: s.values.slice(-slice),
  }))

  const allValues = slicedSeries.flatMap((s) => s.values)
  const maxVal = Math.max(...allValues, 1) * 1.1

  const seriesYs = slicedSeries.map((s) =>
    s.values.map((v) => normalizeY(v, maxVal)),
  )

  return (
    <div
      className="glass rounded-2xl p-6 flex flex-col"
      style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-sm font-bold text-zinc-100">{t('title')}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">
            {t('allPlatforms')} · {period}
          </div>
        </div>
        <div className="flex gap-1">
          {allPeriods.map((p) => (
            <motion.button
              key={p}
              onClick={() => setPeriod(p)}
              whileTap={{ scale: 0.92 }}
              whileHover={{ scale: 1.04 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              className={`text-[11px] font-bold px-3 py-1 rounded-lg transition-all duration-200 ${
                period === p
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
              }`}
            >
              {p}
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── SVG Chart ── */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.svg
            key={period}
            viewBox={`0 0 ${W} 200`}
            className="w-full h-full"
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.985 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
          >
            <defs>
              {slicedSeries.map((s) => (
                <linearGradient key={s.platform} id={`g${s.platform}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={s.color} stopOpacity="0.28" />
                  <stop offset="95%" stopColor={s.color} stopOpacity="0" />
                </linearGradient>
              ))}
            </defs>

            {/* Grid lines */}
            {[20, 60, 100, 140, 180].map((y) => (
              <line
                key={y}
                x1={xStart}
                y1={y}
                x2={xEnd}
                y2={y}
                stroke="rgba(255,255,255,0.06)"
                strokeDasharray={y === 180 ? undefined : '3 3'}
              />
            ))}

            {/* Y-axis labels */}
            {[maxVal, maxVal * 0.75, maxVal * 0.5, maxVal * 0.25, 0].map((v, i) => (
              <text
                key={i}
                x={xStart - 8}
                y={[20, 60, 100, 140, 184][i]}
                textAnchor="end"
                fontSize="10"
                fill="rgba(255,255,255,0.25)"
                fontFamily="Inter, sans-serif"
              >
                {Math.round(v)}€
              </text>
            ))}

            {/* X-axis labels */}
            {xs.map((x, i) => (
              <text
                key={i}
                x={x}
                y="198"
                textAnchor="middle"
                fontSize="10"
                fill="rgba(255,255,255,0.3)"
                fontFamily="Inter, sans-serif"
              >
                {months[i]}
              </text>
            ))}

            {/* Area fills */}
            {slicedSeries.map((s, si) => (
              <path
                key={s.platform}
                d={buildArea(xs, seriesYs[si], yBaseline)}
                fill={`url(#g${s.platform})`}
              />
            ))}

            {/* Lines */}
            {slicedSeries.map((s, si) => (
              <path
                key={s.platform}
                d={buildPath(xs, seriesYs[si])}
                fill="none"
                stroke={s.color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}

            {/* Data points */}
            {xs.map((x, i) =>
              slicedSeries.map((s, si) => (
                <circle
                  key={`${s.platform}-${i}`}
                  cx={x}
                  cy={seriesYs[si][i]}
                  r="3.5"
                  fill={s.color}
                  stroke="rgba(255,255,255,0.8)"
                  strokeWidth="1.5"
                  style={{ filter: `drop-shadow(0 0 4px ${s.color}cc)` }}
                />
              )),
            )}
          </motion.svg>
        </AnimatePresence>
      </div>

      {/* ── Legend ── */}
      <div className="flex gap-4 mt-3 flex-wrap">
        {slicedSeries.map((s) => (
          <div key={s.platform} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-[11px] text-zinc-400 capitalize">{s.platform}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
