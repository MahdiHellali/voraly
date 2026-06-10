import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { TooltipProvider } from '@/components/ui/tooltip'
import MouseTracker from '@/components/providers/MouseTracker'
import { WebGLShader } from '@/components/ui/web-gl-shader'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
})

export const metadata: Metadata = {
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
        {/* Global WebGL ambient field (behind everything) */}
        <WebGLShader />
        {/* Ambient softening — blur + dark tint, strictly between the canvas
            (painted first) and the UI content. Turns the shader into an aura. */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10 bg-zinc-950/40 backdrop-blur-md"
        />
        {/* Edge vignette to focus attention on the centered column */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10"
          style={{
            background:
              'radial-gradient(ellipse 90% 70% at 50% 40%, transparent 0%, rgba(9,9,11,0.45) 75%, rgba(9,9,11,0.7) 100%)',
          }}
        />
        <TooltipProvider>
          <MouseTracker />
          {children}
        </TooltipProvider>
      </body>
    </html>
  )
}
