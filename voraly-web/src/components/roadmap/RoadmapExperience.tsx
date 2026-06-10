'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import type { Phase, RoadmapStep } from '@/lib/roadmap/types'
import EmptyState from './EmptyState'
import QuestionnaireFlow from './QuestionnaireFlow'
import CinematicLoader from './CinematicLoader'
import RoadmapResult from './RoadmapResult'

// Human-readable mapping for the structured errors returned by the route handler.
const ERROR_COPY: Record<string, string> = {
  workflow_not_listening:
    'Le workflow n8n n’est pas à l’écoute. Ouvrez-le dans l’éditeur et cliquez sur « Listen for test event », puis réessayez.',
  workflow_failed: 'Le workflow a renvoyé une erreur. Réessayez dans un instant.',
  workflow_unreachable:
    'Impossible de joindre le service de génération. Vérifiez que n8n est démarré.',
  empty_roadmap:
    'La génération n’a renvoyé aucune étape. Réessayez avec des réponses plus détaillées.',
  unauthorized: 'Votre session a expiré. Reconnectez-vous puis réessayez.',
}

export default function RoadmapExperience({
  initialSteps,
  initialCompleted,
  userId,
}: {
  initialSteps: RoadmapStep[]
  initialCompleted: number[]
  userId: string | null
}) {
  const [phase, setPhase] = useState<Phase>(
    initialSteps.length > 0 ? 'roadmap' : 'empty',
  )
  const [steps, setSteps] = useState<RoadmapStep[]>(initialSteps)
  // Seed for RoadmapResult's checkpoint state. Resets to [] whenever a new
  // roadmap is generated so the fresh plan starts with nothing checked.
  const [completedSeed, setCompletedSeed] = useState<number[]>(initialCompleted)
  const [error, setError] = useState<string | null>(null)

  async function handleComplete(answers: Record<string, string>) {
    setError(null)
    setPhase('loading')
    try {
      const res = await fetch('/api/roadmap/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })
      const data = (await res.json().catch(() => null)) as
        | { roadmap_steps?: RoadmapStep[]; error?: string }
        | null

      if (!res.ok || !data?.roadmap_steps?.length) {
        setError(data?.error ?? 'workflow_failed')
        setPhase('empty')
        return
      }

      setSteps(data.roadmap_steps)
      setCompletedSeed([]) // fresh plan → clear carried-over checkpoints
      setPhase('roadmap')
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
            ✦ IA · Diagnostic stratégique
          </p>
          <h1 className="mb-2 text-2xl font-extrabold tracking-tight text-white">
            Stratégie & Roadmap
          </h1>
          <p className="text-sm text-zinc-400">
            Votre plan d’action personnalisé pour trouver plus de clients, généré
            par l’IA Voraly.
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
            <span>{ERROR_COPY[error] ?? 'Une erreur est survenue. Réessayez.'}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase stage */}
      <AnimatePresence mode="wait">
        {phase === 'empty' && (
          <EmptyState
            key="empty"
            regenerate={steps.length > 0}
            onStart={() => {
              setError(null)
              setPhase('questionnaire')
            }}
          />
        )}

        {phase === 'questionnaire' && (
          <QuestionnaireFlow
            key="questionnaire"
            onComplete={handleComplete}
            onCancel={() => setPhase(steps.length > 0 ? 'roadmap' : 'empty')}
          />
        )}

        {phase === 'loading' && <CinematicLoader key="loading" />}

        {phase === 'roadmap' && (
          <RoadmapResult
            key="roadmap"
            steps={steps}
            initialCompleted={completedSeed}
            userId={userId}
            onRestart={() => setPhase('questionnaire')}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
