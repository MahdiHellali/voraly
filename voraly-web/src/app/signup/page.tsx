'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'
import { signupAction } from '@/app/actions/auth'

export default function SignupPage() {
  const t = useTranslations('auth')
  const [state, formAction, isPending] = useActionState(signupAction, null)

  // After successful signup, show the confirmation message only
  if (state?.message) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 relative">
        {/* Bouton Retour à l'accueil */}
        <Link
          href="/"
          className="absolute top-6 left-6 inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] backdrop-blur-md px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white hover:border-white/[0.15] hover:bg-white/[0.06] transition-all duration-200"
        >
          <ArrowLeft size={13} />
          {t('backHome')}
        </Link>
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
              <h2 className="text-xl font-extrabold text-white">{t('signup.checkEmailTitle')}</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">{state.message}</p>
            </div>
            <Link
              href="/login"
              className="inline-block py-3 px-8 rounded-xl font-semibold text-sm text-white
                bg-gradient-to-r from-indigo-500 to-violet-500
                hover:from-indigo-400 hover:to-violet-400
                transition-all duration-200 shadow-[0_4px_20px_rgba(139,92,246,0.35)]"
            >
              {t('signup.goToLogin')}
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Bouton Retour à l'accueil */}
      <Link
        href="/"
        className="absolute top-6 left-6 inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] backdrop-blur-md px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white hover:border-white/[0.15] hover:bg-white/[0.06] transition-all duration-200"
      >
        <ArrowLeft size={13} />
        {t('backHome')}
      </Link>
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
              {t('signup.heading')}
            </h1>
            <p className="text-sm text-zinc-400 mt-1.5">
              {t('signup.subtitle')}
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
                {t('signup.nameLabel')}
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                autoComplete="name"
                required
                placeholder={t('signup.namePlaceholder')}
                className="w-full rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600
                  bg-white/[0.05] border border-white/[0.10]
                  focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/25
                  transition-all duration-200"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                {t('signup.emailLabel')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder={t('signup.emailPlaceholder')}
                className="w-full rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600
                  bg-white/[0.05] border border-white/[0.10]
                  focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/25
                  transition-all duration-200"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                {t('signup.passwordLabel')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                placeholder={t('signup.passwordPlaceholder')}
                className="w-full rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600
                  bg-white/[0.05] border border-white/[0.10]
                  focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/25
                  transition-all duration-200"
              />
              <p className="text-[11px] text-zinc-600">{t('signup.passwordHint')}</p>
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
              {isPending ? t('signup.creating') : t('signup.createAccount')}
            </button>
          </form>

          {/* ── Footer ── */}
          <p className="text-center text-sm text-zinc-500">
            {t('signup.haveAccount')}{' '}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              {t('signup.signIn')} →
            </Link>
          </p>

        </div>
      </div>
    </main>
  )
}
