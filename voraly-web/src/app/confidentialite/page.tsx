import type { Metadata } from "next"
import PublicNav from "@/components/landing/PublicNav"
import PublicFooter from "@/components/landing/PublicFooter"

export const metadata: Metadata = {
  title: "Politique de confidentialité — Voraly",
  description:
    "Comment Voraly collecte, utilise et protège vos données personnelles. Conforme RGPD.",
  alternates: {
    canonical: "/confidentialite",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function ConfidentialitePage() {
  return (
    <main className="h-dvh overflow-y-auto">
      <PublicNav />

      <section className="mx-auto max-w-3xl px-6 py-20">
        <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-white">
          Politique de confidentialité
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
            <h2 className="mb-3 text-base font-bold text-white">Données collectées</h2>
            <p>
              Voraly collecte uniquement les données nécessaires au fonctionnement du service :
              adresse email lors de l&apos;inscription, et données agrégées de vos plateformes
              freelance (revenus, missions, métriques) via des connexions OAuth. Nous ne stockons
              jamais vos identifiants de plateforme.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-bold text-white">Utilisation des données</h2>
            <p>
              Vos données sont utilisées exclusivement pour fournir le service Voraly : alimenter
              votre tableau de bord, générer votre roadmap IA et synchroniser vos deadlines.
              Aucune donnée personnelle n&apos;est vendue ni transmise à des tiers à des fins
              commerciales.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-bold text-white">Sécurité</h2>
            <p>
              Les données en transit sont chiffrées (TLS). Les connexions aux plateformes
              tierces utilisent le protocole OAuth 2.0 — vos mots de passe ne transitent jamais
              par nos serveurs. L&apos;hébergement est situé dans l&apos;Union européenne.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-bold text-white">Vos droits (RGPD)</h2>
            <p>
              Conformément au Règlement Général sur la Protection des Données (RGPD), vous
              disposez d&apos;un droit d&apos;accès, de rectification, de suppression et de
              portabilité de vos données. Pour exercer ces droits, contactez-nous à{" "}
              <a
                href="mailto:hello@voraly.net"
                className="text-violet-400 underline underline-offset-2 hover:text-violet-300"
              >
                hello@voraly.net
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-bold text-white">Cookies</h2>
            <p>
              Voraly utilise des cookies de session nécessaires au fonctionnement de
              l&apos;authentification. Aucun cookie publicitaire ou de tracking tiers n&apos;est
              déposé sans votre consentement.
            </p>
          </section>

          <p className="text-xs text-zinc-600">
            Cette politique de confidentialité sera complétée lors de la finalisation juridique
            du projet. Pour toute question, contactez{" "}
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
