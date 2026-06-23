'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import type { Phase, RoadmapStep, Question } from '@/lib/roadmap/types'
import EmptyState from './EmptyState'
import QuestionnaireFlow from './QuestionnaireFlow'
import CinematicLoader from './CinematicLoader'
import RoadmapResult from './RoadmapResult'

export default function RoadmapExperience({
  initialSteps,
  initialCompleted,
  initialMarketingStrategy,
  userId,
  isPremium,
}: {
  initialSteps: RoadmapStep[]
  initialCompleted: number[]
  initialMarketingStrategy: unknown
  userId: string | null
  isPremium: boolean
}) {
  const t = useTranslations('roadmap.experience')
  const resolveError = (code: string) =>
    t.has(`errors.${code}`) ? t(`errors.${code}`) : t('errors.generic')
  const [phase, setPhase] = useState<Phase>(
    initialSteps.length > 0 ? 'roadmap' : 'empty',
  )
  const [steps, setSteps] = useState<RoadmapStep[]>(initialSteps)
  const [marketingStrategy, setMarketingStrategy] = useState<unknown>(initialMarketingStrategy)
  const [customQuestions, setCustomQuestions] = useState<Question[]>([])

  // Seed for RoadmapResult's checkpoint state. Resets to [] whenever a new
  // roadmap is generated so the fresh plan starts with nothing checked.
  const [completedSeed, setCompletedSeed] = useState<number[]>(initialCompleted)
  const [error, setError] = useState<string | null>(null)

  async function handleStartQuestionnaire() {
    setError(null)
    setPhase('analyzing')
    try {
      const res = await fetch('/api/roadmap/questions')
      if (!res.ok) {
        throw new Error('failed_to_fetch_questions')
      }
      const data = await res.json()
      setCustomQuestions(data.questions || [])
      setPhase('questionnaire')
    } catch (err) {
      console.error('Failed to load dynamic questions, falling back to defaults', err)
      // Fallback is handled by the API endpoint, but if that also fails or crashes,
      // the empty state will recover gracefully.
      setPhase('questionnaire')
    }
  }

  async function handleComplete(answers: Record<string, string>) {
    setError(null)
    setPhase('loading')
    try {
      // La génération est lancée en tâche de fond : 202 = démarrée, on poll ensuite.
      const res = await fetch('/api/roadmap/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })

      if (res.status !== 202) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null
        setError(data?.error ?? 'workflow_failed')
        setPhase('empty')
        return
      }

      // Polling de l'état jusqu'à done/error (n8n borné à 90 s côté serveur).
      const deadline = Date.now() + 150_000
      let unknownStreak = 0
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 3_000))
        const poll = await fetch('/api/roadmap/generate', { cache: 'no-store' })
        const status = (await poll.json().catch(() => null)) as
          | {
              status?: string
              error?: string
              roadmap_steps?: RoadmapStep[]
              marketing_strategy?: unknown
            }
          | null

        if (status?.status === 'done' && status.roadmap_steps?.length) {
          setSteps(status.roadmap_steps)
          setMarketingStrategy(status.marketing_strategy)
          setCompletedSeed([]) // fresh plan → clear carried-over checkpoints
          setPhase('roadmap')
          return
        }
        if (status?.status === 'error') {
          setError(status.error ?? 'workflow_failed')
          setPhase('empty')
          return
        }
        // 'unknown' = job perdu (ex. redéploiement) : on tolère 3 essais puis on rend la main.
        if (status?.status === 'unknown') {
          if (++unknownStreak >= 3) break
        } else {
          unknownStreak = 0
        }
      }

      setError('workflow_unreachable')
      setPhase('empty')
    } catch {
      setError('workflow_unreachable')
      setPhase('empty')
    }
  }

  return (
    <div className="flex w-full flex-col gap-8 fade-1">
      {/* Header — shown only on the initial 'empty' phase. The questionnaire,
          loader, and roadmap each own their cinematic full-bleed environment. */}
      {phase === 'empty' && (
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-pink-400">
            {t('eyebrow')}
          </p>
          <h1 className="mb-2 text-2xl font-extrabold tracking-tight text-white">
            {t('title')}
          </h1>
          <p className="text-sm text-zinc-400">
            {t('subtitle')}
          </p>
        </div>
      )}

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-5 py-4 text-sm text-amber-200"
          >
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <span>{resolveError(error)}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase stage */}
      <AnimatePresence mode="wait">
        {phase === 'empty' && (
          <EmptyState
            key="empty"
            regenerate={steps.length > 0}
            onStart={handleStartQuestionnaire}
          />
        )}

        {phase === 'analyzing' && (
          <CinematicLoader
            key="analyzing"
            messages={t.raw('analyzingMessages') as string[]}
          />
        )}

        {phase === 'questionnaire' && (
          <QuestionnaireFlow
            key="questionnaire"
            questions={customQuestions}
            onComplete={handleComplete}
            onCancel={() => setPhase(steps.length > 0 ? 'roadmap' : 'empty')}
          />
        )}

        {phase === 'loading' && <CinematicLoader key="loading" />}

        {phase === 'roadmap' && (
          <RoadmapResult
            key="roadmap"
            steps={steps}
            marketingStrategy={marketingStrategy}
            initialCompleted={completedSeed}
            userId={userId}
            isPremium={isPremium}
            onRestart={handleStartQuestionnaire}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
