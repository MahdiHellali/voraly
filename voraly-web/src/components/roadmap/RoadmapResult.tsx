'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check, Circle, RotateCcw, Sparkles, Megaphone, MessageSquare,
  ChevronDown, ChevronUp, AlertCircle, Calendar, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { RoadmapStep } from '@/lib/roadmap/types'
import MarketingChatbot from './MarketingChatbot'

type TabId = 'roadmap' | 'marketing' | 'chat'

interface MarketingScript {
  topic?: string
  structure?: string
  hook?: string
  body?: string
  cta?: string
}

interface MarketingStrategyData {
  organic?: string
  paid?: string
  shorts_scripts?: MarketingScript[]
}

// ─── Config visuelle par jour de la semaine ───────────────────────────────────
const DAY_CONFIG: Record<string, { short: string; accent: string; dot: string }> = {
  Lundi:    { short: 'LUN', accent: 'text-violet-300',  dot: 'bg-violet-500' },
  Mardi:    { short: 'MAR', accent: 'text-indigo-300',  dot: 'bg-indigo-500' },
  Mercredi: { short: 'MER', accent: 'text-sky-300',     dot: 'bg-sky-500' },
  Jeudi:    { short: 'JEU', accent: 'text-pink-300',    dot: 'bg-pink-500' },
  Vendredi: { short: 'VEN', accent: 'text-emerald-300', dot: 'bg-emerald-500' },
  Samedi:   { short: 'SAM', accent: 'text-amber-300',   dot: 'bg-amber-500' },
  Dimanche: { short: 'DIM', accent: 'text-rose-300',    dot: 'bg-rose-500' },
}

function extractWeekLabel(title: string, stepNumber: number): string {
  const m = title.match(/semaine\s+(\d+)/i)
  return m ? `Semaine ${m[1]}` : `Semaine ${stepNumber}`
}

function extractShortTitle(title: string): string {
  return title.replace(/^semaine\s+\d+\s*[:–\-]\s*/i, '').trim() || title
}

