import type { Metadata } from "next"
import { DM_Sans } from "next/font/google"
import DotGrid from "@/components/landing/DotGrid"

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "Voraly — The All-in-One Freelance Dashboard",
  description:
    "Centralize Upwork, Fiverr, Malt & LinkedIn. AI-powered growth roadmap, synced deadlines. Take control of your freelance business.",
  openGraph: {
    title: "Voraly — The All-in-One Freelance Dashboard",
    description: "Centralize your freelance platforms. AI roadmap. Synced deadlines.",
    type: "website",
    locale: "en_US",
  },
}

export default function TestLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={dmSans.className}>
      <body className="bg-zinc-950 text-white antialiased">
        <DotGrid />
        {children}
      </body>
    </html>
  )
}
