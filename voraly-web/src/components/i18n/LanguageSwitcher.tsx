'use client'

import { useLocale } from 'next-intl'
import { useState, useTransition, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Languages } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { LOCALES, LOCALE_LABELS, type Locale } from '@/i18n/config'
import { setUserLocale } from '@/i18n/actions'

/**
 * Sélecteur de langue FR/EN — DA liquid-glass.
 *
 * Variantes :
 *   - "pill"   : bouton rond compact (nav landing, topbar dashboard).
 *   - "inline" : rangée pleine largeur (menu mobile / réglages).
 *
 * Écrit le choix via la server action setUserLocale (cookie), puis
 * router.refresh() pour re-rendre les Server Components dans la nouvelle langue.
 */
export default function LanguageSwitcher({
  variant = 'pill',
  align = 'right',
}: {
  variant?: 'pill' | 'inline'
  align?: 'left' | 'right'
}) {
  const locale = useLocale() as Locale
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Ferme au clic extérieur (variante pill).
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  function selectLocale(next: Locale) {
    setOpen(false)
    if (next === locale) return
    startTransition(async () => {
      await setUserLocale(next)
      router.refresh()
    })
  }

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-2" aria-busy={isPending}>
        {LOCALES.map((code) => {
          const active = code === locale
          return (
            <button
              key={code}
              type="button"
              onClick={() => selectLocale(code)}
              disabled={isPending}
              aria-pressed={active}
              className={[
                'flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                active
                  ? 'bg-violet-500/15 text-white border border-violet-500/30'
                  : 'text-zinc-400 border border-white/[0.06] hover:bg-white/[0.05] hover:text-white',
              ].join(' ')}
            >
              {LOCALE_LABELS[code]}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={LOCALE_LABELS[locale]}
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold uppercase text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
      >
        <Languages className="size-4" />
        <span className="tracking-wide">{locale}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className={[
              'absolute top-11 z-50 w-44 overflow-hidden rounded-2xl p-1',
              align === 'right' ? 'right-0' : 'left-0',
            ].join(' ')}
            style={{
              background: 'rgba(10,10,14,0.92)',
              backdropFilter: 'blur(36px) saturate(180%)',
              WebkitBackdropFilter: 'blur(36px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.09)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            {LOCALES.map((code) => {
              const active = code === locale
              return (
                <button
                  key={code}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  onClick={() => selectLocale(code)}
                  className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  {LOCALE_LABELS[code]}
                  {active && <Check className="size-4 text-violet-400" />}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
