import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: "Contact — Voraly",
  description:
    "Une question ? Contactez l'équipe Voraly. On vous répond sous 24 h.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact — Voraly",
    description: "Une question ? Contactez l'équipe Voraly. On vous répond sous 24 h.",
    type: "website",
    locale: "fr_FR",
    url: "/contact",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact — Voraly",
    description: "Une question ? Contactez l'équipe Voraly. On vous répond sous 24 h.",
  },
}

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children
}
