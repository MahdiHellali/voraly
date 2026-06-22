'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarClock, CalendarDays, FileText, ArrowRight, X, Clock, StickyNote, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AgendaEvent, IntegrationsState } from '@/lib/dashboard/types'
import { updateNotionEventStatus } from '@/app/dashboard/integrations/actions'

// 1 heure = ROW_H pixels dans la grille
const ROW_H = 72

type T = ReturnType<typeof useTranslations>

// ─── Couleurs par statut Notion ────────────────────────────────────────────────
const STATUS_STYLES: Record<string, { rgb: string; bar: string; timeText: string; badgeBg: string; badgeText: string }> = {
  'Idée':     { rgb: '113,113,122', bar: '#a1a1aa', timeText: 'text-zinc-400',    badgeBg: 'rgba(113,113,122,0.15)', badgeText: '#a1a1aa' },
  'En cours': { rgb: '245,158,11',  bar: '#fbbf24', timeText: 'text-amber-300',   badgeBg: 'rgba(245,158,11,0.15)',  badgeText: '#fbbf24' },
  'Rédigé':   { rgb: '59,130,246',  bar: '#60a5fa', timeText: 'text-blue-300',    badgeBg: 'rgba(59,130,246,0.15)',  badgeText: '#60a5fa' },
  'Publié':   { rgb: '16,185,129',  bar: '#34d399', timeText: 'text-emerald-300', badgeBg: 'rgba(16,185,129,0.15)',  badgeText: '#34d399' },
}
const DEFAULT_STYLE = { rgb: '139,92,246', bar: '#8b5cf6', timeText: 'text-violet-300', badgeBg: 'rgba(139,92,246,0.15)', badgeText: '#8b5cf6' }

function getStyle(event: AgendaEvent, overrideStatus?: string | null) {
  const status = overrideStatus ?? event.status
  if (event.source === 'notion' && status && STATUS_STYLES[status]) return STATUS_STYLES[status]
  return DEFAULT_STYLE
}

