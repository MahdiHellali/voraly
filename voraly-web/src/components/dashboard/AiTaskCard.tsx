'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, CheckCircle2, Circle, RefreshCw } from 'lucide-react'
import { LiquidButton } from '@/components/ui/liquid-glass-button'
import type { AiTask } from '@/lib/dashboard/types'

const priorityDot: Record<string, string> = {
  high:   'bg-rose-500',
  medium: 'bg-orange-400',
  low:    'bg-emerald-400',
}

// Couleur d'accent par jour de la semaine (cohérent avec RoadmapResult)
const DAY_ACCENT: Record<string, string> = {
  Lundi:    'text-violet-400/80',
  Mardi:    'text-indigo-400/80',
  Mercredi: 'text-sky-400/80',
  Jeudi:    'text-pink-400/80',
  Vendredi: 'text-emerald-400/80',
}

interface AiTaskCardProps {
  tasks?: AiTask[] | null
  generatedLabel?: string
  userId?: string | null
}

// Détermine si les IDs sont au format "step-day-taskIndex" (daily tasks) ou numériques (weekly).
function isDailyTaskId(id: string): boolean {
  return id.includes('-') && isNaN(Number(id))
}

export default function AiTaskCard({ tasks, generatedLabel, userId }: AiTaskCardProps) {
  const t = useTranslations('dashboard.aiTasks')
  const router = useRouter()
  const [localTasks, setLocalTasks] = useState<AiTask[]>(tasks ?? [])
  const [isPersisting, setIsPersisting] = useState(false)

  const hasTasks = localTasks.length > 0
  const completed = localTasks.filter((t) => t.done).length
  const total = localTasks.length
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0

  const isDaily = hasTasks && isDailyTaskId(localTasks[0]?.id ?? '')

  const toggle = async (id: string) => {
    if (isPersisting) return
    setIsPersisting(true)
    const previous = [...localTasks]
    const next = localTasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    setLocalTasks(next)
    if (!userId) { setIsPersisting(false); return }

    try {
      if (isDaily) {
        const completedDailyTaskIds = next.filter((t) => t.done).map((t) => t.id)
        const res = await fetch('/api/profile/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed_daily_tasks: completedDailyTaskIds }),
        })
        if (!res.ok) throw new Error('progress update failed')

        // Auto-avancement : si toutes les tâches cochées → marquer le step complété.
        if (next.every((t) => t.done) && next.length > 0) {
          const stepNum = parseInt(next[0].id.split('-')[0], 10)
          if (!isNaN(stepNum)) {
            // Lire les completed_steps courants via l'API progress (GET n'existe pas, on
            // envoie une requête fetch séparée côté serveur pour lire puis merger).
            const profileRes = await fetch('/api/profile/progress/steps')
            const existing: number[] = profileRes.ok
              ? ((await profileRes.json()) as { completed_steps: number[] }).completed_steps ?? []
              : []
            if (!existing.includes(stepNum)) {
              await fetch('/api/profile/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed_steps: [...existing, stepNum] }),
              })
            }
            router.refresh()
          }
        }
      } else {
        const completedStepNumbers = next.filter((t) => t.done).map((t) => Number(t.id))
        const res = await fetch('/api/profile/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed_steps: completedStepNumbers }),
        })
        if (!res.ok) throw new Error('progress update failed')
      }
    } catch (err) {
      console.error('[dashboard] failed to persist task progress', err)
      setLocalTasks(previous)
    }
    setIsPersisting(false)
  }

  /* ── État B — pas de roadmap ── */
  if (!hasTasks) {
    return (
      <div className="glass rounded-2xl p-6" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
        <motion.div
          initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex flex-col items-center justify-center text-center py-10"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-2 h-44 w-72 -translate-x-1/2 rounded-full blur-3xl"
            style={{
              background:
                'radial-gradient(ellipse, rgba(139,92,246,0.25), rgba(255,102,204,0.12) 55%, transparent 75%)',
            }}
          />
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="relative flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: '0 0 26px rgba(139,92,246,0.5)',
            }}
          >
            <Sparkles className="h-6 w-6 text-white" />
          </motion.div>

          <p className="relative mt-5 max-w-xs text-[14px] leading-relaxed text-zinc-300">
            {t('emptyBody')}
          </p>

          <Link href="/dashboard/roadmap" className="relative mt-6 inline-block">
            <LiquidButton
              size="xl"
              className="group/liquid text-[14px] font-semibold text-white"
              style={{ boxShadow: '0 0 30px rgba(139,92,246,0.35)' }}
            >
              <span className="flex items-center justify-center gap-2.5">
                <Sparkles size={16} className="text-pink-300" />
                {t('generate')}
              </span>
            </LiquidButton>
          </Link>
        </motion.div>
      </div>
    )
  }

  /* ── État A — roadmap chargée ── */
  const weekLabel = localTasks[0]?.weekLabel
  const titleSuffix = weekLabel ? ` — ${weekLabel}` : ''

  return (
    <div className="glass rounded-2xl p-6" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.08, rotate: -3 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black text-white"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: '0 0 15px rgba(139,92,246,0.4)',
            }}
          >
            {t('aiBadge')}
          </motion.div>
          <div>
            <div className="text-sm font-bold text-zinc-100">
              {t('title')}{titleSuffix}
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5">
              {generatedLabel ?? t('autoGenerated')}
            </div>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="flex items-center gap-3">
          <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
              style={{ background: 'linear-gradient(to right, #6366f1, #8b5cf6)' }}
            />
          </div>
          <span className="text-[11px] font-bold text-zinc-300">
            {completed}/{total}
          </span>
        </div>
      </div>

      {/* ── Liste des tâches ── */}
      <div className="flex flex-col gap-2 mb-4">
        {localTasks.map((task) => {
          // Pour les tâches quotidiennes, dayLabel est fourni par le serveur.
          // Pour le fallback hebdomadaire, on extrait "Semaine N" du texte.
          const displayDayLabel = task.dayLabel ?? null
          const displayWeekLabel = !task.dayLabel
            ? (() => {
                const m = task.text.match(/^(semaine\s+\d+)\s*[:–\-]\s*/i)
                return m ? m[1].replace(/^s/i, 'S') : null
              })()
            : null
          const shortText = displayWeekLabel
            ? task.text.replace(/^semaine\s+\d+\s*[:–\-]\s*/i, '').trim()
            : task.text

          return (
            <motion.button
              key={task.id}
              onClick={() => toggle(task.id)}
              whileTap={{ scale: 0.98 }}
              className="flex items-start gap-3 p-3 rounded-xl text-left transition-all duration-200 hover:bg-white/[0.04] group w-full"
            >
              {/* Icône checkbox */}
              <div className="mt-0.5 flex-shrink-0">
                <AnimatePresence mode="wait" initial={false}>
                  {task.done ? (
                    <motion.span
                      key="checked"
                      initial={{ scale: 0.4, opacity: 0, rotate: -15 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      exit={{ scale: 0.4, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                      className="block"
                    >
                      <CheckCircle2 size={16} className="text-indigo-400" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="unchecked"
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.4, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                      className="block text-zinc-500 group-hover:text-indigo-400 transition-colors"
                    >
                      <Circle size={16} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              {/* Dot priorité */}
              <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${priorityDot[task.priority]}`} />

              {/* Texte */}
              <motion.span
                animate={{ opacity: task.done ? 0.38 : 1 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-0.5 min-w-0"
              >
                {/* Label jour (mode daily_plan) */}
                {displayDayLabel && (
                  <span
                    className={`text-[9px] font-black uppercase tracking-widest ${
                      DAY_ACCENT[displayDayLabel] ?? 'text-zinc-400/70'
                    }`}
                  >
                    {displayDayLabel}
                  </span>
                )}
                {/* Label semaine (mode hebdomadaire legacy) */}
                {displayWeekLabel && (
                  <span className="text-[9px] font-black uppercase tracking-widest text-pink-400/80">
                    {displayWeekLabel}
                  </span>
                )}
                <span
                  className={`text-[13px] leading-snug transition-colors ${
                    task.done ? 'line-through text-zinc-600' : 'text-zinc-300 group-hover:text-zinc-100'
                  }`}
                >
                  {shortText}
                </span>
              </motion.span>
            </motion.button>
          )
        })}
      </div>

      {/* ── Bouton voir la roadmap complète ── */}
      <Link href="/dashboard/roadmap" className="block">
        <LiquidButton size="lg" className="group/liquid w-full text-[13px] font-semibold text-zinc-100">
          <span className="flex items-center justify-center gap-2">
            <Sparkles size={14} className="text-indigo-400" />
            {t('viewFullRoadmap')}
            <RefreshCw
              size={12}
              className="text-zinc-400 transition-transform duration-500 group-hover/liquid:rotate-180"
            />
          </span>
        </LiquidButton>
      </Link>
    </div>
  )
}
