import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { Metadata } from "next"
import LandingExperience from "@/components/landing/LandingExperience"

export const metadata: Metadata = {
  title: "Voraly — Pilotez votre activité freelance · Tableau de bord tout-en-un",
  description:
    "Centralisez Upwork, Fiverr, Malt et LinkedIn, optimisez vos revenus avec l'IA et suivez vos deadlines. Gratuit, sans carte bancaire.",
  openGraph: {
    title: "Voraly — Pilotez votre activité freelance · Tableau de bord tout-en-un",
    description:
      "Centralisez Upwork, Fiverr, Malt et LinkedIn, optimisez vos revenus avec l'IA et suivez vos deadlines. Gratuit, sans carte bancaire.",
    type: "website",
    locale: "fr_FR",
    url: "/",
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
                "Voraly est la plateforme tout-en-un pour freelances : tableau de bord multi-plateformes, roadmap IA et suivi des deadlines.",
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
