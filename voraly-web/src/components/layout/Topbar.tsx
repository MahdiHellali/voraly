'use client'

import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Bell } from 'lucide-react'

const pageTitles: Record<string, string> = {
  '/dashboard':            "Vue d'ensemble",
  '/dashboard/platforms':  'Plateformes',
  '/dashboard/roadmap':    'Stratégie',
  '/dashboard/optimize':   'Optimiser',
  '/dashboard/settings':   'Réglages',
}

export default function Topbar() {
  const pathname = usePathname()
  const title = pageTitles[pathname] ?? 'Dashboard'

  const now = new Date()
  const dateStr = now.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
  })
  const dateCapitalized = dateStr.charAt(0).toUpperCase() + dateStr.slice(1)

  return (
    <motion.header
      initial={{ opacity: 0, y: -14, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0,   filter: 'blur(0px)' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="mb-12 flex items-end justify-between"
    >
      {/* ── Titre de page ── */}
      <div>
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.16em] mb-2">
          {dateCapitalized}
        </p>
        <motion.h1
          key={title}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="text-[28px] font-black text-white tracking-tight leading-none"
        >
          {title}
        </motion.h1>
      </div>

      {/* ── Actions ── */}
      <div className="flex items-center gap-1">
        <motion.button
          whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.07)' }}
          whileTap={{ scale: 0.88, transition: { duration: 0.08 } }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          aria-label="Notifications"
          className="relative p-2.5 rounded-xl text-zinc-600 hover:text-white transition-colors duration-150"
        >
          <Bell size={18} />
          <span
            className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-rose-500"
            style={{ boxShadow: '0 0 6px rgba(244,63,94,0.9)' }}
          />
        </motion.button>
      </div>
    </motion.header>
  )
}
