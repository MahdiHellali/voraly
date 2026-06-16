'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'

type Period = '7d' | '30d' | '90d'

interface StatsData {
  period: string
  totalPageViews: number
  uniqueVisitors: number
  topPages: { page_url: string; count: number }[]
  eventsByType: { event_type: string; count: number }[]
  dailyViews: { date: string; count: number }[]
  signups: number
  premiumConversions: number
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

const card = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
          >
            <div className="mb-2 h-3 w-20 rounded bg-white/10" />
            <div className="h-8 w-28 rounded bg-white/10" />
          </div>
        ))}
      </div>
      <div className="animate-pulse rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="mb-4 h-4 w-40 rounded bg-white/10" />
        <div className="flex items-end gap-2" style={{ height: 140 }}>
          {[40, 65, 50, 80, 55, 70, 45, 90, 60, 75, 50, 85, 65, 45].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-white/10"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function KpiCard({
  label,
  value,
  icon,
}: {
  label: string
  value: number | string
  icon: string
}) {
  return (
    <motion.div
      variants={card}
      className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
    >
      <p className="mb-1 text-sm text-white/50">{label}</p>
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <span className="text-3xl font-bold tabular-nums text-[#FF66CC]">
          {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
        </span>
      </div>
    </motion.div>
  )
}

function DailyChart({ dailyViews }: { dailyViews: { date: string; count: number }[] }) {
  if (dailyViews.length === 0) return null

  const maxCount = Math.max(...dailyViews.map((d) => d.count), 1)
  const barWidth = 24
  const gap = 6
  const width = dailyViews.length * (barWidth + gap) + gap
  const height = 160

  return (
    <motion.div
      variants={card}
      className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
    >
      <h3 className="mb-4 text-sm font-semibold text-white/70">
        Pages vues par jour
      </h3>
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity={0.4} />
          </linearGradient>
        </defs>
        {dailyViews.map((d, i) => {
          const barHeight = (d.count / maxCount) * (height - 30)
          const x = gap + i * (barWidth + gap)
          const y = height - 10 - barHeight
          return (
            <g key={d.date}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill="url(#barGrad)"
                rx={4}
              />
              <text
                x={x + barWidth / 2}
                y={height - 2}
                textAnchor="middle"
                className="fill-white/40 text-[9px]"
              >
                {d.date.slice(5)}
              </text>
            </g>
          )
        })}
      </svg>
    </motion.div>
  )
}

function TopPages({ topPages }: { topPages: { page_url: string; count: number }[] }) {
  const maxCount = Math.max(...topPages.map((p) => p.count), 1)

  return (
    <motion.div
      variants={card}
      className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
    >
      <h3 className="mb-4 text-sm font-semibold text-white/70">
        Pages les plus visitées
      </h3>
      {topPages.length === 0 ? (
        <p className="text-sm text-white/30">Aucune donnée analytics</p>
      ) : (
        <div className="space-y-2">
          {topPages.map((p, i) => {
            const pct = (p.count / maxCount) * 100
            return (
              <div key={p.page_url} className="flex items-center gap-3">
                <span className="w-5 text-right text-xs text-white/40">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate text-white/80">{p.page_url}</span>
                    <span className="ml-2 tabular-nums text-white/50">{p.count}</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#FF66CC]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}

function EventsBreakdown({ eventsByType }: { eventsByType: { event_type: string; count: number }[] }) {
  const total = eventsByType.reduce((s, e) => s + e.count, 0)
  if (eventsByType.length === 0) return null

  const colors = ['#8b5cf6', '#6366f1', '#FF66CC', '#10b981', '#f59e0b']
  const slices = eventsByType.map((e, i) => {
    const pct = total > 0 ? Math.round((e.count / total) * 100) : 0
    return { ...e, color: colors[i % colors.length], pct }
  })

  return (
    <motion.div
      variants={card}
      className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
    >
      <h3 className="mb-4 text-sm font-semibold text-white/70">
        Répartition par événement
      </h3>
      <div className="space-y-2">
        {slices.map((s) => (
          <div key={s.event_type} className="flex items-center gap-3">
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="flex-1 text-sm capitalize text-white/70">
              {s.event_type.replace(/_/g, ' ')}
            </span>
            <span className="text-sm tabular-nums text-white/50">{s.count}</span>
            <span className="w-10 text-right text-xs text-white/30">{s.pct}%</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState<Period>('7d')
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const doFetch = useCallback(() => {
    let cancelled = false
    fetch(`/api/analytics/stats?period=${period}`)
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then((data) => {
        if (!cancelled) {
          setStats(data)
          setLoading(false)
          setError(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true)
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [period])

  useEffect(() => {
    const cleanup = doFetch()
    return cleanup
  }, [doFetch])

  const isEmpty = stats && stats.totalPageViews === 0 && stats.uniqueVisitors === 0 && stats.signups === 0

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="mt-1 text-sm text-white/50">
            Statistiques d&apos;utilisation de Voraly
          </p>
        </div>
        <div className="flex gap-1 rounded-full bg-white/5 p-1">
          {(['7d', '30d', '90d'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                period === p
                  ? 'bg-[#8b5cf6] text-white'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading && !stats ? (
        <LoadingSkeleton />
      ) : error ? (
        <div className="flex items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-12 backdrop-blur-xl">
          <p className="text-white/40">Erreur lors du chargement des statistiques</p>
        </div>
      ) : isEmpty ? (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-12 backdrop-blur-xl"
        >
          <p className="text-white/40">Aucune donnée analytics</p>
        </motion.div>
      ) : stats ? (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <KpiCard label="Pages vues" value={stats.totalPageViews} icon="👁️" />
            <KpiCard label="Visiteurs uniques" value={stats.uniqueVisitors} icon="👤" />
            <KpiCard label="Inscriptions" value={stats.signups} icon="✍️" />
            <KpiCard label="Conversions Premium" value={stats.premiumConversions} icon="⭐" />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <DailyChart dailyViews={stats.dailyViews} />
            </div>
            <TopPages topPages={stats.topPages} />
            <EventsBreakdown eventsByType={stats.eventsByType} />
          </div>
        </motion.div>
      ) : null}
    </div>
  )
}