'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { LiquidButton } from '@/components/ui/liquid-glass-button'

const NAV_LINKS = [
  { href: '/fonctionnalites', label: 'Fonctionnalités' },
  { href: '/pricing',         label: 'Tarifs'          },
  { href: '/faq',             label: 'FAQ'              },
  { href: '/a-propos',        label: 'À propos'         },
]

export default function PublicNav() {
  const pathname = usePathname()

  return (
    <motion.header
      initial={{ opacity: 0, y: -16, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-40 w-full"
    >
      <nav
        className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4"
        aria-label="Navigation principale"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group" aria-label="Voraly — accueil">
          <div className="relative h-7 w-7 shrink-0">
            <Image
              src="/volary-logo.png"
              alt="Voraly logo"
              fill
              className="object-contain transition-opacity duration-300 group-hover:opacity-80"
            />
          </div>
          <span className="text-base font-extrabold tracking-tight text-white">
            Voraly
          </span>
        </Link>

        {/* Liens centre */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={[
                  'relative rounded-xl px-3.5 py-2 text-sm font-medium transition-colors duration-200',
                  isActive
                    ? 'text-white bg-white/[0.07]'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]',
                ].join(' ')}
              >
                {label}
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 rounded-xl border border-white/[0.1] bg-white/[0.04]"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
              </Link>
            )
          })}
        </div>

        {/* CTA droite */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:inline-flex rounded-full px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/[0.05] hover:text-white"
          >
            Connexion
          </Link>
          <Link href="/signup">
            <LiquidButton size="default" className="rounded-full px-5 py-2 text-sm font-semibold text-white">
              Commencer
            </LiquidButton>
          </Link>
        </div>
      </nav>

      {/* Barre de séparation glass */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
    </motion.header>
  )
}
