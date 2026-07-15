import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Voraly — The All-in-One Freelance Dashboard",
  description:
    "Centralize Upwork, Fiverr, Malt & LinkedIn. AI-powered growth roadmap, synced deadlines. Take control of your freelance business — join the waitlist.",
  openGraph: {
    title: "Voraly — The All-in-One Freelance Dashboard",
    description:
      "Centralize your freelance platforms. AI roadmap. Synced deadlines. Join the waitlist.",
    type: "website",
    locale: "en_US",
  },
}

export default function TestLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
