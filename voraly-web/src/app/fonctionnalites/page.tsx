import type { Metadata } from "next"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { LayoutDashboard, Sparkles, Plug, CalendarClock } from "lucide-react"
import PublicNav from "@/components/landing/PublicNav"
import PublicFooter from "@/components/landing/PublicFooter"
import { LiquidButton } from "@/components/ui/liquid-glass-button"

export const metadata: Metadata = {
  title: "Fonctionnalités du tableau de bord freelance — Voraly",
  description:
    "Tableau de bord freelance tout-en-un : agrégation Upwork, Fiverr, Malt et LinkedIn, roadmap IA personnalisée, suivi des deadlines avec Google Calendar. Gratuit, sans carte bancaire.",
  alternates: {
    canonical: "/fonctionnalites",
  },
  openGraph: {
    title: "Fonctionnalités du tableau de bord freelance — Voraly",
    description:
      "Agrégation multi-plateformes, roadmap IA freelance, suivi des deadlines. Tout ce qu'il faut pour faire grandir votre activité.",
    type: "website",
    locale: "fr_FR",
    url: "/fonctionnalites",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fonctionnalités du tableau de bord freelance — Voraly",
    description:
      "Agrégation multi-plateformes, roadmap IA freelance, suivi des deadlines. Tout ce qu'il faut pour faire grandir votre activité.",
  },
}

const TRUST_KEYS = ["oauth", "encrypted", "gdpr", "eu"] as const

// Méta visuelle des piliers ; le texte vient des messages (featuresPage.pillars.<id>).
const PILLAR_META = [
  { id: "tableau-de-bord", icon: LayoutDashboard, color: "text-violet-400", glow: "rgba(139,92,246,0.12)" },
  { id: "roadmap-ia",      icon: Sparkles,        color: "text-pink-400",   glow: "rgba(255,102,204,0.12)" },
  { id: "integrations",    icon: Plug,            color: "text-indigo-400", glow: "rgba(99,102,241,0.12)" },
  { id: "deadlines",       icon: CalendarClock,   color: "text-violet-400", glow: "rgba(139,92,246,0.12)" },
] as const

export default async function FonctionnalitesPage() {
  const t = await getTranslations("featuresPage")
  const tc = await getTranslations("common")
  const tTrust = await getTranslations("landing.trust")

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
            {t("eyebrow")}
          </p>
          <h1 className="text-balance text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            {t("titleLead")}{" "}
            <span className="gradient-text">{t("titleAccent")}</span>
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-zinc-400">
            {t("subtitle")}
          </p>
          <Link href="/signup">
            <LiquidButton size="xl" className="rounded-full px-8 text-base font-bold text-white">
              {tc("getStartedFree")}
            </LiquidButton>
          </Link>
        </div>
      </section>

      {/* Pilliers */}
      <section className="mx-auto max-w-5xl px-6 pb-28">
        <div className="flex flex-col gap-16">
          {PILLAR_META.map((pillar, i) => {
            const Icon = pillar.icon
            const details = t.raw(`pillars.${pillar.id}.details`) as string[]
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
                    <h2 className="text-2xl font-extrabold text-white">{t(`pillars.${pillar.id}.title`)}</h2>
                    <p className="text-base font-semibold text-zinc-300">{t(`pillars.${pillar.id}.hook`)}</p>
                  </div>
                  <ul className="flex flex-col gap-2.5">
                    {details.map((d) => (
                      <li key={d} className="flex items-start gap-3 text-sm text-zinc-400">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Corps */}
                <div className="flex flex-col gap-6 justify-center md:w-3/5">
                  <p className="text-sm leading-relaxed text-zinc-400">{t(`pillars.${pillar.id}.body`)}</p>
                  <div className="border-l-2 border-violet-500/30 pl-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-violet-400 mb-2">
                      {t("whyLabel")}
                    </p>
                    <p className="text-sm leading-relaxed text-zinc-500">{t(`pillars.${pillar.id}.why`)}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Badges confiance */}
      <section className="mx-auto max-w-3xl px-6 pb-10 flex justify-center">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {TRUST_KEYS.map((key) => (
            <span
              key={key}
              className="glass inline-flex items-center rounded-full px-3 py-1 text-xs font-medium text-zinc-400"
            >
              {tTrust(key)}
            </span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-6 pb-28 text-center">
        <div className="glass-hero rounded-3xl px-8 py-14">
          <h2 className="mb-4 text-2xl font-extrabold text-white">
            {t("cta.title")}
          </h2>
          <p className="mb-8 text-sm text-zinc-400">
            {t("cta.subtitle")}
          </p>
          <Link href="/signup">
            <LiquidButton size="xl" className="rounded-full px-8 text-base font-bold text-white">
              {tc("getStartedFree")}
            </LiquidButton>
          </Link>
        </div>
      </section>

      <PublicFooter />
    </main>
  )
}
