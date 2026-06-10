'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Puzzle,
  Rocket,
  TrendingUp,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard',           icon: LayoutDashboard, label: 'Accueil'      },
  { href: '/dashboard/platforms', icon: Puzzle,          label: 'Plateformes'  },
  { href: '/dashboard/roadmap',   icon: Rocket,          label: 'Stratégie'    },
  { href: '/dashboard/optimize',  icon: TrendingUp,      label: 'Optimiser'    },
  { href: '/dashboard/settings',  icon: Settings,        label: 'Réglages'     },
]

const tabVariants = {
  initial: {
    gap: 0,
    paddingLeft:  '0.9rem',
    paddingRight: '0.9rem',
  },
  animate: (isActive: boolean) => ({
    gap:          isActive ? '0.6rem' : 0,
    paddingLeft:  isActive ? '1.5rem' : '0.9rem',
    paddingRight: isActive ? '1.5rem' : '0.9rem',
  }),
}

const labelVariants = {
  initial: { width: 0, opacity: 0 },
  animate: { width: 'auto', opacity: 1 },
  exit:    { width: 0, opacity: 0 },
}

const spring = { delay: 0.05, type: 'spring', bounce: 0, duration: 0.55 } as const

export default function FloatingNav() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <motion.nav
        initial={{ opacity: 0, y: 28, scale: 0.92, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0,  scale: 1,    filter: 'blur(0px)' }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        className="glass-pill flex items-center gap-1 rounded-[1.75rem] p-2 pointer-events-auto"
        aria-label="Navigation principale"
      >
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive =
            href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              aria-label={label}
              className="group relative"
            >
              {/* Hover tooltip — only when the item isn't already showing its
                  inline label (i.e. not active). Fades up above the dock. */}
              {!isActive && (
                <span
                  className="pointer-events-none absolute -top-11 left-1/2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-xl border border-pink-500/20 bg-zinc-900/90 px-3 py-1.5 text-xs font-semibold text-zinc-100 opacity-0 backdrop-blur-xl transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100"
                  style={{ boxShadow: '0 0 20px rgba(255,102,204,0.18)' }}
                >
                  {label}
                  <span className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-pink-500/20 bg-zinc-900/90" />
                </span>
              )}
              <motion.div
                variants={tabVariants}
                initial={false}
                animate="animate"
                custom={isActive}
                transition={spring}
                whileTap={{ scale: 0.91, transition: { duration: 0.1, type: 'spring' } }}
                className={cn(
                  'flex items-center rounded-2xl py-3.5 text-base font-semibold',
                  'cursor-pointer select-none outline-none',
                  'transition-colors duration-200',
                  isActive
                    ? 'bg-white/[0.11] text-white'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]'
                )}
              >
                <Icon size={24} className="flex-shrink-0" />
                <AnimatePresence initial={false}>
                  {isActive && (
                    <motion.span
                      variants={labelVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={spring}
                      className="overflow-hidden whitespace-nowrap"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          )
        })}
      </motion.nav>
    </div>
  )
}
