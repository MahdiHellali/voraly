'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Puzzle,
  Rocket,
  TrendingUp,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { logoutAction } from '@/app/actions/auth'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'voraly-sidebar-collapsed'

const navItems = [
  { href: '/dashboard',           icon: LayoutDashboard, label: 'Dashboard'               },
  { href: '/dashboard/platforms', icon: Puzzle,          label: 'Plateformes connectées'  },
  { href: '/dashboard/roadmap',   icon: Rocket,          label: 'Stratégie & Roadmap'     },
  { href: '/dashboard/optimize',  icon: TrendingUp,      label: 'Optimisation des offres' },
  { href: '/dashboard/settings',  icon: Settings,        label: 'Paramètres'              },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function getDisplayName(user: User): string {
  return user.user_metadata?.full_name?.trim()
    || user.email?.split('@')[0]
    || 'Utilisateur'
}

function getInitials(user: User): string {
  const name = user.user_metadata?.full_name?.trim()
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }
  return (user.email?.[0] ?? '?').toUpperCase()
}

const MotionLink = motion.create(Link)

interface SidebarProps {
  user: User
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mounted,     setMounted]     = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved !== null) setIsCollapsed(saved === 'true')
    setMounted(true)
  }, [])

  const toggle = useCallback(() => {
    setIsCollapsed(prev => {
      const next = !prev
      localStorage.setItem(STORAGE_KEY, String(next))
      return next
    })
  }, [])

  const displayName = getDisplayName(user)
  const initials    = getInitials(user)

  return (
    <motion.aside
      className="glass-sidebar relative flex flex-col h-full flex-shrink-0 z-20 overflow-hidden"
      animate={{ width: mounted ? (isCollapsed ? 64 : 240) : 240 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      aria-label="Navigation principale"
    >
      {/* ── Logo header ── */}
      <div className={cn('flex items-center gap-3 py-5 border-b border-white/[0.06] overflow-hidden', isCollapsed ? 'justify-center px-2' : 'px-4')}>
        <motion.div
          whileHover={{ scale: 1.08, rotate: -4 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center font-black text-sm text-white"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            boxShadow:  '0 0 14px rgba(139,92,246,0.45)',
          }}
        >
          V
        </motion.div>

        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.span
              key="logo-text"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="gradient-text text-[15px] font-extrabold tracking-wide whitespace-nowrap overflow-hidden"
            >
              Voraly
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* ── Nav items ── */}
      <nav className="flex-1 flex flex-col gap-1 p-2 overflow-y-auto overflow-x-hidden">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive =
            href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(href)

          const linkEl = (
            <MotionLink
              key={href}
              href={href}
              whileTap={{ scale: 0.96 }}
              className={cn(
                'flex items-center gap-3 rounded-xl border text-sm font-medium transition-all duration-200 outline-none overflow-hidden',
                isCollapsed ? 'px-0 py-2.5 justify-center w-full' : 'px-3 py-2.5',
                isActive
                  ? [
                      'bg-gradient-to-r from-indigo-500/[0.18] to-violet-500/[0.12]',
                      'text-indigo-300 border-indigo-500/30',
                      'shadow-[0_2px_16px_rgba(99,102,241,0.18)]',
                    ].join(' ')
                  : 'border-transparent text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-100'
              )}
            >
              <Icon
                size={16}
                className={cn('flex-shrink-0', isActive ? 'text-indigo-300' : 'text-zinc-500')}
              />
              <span
                className="truncate whitespace-nowrap transition-all duration-300 overflow-hidden"
                style={{
                  maxWidth: isCollapsed ? '0px' : '180px',
                  opacity:  isCollapsed ? 0 : 1,
                }}
              >
                {label}
              </span>
            </MotionLink>
          )

          if (isCollapsed) {
            return (
              <Tooltip key={href}>
                <TooltipTrigger className="w-full">{linkEl}</TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
              </Tooltip>
            )
          }

          return <div key={href}>{linkEl}</div>
        })}
      </nav>

      {/* ── User profile ── */}
      <div className="p-2 border-t border-white/[0.06] overflow-hidden">
        <div
          className={cn(
            'flex items-center gap-3 p-2 rounded-xl overflow-hidden',
            isCollapsed && 'justify-center'
          )}
        >
          {/* Avatar */}
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.93 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black text-white cursor-default"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow:  '0 0 10px rgba(139,92,246,0.35)',
            }}
          >
            {initials}
          </motion.div>

          {/* Name + email */}
          <div
            className="min-w-0 transition-all duration-300 overflow-hidden flex-1"
            style={{ maxWidth: isCollapsed ? '0px' : '120px', opacity: isCollapsed ? 0 : 1 }}
          >
            <div className="text-xs font-semibold text-zinc-200 truncate">{displayName}</div>
            <div className="text-[10px] text-zinc-500 truncate">{user.email}</div>
          </div>

          {/* Logout icon (expanded) */}
          {!isCollapsed && (
            <form action={logoutAction} className="flex-shrink-0">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <motion.button
                      type="submit"
                      aria-label="Déconnexion"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.88 }}
                      className="p-1.5 rounded-lg text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200"
                    >
                      <LogOut size={13} />
                    </motion.button>
                  }
                />
                <TooltipContent side="right">Déconnexion</TooltipContent>
              </Tooltip>
            </form>
          )}
        </div>

        {/* Logout icon (collapsed) */}
        {isCollapsed && (
          <form action={logoutAction} className="w-full mt-1">
            <Tooltip>
              <TooltipTrigger
                render={
                  <motion.button
                    type="submit"
                    aria-label="Déconnexion"
                    whileHover={{ scale: 1.07 }}
                    whileTap={{ scale: 0.88 }}
                    className="w-full flex items-center justify-center py-2 rounded-xl text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200"
                  >
                    <LogOut size={14} />
                  </motion.button>
                }
              />
              <TooltipContent side="right">Déconnexion</TooltipContent>
            </Tooltip>
          </form>
        )}

        {/* ── Collapse toggle ── */}
        <motion.button
          onClick={toggle}
          whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
          whileTap={{ scale: 0.94 }}
          aria-label={isCollapsed ? 'Développer' : 'Réduire'}
          className="mt-1.5 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-zinc-600 hover:text-zinc-300 transition-all duration-200 text-[11px] border border-transparent hover:border-white/[0.08]"
        >
          <AnimatePresence mode="wait" initial={false}>
            {isCollapsed ? (
              <motion.span
                key="expand"
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
                transition={{ duration: 0.18 }}
              >
                <ChevronRight size={14} />
              </motion.span>
            ) : (
              <motion.span
                key="collapse"
                initial={{ opacity: 0, rotate: 90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: -90 }}
                transition={{ duration: 0.18 }}
                className="flex items-center gap-1.5"
              >
                <ChevronLeft size={14} />
                <span>Réduire</span>
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.aside>
  )
}
