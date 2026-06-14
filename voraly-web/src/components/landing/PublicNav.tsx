'use client'

/**
 * PublicNav — navigation landing double état
 *
 * État 0 (scroll < THRESHOLD) : header full-width transparent
 *   Logo (texte) | Liens centrés | CTAs droite
 *
 * État 1 (scroll ≥ THRESHOLD) : pill flottante centrée
 *   [Logo icône V] │ [Liens] │ [Commencer]
 *   Hover glissant via framer-motion layoutId
 */

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Menu, X } from 'lucide-react'

const THRESHOLD = 72 // px avant bascule pill

const NAV_LINKS = [
  { href: '/fonctionnalites', label: 'Fonctionnalités' },
  { href: '/pricing',         label: 'Tarifs'          },
  { href: '/faq',             label: 'FAQ'             },
  { href: '/a-propos',        label: 'À propos'        },
]

// ── Logo wordmark ────────────────────────────────────────────────
function LogoWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="Voraly — accueil"
      className="flex items-center gap-2 group shrink-0"
    >
      {/* Nouveau Logo Circulaire */}
      <motion.div
        whileHover={{ scale: 1.08 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        className="flex-shrink-0"
      >
        <Image
          src="/logo-circle.svg"
          alt="Voraly"
          width={compact ? 28 : 32}
          height={compact ? 28 : 32}
          className="select-none shrink-0"
          style={{
            filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.45))'
          }}
          priority
        />
      </motion.div>
      {!compact && (
        <span className="text-base font-extrabold tracking-tight text-white group-hover:text-zinc-200 transition-colors">
          Voraly
        </span>
      )}
    </Link>
  )
}

// ── NavLink avec highlight glissant ──────────────────────────────
function NavLinks({
  compact = false,
  onNavigate,
}: {
  compact?: boolean
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <ul
      className={`flex items-center ${compact ? 'gap-0.5' : 'gap-0.5'}`}
      onMouseLeave={() => setHovered(null)}
    >
      {NAV_LINKS.map(({ href, label }) => {
        const isActive = pathname === href || pathname.startsWith(href + '/')
        const isHovered = hovered === href

        return (
          <li key={href} className="relative">
            <Link
              href={href}
              onClick={onNavigate}
              onMouseEnter={() => setHovered(href)}
              className={[
                'relative z-10 block rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors duration-150',
                isActive || isHovered ? 'text-white' : 'text-zinc-400',
              ].join(' ')}
            >
              {label}
            </Link>

            {/* Highlight glissant */}
            <AnimatePresence>
              {(isHovered || isActive) && (
                <motion.div
                  layoutId={compact ? 'pill-hover' : 'header-hover'}
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: isActive
                      ? 'rgba(139,92,246,0.12)'
                      : 'rgba(255,255,255,0.07)',
                    border: isActive
                      ? '1px solid rgba(139,92,246,0.2)'
                      : '1px solid rgba(255,255,255,0.06)',
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </AnimatePresence>
          </li>
        )
      })}
    </ul>
  )
}

// ── Divider vertical ─────────────────────────────────────────────
function VDivider() {
  return (
    <div
      className="mx-2 h-4 w-px shrink-0"
      style={{ background: 'rgba(255,255,255,0.1)' }}
    />
  )
}

// ── Bouton CTA compact pill ───────────────────────────────────────
function PillCTA() {
  return (
    <Link
      href="/signup"
      className="group inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold text-white transition-all duration-200"
      style={{
        background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
        boxShadow: '0 0 18px rgba(139,92,246,0.35)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 0 28px rgba(139,92,246,0.55)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 0 18px rgba(139,92,246,0.35)'
      }}
    >
      Commencer
      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}

// ── Mobile menu drawer ────────────────────────────────────────────
function MobileMenu({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-x-4 top-20 z-50 rounded-2xl p-4 md:hidden"
          style={{
            background: 'rgba(10,10,14,0.95)',
            backdropFilter: 'blur(36px) saturate(180%)',
            WebkitBackdropFilter: 'blur(36px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          }}
        >
          <nav aria-label="Menu mobile">
            <ul className="flex flex-col gap-1">
              {NAV_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onClose}
                    className="block rounded-xl px-4 py-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/[0.05] hover:text-white"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-col gap-2 border-t border-white/[0.06] pt-3">
              <Link
                href="/login"
                onClick={onClose}
                className="block rounded-xl px-4 py-3 text-center text-sm font-medium text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-white"
              >
                Connexion
              </Link>
              <Link
                href="/signup"
                onClick={onClose}
                className="block rounded-xl px-4 py-3 text-center text-sm font-semibold text-white"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                }}
              >
                Commencer →
              </Link>
            </div>
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Composant principal ───────────────────────────────────────────
export default function PublicNav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const ticking = useRef(false)

  useEffect(() => {
    const onScroll = () => {
      if (!ticking.current) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY >= THRESHOLD)
          ticking.current = false
        })
        ticking.current = true
      }
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/* ── ÉTAT 0 : Header full-width ───────────────────────────── */}
      <AnimatePresence>
        {!scrolled && (
          <motion.div
            key="header-full"
            initial={{ opacity: 0, y: -16, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -12, filter: 'blur(6px)' }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4"
          >
            {/* Logo */}
            <LogoWordmark />

            {/* Liens centrés — desktop */}
            <nav className="hidden md:block" aria-label="Navigation principale">
              <NavLinks />
            </nav>

            {/* CTAs droite — desktop */}
            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-full px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white hover:bg-white/[0.05]"
              >
                Connexion
              </Link>
              <Link
                href="/signup"
                className="group inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold text-white transition-all duration-200"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                  boxShadow: '0 0 20px rgba(139,92,246,0.3)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    '0 0 30px rgba(139,92,246,0.5)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow =
                    '0 0 20px rgba(139,92,246,0.3)'
                }}
              >
                Commencer
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            {/* Hamburger — mobile */}
            <button
              type="button"
              className="flex md:hidden size-9 items-center justify-center rounded-full text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ÉTAT 1 : Pill flottante ───────────────────────────────── */}
      <div className="flex justify-center px-4 pt-4">
        <AnimatePresence>
          {scrolled && (
            <motion.nav
              key="pill-nav"
              aria-label="Navigation principale"
              initial={{ opacity: 0, y: -20, scale: 0.96, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -16, scale: 0.97, filter: 'blur(6px)' }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center rounded-full"
              style={{
                background: 'rgba(10,10,14,0.88)',
                backdropFilter: 'blur(40px) saturate(200%)',
                WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                border: '1px solid rgba(255,255,255,0.09)',
                boxShadow:
                  '0 8px 32px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
                padding: '5px 6px',
                gap: 0,
              }}
            >
              {/* Logo compact */}
              <div className="px-2">
                <LogoWordmark compact />
              </div>

              <VDivider />

              {/* Liens */}
              <div className="hidden md:block px-1">
                <NavLinks compact />
              </div>

              {/* Divider + CTA — desktop */}
              <div className="hidden md:flex items-center">
                <VDivider />
                <div className="px-1">
                  <PillCTA />
                </div>
              </div>

              {/* Hamburger — mobile */}
              <div className="md:hidden px-1">
                <button
                  type="button"
                  onClick={() => setMobileOpen((v) => !v)}
                  aria-label={mobileOpen ? 'Fermer' : 'Menu'}
                  aria-expanded={mobileOpen}
                  className="flex size-8 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
                </button>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>

      {/* Menu mobile (partagé entre les 2 états) */}
      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  )
}
