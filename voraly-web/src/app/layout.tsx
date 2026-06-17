import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
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

const MATOMO_URL = process.env.NEXT_PUBLIC_MATOMO_URL
const MATOMO_SITE_ID = process.env.NEXT_PUBLIC_MATOMO_SITE_ID

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

        {/* Matomo Analytics */}
        {MATOMO_URL && MATOMO_SITE_ID && (
          <Script id="matomo" strategy="afterInteractive">
            {`
              var _paq = window._paq = window._paq || [];
              _paq.push(['trackPageView']);
              _paq.push(['enableLinkTracking']);
              (function() {
                var u="${MATOMO_URL}";
                _paq.push(['setTrackerUrl', u+'matomo.php']);
                _paq.push(['setSiteId', '${MATOMO_SITE_ID}']);
                var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
                g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
              })();
            `}
          </Script>
        )}
      </body>
    </html>
  )
}
