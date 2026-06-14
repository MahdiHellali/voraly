'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Circle, RotateCcw, Sparkles, Megaphone, MessageSquare, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
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

export default function RoadmapResult({
  steps,
  marketingStrategy,
  initialCompleted,
  userId,
  onRestart,
}: {
  steps: RoadmapStep[]
  marketingStrategy: unknown
  /** Step numbers already completed, restored from the DB on the server. */
  initialCompleted: number[]
  /** Authenticated user id (RLS owner); null disables persistence. */
  userId: string | null
  onRestart: () => void
}) {
  const strategy = marketingStrategy as MarketingStrategyData | null
  const [activeTab, setActiveTab] = useState<TabId>('roadmap')
  const [completed, setCompleted] = useState<number[]>(initialCompleted)
  const [expandedScripts, setExpandedScripts] = useState<Record<number, boolean>>({})

  const doneCount = completed.length

  const toggle = async (n: number) => {
    const previous = completed
    const next = completed.includes(n)
      ? completed.filter((x) => x !== n)
      : [...completed, n]

    // Optimistic update — flip the UI immediately.
    setCompleted(next)

    if (!userId) return

    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ completed_steps: next })
      .eq('id', userId)

    // On failure, roll back to the prior state so the UI stays truthful.
    if (error) {
      console.error('[roadmap] failed to persist completed_steps', error)
      setCompleted(previous)
    }
  }

  const toggleScript = (i: number) => {
    setExpandedScripts((prev) => ({ ...prev, [i]: !prev[i] }))
  }

  const hasMarketing = !!(
    strategy &&
    (strategy.organic || strategy.paid || strategy.shorts_scripts?.length)
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="flex w-full flex-col gap-8"
    >
      {/* Header + progress */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-pink-400">
            ✦ Votre hub stratégique
          </p>
          <h2 className="text-balance text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Stratégie de Croissance & IA
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            {doneCount} / {steps.length} étape{steps.length > 1 ? 's' : ''}{' '}
            complétée{steps.length > 1 ? 's' : ''}
          </p>
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

      {/* Tabs navigation */}
      <div className="flex border-b border-white/5 pb-px">
        <div className="flex gap-1 rounded-2xl bg-white/[0.02] p-1 border border-white/5">
          <button
            type="button"
            onClick={() => setActiveTab('roadmap')}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98]",
              activeTab === 'roadmap'
                ? "bg-white/10 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
            )}
          >
            <Sparkles size={16} className="text-pink-400" />
            Plan d&apos;Action
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('marketing')}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98]",
              activeTab === 'marketing'
                ? "bg-white/10 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
            )}
          >
            <Megaphone size={16} className="text-indigo-400" />
            Stratégie Marketing
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98]",
              activeTab === 'chat'
                ? "bg-white/10 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
            )}
          >
            <MessageSquare size={16} className="text-fuchsia-400" />
            Conseiller IA
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === 'roadmap' && (
          <div className="flex flex-col gap-5">
            {steps.map((step, i) => {
              const isDone = completed.includes(step.step_number)
              return (
                <motion.article
                  key={step.step_number}
                  initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{
                    duration: 0.55,
                    delay: i * 0.12,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className={cn(
                    'relative overflow-hidden rounded-3xl border bg-white/5 p-7 backdrop-blur-xl transition-all sm:p-8',
                    isDone ? 'border-pink-500/30' : 'border-white/10',
                  )}
                  style={
                    isDone
                      ? { boxShadow: '0 0 30px rgba(255,102,204,0.18)' }
                      : undefined
                  }
                >
                  {/* Decorative corner glow */}
                  <div
                    className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full"
                    style={{
                      background:
                        'radial-gradient(circle, rgba(255,102,204,0.12), transparent 70%)',
                      filter: 'blur(30px)',
                    }}
                  />

                  <div className="relative flex flex-col gap-5">
                    <div className="flex items-start gap-4">
                      {/* Glowing pink step badge */}
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-pink-500/40 bg-pink-500/15 text-base font-bold text-pink-300"
                        style={{ boxShadow: '0 0 20px rgba(255,102,204,0.25)' }}
                      >
                        {step.step_number}
                      </span>
                      <h3
                        className={cn(
                          'pt-1.5 text-lg font-bold leading-snug tracking-tight sm:text-xl',
                          isDone ? 'text-zinc-400 line-through' : 'text-white',
                        )}
                      >
                        {step.title}
                      </h3>
                    </div>

                    <p className="text-[15px] leading-relaxed text-zinc-300">
                      {step.actionable_advice}
                    </p>

                    <button
                      type="button"
                      onClick={() => toggle(step.step_number)}
                      className={cn(
                        'inline-flex w-fit items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold backdrop-blur-xl transition-all active:scale-[0.97]',
                        isDone
                          ? 'border-pink-500/50 bg-pink-500/20 text-pink-100'
                          : 'border-white/12 bg-white/5 text-zinc-300 hover:border-pink-500/40 hover:text-white',
                      )}
                    >
                      {isDone ? (
                        <>
                          <Check size={15} strokeWidth={3} />
                          Complété
                        </>
                      ) : (
                        <>
                          <Circle size={15} />
                          Marquer comme complété
                        </>
                      )}
                    </button>
                  </div>
                </motion.article>
              )
            })}
          </div>
        )}

        {activeTab === 'marketing' && (
          <div className="space-y-8">
            {!hasMarketing ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-xl">
                <AlertCircle size={40} className="text-zinc-500 mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Stratégie marketing manquante</h3>
                <p className="text-sm text-zinc-400 max-w-md mb-6">
                  Vous possédez une ancienne version de roadmap sans stratégie marketing. Cliquez sur &quot;Nouveau diagnostic&quot; ci-dessus pour la générer !
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {/* Organic strategy */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl md:p-8"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-300">
                      <Sparkles size={16} />
                    </span>
                    <h3 className="text-lg font-bold text-white">Contenu Organique</h3>
                  </div>
                  <div className="text-sm leading-relaxed text-zinc-300 whitespace-pre-line">
                    {strategy?.organic}
                  </div>
                </motion.div>

                {/* Paid strategy */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl md:p-8"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-pink-500/30 bg-pink-500/10 text-pink-300">
                      <Megaphone size={16} />
                    </span>
                    <h3 className="text-lg font-bold text-white">Contenu Payant</h3>
                  </div>
                  <div className="text-sm leading-relaxed text-zinc-300 whitespace-pre-line">
                    {strategy?.paid}
                  </div>
                </motion.div>

                {/* Shorts scripts - full-width */}
                {strategy?.shorts_scripts && strategy.shorts_scripts.length > 0 && (
                  <div className="col-span-1 md:col-span-2 space-y-6">
                    <h3 className="text-xl font-bold tracking-tight text-white mt-4">
                      💡 Scripts Vidéos de Shorts Recommandés
                    </h3>
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {strategy.shorts_scripts.map((script, idx) => {
                        const isExpanded = !!expandedScripts[idx]
                        return (
                          <motion.div
                            key={idx}
                            layout
                            className={cn(
                              "group relative overflow-hidden rounded-3xl border bg-white/5 p-6 backdrop-blur-xl transition-all duration-300",
                              isExpanded ? "border-pink-500/30" : "border-white/10 hover:border-white/20"
                            )}
                          >
                            <div className="flex flex-col gap-4">
                              <div>
                                <span className="mb-2 inline-flex items-center rounded-full bg-pink-500/10 px-2.5 py-0.5 text-xs font-medium text-pink-300 border border-pink-500/20">
                                  Vidéo {idx + 1}
                                </span>
                                <h4 className="text-base font-bold text-white leading-snug group-hover:text-pink-300 transition-colors">
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
                                <span>{isExpanded ? "Masquer le script" : "Afficher le script complet"}</span>
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>

                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="space-y-4 pt-2 border-t border-white/5"
                                  >
                                    <div>
                                      <span className="inline-flex rounded-full bg-pink-500/10 px-2 py-0.5 text-[10px] font-bold text-pink-300 border border-pink-500/20 mb-1">
                                        ACCROCHE (0-3s)
                                      </span>
                                      <p className="text-sm font-medium text-white italic">
                                        &ldquo;{script.hook}&rdquo;
                                      </p>
                                    </div>
                                    <div>
                                      <span className="inline-flex rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-300 border border-indigo-500/20 mb-1">
                                        MESSAGE (3-45s)
                                      </span>
                                      <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
                                        {script.body}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="inline-flex rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/20 mb-1">
                                        CTA (45-50s)
                                      </span>
                                      <p className="text-sm font-semibold text-white">
                                        {script.cta}
                                      </p>
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

        {activeTab === 'chat' && (
          <div>
            {!hasMarketing ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-xl">
                <AlertCircle size={40} className="text-zinc-500 mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Conseiller IA indisponible</h3>
                <p className="text-sm text-zinc-400 max-w-md mb-6">
                  Vous devez générer un diagnostic complet pour pouvoir converser avec le chatbot de stratégie marketing.
                </p>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
              >
                <MarketingChatbot />
              </motion.div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
