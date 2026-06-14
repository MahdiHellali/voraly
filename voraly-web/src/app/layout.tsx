import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { TooltipProvider } from '@/components/ui/tooltip'
import HeroBackground from '@/components/landing/HeroBackground'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: 'Voraly — Tableau de bord freelance intelligent',
  description:
    "Voraly centralise vos plateformes freelance (Upwork, Fiverr, Malt) et optimise vos revenus grâce à l'IA. Pilotez votre activité depuis un seul tableau de bord.",
  keywords: ['freelance', 'Upwork', 'Fiverr', 'Malt', 'optimisation', 'IA', 'revenus'],
  authors: [{ name: 'Voraly' }],
  openGraph: {
    title: 'Voraly — Tableau de bord freelance intelligent',
    description: "Optimisez vos revenus freelance sur toutes les plateformes grâce à l'IA.",
    type: 'website',
    locale: 'fr_FR',
    url: '/',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="dark">
      <body className={inter.className}>
        {/* Fond aurora global — toutes les pages */}
        <HeroBackground />
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </body>
    </html>
  )
}
