import type { Metadata } from "next"
import PublicNav from "@/components/landing/PublicNav"
import PublicFooter from "@/components/landing/PublicFooter"

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation — Voraly",
  description:
    "Conditions générales d'utilisation de Voraly, tableau de bord freelance. Accès au service, abonnements, responsabilités.",
  alternates: {
    canonical: "/cgu",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function CguPage() {
  return (
    <main className="h-dvh overflow-y-auto">
      <PublicNav />

      <section className="mx-auto max-w-3xl px-6 py-20">
        <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-white">
          Conditions générales d&apos;utilisation
        </h1>
        <p className="mb-10 text-sm text-zinc-500">
          Document en cours de finalisation — contact :{" "}
          <a
            href="mailto:hello@voraly.net"
            className="text-violet-400 underline underline-offset-2 hover:text-violet-300"
          >
            hello@voraly.net
          </a>
        </p>

        <div className="flex flex-col gap-10 text-sm leading-relaxed text-zinc-400">
          <section>
            <h2 className="mb-3 text-base font-bold text-white">Accès au service</h2>
            <p>
              Voraly est un service en ligne accessible depuis{" "}
              <strong className="text-zinc-200">voraly.net</strong>. L&apos;accès est ouvert à
              toute personne physique majeure disposant d&apos;une connexion internet. Une
              inscription est requise pour accéder aux fonctionnalités du tableau de bord.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-bold text-white">Plan gratuit et plan Pro</h2>
            <p>
              Voraly propose un plan gratuit sans carte bancaire, donnant accès aux
              fonctionnalités de base. Le plan Pro, soumis à abonnement, débloque la roadmap IA
              avancée et les intégrations illimitées. L&apos;abonnement peut être résilié à tout
              moment depuis les réglages du compte, sans frais.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-bold text-white">Responsabilité de l&apos;utilisateur</h2>
            <p>
              L&apos;utilisateur est seul responsable des comptes tiers connectés à Voraly et de
              l&apos;exactitude des informations fournies lors de l&apos;inscription. Il
              s&apos;engage à ne pas utiliser le service à des fins illicites.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-bold text-white">Disponibilité du service</h2>
            <p>
              Voraly s&apos;efforce de maintenir le service disponible en permanence. Des
              interruptions de maintenance ou des incidents techniques peuvent survenir. Voraly
              ne peut être tenu responsable des préjudices liés à une indisponibilité temporaire
              du service.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-bold text-white">Modification des CGU</h2>
            <p>
              Ces CGU peuvent être mises à jour. En cas de modification substantielle,
              l&apos;utilisateur sera informé par email. La poursuite de l&apos;utilisation du
              service après notification vaut acceptation des nouvelles conditions.
            </p>
          </section>

          <p className="text-xs text-zinc-600">
            Ces conditions générales seront complétées lors de la finalisation juridique du
            projet. Pour toute question, contactez{" "}
            <a
              href="mailto:hello@voraly.net"
              className="text-zinc-500 underline underline-offset-2 hover:text-zinc-300"
            >
              hello@voraly.net
            </a>
            .
          </p>
        </div>
      </section>

      <PublicFooter />
    </main>
  )
}
