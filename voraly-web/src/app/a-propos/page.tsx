import type { Metadata } from 'next'
import Link from 'next/link'
import { LiquidButton } from '@/components/ui/liquid-glass-button'
import PublicNav from '@/components/landing/PublicNav'
import PublicFooter from '@/components/landing/PublicFooter'

export const metadata: Metadata = {
  title: "À propos — Voraly",
  description:
    "Notre mission : rendre aux freelances le contrôle de leur carrière. Découvrez l'histoire, les valeurs et l'équipe derrière Voraly.",
  openGraph: {
    title: "À propos — Voraly",
    description:
      "Notre mission : rendre aux freelances le contrôle de leur carrière. Découvrez l'histoire, les valeurs et l'équipe derrière Voraly.",
    type: "website",
    locale: "fr_FR",
    url: "/a-propos",
  },
}

const VALUES = [
  {
    title: "Clarté",
    desc: "Votre activité mérite d'être lisible. Nous transformons la complexité en décisions simples.",
  },
  {
    title: "Autonomie",
    desc: "Vous êtes le pilote. Voraly vous donne les instruments — pas les ordres.",
  },
  {
    title: "Croissance",
    desc: "Chaque fonctionnalité est conçue pour faire progresser votre activité, pas seulement la surveiller.",
  },
  {
    title: "Confiance",
    desc: "Vos données vous appartiennent. Notre sécurité est un socle, pas une promesse creuse.",
  },
]

export default function AProposPage() {
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
            À propos
          </p>
          <h1 className="text-balance text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Own your career —{" "}
            <span className="gradient-text">notre mission.</span>
          </h1>
          <p className="mx-auto max-w-xl text-base leading-relaxed text-zinc-400">
            Voraly est né d&apos;une frustration simple : pourquoi les freelances passent-ils autant
            de temps à gérer leurs outils plutôt qu&apos;à exercer leur métier ?
          </p>
        </div>
      </section>

      {/* Mission / Vision */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="glass rounded-3xl p-10 flex flex-col gap-5">
            <h2 className="text-xl font-extrabold text-white">Notre mission</h2>
            <p className="text-sm leading-relaxed text-zinc-400">
              Rendre aux freelances la visibilité et le contrôle de leur activité. Centraliser ce
              qui était dispersé. Simplifier ce qui était complexe. Automatiser ce qui était
              répétitif. Vous laisser vous concentrer sur ce qui compte : votre travail et votre
              croissance.
            </p>
          </div>
          <div className="glass-hero rounded-3xl p-10 flex flex-col gap-5">
            <h2 className="text-xl font-extrabold text-white">Notre vision</h2>
            <p className="text-sm leading-relaxed text-zinc-400">
              Un monde où chaque freelance dispose des mêmes outils stratégiques que les grandes
              entreprises — adaptés à sa réalité, accessibles depuis un seul écran. L&apos;IA au
              service de votre indépendance, pas à la place de votre jugement.
            </p>
          </div>
        </div>
      </section>

      {/* L'histoire */}
      <section className="mx-auto max-w-3xl px-6 pb-20">
        <div className="glass rounded-3xl p-10 flex flex-col gap-6">
          <h2 className="text-xl font-extrabold text-white">Comment tout a commencé</h2>
          <div className="flex flex-col gap-4 text-sm leading-relaxed text-zinc-400">
            <p>
              Voraly est parti d&apos;une observation : la plupart des freelances jonglent avec
              quatre, cinq, six plateformes différentes, chacune avec son propre tableau de bord,
              ses propres métriques, ses propres messages. Le résultat ? Des heures gaspillées à
              consolider des données, des deadlines oubliées, des opportunités ratées.
            </p>
            <p>
              Nous avons construit Voraly pour résoudre ce problème de fond. Pas en ajoutant une
              plateforme de plus à la liste — mais en créant le hub central depuis lequel toutes
              les autres sont pilotées. Un seul endroit, une vision complète, une stratégie claire.
            </p>
          </div>
        </div>
      </section>

      {/* Valeurs */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <h2 className="mb-10 text-center text-2xl font-extrabold text-white">
          Ce en quoi nous croyons
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-4">
          {VALUES.map((v) => (
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
            Rejoignez la communauté Voraly.
          </h2>
          <p className="mb-8 text-sm text-zinc-400">
            Des questions ? Une idée ? L&apos;équipe vous répond.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/signup">
              <LiquidButton size="xl" className="rounded-full px-8 text-base font-bold text-white">
                Commencer gratuitement
              </LiquidButton>
            </Link>
            <Link
              href="/contact"
              className="glass inline-flex items-center rounded-full px-8 py-3 text-base font-semibold text-zinc-200 hover:bg-white/[0.06] hover:text-white transition-colors"
            >
              Nous contacter
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  )
}
