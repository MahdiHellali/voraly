'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { signupAction } from '@/app/actions/auth'

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signupAction, null)

  // After successful signup, show the confirmation message only
  if (state?.message) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="glass relative overflow-hidden rounded-3xl w-full max-w-md p-8 text-center fade-1">
          <div className="glow-line" />
          <div className="glow-sphere" />
          <div className="relative z-10 flex flex-col items-center gap-6">
            <div
              className="w-12 h-12 flex items-center justify-center"
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
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-extrabold text-white">Vérifiez votre email</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">{state.message}</p>
            </div>
            <Link
              href="/login"
              className="inline-block py-3 px-8 rounded-xl font-semibold text-sm text-white
                bg-gradient-to-r from-indigo-500 to-violet-500
                hover:from-indigo-400 hover:to-violet-400
                transition-all duration-200 shadow-[0_4px_20px_rgba(139,92,246,0.35)]"
            >
              Aller à la connexion
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      {/* Glass card */}
      <div className="glass relative overflow-hidden rounded-3xl w-full max-w-md p-8 fade-1">
        <div className="glow-line" />
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
              Créer un compte
            </h1>
            <p className="text-sm text-zinc-400 mt-1.5">
              Rejoignez des milliers de freelances qui optimisent leurs revenus
            </p>
          </div>

          {/* ── Error banner ── */}
          {state?.error && (
            <div className="flex items-start gap-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 px-4 py-3 text-sm text-rose-400 fade-1">
              <span className="mt-0.5 text-base leading-none">⚠</span>
              <span>{state.error}</span>
            </div>
          )}

          {/* ── Form ── */}
          <form action={formAction} className="flex flex-col gap-4">
            {/* Full name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="full_name" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Nom complet
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                autoComplete="name"
                required
                placeholder="Jean Dupont"
                className="w-full rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600
                  bg-white/[0.05] border border-white/[0.10]
                  focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/25
                  transition-all duration-200"
              />
            </div>

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
              <label htmlFor="password" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                placeholder="12 caractères minimum"
                className="w-full rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600
                  bg-white/[0.05] border border-white/[0.10]
                  focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/25
                  transition-all duration-200"
              />
              <p className="text-[11px] text-zinc-600">Au moins 12 caractères.</p>
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
              {isPending ? 'Création en cours…' : 'Créer mon compte'}
            </button>
          </form>

          {/* ── Footer ── */}
          <p className="text-center text-sm text-zinc-500">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Se connecter →
            </Link>
          </p>

        </div>
      </div>
    </main>
  )
}
