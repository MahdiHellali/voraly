'use client'

import { useActionState, useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Loader2, Shield } from 'lucide-react'
import { loginAction } from '@/app/actions/auth'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null)
  const [totpCode, setTotpCode] = useState('')
  const [mfaError, setMfaError] = useState<string | null>(null)
  const [mfaVerifying, setMfaVerifying] = useState(false)
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null)

  const supabase = createClient()

  // Detect query param ?mfa=true (e.g. from middleware redirect)
  useEffect(() => {
    async function checkMfaFactor() {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        if (params.get('mfa') === 'true') {
          try {
            const { data, error } = await supabase.auth.mfa.listFactors()
            if (!error && data) {
              const verified = data.totp?.find(f => f.status === 'verified')
              if (verified) {
                setMfaFactorId(verified.id)
              }
            }
          } catch (err) {
            console.error('Error fetching MFA factors:', err)
          }
        }
      }
    }
    checkMfaFactor()
  }, [supabase])

  const isMfaActive = Boolean(state?.mfaRequired || mfaFactorId)
  const activeFactorId = state?.factorId || mfaFactorId

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeFactorId || totpCode.length !== 6) return
    setMfaError(null)
    setMfaVerifying(true)
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: activeFactorId
      })
      if (challengeError) {
        setMfaError(challengeError.message)
        setMfaVerifying(false)
        return
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: activeFactorId,
        challengeId: challengeData.id,
        code: totpCode
      })

      if (verifyError) {
        setMfaError(verifyError.message)
      } else {
        // Success! Redirect to dashboard
        window.location.href = '/dashboard'
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Une erreur est survenue lors de la vérification."
      setMfaError(msg)
    } finally {
      setMfaVerifying(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Bouton Retour à l'accueil */}
      <Link
        href="/"
        className="absolute top-6 left-6 inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] backdrop-blur-md px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white hover:border-white/[0.15] hover:bg-white/[0.06] transition-all duration-200"
      >
        <ArrowLeft size={13} />
        {"Retour à l'accueil"}
      </Link>
      {/* Glass card */}
      <div className="glass relative overflow-hidden rounded-3xl w-full max-w-md p-8 fade-1">
        {/* Decorative top line */}
        <div className="glow-line" />
        {/* Ambient glow sphere */}
        <div className="glow-sphere" />

        <div className="relative z-10 flex flex-col gap-7">

          {/* ── Logo ── */}
          <div className="flex flex-col items-center gap-3">
            <Link href="/" className="flex flex-col items-center gap-3 group">
              <div
                className="w-12 h-12 flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
                style={{
                  filter: 'drop-shadow(0 0 16px rgba(139,92,246,0.55))',
                }}
              >
                <Image
                  src="/logo-circle.svg"
                  alt="Voraly"
                  width={48}
                  height={48}
                  className="select-none"
                  priority
                />
              </div>
              <span className="gradient-text text-xl font-extrabold tracking-wide">Voraly</span>
            </Link>
          </div>

          {isMfaActive ? (
            <>
              {/* ── Heading 2FA ── */}
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-white/[0.08] flex items-center justify-center mx-auto mb-3">
                  <Shield className="text-indigo-400" size={20} />
                </div>
                <h1 className="text-xl font-extrabold text-white tracking-tight">
                  Double authentification (2FA)
                </h1>
                <p className="text-xs text-zinc-400 mt-1.5 px-4 leading-relaxed">
                  Saisissez le code de sécurité à 6 chiffres généré par votre application d&apos;authentification pour valider votre connexion.
                </p>
              </div>

              {/* ── Banner 2FA ── */}
              {mfaError && (
                <div className="flex items-start gap-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 px-4 py-3 text-sm text-rose-400 fade-1">
                  <span className="mt-0.5 text-base leading-none">⚠</span>
                  <span>{mfaError}</span>
                </div>
              )}

              {/* ── Form 2FA ── */}
              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="totpCode" className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Code de sécurité
                  </label>
                  <input
                    id="totpCode"
                    type="text"
                    maxLength={6}
                    autoFocus
                    placeholder="000000"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center tracking-[0.35em] font-mono rounded-xl px-4 py-3 text-lg text-zinc-100 placeholder-zinc-600
                      bg-white/[0.05] border border-white/[0.10]
                      focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/25
                      transition-all duration-200"
                  />
                </div>

                <button
                  type="submit"
                  disabled={mfaVerifying || totpCode.length !== 6}
                  className="w-full mt-1 py-3 px-6 rounded-xl font-semibold text-sm text-white
                    bg-gradient-to-r from-indigo-500 to-violet-500
                    hover:from-indigo-400 hover:to-violet-400
                    focus:outline-none focus:ring-2 focus:ring-violet-500/50
                    disabled:opacity-60 disabled:cursor-not-allowed
                    transition-all duration-200 cursor-pointer
                    shadow-[0_4px_20px_rgba(139,92,246,0.35)]
                    hover:shadow-[0_6px_28px_rgba(139,92,246,0.5)]
                    active:scale-[0.98]"
                >
                  {mfaVerifying ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      <span>Vérification…</span>
                    </div>
                  ) : (
                    'Vérifier et se connecter'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    window.location.href = '/login'
                  }}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03] border border-transparent hover:border-white/[0.05] transition-all duration-200"
                >
                  Retour à la connexion
                </button>
              </form>
            </>
          ) : (
            <>
              {/* ── Heading ── */}
              <div className="text-center">
                <h1 className="text-2xl font-extrabold text-white tracking-tight">
                  Bon retour&nbsp;👋
                </h1>
                <p className="text-sm text-zinc-400 mt-1.5">
                  Connectez-vous à votre tableau de bord freelance
                </p>
              </div>

              {/* ── Banner ── */}
              {state?.error && (
                <div className="flex items-start gap-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 px-4 py-3 text-sm text-rose-400 fade-1">
                  <span className="mt-0.5 text-base leading-none">⚠</span>
                  <span>{state.error}</span>
                </div>
              )}

              {/* ── Form ── */}
              <form action={formAction} className="flex flex-col gap-4">
                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Adresse email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="vous@exemple.com"
                    className="w-full rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600
                      bg-white/[0.05] border border-white/[0.10]
                      focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/25
                      transition-all duration-200"
                  />
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Mot de passe
                    </label>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    placeholder="••••••••••••"
                    className="w-full rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600
                      bg-white/[0.05] border border-white/[0.10]
                      focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/25
                      transition-all duration-200"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full mt-1 py-3 px-6 rounded-xl font-semibold text-sm text-white
                    bg-gradient-to-r from-indigo-500 to-violet-500
                    hover:from-indigo-400 hover:to-violet-400
                    focus:outline-none focus:ring-2 focus:ring-violet-500/50
                    disabled:opacity-60 disabled:cursor-not-allowed
                    transition-all duration-200 cursor-pointer
                    shadow-[0_4px_20px_rgba(139,92,246,0.35)]
                    hover:shadow-[0_6px_28px_rgba(139,92,246,0.5)]
                    active:scale-[0.98]"
                >
                  {isPending ? 'Connexion en cours…' : 'Se connecter'}
                </button>
              </form>

              {/* ── Footer ── */}
              <p className="text-center text-sm text-zinc-500">
                Pas encore de compte ?{' '}
                <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                  Créer un compte →
                </Link>
              </p>
            </>
          )}

        </div>
      </div>
    </main>
  )
}
