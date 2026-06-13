"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown } from "lucide-react"
import PublicNav from "@/components/landing/PublicNav"
import PublicFooter from "@/components/landing/PublicFooter"

// metadata injectée par src/app/faq/layout.tsx (page Client Component)

const FAQ_CATEGORIES = [
  {
    slug: "plateformes",
    title: "Plateformes",
    items: [
      {
        q: "Quelles plateformes sont compatibles ?",
        a: "Upwork, Fiverr, Malt et LinkedIn dès aujourd'hui, avec de nouvelles intégrations chaque mois. Vos deadlines se synchronisent avec Google Calendar et Notion.",
      },
      {
        q: "Puis-je connecter plusieurs comptes sur la même plateforme ?",
        a: "Oui, vous pouvez connecter plusieurs comptes Upwork ou Fiverr si vous gérez plusieurs profils. Chaque compte apparaît comme une source distincte dans votre tableau de bord.",
      },
      {
        q: "Comment se fait la synchronisation des données ?",
        a: "Voraly synchronise vos données automatiquement toutes les heures via les API officielles de chaque plateforme. Vous pouvez aussi forcer une synchronisation manuelle depuis vos réglages.",
      },
    ],
  },
  {
    slug: "compte",
    title: "Compte",
    items: [
      {
        q: "Combien de temps pour démarrer ?",
        a: "Environ deux minutes : créez votre compte, connectez vos plateformes, et votre tableau de bord se remplit automatiquement.",
      },
      {
        q: "Puis-je annuler à tout moment ?",
        a: "Oui. Aucun engagement — résiliez votre abonnement Pro en un clic depuis vos réglages.",
      },
      {
        q: "Puis-je utiliser Voraly sur mobile ?",
        a: "Voraly est une application web responsive, accessible depuis n'importe quel navigateur mobile. Une application native iOS/Android est prévue dans la roadmap.",
      },
    ],
  },
  {
    slug: "ia",
    title: "Intelligence artificielle",
    items: [
      {
        q: "Comment fonctionne la roadmap IA ?",
        a: "L'IA analyse vos revenus, vos missions et vos tarifs pour générer une feuille de route personnalisée, mise à jour au fil de votre activité.",
      },
      {
        q: "L'IA a-t-elle accès à mes messages privés ?",
        a: "Non. L'IA analyse uniquement les données agrégées de vos missions et revenus. Elle n'a pas accès à vos conversations, vos fichiers ou vos messages clients.",
      },
      {
        q: "À quelle fréquence la roadmap est-elle mise à jour ?",
        a: "La roadmap se met à jour automatiquement chaque semaine, ou à chaque nouvelle synchronisation si un changement significatif est détecté (nouvelle mission, hausse ou baisse de revenus).",
      },
    ],
  },
  {
    slug: "securite",
    title: "Sécurité",
    items: [
      {
        q: "Mes données sont-elles en sécurité ?",
        a: "Vos connexions sont chiffrées et nous ne stockons jamais vos identifiants de plateforme. Vous gardez le contrôle total et pouvez déconnecter un compte à tout moment.",
      },
      {
        q: "Où sont hébergées mes données ?",
        a: "Vos données sont hébergées dans des datacenters européens (UE) conformes au RGPD. Nous ne transférons aucune donnée personnelle en dehors de l'Union européenne sans votre accord.",
      },
      {
        q: "Voraly est-il conforme au RGPD ?",
        a: "Oui. Voraly respecte le Règlement Général sur la Protection des Données. Vous pouvez demander l'export ou la suppression de vos données à tout moment depuis vos réglages ou en nous contactant.",
      },
    ],
  },
  {
    slug: "facturation",
    title: "Facturation",
    items: [
      {
        q: "Voraly est-il vraiment gratuit ?",
        a: "Vous démarrez gratuitement, sans carte bancaire. L'offre Pro débloque la roadmap IA avancée et les intégrations illimitées.",
      },
      {
        q: "Quels modes de paiement sont acceptés ?",
        a: "Voraly Pro accepte les cartes bancaires (Visa, Mastercard, Amex) via Stripe. Le paiement est entièrement sécurisé — nous n'avons jamais accès à vos données de carte.",
      },
      {
        q: "Y a-t-il des frais cachés ?",
        a: "Aucun frais caché. Le prix affiché est le prix final. Vous recevez une facture à chaque renouvellement.",
      },
    ],
  },
]

function FaqCategory({ category }: { category: (typeof FAQ_CATEGORIES)[0] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  return (
    <div className="flex flex-col gap-3">
      <h2 className="mb-2 text-sm font-bold uppercase tracking-[0.15em] text-zinc-500">
        {category.title}
      </h2>
      {category.items.map((item, i) => (
        <div key={i} className="glass rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
            aria-expanded={openIdx === i}
          >
            <span className="text-sm font-semibold text-white">{item.q}</span>
            <ChevronDown
              size={18}
              className={[
                "shrink-0 text-zinc-400 transition-transform duration-300",
                openIdx === i ? "rotate-180" : "",
              ].join(" ")}
            />
          </button>
          {/* Réponse toujours dans le DOM — pliage CSS uniquement (SEO + IA) */}
          <div
            aria-hidden={openIdx !== i}
            className="overflow-hidden"
            style={{
              maxHeight: openIdx === i ? "600px" : "0px",
              opacity: openIdx === i ? 1 : 0,
              visibility: openIdx === i ? "visible" : "hidden",
              transition: "max-height 0.35s cubic-bezier(0.22,1,0.36,1), opacity 0.35s ease, visibility 0.35s ease",
            }}
          >
            <p className="px-6 pb-5 text-sm leading-relaxed text-zinc-400">{item.a}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function FaqPage() {
  return (
    <main className="h-dvh overflow-y-auto">
      <PublicNav />

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-violet-400">FAQ</p>
        <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          Questions fréquentes
        </h1>
        <p className="text-base text-zinc-400">
          Tout ce que vous devez savoir sur Voraly. Vous ne trouvez pas la réponse ?{" "}
          <Link
            href="/contact"
            className="text-violet-400 underline underline-offset-2 hover:text-violet-300"
          >
            Contactez-nous.
          </Link>
        </p>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 pb-28 flex flex-col gap-12">
        {FAQ_CATEGORIES.map((cat) => (
          <FaqCategory key={cat.slug} category={cat} />
        ))}
      </section>

      <PublicFooter />
    </main>
  )
}