// ─── Mini-calendrier accordéon ────────────────────────────────────────────────
function WeekCalendar({ step }: { step: RoadmapStep }) {
  const plan = step.daily_plan ?? []

  if (plan.length === 0) {
    return (
      <div className="mt-4 rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-sm leading-relaxed text-zinc-300 whitespace-pre-line">
        {step.actionable_advice}
      </div>
    )
  }

  return (
    <div className="mt-4 space-y-2">
      {plan.map((day, di) => {
        const cfg = DAY_CONFIG[day.day] ?? {
          short: day.day.slice(0, 3).toUpperCase(),
          accent: 'text-zinc-300',
          dot: 'bg-zinc-500',
        }
        return (
          <motion.div
            key={day.day}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: di * 0.06, duration: 0.28 }}
            className="flex gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4 py-3.5 backdrop-blur-sm"
          >
            {/* Colonne jour */}
            <div className="flex w-12 shrink-0 flex-col items-center justify-start gap-1 pt-0.5">
              <span className={cn('text-[10px] font-black tracking-widest', cfg.accent)}>
                {cfg.short}
              </span>
              <div className={cn('h-1 w-1 rounded-full', cfg.dot)} />
            </div>

            {/* Tâches du jour */}
            <div className="flex flex-1 flex-col gap-1.5">
              {day.tasks.map((task, ti) => (
                <div key={ti} className="flex items-start gap-2 text-[13px] leading-snug text-zinc-200">
                  <ChevronRight size={11} className={cn('mt-[3px] shrink-0', cfg.accent)} />
                  <span>{task}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// ─── Carte semaine avec accordéon ────────────────────────────────────────────
function WeekCard({
  step,
  isDone,
  isExpanded,
  onToggleDone,
  onToggleExpand,
  index,
}: {
  step: RoadmapStep
  isDone: boolean
  isExpanded: boolean
  onToggleDone: () => void
  onToggleExpand: () => void
  index: number
}) {
  const weekLabel = extractWeekLabel(step.title, step.step_number)
  const shortTitle = extractShortTitle(step.title)
  const hasCalendar = (step.daily_plan?.length ?? 0) > 0
  const weekNum = weekLabel.split(' ')[1] ?? String(step.step_number)

  return (
    <motion.article
      initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'relative overflow-hidden rounded-3xl border backdrop-blur-xl transition-colors duration-300',
        isDone
          ? 'border-pink-500/30 bg-white/[0.04]'
          : isExpanded
            ? 'border-violet-500/25 bg-white/[0.035]'
            : 'border-white/10 bg-white/[0.03]',
      )}
      style={
        isDone
          ? { boxShadow: '0 0 28px rgba(255,102,204,0.12)' }
          : isExpanded
            ? { boxShadow: '0 0 28px rgba(139,92,246,0.1)' }
            : undefined
      }
    >
      {/* Corner glow */}
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(139,92,246,0.09), transparent 70%)',
          filter: 'blur(24px)',
        }}
      />

      <div className="relative p-6 sm:p-7">
        {/* En-tête de la carte */}
        <div className="flex items-start gap-4">
          {/* Badge "SEMAINE N" */}
          <div
            className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl border border-pink-500/30 bg-pink-500/10 leading-none"
            style={{ boxShadow: '0 0 18px rgba(255,102,204,0.18)' }}
          >
            <span className="text-[9px] font-black uppercase tracking-widest text-pink-400/80">SEM.</span>
            <span className="text-xl font-black text-pink-300">{weekNum}</span>
          </div>

          {/* Titre + label */}
          <div className="flex-1 min-w-0">
            <p className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-pink-400/80">
              {weekLabel}
            </p>
            <h3
              className={cn(
                'text-base font-bold leading-snug tracking-tight sm:text-lg',
                isDone ? 'text-zinc-500 line-through' : 'text-white',
              )}
            >
              {shortTitle}
            </h3>
          </div>

          {/* Bouton accordéon */}
          <button
            type="button"
            onClick={onToggleExpand}
            aria-label={isExpanded ? 'Réduire' : 'Développer'}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-white/5 text-zinc-400 transition-all hover:border-violet-500/30 hover:bg-violet-500/10 hover:text-violet-300"
          >
            {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>

        {/* Hint "voir plan détaillé" quand fermé et calendrier disponible */}
        {!isExpanded && hasCalendar && (
          <button
            type="button"
            onClick={onToggleExpand}
            className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-violet-400/70 transition-colors hover:text-violet-300"
          >
            <Calendar size={11} />
            Voir le plan détaillé jour par jour
          </button>
        )}

        {/* Corps accordéon */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              {hasCalendar ? (
                <>
                  <div className="mt-5 flex items-center gap-2 border-t border-white/5 pt-5">
                    <Calendar size={13} className="text-violet-400" />
                    <span className="text-[11px] font-bold uppercase tracking-widest text-violet-400">
                      Plan détaillé — {weekLabel}
                    </span>
                  </div>
                  <WeekCalendar step={step} />
                </>
              ) : (
                <div className="mt-5 border-t border-white/5 pt-5 text-[14px] leading-relaxed text-zinc-300">
                  {step.actionable_advice}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bouton "Marquer complétée" */}
        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            onClick={onToggleDone}
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold backdrop-blur-xl transition-all active:scale-[0.97]',
              isDone
                ? 'border-pink-500/50 bg-pink-500/20 text-pink-100'
                : 'border-white/10 bg-white/5 text-zinc-300 hover:border-pink-500/40 hover:text-white',
            )}
          >
            {isDone ? (
              <><Check size={14} strokeWidth={3} /> Complétée</>
            ) : (
              <><Circle size={14} /> Marquer complétée</>
            )}
          </button>

          {isDone && (
            <motion.span
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-[11px] font-semibold text-pink-400"
            >
              ✦ Semaine validée
            </motion.span>
          )}
        </div>
      </div>
    </motion.article>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function RoadmapResult({
  steps,
  marketingStrategy,
  initialCompleted,
  userId,
  onRestart,
}: {
  steps: RoadmapStep[]
  marketingStrategy: unknown
  initialCompleted: number[]
  userId: string | null
  onRestart: () => void
}) {
  const strategy = marketingStrategy as MarketingStrategyData | null
  const [activeTab, setActiveTab] = useState<TabId>('roadmap')
  const [completed, setCompleted] = useState<number[]>(initialCompleted)
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({})
  const [expandedScripts, setExpandedScripts] = useState<Record<number, boolean>>({})

  const doneCount = completed.length
  const progressPct = steps.length > 0 ? Math.round((doneCount / steps.length) * 100) : 0

  const toggle = async (n: number) => {
    const previous = completed
    const next = completed.includes(n) ? completed.filter((x) => x !== n) : [...completed, n]
    setCompleted(next)
    if (!userId) return
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ completed_steps: next })
      .eq('id', userId)
    if (error) {
      console.error('[roadmap] failed to persist completed_steps', error)
      setCompleted(previous)
    }
  }

  const toggleStep = (n: number) =>
    setExpandedSteps((prev) => ({ ...prev, [n]: !prev[n] }))

  const toggleScript = (i: number) =>
    setExpandedScripts((prev) => ({ ...prev, [i]: !prev[i] }))

  const hasMarketing = !!(
    strategy && (strategy.organic || strategy.paid || strategy.shorts_scripts?.length)
  )

  const TABS = [
    { id: 'roadmap' as TabId,    label: "Plan d'Action",      icon: <Sparkles size={15} className="text-pink-400" /> },
    { id: 'marketing' as TabId,  label: 'Stratégie Marketing', icon: <Megaphone size={15} className="text-indigo-400" /> },
    { id: 'chat' as TabId,       label: 'Conseiller IA',       icon: <MessageSquare size={15} className="text-fuchsia-400" /> },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="flex w-full flex-col gap-8"
    >
      {/* Header + barre de progression */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-pink-400">
            ✦ Votre hub stratégique
          </p>
          <h2 className="text-balance text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Stratégie de Croissance & IA
          </h2>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-1.5 w-40 overflow-hidden rounded-full bg-white/5">
              <motion.div
                className="h-full rounded-full"
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
                style={{ background: 'linear-gradient(to right, #6366f1, #ec4899)' }}
              />
            </div>
            <span className="text-sm text-zinc-400">
              {doneCount} / {steps.length} semaine{steps.length > 1 ? 's' : ''} complétée{steps.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onRestart}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 backdrop-blur-xl transition-colors hover:border-white/20 hover:text-white"
        >
          <RotateCcw size={14} />
          Nouveau diagnostic
        </button>
      </div>

      {/* Onglets */}
      <div className="flex border-b border-white/5 pb-px">
        <div className="flex gap-1 rounded-2xl border border-white/5 bg-white/[0.02] p-1">
          {TABS.map(({ id, label, icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98]',
                activeTab === id
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200',
              )}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenu des onglets */}
      <div className="min-h-[400px]">

        {/* ── Plan d'Action ── */}
        {activeTab === 'roadmap' && (
          <div className="flex flex-col gap-5">
            {steps.map((step, i) => (
              <WeekCard
                key={step.step_number}
                step={step}
                isDone={completed.includes(step.step_number)}
                isExpanded={!!expandedSteps[step.step_number]}
                onToggleDone={() => toggle(step.step_number)}
                onToggleExpand={() => toggleStep(step.step_number)}
                index={i}
              />
            ))}
          </div>
        )}

        {/* ── Stratégie Marketing ── */}
        {activeTab === 'marketing' && (
          <div className="space-y-8">
            {!hasMarketing ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-xl">
                <AlertCircle size={40} className="mb-4 text-zinc-500" />
                <h3 className="mb-2 text-lg font-bold text-white">Stratégie marketing manquante</h3>
                <p className="max-w-md text-sm text-zinc-400">
                  Vous possédez une ancienne version de roadmap sans stratégie marketing. Cliquez sur &quot;Nouveau diagnostic&quot; ci-dessus pour la générer.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl md:p-8"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-300">
                      <Sparkles size={16} />
                    </span>
                    <h3 className="text-lg font-bold text-white">Contenu Organique</h3>
                  </div>
                  <div className="whitespace-pre-line text-sm leading-relaxed text-zinc-300">
                    {strategy?.organic}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl md:p-8"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-pink-500/30 bg-pink-500/10 text-pink-300">
                      <Megaphone size={16} />
                    </span>
                    <h3 className="text-lg font-bold text-white">Contenu Payant</h3>
                  </div>
                  <div className="whitespace-pre-line text-sm leading-relaxed text-zinc-300">
                    {strategy?.paid}
                  </div>
                </motion.div>

                {strategy?.shorts_scripts && strategy.shorts_scripts.length > 0 && (
                  <div className="col-span-1 space-y-6 md:col-span-2">
                    <h3 className="mt-4 text-xl font-bold tracking-tight text-white">
                      Scripts Vidéos de Shorts Recommandés
                    </h3>
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {strategy.shorts_scripts.map((script, idx) => {
                        const isExpanded = !!expandedScripts[idx]
                        return (
                          <motion.div
                            key={idx}
                            layout
                            className={cn(
                              'group relative overflow-hidden rounded-3xl border bg-white/5 p-6 backdrop-blur-xl transition-all duration-300',
                              isExpanded ? 'border-pink-500/30' : 'border-white/10 hover:border-white/20',
                            )}
                          >
                            <div className="flex flex-col gap-4">
                              <div>
                                <span className="mb-2 inline-flex items-center rounded-full border border-pink-500/20 bg-pink-500/10 px-2.5 py-0.5 text-xs font-medium text-pink-300">
                                  Vidéo {idx + 1}
                                </span>
                                <h4 className="text-base font-bold leading-snug text-white transition-colors group-hover:text-pink-300">
                                  {script.topic}
                                </h4>
                              </div>
                              <div className="text-xs text-zinc-400">
                                <span className="font-semibold text-zinc-300">Structure :</span> {script.structure}
                              </div>
                              <button
                                type="button"
                                onClick={() => toggleScript(idx)}
                                className="inline-flex w-full items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:bg-white/[0.05] hover:text-white"
                              >
                                <span>{isExpanded ? 'Masquer le script' : 'Afficher le script complet'}</span>
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="space-y-4 border-t border-white/5 pt-2"
                                  >
                                    <div>
                                      <span className="mb-1 inline-flex rounded-full border border-pink-500/20 bg-pink-500/10 px-2 py-0.5 text-[10px] font-bold text-pink-300">
                                        ACCROCHE (0-3s)
                                      </span>
                                      <p className="text-sm font-medium italic text-white">&ldquo;{script.hook}&rdquo;</p>
                                    </div>
                                    <div>
                                      <span className="mb-1 inline-flex rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
                                        MESSAGE (3-45s)
                                      </span>
                                      <p className="whitespace-pre-line text-xs leading-relaxed text-zinc-300">{script.body}</p>
                                    </div>
                                    <div>
                                      <span className="mb-1 inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                                        CTA (45-50s)
                                      </span>
                                      <p className="text-sm font-semibold text-white">{script.cta}</p>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Conseiller IA ── */}
        {activeTab === 'chat' && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <MarketingChatbot />
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
