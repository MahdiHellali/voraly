'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

// Phase 'loading' — a glowing frosted-glass ring breathing with neon-pink rim
// light, under cycling minimalist micro-copy.
const MESSAGES = [
  'Analyse de votre positionnement…',
  'Calcul des opportunités de marché…',
  'Cartographie de vos leviers de croissance…',
  'Génération de votre plan d’action personnalisé…',
]

export default function CinematicLoader() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const id = setInterval(
      () => setStep((s) => (s + 1) % MESSAGES.length),
      3000,
    )
    return () => clearInterval(id)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(8px)' }}
      transition={{ duration: 0.5 }}
      className="flex min-h-[56vh] w-full flex-col items-center justify-center gap-12"
    >
      {/* Glowing frosted sphere / ring */}
      <div className="relative flex h-48 w-48 items-center justify-center">
        {/* Ambient bloom */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(255,102,204,0.35) 0%, transparent 65%)',
            filter: 'blur(28px)',
          }}
          animate={{ scale: [1, 1.18, 1], opacity: [0.55, 0.9, 0.55] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Rotating rim-lit ring */}
        <motion.div
          className="absolute h-40 w-40 rounded-full"
          style={{
            background:
              'conic-gradient(from 0deg, transparent, rgba(255,102,204,0.9), transparent 55%)',
            maskImage:
              'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))',
            WebkitMaskImage:
              'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />

        {/* Frosted core */}
        <motion.div
          className="relative h-28 w-28 rounded-full border border-white/15 bg-white/5 backdrop-blur-xl"
          style={{
            boxShadow:
              '0 0 40px rgba(255,102,204,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div
            className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(255,182,224,0.55), transparent 70%)',
            }}
          />
        </motion.div>
      </div>

      {/* Cycling micro-copy */}
      <div className="flex h-6 items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={step}
            initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-sm font-medium tracking-wide text-zinc-300"
          >
            {MESSAGES[step]}
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
