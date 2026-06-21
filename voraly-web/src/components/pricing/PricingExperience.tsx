'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { WhopCheckoutEmbed } from '@whop/checkout/react'
import type {
  CheckoutErrorResponse,
  CheckoutSessionResponse,
} from '@/lib/whop/types'
import ProCard from './ProCard'

// ─── Voraly Pro · Expérience de conversion ────────────────────────────────────
// Machine à états du tunnel d'upgrade. Le paiement Whop est entièrement
// embarqué (iframe) : l'utilisateur ne quitte jamais l'application.

type CheckoutPhase = 'idle' | 'creating' | 'checkout' | 'success'

// Loader compact — anneau rose pulsant, version condensée du CinematicLoader.
function CompactLoader({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16">
      <div className="relative flex h-16 w-16 items-center justify-center">
        {/* Halo ambiant */}
        <motion.div
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(255,102,204,0.4) 0%, transparent 70%)',
            filter: 'blur(12px)',
          }}
          animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Anneau rotatif rim-light */}
        <motion.div
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{
            background:
              'conic-gradient(from 0deg, transparent, rgba(255,102,204,0.9), transparent 55%)',
            maskImage:
              'radial-gradient(farthest-side, transparent calc(100% - 2.5px), #000 calc(100% - 1.5px))',
            WebkitMaskImage:
              'radial-gradient(farthest-side, transparent calc(100% - 2.5px), #000 calc(100% - 1.5px))',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
        />
        {/* Cœur lumineux */}
        <div
          className="h-2.5 w-2.5 rounded-full bg-pink-400"
          style={{ boxShadow: '0 0 14px rgba(255,102,204,0.8)' }}
        />
      </div>
      <p className="text-sm font-medium tracking-wide text-zinc-300">{label}</p>
    </div>
  )
}

