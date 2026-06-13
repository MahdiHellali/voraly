import type { Metadata } from "next"
import Link from "next/link"
import { LayoutDashboard, Sparkles, Plug, CalendarClock } from "lucide-react"
import PublicNav from "@/components/landing/PublicNav"
import PublicFooter from "@/components/landing/PublicFooter"
import { LiquidButton } from "@/components/ui/liquid-glass-button"

export const metadata: Metadata = {
  title: "Fonctionnalités — Voraly",
  description:
    "Tableau de bord temps réel, roadmap IA, multi-plateformes et suivi des deadlines. Tout ce qu'il faut pour faire grandir votre activité freelance.",
  openGraph: {
    title: "Fonctionnalités — Voraly",
    description:
      "Tableau de bord temps réel, roadmap IA, multi-plateformes et suivi des deadlines.",
    type: "website",
    locale: "fr_FR",
    url: "/fonctionnalites",
  },
}

const PILLARS = [
  {
    id: "tableau-de-bord",
    icon: LayoutDashboard,
    color: "text-violet-400",
    glow: "rgba(139,92,246,0.12)",
    title: "Tableau de bord temps réel",
    hook: "Tout votre business, visible d'un coup d'oeil.",
    body: "Voraly agrège en temps réel les données de toutes vos plateformes freelance. Revenus du mois, missions en cours, taux de conversion, notes clients — plus besoin d'ouvrir dix onglets. Votre tableau de bord se met à jour automatiquement dès qu'une nouvelle mission est assignée ou qu'un paiement est reçu.",
    details: [
      "Agrégation multi-plateformes en temps réel",
      "KPIs : revenus, missions actives, taux de complétion",
      "Historique et courbes de progression",
      "Alertes intelligentes (paiement en attente, mission expirante)",
    ],
  },
  {
    id: "roadmap-ia",
    icon: Sparkles,
    color: "text-pink-400",
    glow: "rgba(255,102,204,0.12)",
    title: "Roadmap IA stratégique",
    hook: "Votre prochain mois, déjà planifié.",
    body: "L'IA de Voraly ne se contente pas d'analyser vos chiffres passés — elle vous dit quoi faire ensuite. En croisant vos revenus, vos tarifs et les tendances de vos plateformes, elle génère une feuille de route concrète et personnalisée : services à pousser, tarifs à ajuster, plateformes à prioriser.",
    details: [
      "Analyse de vos données sur 3, 6 ou 12 mois",
      "Recommandations de tarifs par service et par plateforme",
      "Suggestions de positionnement et de niche",
      "Mise à jour automatique au fil de votre activité",
    ],
  },
  {
    id: "integrations",
    icon: Plug,
    color: "text-indigo-400",
    glow: "rgba(99,102,241,0.12)",
    title: "Multi-plateformes",
    hook: "Un seul tableau de bord pour toutes vos plateformes.",
    body: "Connectez Upwork, Fiverr, Malt et LinkedIn en quelques clics. Voraly utilise des connexions OAuth sécurisées — vos identifiants ne transitent jamais par nos serveurs. De nouvelles intégrations arrivent chaque mois, selon les votes de la communauté.",
    details: [
      "Upwork, Fiverr, Malt, LinkedIn dès le lancement",
      "Connexion OAuth sécurisée, déconnexion en un clic",
      "Données synchronisées automatiquement toutes les heures",
      "Nouvelles intégrations mensuelles (vote communauté)",
    ],
  },
  {
    id: "deadlines",
    icon: CalendarClock,
    color: "text-violet-400",
    glow: "rgba(139,92,246,0.12)",
    title: "Suivi des deadlines",
    hook: "Plus jamais d'échéance oubliée.",
    body: "Voraly synchronise vos missions et leurs échéances avec Google Calendar et Notion. Chaque deadline apparaît dans votre calendrier, avec rappels configurables. L'IA tient également compte de vos deadlines pour prioriser ses recommandations.",
    details: [
      "Synchronisation bidirectionnelle avec Google Calendar",
      "Intégration Notion (base de données de tâches)",
      "Rappels par email et notification push",
      "Vue timeline par plateforme et par client",
    ],
  },
]

export default function FonctionnalitesPage() {
  return (
    <main className="h-dvh overflow-y-auto">
      {/* JSON-LD SoftwareApplication */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Voraly",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            description:
              "Tableau de bord freelance tout-en-un : agrégation multi-plateformes, roadmap IA, suivi des deadlines.",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "EUR",
              description: "Plan gratuit disponible",
            },
            featureList: [
              "Tableau de bord temps réel multi-plateformes",
              "Roadmap IA personnalisée",
              "Connexion Upwork, Fiverr, Malt, LinkedIn",
              "Suivi des deadlines avec Google Calendar",
            ],
          }),
        }}
      />

      <PublicNav />

      {/* Hero */}
      <section className="relative mx-auto max-w-4xl px-6 py-24 text-center">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.12) 0%, transparent 70%)",
          }}
        />
        <div className="relative flex flex-col items-center gap-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-400">
            Fonctionnalités
          </p>
          <h1 className="text-balance text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Tout ce qu&apos;il faut pour faire grandir{" "}
            <span className="gradient-text">votre activité freelance.</span>
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-zinc-400">
            Quatre piliers conçus pour vous faire gagner du temps, de la visibilité et des revenus.
          </p>
          <Link href="/signup">
            <LiquidButton size="xl" className="rounded-full px-8 text-base font-bold text-white">
              Commencer gratuitement
            </LiquidButton>
          </Link>
        </div>
      </section>

      {/* Pilliers */}
      <section className="mx-auto max-w-5xl px-6 pb-28">
        <div className="flex flex-col gap-16">
          {PILLARS.map((pillar, i) => {
            const Icon = pillar.icon
            return (
              <div
                key={pillar.id}
                id={pillar.id}
                className={[
                  "glass rounded-3xl p-10 flex flex-col gap-8",
                  i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse",
                ].join(" ")}
              >
                {/* Icône + titre */}
                <div className="flex flex-col gap-5 md:w-2/5">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04]"
                    style={{ boxShadow: `0 0 30px ${pillar.glow}` }}
                  >
                    <Icon size={26} className={pillar.color} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <h2 className="text-2xl font-extrabold text-white">{pillar.title}</h2>
                    <p className="text-base font-semibold text-zinc-300">{pillar.hook}</p>
                  </div>
                  <ul className="flex flex-col gap-2.5">
                    {pillar.details.map((d) => (
                      <li key={d} className="flex items-start gap-3 text-sm text-zinc-400">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Corps */}
                <div className="flex items-center md:w-3/5">
                  <p className="text-sm leading-relaxed text-zinc-400">{pillar.body}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-6 pb-28 text-center">
        <div className="glass-hero rounded-3xl px-8 py-14">
          <h2 className="mb-4 text-2xl font-extrabold text-white">
            Prêt à reprendre le contrôle ?
          </h2>
          <p className="mb-8 text-sm text-zinc-400">
            Gratuit, sans carte bancaire. Configuration en 2 minutes.
          </p>
          <Link href="/signup">
            <LiquidButton size="xl" className="rounded-full px-8 text-base font-bold text-white">
              Commencer gratuitement
            </LiquidButton>
          </Link>
        </div>
      </section>

      <PublicFooter />
    </main>
  )
}
