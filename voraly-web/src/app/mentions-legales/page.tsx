import type { Metadata } from "next"
import PublicNav from "@/components/landing/PublicNav"
import PublicFooter from "@/components/landing/PublicFooter"

export const metadata: Metadata = {
  title: "Mentions légales — Voraly",
  description: "Mentions légales de Voraly, tableau de bord freelance.",
  alternates: {
    canonical: "/mentions-legales",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function MentionsLegalesPage() {
  return (
    <main className="h-dvh overflow-y-auto">
      <PublicNav />

      <section className="mx-auto max-w-3xl px-6 py-20">
        <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-white">
          Mentions légales
        </h1>
        <p className="mb-10 text-sm text-zinc-500">
          Document en cours de finalisation — contact :{" "}
          <a
            href="mailto:contact@voraly.net"
            className="text-violet-400 underline underline-offset-2 hover:text-violet-300"
          >
            contact@voraly.net
          </a>
        </p>

        <div className="flex flex-col gap-10 text-sm leading-relaxed text-zinc-400">
          <section>
            <h2 className="mb-3 text-base font-bold text-white">Éditeur du site</h2>
            <p>
              Le site <strong className="text-zinc-200">voraly.net</strong> est édité par Voraly.
            </p>
            <p className="mt-2">
              Contact :{" "}
              <a
                href="mailto:contact@voraly.net"
                className="text-violet-400 underline underline-offset-2 hover:text-violet-300"
              >
                contact@voraly.net
              </a>
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-bold text-white">Hébergement</h2>
            <p>
              Le site est hébergé dans des infrastructures situées dans l&apos;Union européenne.
              Les données des utilisateurs sont stockées dans des datacenters conformes au RGPD.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-bold text-white">Propriété intellectuelle</h2>
            <p>
              L&apos;ensemble des contenus présents sur ce site (textes, visuels, code) sont
              protégés par le droit de la propriété intellectuelle et appartiennent à Voraly ou
              à leurs auteurs respectifs. Toute reproduction sans autorisation écrite est interdite.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-bold text-white">Données personnelles</h2>
            <p>
              Pour toute question relative au traitement de vos données personnelles, consultez
              notre{" "}
              <a
                href="/confidentialite"
                className="text-violet-400 underline underline-offset-2 hover:text-violet-300"
              >
                Politique de confidentialité
              </a>
              .
            </p>
          </section>

          <p className="text-xs text-zinc-600">
            Ces mentions légales seront complétées lors de la finalisation juridique du projet.
            En attendant, pour toute question, contactez{" "}
            <a
              href="mailto:contact@voraly.net"
              className="text-zinc-500 underline underline-offset-2 hover:text-zinc-300"
            >
              contact@voraly.net
            </a>
            .
          </p>
        </div>
      </section>

      <PublicFooter />
    </main>
  )
}
