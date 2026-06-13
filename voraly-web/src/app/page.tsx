import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { Metadata } from "next"
import LandingExperience from "@/components/landing/LandingExperience"

export const metadata: Metadata = {
  title: "Voraly — Tableau de bord freelance tout-en-un · Upwork, Fiverr, Malt, LinkedIn",
  description:
    "Centralisez Upwork, Fiverr, Malt et LinkedIn sur un seul tableau de bord freelance, optimisez vos revenus avec la roadmap IA et suivez vos deadlines. Gratuit, sans carte bancaire.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Voraly — Tableau de bord freelance tout-en-un · Upwork, Fiverr, Malt, LinkedIn",
    description:
      "Centralisez Upwork, Fiverr, Malt et LinkedIn sur un seul tableau de bord freelance, optimisez vos revenus avec la roadmap IA et suivez vos deadlines. Gratuit, sans carte bancaire.",
    type: "website",
    locale: "fr_FR",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Voraly — Tableau de bord freelance tout-en-un",
    description:
      "Centralisez Upwork, Fiverr, Malt et LinkedIn, optimisez vos revenus avec la roadmap IA. Gratuit, sans carte bancaire.",
  },
}

export default async function RootPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/dashboard")
  }

  return (
    <>
      {/* JSON-LD structuré */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Voraly",
              url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://voraly.net",
              description:
                "Voraly est un tableau de bord freelance qui centralise Upwork, Fiverr, Malt et LinkedIn, génère une roadmap de croissance par IA et synchronise vos deadlines avec Google Calendar et Notion.",
              sameAs: [
                "https://x.com/voralyapp",
                "https://www.linkedin.com/company/voraly",
              ],
            },
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Voraly",
              url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://voraly.net",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://voraly.net"}/faq?q={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
              },
            },
          ]),
        }}
      />
      <LandingExperience />
    </>
  )
}
