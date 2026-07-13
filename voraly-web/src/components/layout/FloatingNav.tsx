'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
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
  { href: '/dashboard',           icon: LayoutDashboard, key: 'overview'   },
  { href: '/dashboard/platforms', icon: Puzzle,          key: 'platforms'  },
  { href: '/dashboard/roadmap',   icon: Rocket,          key: 'roadmap'    },
  { href: '/dashboard/optimize',  icon: TrendingUp,      key: 'optimize'   },
  { href: '/dashboard/settings',  icon: Settings,        key: 'settings'   },
] as const

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
const HIDE_DELAY = 3000 // 3s avant auto-hide
const REVEAL_THRESHOLD = 80 // px depuis le bas pour révéler

export default function FloatingNav() {
  const pathname = usePathname()
  const t = useTranslations('dashboard.nav')
  const [hidden, setHidden] = useState(false)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isDesktop = useRef(false)

  useEffect(() => {
    isDesktop.current = window.innerWidth >= 768

    const handleMouseMove = (e: MouseEvent) => {
      const bottomDist = window.innerHeight - e.clientY

      // Révéler si la souris s'approche du bas
      if (bottomDist <= REVEAL_THRESHOLD) {
        setHidden(false)
      }

      // Reset du timer de cache
      if (hideTimer.current) clearTimeout(hideTimer.current)
      if (isDesktop.current) {
        hideTimer.current = setTimeout(() => {
          setHidden(true)
        }, HIDE_DELAY)
      }
    }

    const handleMouseLeave = () => {
      // Si la souris quitte la fenêtre, cacher après délai
      if (hideTimer.current) clearTimeout(hideTimer.current)
      if (isDesktop.current) {
        hideTimer.current = setTimeout(() => {
          setHidden(true)
        }, HIDE_DELAY)
      }
    }

    // Initialiser le timer au montage
    if (isDesktop.current) {
      hideTimer.current = setTimeout(() => setHidden(true), HIDE_DELAY)
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true })

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  }, [])

  return (
    <div className="fixed bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <AnimatePresence>
        {!hidden && (
          <motion.nav
            key="floating-nav"
            initial={{ opacity: 0, y: 28, scale: 0.92, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0,  scale: 1,    filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(4px)' }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="glass-pill flex items-center gap-1 rounded-[1.75rem] p-1.5 sm:p-2 pointer-events-auto"
            aria-label="Navigation principale"
            onMouseEnter={() => setHidden(false)}
          >
            {navItems.map(({ href, icon: Icon, key }) => {
              const isActive =
                href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(href)
              const label = t(key)

              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={label}
                  className="group relative"
                >
                  {/* Hover tooltip */}
                  {!isActive && (
                    <span
                      className="pointer-events-none absolute -top-11 left-1/2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-xl border border-theme bg-theme-glass px-3 py-1.5 text-xs font-semibold text-theme-primary opacity-0 backdrop-blur-xl transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100"
                      style={{ boxShadow: '0 0 20px rgba(255,102,204,0.18)' }}
                    >
                      {label}
                      <span className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-theme bg-theme-glass" />
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
                      'flex items-center rounded-2xl py-3 sm:py-3.5 text-base font-semibold',
                      'cursor-pointer select-none outline-none',
                      'transition-colors duration-200',
                      isActive
                        ? 'bg-white/[0.11] text-white'
                        : 'text-theme-secondary hover:text-zinc-200 hover:bg-white/[0.04]'
                    )}
                  >
                    <Icon size={20} className="flex-shrink-0 sm:size-6" />
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
        )}
      </AnimatePresence>
    </div>
  )
}
