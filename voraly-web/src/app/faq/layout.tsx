import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'FAQ — Voraly, tableau de bord freelance',
  description:
    'Plateformes compatibles, sécurité des données, roadmap IA freelance, tarifs... Toutes les réponses à vos questions sur Voraly.',
  alternates: {
    canonical: '/faq',
  },
  openGraph: {
    title: 'FAQ — Voraly, tableau de bord freelance',
    description:
      'Plateformes compatibles, sécurité des données, roadmap IA freelance, tarifs... Toutes les réponses à vos questions sur Voraly.',
    type: 'website',
    locale: 'fr_FR',
    url: '/faq',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FAQ — Voraly, tableau de bord freelance',
    description:
      'Plateformes compatibles, sécurité des données, roadmap IA freelance, tarifs...',
  },
}

export default function FaqLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* JSON-LD FAQPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'Quelles plateformes sont compatibles ?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: "Upwork, Fiverr, Malt et LinkedIn dès aujourd'hui, avec de nouvelles intégrations chaque mois. Vos deadlines se synchronisent avec Google Calendar et Notion.",
                },
              },
              {
                '@type': 'Question',
                name: 'Mes données sont-elles en sécurité ?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: "Vos connexions sont chiffrées et nous ne stockons jamais vos identifiants de plateforme. Vous gardez le contrôle total et pouvez déconnecter un compte à tout moment.",
                },
              },
              {
                '@type': 'Question',
                name: 'Comment fonctionne la roadmap IA ?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: "L'IA analyse vos revenus, vos missions et vos tarifs pour générer une feuille de route personnalisée, mise à jour au fil de votre activité.",
                },
              },
              {
                '@type': 'Question',
                name: 'Voraly est-il vraiment gratuit ?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: "Vous démarrez gratuitement, sans carte bancaire. L'offre Pro débloque la roadmap IA avancée et les intégrations illimitées.",
                },
              },
              {
                '@type': 'Question',
                name: 'Combien de temps pour démarrer ?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: "Environ deux minutes : créez votre compte, connectez vos plateformes, et votre tableau de bord se remplit automatiquement.",
                },
              },
              {
                '@type': 'Question',
                name: "Puis-je annuler à tout moment ?",
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: "Oui. Aucun engagement — résiliez votre abonnement Pro en un clic depuis vos réglages.",
                },
              },
            ],
          }),
        }}
      />
      {children}
    </>
  )
}
