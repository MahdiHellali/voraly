'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, CheckCircle2, Circle, RefreshCw } from 'lucide-react'
import { LiquidButton } from '@/components/ui/liquid-glass-button'

interface Task {
  id: string
  text: string
  done: boolean
  priority: 'high' | 'medium' | 'low'
}

const initialTasks: Task[] = [
  { id: '1', text: 'Mettre à jour la photo de profil Upwork avec un fond professionnel', done: true,  priority: 'high'   },
  { id: '2', text: 'Rédiger 3 nouvelles offres spécialisées en développement Next.js',   done: false, priority: 'high'   },
  { id: '3', text: 'Répondre aux 2 invitations de projets en attente sur Fiverr',        done: false, priority: 'medium' },
  { id: '4', text: 'Optimiser la description Malt avec les mots-clés IA/automation',     done: false, priority: 'medium' },
  { id: '5', text: 'Collecter 2 nouveaux avis clients après livraison',                  done: false, priority: 'low'    },
]

const priorityDot: Record<string, string> = {
  high:   'bg-rose-500',
  medium: 'bg-orange-400',
  low:    'bg-emerald-400',
}

export default function AiTaskCard() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)

  const completed = tasks.filter((t) => t.done).length
  const total     = tasks.length
  const progress  = Math.round((completed / total) * 100)

  const toggle = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  }

  return (
    <div
      className="glass rounded-2xl p-6"
      style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
    >
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
            IA
          </motion.div>
          <div>
            <div className="text-sm font-bold text-zinc-100">To-Do IA — Roadmap Marketing</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">
              Générée automatiquement · Semaine du 2 juin
            </div>
          </div>
        </div>

        {/* ── Animated progress bar ── */}
        <div className="flex items-center gap-3">
          <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
              style={{ background: 'linear-gradient(to right, #6366f1, #8b5cf6)' }}
            />
          </div>
          <span className="text-[11px] font-bold text-zinc-300">{completed}/{total}</span>
        </div>
      </div>

      {/* ── Task list ── */}
      <div className="flex flex-col gap-2 mb-4">
        {tasks.map((task) => (
          <motion.button
            key={task.id}
            onClick={() => toggle(task.id)}
            whileTap={{ scale: 0.98 }}
            className="flex items-start gap-3 p-3 rounded-xl text-left transition-all duration-200 hover:bg-white/[0.04] group w-full"
          >
            {/* ── Checkbox icon — animates on toggle ── */}
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

            {/* Priority dot */}
            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${priorityDot[task.priority]}`} />

            {/* Text — fades & dims when done */}
            <motion.span
              animate={{ opacity: task.done ? 0.38 : 1 }}
              transition={{ duration: 0.25 }}
              className={`text-[13px] leading-snug transition-colors ${
                task.done ? 'line-through text-zinc-600' : 'text-zinc-300 group-hover:text-zinc-100'
              }`}
            >
              {task.text}
            </motion.span>
          </motion.button>
        ))}
      </div>

      {/* ── Regenerate button — primary action → Liquid Glass Button ── */}
      <LiquidButton size="lg" className="group/liquid w-full text-[13px] font-semibold text-zinc-100">
        <span className="flex items-center justify-center gap-2">
          <Sparkles size={14} className="text-indigo-400" />
          Régénérer les recommandations IA
          <RefreshCw
            size={12}
            className="text-zinc-400 transition-transform duration-500 group-hover/liquid:rotate-180"
          />
        </span>
      </LiquidButton>
    </div>
  )
}
