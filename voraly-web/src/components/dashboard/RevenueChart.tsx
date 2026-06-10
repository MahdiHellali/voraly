'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Period = '6M' | '3M' | '1M'

const DATA: Record<Period, { months: string[]; upwork: number[]; fiverr: number[]; malt: number[] }> = {
  '6M': {
    months: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
    upwork: [4100, 4300, 3900, 4800, 5000, 5120],
    malt:   [3200, 3500, 3300, 3800, 4000, 4120],
    fiverr: [2100, 2400, 2200, 2900, 3100, 3210],
  },
  '3M': {
    months: ['Avr', 'Mai', 'Juin'],
    upwork: [4800, 5000, 5120],
    malt:   [3800, 4000, 4120],
    fiverr: [2900, 3100, 3210],
  },
  '1M': {
    months: ['S1', 'S2', 'S3', 'S4'],
    upwork: [1200, 1300, 1250, 1370],
    malt:   [980, 1050, 1010, 1080],
    fiverr: [750, 850, 780, 830],
  },
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

export default function RevenueChart() {
  const [period, setPeriod] = useState<Period>('6M')
  const data = DATA[period]

  const W = 500
  const xStart = 40
  const xEnd = 480
  const yBaseline = 180
  const n = data.months.length
  const step = (xEnd - xStart) / (n - 1)
  const xs = data.months.map((_, i) => xStart + i * step)
  const allValues = [...data.upwork, ...data.fiverr, ...data.malt]
  const maxVal = Math.max(...allValues) * 1.1

  const upworkYs = data.upwork.map((v) => normalizeY(v, maxVal))
  const fiverrYs  = data.fiverr.map((v) => normalizeY(v, maxVal))
  const maltYs    = data.malt.map((v) => normalizeY(v, maxVal))

  return (
    <div
      className="glass rounded-2xl p-6 flex flex-col"
      style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-sm font-bold text-zinc-100">Évolution des Revenus</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">Toutes plateformes · {period}</div>
        </div>
        <div className="flex gap-1">
          {(['6M', '3M', '1M'] as Period[]).map((p) => (
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

      {/* ── SVG Chart — fades when period changes ── */}
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
              <linearGradient id="gUpwork" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6366f1" stopOpacity="0.30" />
                <stop offset="95%" stopColor="#6366f1" stopOpacity="0"    />
              </linearGradient>
              <linearGradient id="gMalt" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f97316" stopOpacity="0.22" />
                <stop offset="95%" stopColor="#f97316" stopOpacity="0"    />
              </linearGradient>
              <linearGradient id="gFiverr" x1="0" y1="0" x2="0" y2="22">
                <stop offset="5%"  stopColor="#8b5cf6" stopOpacity="0.22" />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity="0"    />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[20, 60, 100, 140, 180].map((y) => (
              <line
                key={y}
                x1={xStart} y1={y} x2={xEnd} y2={y}
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
                {data.months[i]}
              </text>
            ))}

            {/* Area fills */}
            <path d={buildArea(xs, upworkYs, yBaseline)} fill="url(#gUpwork)" />
            <path d={buildArea(xs, maltYs,    yBaseline)} fill="url(#gMalt)"    />
            <path d={buildArea(xs, fiverrYs,  yBaseline)} fill="url(#gFiverr)"  />

            {/* Lines */}
            <path d={buildPath(xs, upworkYs)} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d={buildPath(xs, maltYs)}    fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d={buildPath(xs, fiverrYs)}  fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

            {/* Data points */}
            {xs.map((x, i) => (
              <g key={i}>
                <circle cx={x} cy={upworkYs[i]} r="3.5" fill="#6366f1" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" style={{ filter: 'drop-shadow(0 0 4px rgba(99,102,241,0.8))' }} />
                <circle cx={x} cy={maltYs[i]}    r="3.5" fill="#f97316" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" style={{ filter: 'drop-shadow(0 0 4px rgba(249,115,22,0.8))' }} />
                <circle cx={x} cy={fiverrYs[i]}  r="3.5" fill="#8b5cf6" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" style={{ filter: 'drop-shadow(0 0 4px rgba(139,92,246,0.8))' }} />
              </g>
            ))}
          </motion.svg>
        </AnimatePresence>
      </div>

      {/* ── Legend ── */}
      <div className="flex gap-4 mt-3">
        {[
          { label: 'Upwork', color: '#6366f1' },
          { label: 'Malt',    color: '#f97316' },
          { label: 'Fiverr',  color: '#8b5cf6' },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: l.color }} />
            <span className="text-[11px] text-zinc-400">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
