'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Circle, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { RoadmapStep } from '@/lib/roadmap/types'

// Phase 'roadmap' — the generated strategy as a majestic 3-step bento sequence.
// Completed checkpoints persist to profiles.completed_steps (JSONB array of
// step numbers) with optimistic UI: the toggle flips instantly and reverts if
// the Supabase write fails.
export default function RoadmapResult({
  steps,
  initialCompleted,
  userId,
  onRestart,
}: {
  steps: RoadmapStep[]
  /** Step numbers already completed, restored from the DB on the server. */
  initialCompleted: number[]
  /** Authenticated user id (RLS owner); null disables persistence. */
  userId: string | null
  onRestart: () => void
}) {
  const [completed, setCompleted] = useState<number[]>(initialCompleted)
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
            ✦ Votre plan d’action
          </p>
          <h2 className="text-balance text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Votre roadmap de croissance
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

      {/* Step cards */}
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
    </motion.div>
  )
}
