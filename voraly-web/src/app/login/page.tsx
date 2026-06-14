'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { loginAction } from '@/app/actions/auth'

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null)

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
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

        </div>
      </div>
    </main>
  )
}
