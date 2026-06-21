import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { LiquidButton } from '@/components/ui/liquid-glass-button'
import PublicNav from '@/components/landing/PublicNav'
import PublicFooter from '@/components/landing/PublicFooter'

export const metadata: Metadata = {
  title: "À propos — Voraly, le tableau de bord freelance",
  description:
    "Voraly est né pour résoudre un problème concret : les freelances passent trop de temps à gérer leurs outils. Découvrez notre mission, nos valeurs et notre vision pour l'indépendance professionnelle.",
  alternates: {
    canonical: "/a-propos",
  },
  openGraph: {
    title: "À propos — Voraly, le tableau de bord freelance",
    description:
      "Voraly est né pour résoudre un problème concret : les freelances passent trop de temps à gérer leurs outils. Mission, valeurs, vision.",
    type: "website",
    locale: "fr_FR",
    url: "/a-propos",
  },
  twitter: {
    card: "summary_large_image",
    title: "À propos — Voraly, le tableau de bord freelance",
    description:
      "Voraly est né pour résoudre un problème concret : les freelances passent trop de temps à gérer leurs outils. Mission, valeurs, vision.",
  },
}

type ValueItem = { title: string; desc: string }

export default async function AProposPage() {
  const t = await getTranslations('aboutPage')
  const tc = await getTranslations('common')
  const values = t.raw('values') as ValueItem[]

  return (
    <main className="h-dvh overflow-y-auto">
      <PublicNav />

      {/* Hero */}
      <section className="relative mx-auto max-w-3xl px-6 py-24 text-center">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 70%)",
          }}
        />
        <div className="relative flex flex-col gap-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-400">
            {t('eyebrow')}
          </p>
          <h1 className="text-balance text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            {t('titleLead')}{" "}
            <span className="gradient-text">{t('titleAccent')}</span>
          </h1>
          <p className="mx-auto max-w-xl text-base leading-relaxed text-zinc-400">
            {t('intro')}
          </p>
        </div>
      </section>

      {/* Mission / Vision */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="glass rounded-3xl p-10 flex flex-col gap-5">
            <h2 className="text-xl font-extrabold text-white">{t('mission.title')}</h2>
            <p className="text-sm leading-relaxed text-zinc-400">
              {t('mission.body')}
            </p>
          </div>
          <div className="glass-hero rounded-3xl p-10 flex flex-col gap-5">
            <h2 className="text-xl font-extrabold text-white">{t('vision.title')}</h2>
            <p className="text-sm leading-relaxed text-zinc-400">
              {t('vision.body')}
            </p>
          </div>
        </div>
      </section>

      {/* Le problème observé */}
      <section className="mx-auto max-w-3xl px-6 pb-10">
        <div className="glass rounded-3xl p-10 flex flex-col gap-6">
          <h2 className="text-xl font-extrabold text-white">{t('problem.title')}</h2>
          <div className="flex flex-col gap-4 text-sm leading-relaxed text-zinc-400">
            <p>{t('problem.p1')}</p>
            <p>{t('problem.p2')}</p>
          </div>
        </div>
      </section>

      {/* L'histoire */}
      <section className="mx-auto max-w-3xl px-6 pb-20">
        <div className="glass rounded-3xl p-10 flex flex-col gap-6">
          <h2 className="text-xl font-extrabold text-white">{t('story.title')}</h2>
          <div className="flex flex-col gap-4 text-sm leading-relaxed text-zinc-400">
            <p>{t('story.p1')}</p>
            <p>{t('story.p2')}</p>
            <p>{t('story.p3')}</p>
          </div>
        </div>
      </section>

      {/* Valeurs */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <h2 className="mb-10 text-center text-2xl font-extrabold text-white">
          {t('valuesTitle')}
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-4">
          {values.map((v) => (
            <div key={v.title} className="glass rounded-2xl p-6 flex flex-col gap-3">
              <h3 className="text-sm font-bold text-white">{v.title}</h3>
              <p className="text-xs leading-relaxed text-zinc-400">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-6 pb-28 text-center">
        <div className="glass-hero rounded-3xl px-8 py-14">
          <h2 className="mb-4 text-2xl font-extrabold text-white">
            {t('cta.title')}
          </h2>
          <p className="mb-8 text-sm text-zinc-400">
            {t('cta.subtitle')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/signup">
              <LiquidButton size="xl" className="rounded-full px-8 text-base font-bold text-white">
                {tc('getStartedFree')}
              </LiquidButton>
            </Link>
            <Link
              href="/contact"
              className="glass inline-flex items-center rounded-full px-8 py-3 text-base font-semibold text-zinc-200 hover:bg-white/[0.06] hover:text-white transition-colors"
            >
              {t('cta.contact')}
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  )
}