// ─── Badges ───────────────────────────────────────────────────────────────────
function SourceBadge({ source, t }: { source: AgendaEvent['source']; t: T }) {
  const isG = source === 'google_calendar'
  return (
    <span className={cn(
      'inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-bold',
      isG ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300' : 'border-zinc-500/30 bg-white/[0.05] text-zinc-300',
    )}>
      {isG ? <CalendarDays size={9} /> : <FileText size={9} />}
      {isG ? t('sourceCalendar') : t('sourceNotion')}
    </span>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtTime(iso: string, locale: string) {
  return new Date(iso).toLocaleTimeString(locale === 'en' ? 'en-US' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function fmtDuration(start: string, end: string | null): string {
  if (!end) return ''
  const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000)
  if (mins <= 0) return ''
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h${m.toString().padStart(2, '0')}`
}

function getMetrics(e: AgendaEvent, gridStart: number) {
  const s = new Date(e.start)
  const end = e.end ? new Date(e.end) : new Date(s.getTime() + 30 * 60_000)
  const sFrac = s.getHours() + s.getMinutes() / 60
  const eFrac = end.getHours() + end.getMinutes() / 60
  const top = (Math.max(sFrac, gridStart) - gridStart) * ROW_H
  const height = Math.max((eFrac - sFrac) * ROW_H, ROW_H * 0.25)
  return { top, height }
}

// ─── Popup evenement ─────────────────────────────────────────────────────────
const STATUSES = ['Idée', 'En cours', 'Rédigé', 'Publié'] as const

function EventPopup({ event, currentStatus, onStatusChange, onClose, t, locale }: {
  event: AgendaEvent
  currentStatus: string | null | undefined
  onStatusChange: (newStatus: string) => Promise<void>
  onClose: () => void
  t: T
  locale: string
}) {
  const [updating, setUpdating] = useState(false)
  const isNotion = event.source === 'notion'
  const style = getStyle(event, currentStatus)

  const s = new Date(event.start)
  const dayLabel = s.toLocaleDateString(locale === 'en' ? 'en-US' : 'fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
  const duration = fmtDuration(event.start, event.end)

  async function handleStatus(newStatus: string) {
    if (updating || newStatus === currentStatus || !event.notionPageId) return
    setUpdating(true)
    await onStatusChange(newStatus)
    setUpdating(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(9,9,11,0.65)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.86, opacity: 0, y: 28, filter: 'blur(6px)' }}
        animate={{ scale: 1, opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ scale: 0.86, opacity: 0, y: 28, filter: 'blur(6px)' }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        className="relative w-full max-w-sm rounded-3xl border border-white/[0.10] bg-zinc-950/96 p-6"
        style={{ boxShadow: `0 32px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.06), 0 0 60px rgba(${style.rgb},0.12)` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fermer */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-zinc-400 transition-all hover:bg-white/[0.09] hover:text-zinc-200"
        >
          <X size={13} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2">
          <SourceBadge source={event.source} t={t} />
          {event.type && (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[9px] font-bold text-zinc-400">
              <Tag size={8} />
              {event.type}
            </span>
          )}
        </div>

        <h3 className="mt-3 text-[18px] font-bold leading-snug text-zinc-50">{event.title}</h3>
        <p className="mt-1 text-[12px] capitalize text-zinc-500">{dayLabel}</p>

        {/* Horaire */}
        {!event.allDay ? (
          <div className="mt-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
            <div className="flex items-center gap-2.5">
              <Clock size={14} className="shrink-0" style={{ color: style.bar }} />
              <div className="flex flex-1 items-center justify-between">
                <span className="text-[13px] font-semibold tabular-nums text-zinc-200">
                  {fmtTime(event.start, locale)}
                  {event.end && <> &rarr; {fmtTime(event.end, locale)}</>}
                </span>
                {duration && (
                  <span className="rounded-full border border-white/[0.10] px-2 py-0.5 text-[10px] font-bold" style={{ color: style.bar }}>
                    {duration}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-[13px] font-semibold text-zinc-400">
            {t('allDay')}
          </div>
        )}

        {/* Notes */}
        {isNotion && event.notes && (
          <div className="mt-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
            <div className="flex items-start gap-2.5">
              <StickyNote size={13} className="mt-0.5 shrink-0 text-zinc-500" />
              <p className="text-[12px] leading-relaxed text-zinc-400">{event.notes}</p>
            </div>
          </div>
        )}

        {/* Selecteur de statut (Notion uniquement) */}
        {isNotion && event.notionPageId && (
          <div className="mt-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Statut</p>
            <div className="grid grid-cols-4 gap-1.5">
              {STATUSES.map((s) => {
                const st = STATUS_STYLES[s]
                const isActive = currentStatus === s
                return (
                  <button
                    key={s}
                    disabled={updating}
                    onClick={() => handleStatus(s)}
                    className="flex flex-col items-center gap-1 rounded-xl border px-1 py-2 text-[10px] font-semibold transition-all disabled:opacity-50"
                    style={{
                      borderColor: isActive ? `rgba(${st.rgb}, 0.45)` : 'rgba(255,255,255,0.06)',
                      backgroundColor: isActive ? `rgba(${st.rgb}, 0.16)` : 'rgba(255,255,255,0.03)',
                      color: isActive ? st.bar : '#71717a',
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: st.bar }}
                    />
                    {s}
                  </button>
                )
              })}
            </div>
            {updating && (
              <p className="mt-2 text-center text-[10px] text-zinc-600">Mise à jour...</p>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

// ─── Bouton connecteur ────────────────────────────────────────────────────────
function ConnectorButton({ label, icon, state, href, t }: {
  label: string; icon: React.ReactNode; state: 'connect' | 'soon' | 'connected'; href: string; t: T
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

// ─── Composant principal ──────────────────────────────────────────────────────
interface DeadlineCardProps {
  agenda?: AgendaEvent[] | null
  integrations?: Pick<IntegrationsState, 'googleCalendar' | 'notion'>
}

export default function DeadlineCard({ agenda, integrations }: DeadlineCardProps) {
  const t = useTranslations('dashboard.deadlines')
  const locale = useLocale()
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null)
  // Surcharges de statut locales (mises a jour optimistes)
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({})

  const events = agenda ?? []
  const connected = integrations?.googleCalendar === 'connected' || integrations?.notion === 'connected'

  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const isToday = (e: AgendaEvent) =>
    e.allDay ? e.start.slice(0, 10) === todayStr : new Date(e.start).toDateString() === now.toDateString()

  const allDay = events.filter((e) => e.allDay && isToday(e))
  const timed = events.filter((e) => !e.allDay && isToday(e) && new Date(e.end ?? e.start) >= now)
  const dayCount = allDay.length + timed.length

  const gridStart = now.getHours()
  const hours = Array.from({ length: 24 - gridStart }, (_, i) => gridStart + i)
  const gridH = hours.length * ROW_H

  function getEffectiveStatus(e: AgendaEvent): string | null | undefined {
    return statusOverrides[e.id] ?? e.status
  }

  async function handleStatusChange(eventId: string, newStatus: string) {
    const prevStatus = statusOverrides[eventId] ?? selectedEvent?.status
    // Mise a jour optimiste immediate
    setStatusOverrides((prev) => ({ ...prev, [eventId]: newStatus }))
    const result = await updateNotionEventStatus(
      selectedEvent?.notionPageId ?? '',
      newStatus,
    )
    // Revert si echec
    if (!result.ok) {
      setStatusOverrides((prev) => ({
        ...prev,
        [eventId]: prevStatus ?? '',
      }))
    }
  }

  return (
    <>
      <div
        className="glass rounded-2xl p-6 flex flex-col"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="text-[15px] font-bold text-zinc-100">{t('title')}</div>
            <div className="text-[12px] text-zinc-500 mt-0.5">{t('agendaSubtitle')}</div>
          </div>
          {connected && dayCount > 0 && (
            <span className="text-[10px] font-bold bg-violet-500/15 text-violet-300 border border-violet-500/25 px-2.5 py-1 rounded-full">
              {t('eventCount', { count: dayCount })}
            </span>
          )}
        </div>

        {connected ? (
          <div className="overflow-y-auto pr-1" style={{ maxHeight: 560 }}>
            {/* Evenements toute la journee */}
            {allDay.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pb-3 mb-3 border-b border-white/[0.05]">
                {allDay.map((e) => (
                  <motion.button
                    key={e.id}
                    onClick={() => setSelectedEvent(e)}
                    whileHover={{ scale: 1.05, boxShadow: '0 6px 24px rgba(139,92,246,0.28)' }}
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 440, damping: 28 }}
                    className="flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5 text-left cursor-pointer transition-colors hover:border-white/[0.13] hover:bg-white/[0.06]"
                  >
                    <span className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">{t('allDay')}</span>
                    <span className="text-[12px] font-medium text-zinc-200 truncate max-w-[140px]">{e.title}</span>
                    <SourceBadge source={e.source} t={t} />
                  </motion.button>
                ))}
              </div>
            )}

            {/* Grille temporelle */}
            <div className="flex gap-0">
              {/* Colonne heures */}
              <div className="flex flex-col shrink-0 w-11">
                {hours.map((h) => (
                  <div key={h} className="flex items-start pt-1" style={{ height: ROW_H }}>
                    <span className="text-[10px] font-semibold tabular-nums text-zinc-600 select-none leading-none">
                      {String(h).padStart(2, '0')}h
                    </span>
                  </div>
                ))}
              </div>

              {/* Zone evenements */}
              <div className="relative flex-1 border-l border-white/[0.05]" style={{ height: gridH }}>
                {/* Lignes heures */}
                {hours.map((_, i) => (
                  <div key={i} className="absolute left-0 right-0 border-t border-white/[0.04]" style={{ top: i * ROW_H }} />
                ))}
                {/* Demi-heures */}
                {hours.map((_, i) => (
                  <div key={`hh-${i}`} className="absolute left-0 right-0 border-t border-dashed border-white/[0.02]" style={{ top: i * ROW_H + ROW_H / 2 }} />
                ))}

                {/* Vide */}
                {timed.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-[12px] text-zinc-700 select-none">{t('noEventsToday')}</p>
                  </div>
                )}

                {/* Evenements — hauteur proportionnelle a la duree */}
                {timed.map((e) => {
                  const { top, height } = getMetrics(e, gridStart)
                  const effStatus = getEffectiveStatus(e)
                  const style = getStyle(e, effStatus)
                  const showEndTime = height >= ROW_H * 0.4
                  const showDuration = height >= ROW_H * 0.65

                  return (
                    <motion.button
                      key={e.id}
                      onClick={() => setSelectedEvent(e)}
                      whileHover={{
                        scale: 1.028,
                        zIndex: 20,
                        boxShadow: `0 10px 32px rgba(${style.rgb},0.42), 0 0 0 1px rgba(${style.rgb},0.32)`,
                      }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: 'spring', stiffness: 440, damping: 28 }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute left-2 right-2 rounded-xl px-2.5 py-1.5 text-left cursor-pointer overflow-hidden border transition-colors"
                      style={{
                        top,
                        height,
                        zIndex: 1,
                        borderColor: `rgba(${style.rgb}, 0.22)`,
                        backgroundColor: `rgba(${style.rgb}, 0.08)`,
                      }}
                    >
                      {/* Bande couleur laterale */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl"
                        style={{ backgroundColor: style.bar }}
                      />

                      <div className="flex items-start justify-between gap-1.5 h-full pl-1.5">
                        <div className="flex flex-col gap-0.5 min-w-0 flex-1 overflow-hidden">
                          <span className={cn('text-[9.5px] font-bold tabular-nums leading-none', style.timeText)}>
                            {fmtTime(e.start, locale)}
                            {showEndTime && e.end && ` – ${fmtTime(e.end, locale)}`}
                          </span>
                          <span className="text-[12px] font-semibold text-zinc-100 leading-tight line-clamp-2">
                            {e.title}
                          </span>
                          {showDuration && (
                            <span className="text-[10px] text-zinc-500 leading-none mt-0.5">
                              {fmtDuration(e.start, e.end)}
                            </span>
                          )}
                        </div>
                        <div className="shrink-0 mt-0.5">
                          {/* Badge statut pour les evenements Notion */}
                          {e.source === 'notion' && effStatus ? (
                            <span
                              className="inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[9px] font-bold"
                              style={{
                                borderColor: `rgba(${style.rgb}, 0.3)`,
                                backgroundColor: `rgba(${style.rgb}, 0.12)`,
                                color: style.bar,
                              }}
                            >
                              {effStatus}
                            </span>
                          ) : (
                            <SourceBadge source={e.source} t={t} />
                          )}
                        </div>
                      </div>
                    </motion.button>
                  )
                })}

                {/* Indicateur heure actuelle */}
                <div
                  className="absolute left-0 right-0 z-30 flex items-center pointer-events-none"
                  style={{ top: (now.getHours() + now.getMinutes() / 60 - gridStart) * ROW_H }}
                >
                  <div className="h-2 w-2 rounded-full bg-rose-400 shrink-0 -ml-1 shadow-[0_0_8px_rgba(244,63,94,0.9)]" />
                  <div className="flex-1 h-px bg-gradient-to-r from-rose-400/80 to-transparent" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
            className="relative flex flex-1 flex-col items-center justify-center text-center py-8"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-6 h-40 w-40 -translate-x-1/2 rounded-full blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.18), transparent 70%)' }}
            />
            <div
              className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.05]"
              style={{ boxShadow: '0 0 22px rgba(99,102,241,0.3)' }}
            >
              <CalendarClock className="h-5 w-5 text-indigo-300" />
            </div>
            <p className="relative mt-4 max-w-[260px] text-[13px] leading-relaxed text-zinc-400">
              {t('emptyBody')}
            </p>
            <div className="relative mt-5 flex w-full max-w-[280px] flex-col gap-2">
              <ConnectorButton
                label="Google Calendar"
                icon={<CalendarDays size={15} className="text-indigo-300" />}
                state={integrations?.googleCalendar ?? 'soon'}
                href="/dashboard/integrations/google-calendar"
                t={t}
              />
              <ConnectorButton
                label="Notion"
                icon={<FileText size={15} className="text-zinc-300" />}
                state={integrations?.notion ?? 'soon'}
                href="/dashboard/integrations/notion"
                t={t}
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* Popup evenement */}
      <AnimatePresence>
        {selectedEvent && (
          <EventPopup
            event={selectedEvent}
            currentStatus={getEffectiveStatus(selectedEvent)}
            onStatusChange={async (newStatus) => {
              await handleStatusChange(selectedEvent.id, newStatus)
            }}
            onClose={() => setSelectedEvent(null)}
            t={t}
            locale={locale}
          />
        )}
      </AnimatePresence>
    </>
  )
}