export default function PricingExperience({
  isAuthenticated,
  isPremium,
}: {
  isAuthenticated: boolean
  isPremium: boolean
}) {
  const router = useRouter()
  const t = useTranslations('pricingPage')
  const resolveError = (code: string) =>
    t.has(`errors.${code}`) ? t(`errors.${code}`) : t('errors.fallback')
  const [phase, setPhase] = useState<CheckoutPhase>('idle')
  // Peut basculer à true côté client si l'API répond 'already_premium'.
  const [premium, setPremium] = useState(isPremium)
  const [session, setSession] = useState<CheckoutSessionResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleUpgrade() {
    setError(null)
    setPhase('creating')
    try {
      // L'identité vient de la session Supabase côté serveur — aucun body.
      const res = await fetch('/api/checkout', { method: 'POST' })
      const data = (await res.json().catch(() => null)) as
        | CheckoutSessionResponse
        | CheckoutErrorResponse
        | null

      if (
        res.ok &&
        data &&
        'sessionId' in data &&
        typeof data.sessionId === 'string' &&
        typeof data.planId === 'string'
      ) {
        setSession({ sessionId: data.sessionId, planId: data.planId })
        setPhase('checkout')
        return
      }

      const code = data && 'error' in data ? data.error : 'whop_error'
      if (code === 'already_premium') {
        // Rien à acheter : on bascule calmement vers l'état « membre Pro ».
        setPremium(true)
        setPhase('idle')
        return
      }
      setError(resolveError(code))
      setPhase('idle')
    } catch {
      setError(t('errors.fallback'))
      setPhase('idle')
    }
  }

  function goToDashboard() {
    // Le webhook Whop active is_premium côté serveur — refresh pour récupérer
    // le statut à jour dès l'arrivée sur le tableau de bord.
    router.refresh()
    router.push('/dashboard')
  }

  return (
    // Le body est en overflow:hidden global — cette page (hors layout
    // dashboard) fournit donc son propre conteneur de scroll.
    <main className="h-dvh overflow-y-auto">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12">
        {/* Retour */}
        <div>
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-200"
          >
            <ArrowLeft
              size={16}
              className="transition-transform duration-300 group-hover:-translate-x-0.5"
            />
            {t('backToDashboard')}
          </Link>
        </div>

        {/* Bannière d'erreur */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-5 py-4 text-sm text-amber-200"
            >
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scène — les changements de phase sont annoncés aux lecteurs d'écran */}
        <div aria-live="polite" className="flex w-full flex-col">
          <AnimatePresence mode="wait">
            {phase === 'idle' && (
              <ProCard
                key="idle"
                isAuthenticated={isAuthenticated}
                isPremium={premium}
                onUpgrade={handleUpgrade}
              />
            )}

            {phase === 'creating' && (
              <motion.section
                key="creating"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, filter: 'blur(8px)' }}
                transition={{ duration: 0.4 }}
                className="mx-auto w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl"
              >
                <CompactLoader label={t('preparing')} />
              </motion.section>
            )}

            {phase === 'checkout' && session && (
              <motion.section
                key="checkout"
                initial={{ filter: 'blur(6px)', opacity: 0, y: 20 }}
                animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
                exit={{ filter: 'blur(6px)', opacity: 0, y: -20 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="mx-auto flex w-full max-w-2xl flex-col gap-5 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl sm:p-7"
              >
                <div className="flex flex-col gap-1.5 px-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-pink-400">
                    {t('securePayment')}
                  </p>
                  <p className="text-sm text-zinc-400">
                    {t('finalizeSubtitle')}
                  </p>
                </div>

                {/* min-h pour éviter tout saut de mise en page pendant le
                    chargement de l'iframe Whop. */}
                <div className="min-h-[560px] overflow-hidden rounded-2xl">
                  <WhopCheckoutEmbed
                    planId={session.planId}
                    sessionId={session.sessionId}
                    theme="dark"
                    skipRedirect
                    fallback={
                      <CompactLoader label={t('loadingPayment')} />
                    }
                    onComplete={() => setPhase('success')}
                  />
                </div>

                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setPhase('idle')}
                    className="rounded-full px-6 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-200 active:scale-95"
                  >
                    {t('cancel')}
                  </button>
                </div>
              </motion.section>
            )}

            {phase === 'success' && (
              <motion.section
                key="success"
                initial={{ filter: 'blur(6px)', opacity: 0, y: 20 }}
                animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
                exit={{ filter: 'blur(6px)', opacity: 0, y: -20 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="relative mx-auto flex w-full max-w-xl flex-col items-center gap-7 overflow-hidden rounded-3xl border border-white/10 bg-white/5 px-8 py-14 text-center backdrop-blur-xl sm:px-12"
              >
                {/* Halo décoratif rose */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full"
                  style={{
                    background:
                      'radial-gradient(circle, rgba(255,102,204,0.16) 0%, transparent 70%)',
                    filter: 'blur(40px)',
                  }}
                />

                {/* Médaillon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 260,
                    damping: 18,
                    delay: 0.15,
                  }}
                  className="relative flex h-20 w-20 items-center justify-center rounded-full border border-pink-500/40 bg-pink-500/10"
                  style={{ boxShadow: '0 0 40px rgba(255,102,204,0.35)' }}
                >
                  <Check size={34} className="text-pink-400" />
                </motion.div>

                <div className="relative flex flex-col gap-3">
                  <h2 className="text-balance text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                    {t('successTitle')}
                  </h2>
                  <p className="mx-auto max-w-sm text-sm leading-relaxed text-zinc-400">
                    {t('successBody')}
                  </p>
                </div>

                <motion.button
                  type="button"
                  onClick={goToDashboard}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  className="group relative inline-flex items-center gap-3 rounded-full border border-pink-500/40 bg-pink-500/10 px-8 py-4 text-base font-semibold text-pink-100 backdrop-blur-xl transition-colors hover:bg-pink-500/20"
                  style={{ boxShadow: '0 0 28px rgba(255,102,204,0.25)' }}
                >
                  {t('goToDashboard')}
                  <ArrowRight
                    size={18}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </motion.button>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  )
}
