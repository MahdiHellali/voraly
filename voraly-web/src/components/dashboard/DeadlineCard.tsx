'use client'

import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import { CalendarClock, CalendarDays, FileText, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AgendaEvent, IntegrationsState } from '@/lib/dashboard/types'

type DeadlineT = ReturnType<typeof useTranslations>

function SourceBadge({ source, t }: { source: AgendaEvent['source']; t: DeadlineT }) {
  const isG = source === 'google_calendar'
  return (
    <span className={cn(
      'inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[8px] font-bold',
      isG ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300' : 'border-zinc-500/30 bg-white/[0.05] text-zinc-300',
    )}>
      {isG ? <CalendarDays size={9} /> : <FileText size={9} />}
      {isG ? t('sourceCalendar') : t('sourceNotion')}
    </span>
  )
}

function ConnectorButton({ label, icon, state, href, t }: {
  label: string; icon: React.ReactNode; state: 'connect' | 'soon' | 'connected'; href: string; t: DeadlineT
}) {
  const content = (
    <span className="flex w-full items-center gap-2.5">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.05]">{icon}</span>
      <span className="text-[12.5px] font-semibold text-zinc-200">{label}</span>
      <span className="ml-auto text-[10px] font-bold">
        {state === 'connected' ? (
          <span className="inline-flex items-center gap-1 text-emerald-400">{t('connected')}</span>
        ) : state === 'soon' ? (
          <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 uppercase tracking-wide text-zinc-500">{t('soon')}</span>
        ) : (
          <span className="inline-flex items-center gap-1 text-violet-300">{t('connect')} <ArrowRight size={12} /></span>
        )}
      </span>
    </span>
  )
  const base = 'group flex items-center rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 backdrop-blur-xl transition-all duration-200'
  if (state === 'soon' || state === 'connected')
    return <div className={cn(base, 'cursor-default', state === 'soon' && 'opacity-70')} aria-disabled={state === 'soon'}>{content}</div>
  return <Link href={href} className={cn(base, 'hover:-translate-y-0.5 hover:border-white/[0.16] hover:bg-white/[0.05]')}>{content}</Link>
}

interface DeadlineCardProps {
  agenda?: AgendaEvent[] | null
  integrations?: Pick<IntegrationsState, 'googleCalendar' | 'notion'>
}

export default function DeadlineCard({ agenda, integrations }: DeadlineCardProps) {
  const t = useTranslations('dashboard.deadlines')
  const locale = useLocale()
  const events = agenda ?? []
  const connected = integrations?.googleCalendar === 'connected' || integrations?.notion === 'connected'

  const fmt = (iso: string) => new Date(iso).toLocaleTimeString(locale === 'en' ? 'en-US' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })
  // « Aujourd'hui » résolu dans le fuseau du navigateur (le serveur renvoie une fenêtre large).
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const isToday = (e: AgendaEvent) => e.allDay ? e.start.slice(0, 10) === todayStr : new Date(e.start).toDateString() === now.toDateString()
  const allDay = events.filter((e) => e.allDay && isToday(e))
  // Événements chronométrés du jour encore à venir/en cours (heures restantes).
  const timed = events.filter((e) => !e.allDay && isToday(e) && new Date(e.end ?? e.start) >= now)
  const dayCount = allDay.length + timed.length
  const startHour = now.getHours()
  const hours = Array.from({ length: 24 - startHour }, (_, i) => startHour + i)
  // Un événement déjà commencé mais en cours est rangé sur l'heure courante.
  const hourOf = (e: AgendaEvent) => Math.max(new Date(e.start).getHours(), startHour)

  return (
    <div className="glass rounded-2xl p-6 flex flex-col" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-sm font-bold text-zinc-100">{t('title')}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">{t('agendaSubtitle')}</div>
        </div>
        {connected && dayCount > 0 && (
          <span className="text-[10px] font-bold bg-violet-500/15 text-violet-300 border border-violet-500/25 px-2.5 py-1 rounded-full">
            {t('eventCount', { count: dayCount })}
          </span>
        )}
      </div>

      {connected ? (
        <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto pr-1">
          {/* Toute la journée */}
          {allDay.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pb-1">
              {allDay.map((e) => (
                <span key={e.id} className="flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5 text-[11px] text-zinc-200">
                  <span className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">{t('allDay')}</span>
                  <span className="font-medium truncate max-w-[140px]">{e.title}</span>
                  <SourceBadge source={e.source} t={t} />
                </span>
              ))}
            </div>
          )}

          {/* Grille des heures restantes */}
          {hours.map((h) => {
            const evs = timed.filter((e) => hourOf(e) === h)
            return (
              <div key={h} className="flex gap-3 border-t border-white/[0.04] pt-2">
                <span className="w-10 shrink-0 pt-0.5 text-[10px] font-semibold tabular-nums text-zinc-600">{String(h).padStart(2, '0')}:00</span>
                <div className="flex flex-1 flex-col gap-1.5 min-w-0">
                  {evs.length === 0 ? (
                    <div className="h-3" />
                  ) : (
                    evs.map((e) => (
                      <motion.div
                        key={e.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="flex items-center gap-2 rounded-xl border border-violet-500/15 bg-violet-500/[0.06] px-3 py-2"
                      >
                        <span className="text-[10px] font-bold tabular-nums text-violet-300">{fmt(e.start)}</span>
                        <span className="flex-1 truncate text-[12px] font-medium text-zinc-100">{e.title}</span>
                        <SourceBadge source={e.source} t={t} />
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            )
          })}

          {dayCount === 0 && (
            <p className="py-6 text-center text-[12px] text-zinc-500">{t('noEventsToday')}</p>
          )}
        </div>
      ) : (
        /* ── Empty state — connecter Calendar / Notion ── */
        <motion.div
          initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
          className="relative flex flex-1 flex-col items-center justify-center text-center py-8"
        >
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.05]" style={{ boxShadow: '0 0 22px rgba(99,102,241,0.3)' }}>
            <CalendarClock className="h-5 w-5 text-indigo-300" />
          </div>
          <p className="relative mt-4 max-w-[260px] text-[13px] leading-relaxed text-zinc-400">{t('emptyBody')}</p>
          <div className="relative mt-5 flex w-full max-w-[280px] flex-col gap-2">
            <ConnectorButton label="Google Calendar" icon={<CalendarDays size={15} className="text-indigo-300" />} state={integrations?.googleCalendar ?? 'soon'} href="/dashboard/integrations/google-calendar" t={t} />
            <ConnectorButton label="Notion" icon={<FileText size={15} className="text-zinc-300" />} state={integrations?.notion ?? 'soon'} href="/dashboard/integrations/notion" t={t} />
          </div>
        </motion.div>
      )}
    </div>
  )
}
