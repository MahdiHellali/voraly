'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { CalendarClock, CalendarDays, FileText, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Deadline, IntegrationsState } from '@/lib/dashboard/types'

type Urgency = 'red' | 'orange' | 'green'

const urgencyConfig: Record<Urgency, { bg: string; dot: string; bar: string; time: string }> = {
  red:    { bg: 'bg-rose-500/5',    dot: 'bg-rose-500',    bar: 'bg-rose-500',    time: 'text-rose-400'    },
  orange: { bg: 'bg-orange-500/5',  dot: 'bg-orange-500',  bar: 'bg-orange-500',  time: 'text-orange-400'  },
  green:  { bg: 'bg-emerald-500/5', dot: 'bg-emerald-400', bar: 'bg-emerald-400', time: 'text-emerald-400' },
}

function computeUrgency(dueAt: string): Urgency {
  const msLeft = new Date(dueAt).getTime() - Date.now()
  const hoursLeft = msLeft / (1000 * 60 * 60)
  if (hoursLeft <= 24) return 'red'
  if (hoursLeft <= 48) return 'orange'
  return 'green'
}

function computeTimeLeft(dueAt: string): string {
  const msLeft = new Date(dueAt).getTime() - Date.now()
  if (msLeft <= 0) return 'Expiré'
  const h = Math.floor(msLeft / (1000 * 60 * 60))
  const m = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60))
  if (h >= 48) return `${Math.floor(h / 24)}j ${h % 24}h`
  return `${h}h ${m.toString().padStart(2, '0')}m`
}

function ConnectorButton({
  label,
  icon,
  state,
  href,
}: {
  label: string
  icon: React.ReactNode
  state: 'connect' | 'soon' | 'connected'
  href: string
}) {
  const isSoon = state === 'soon'
  const isConnected = state === 'connected'

  const content = (
    <span className="flex w-full items-center gap-2.5">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.05]">
        {icon}
      </span>
      <span className="text-[12.5px] font-semibold text-zinc-200">{label}</span>
      <span className="ml-auto text-[10px] font-bold">
        {isConnected ? (
          <span className="inline-flex items-center gap-1 text-emerald-400">Connecté</span>
        ) : isSoon ? (
          <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 uppercase tracking-wide text-zinc-500">
            Bientôt
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-violet-300">
            Connecter <ArrowRight size={12} />
          </span>
        )}
      </span>
    </span>
  )

  const base =
    'group flex items-center rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 backdrop-blur-xl transition-all duration-200'

  if (isSoon || isConnected) {
    return (
      <div
        className={cn(base, 'cursor-default', isSoon && 'opacity-70')}
        aria-disabled={isSoon}
      >
        {content}
      </div>
    )
  }

  return (
    <Link
      href={href}
      className={cn(
        base,
        'hover:-translate-y-0.5 hover:border-white/[0.16] hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50',
      )}
    >
      {content}
    </Link>
  )
}

interface DeadlineCardProps {
  deadlines?: Deadline[] | null
  integrations?: Pick<IntegrationsState, 'googleCalendar' | 'notion'>
}

export default function DeadlineCard({ deadlines, integrations }: DeadlineCardProps) {
  const hasDeadlines = !!deadlines && deadlines.length > 0

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
        {hasDeadlines && (
          <span className="text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/25 px-2.5 py-1 rounded-full">
            {deadlines.filter((d) => computeUrgency(d.dueAt) === 'red').length} urgents
          </span>
        )}
      </div>

      {hasDeadlines ? (
        /* ── Liste des deadlines ── */
        <div className="flex flex-col gap-2">
          {deadlines.map((d, index) => {
            const urgency = computeUrgency(d.dueAt)
            const timeLeft = computeTimeLeft(d.dueAt)
            const cfg = urgencyConfig[urgency]

            return (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.35,
                  delay: 0.1 + index * 0.07,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={{ x: 2, transition: { duration: 0.15 } }}
                className={cn('flex items-center gap-3 rounded-xl px-3 py-3', cfg.bg)}
              >
                {/* Dot urgence */}
                <motion.div
                  className={cn('w-2 h-2 rounded-full flex-shrink-0', cfg.dot)}
                  animate={urgency === 'red' ? { scale: [1, 1.4, 1] } : {}}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold text-zinc-200 truncate">{d.title}</div>
                  {d.client && (
                    <div className="text-[10px] text-zinc-500 truncate mt-0.5">{d.client}</div>
                  )}
                  {/* Barre de progression */}
                  <div className="mt-1.5 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className={cn('h-full rounded-full', cfg.bar)}
                      initial={{ width: 0 }}
                      animate={{ width: `${d.progress}%` }}
                      transition={{
                        duration: 1.0,
                        delay: 0.3 + index * 0.07,
                        ease: [0.34, 1.56, 0.64, 1],
                      }}
                    />
                  </div>
                </div>

                {/* Source + temps restant */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-zinc-400 capitalize">
                    {d.source === 'google_calendar' ? 'Calendar' : 'Notion'}
                  </span>
                  <span className={cn('text-[10px] font-bold', cfg.time)}>⏱ {timeLeft}</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      ) : (
        /* ── Empty state — connecter Calendar / Notion ── */
        <motion.div
          initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
          className="relative flex flex-1 flex-col items-center justify-center text-center py-8"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-6 h-40 w-40 -translate-x-1/2 rounded-full blur-3xl"
            style={{
              background: 'radial-gradient(circle, rgba(99,102,241,0.18), transparent 70%)',
            }}
          />
          <div
            className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.05]"
            style={{ boxShadow: '0 0 22px rgba(99,102,241,0.3)' }}
          >
            <CalendarClock className="h-5 w-5 text-indigo-300" />
          </div>
          <p className="relative mt-4 max-w-[260px] text-[13px] leading-relaxed text-zinc-400">
            Connectez Google Calendar ou Notion pour voir vos livraisons imminentes.
          </p>
          <div className="relative mt-5 flex w-full max-w-[280px] flex-col gap-2">
            <ConnectorButton
              label="Google Calendar"
              icon={<CalendarDays size={15} className="text-indigo-300" />}
              state={integrations?.googleCalendar ?? 'soon'}
              href="/dashboard/integrations/google-calendar"
            />
            <ConnectorButton
              label="Notion"
              icon={<FileText size={15} className="text-zinc-300" />}
              state={integrations?.notion ?? 'soon'}
              href="/dashboard/integrations/notion"
            />
          </div>
        </motion.div>
      )}
    </div>
  )
}
