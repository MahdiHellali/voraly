'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { label: 'Fonctionnalités', href: '/fonctionnalites' },
  { label: 'Tarifs', href: '/pricing' },
  { label: 'À propos', href: '/a-propos' },
]

interface MarketingNavProps {
  isAuthed?: boolean
}

export default function MarketingNav({ isAuthed = false }: MarketingNavProps) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <motion.nav
        initial={{ opacity: 0, y: -16, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        aria-label="Navigation principale"
        className={cn(
          'flex w-full max-w-5xl items-center justify-between gap-4 rounded-full px-4 py-2.5 transition-all duration-300 sm:px-6',
          scrolled ? 'glass-pill' : 'border border-transparent bg-transparent'
        )}
      >
        {/* Wordmark */}
        <Link
          href="/"
          className="gradient-text shrink-0 text-lg font-black tracking-tight"
          aria-label="Voraly — Accueil"
        >
          Voraly
        </Link>

        {/* Desktop links */}
        <ul className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="rounded-full px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:text-white"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-2 md:flex">
          {isAuthed ? (
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-1.5 rounded-full bg-pink-500/90 px-5 py-2 text-sm font-semibold text-white shadow-[0_0_24px_rgba(255,102,204,0.35)] transition-all hover:bg-pink-400 hover:shadow-[0_0_32px_rgba(255,102,204,0.5)]"
            >
              Tableau de bord
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-zinc-200 backdrop-blur-xl transition-colors hover:border-white/20 hover:text-white"
              >
                Se connecter
              </Link>
              <Link
                href="/login"
                className="group inline-flex items-center gap-1.5 rounded-full bg-pink-500/90 px-5 py-2 text-sm font-semibold text-white shadow-[0_0_24px_rgba(255,102,204,0.35)] transition-all hover:bg-pink-400 hover:shadow-[0_0_32px_rgba(255,102,204,0.5)]"
              >
                Commencer
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={open}
          className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-200 backdrop-blur-xl md:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="glass-pill absolute inset-x-4 top-20 rounded-3xl p-4 md:hidden"
          >
            <ul className="flex flex-col gap-1">
              {links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-2xl px-4 py-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-col gap-2 border-t border-white/10 pt-3">
              {isAuthed ? (
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="rounded-2xl bg-pink-500/90 px-4 py-3 text-center text-sm font-semibold text-white"
                >
                  Tableau de bord
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-medium text-zinc-200"
                  >
                    Se connecter
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="rounded-2xl bg-pink-500/90 px-4 py-3 text-center text-sm font-semibold text-white"
                  >
                    Commencer
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
