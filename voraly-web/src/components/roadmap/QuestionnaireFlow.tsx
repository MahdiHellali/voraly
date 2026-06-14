'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, ArrowLeft, Sparkles, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { QUESTIONS, type Question } from '@/lib/roadmap/types'

// Phase 'questionnaire' — exactly one question on screen at a time. Answers are
// held locally and only handed back to the orchestrator on the final step.
export default function QuestionnaireFlow({
  questions = [],
  onComplete,
  onCancel,
}: {
  questions?: Question[]
  onComplete: (answers: Record<string, string>) => void
  onCancel: () => void
}) {
  const activeQuestions = questions.length > 0 ? questions : QUESTIONS
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const question = activeQuestions[index]
  const total = activeQuestions.length
  const isLast = index === total - 1
  const current = answers[question.id]?.trim() ?? ''
  const canAdvance = current.length > 0

  const setAnswer = (value: string) =>
    setAnswers((prev) => ({ ...prev, [question.id]: value }))

  const goNext = () => {
    if (!canAdvance) return
    if (isLast) {
      onComplete(answers)
      return
    }
    setDirection(1)
    setIndex((i) => i + 1)
  }

  const goBack = () => {
    if (index === 0) {
      onCancel()
      return
    }
    setDirection(-1)
    setIndex((i) => i - 1)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto flex min-h-[52vh] w-full max-w-2xl flex-col"
    >
      {/* Progress */}
      <div className="mb-10 flex items-center gap-3">
        {activeQuestions.map((q, i) => (
          <div
            key={q.id}
            className="h-1 flex-1 overflow-hidden rounded-full bg-white/8"
          >
            <motion.div
              className="h-full rounded-full bg-pink-400"
              initial={false}
              animate={{ width: i < index ? '100%' : i === index ? '50%' : '0%' }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              style={{ boxShadow: '0 0 12px rgba(255,102,204,0.5)' }}
            />
          </div>
        ))}
      </div>

      {/* Question card */}
      <div className="relative flex-1">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={question.id}
            custom={direction}
            initial={{ opacity: 0, x: direction * 48, filter: 'blur(6px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: direction * -48, filter: 'blur(6px)' }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col"
          >
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-pink-400">
              {String(index + 1).padStart(2, '0')} · {question.eyebrow}
            </p>
            <h2 className="mb-8 text-balance text-2xl font-bold leading-snug tracking-tight text-white sm:text-[28px]">
              {question.label}
            </h2>

            {question.kind === 'text' && (
              <input
                autoFocus
                type="text"
                value={current}
                placeholder={question.placeholder}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && goNext()}
                className="w-full rounded-3xl border border-white/10 bg-white/5 px-6 py-5 text-base text-white outline-none backdrop-blur-xl transition-colors placeholder:text-zinc-500 focus:border-pink-500/50"
                style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
              />
            )}

            {(question.kind === 'select' || question.kind === 'toggle') && (
              <div
                className={cn(
                  'grid gap-3',
                  question.kind === 'toggle'
                    ? 'grid-cols-1 sm:grid-cols-2'
                    : 'grid-cols-1',
                )}
              >
                {question.options?.map((opt) => {
                  const selected = current === opt
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAnswer(opt)}
                      className={cn(
                        'group flex items-center justify-between rounded-2xl border px-6 py-4 text-left text-base font-medium backdrop-blur-xl transition-all active:scale-[0.98]',
                        selected
                          ? 'border-pink-500/60 bg-pink-500/15 text-white'
                          : 'border-white/10 bg-white/5 text-zinc-300 hover:border-white/20 hover:bg-white/[0.07]',
                      )}
                      style={
                        selected
                          ? { boxShadow: '0 0 24px rgba(255,102,204,0.25)' }
                          : undefined
                      }
                    >
                      {opt}
                      <span
                        className={cn(
                          'flex h-5 w-5 items-center justify-center rounded-full border transition-colors',
                          selected
                            ? 'border-pink-400 bg-pink-400 text-zinc-950'
                            : 'border-white/20 text-transparent',
                        )}
                      >
                        <Check size={12} strokeWidth={3} />
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="mt-10 flex items-center justify-between">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
        >
          <ArrowLeft size={16} />
          {index === 0 ? 'Annuler' : 'Précédent'}
        </button>

        <motion.button
          type="button"
          onClick={goNext}
          disabled={!canAdvance}
          whileTap={canAdvance ? { scale: 0.95 } : undefined}
          className={cn(
            'inline-flex items-center gap-2 rounded-full border px-7 py-3 text-sm font-semibold backdrop-blur-xl transition-all',
            canAdvance
              ? 'border-pink-500/40 bg-pink-500/15 text-pink-100 hover:bg-pink-500/25'
              : 'cursor-not-allowed border-white/10 bg-white/5 text-zinc-600',
          )}
          style={
            canAdvance
              ? { boxShadow: '0 0 24px rgba(255,102,204,0.25)' }
              : undefined
          }
        >
          {isLast ? (
            <>
              <Sparkles size={16} />
              Générer ma roadmap
            </>
          ) : (
            <>
              Suivant
              <ArrowRight size={16} />
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  )
}
