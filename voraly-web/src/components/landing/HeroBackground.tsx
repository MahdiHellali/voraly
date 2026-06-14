'use client'

/**
 * HeroBackground — fond animé CSS pur (zéro WebGL).
 * - Fond ultra-sombre #09090b
 * - Grille de points SVG inline subtile
 * - 4 glows radiaux Voraly (violet / indigo / rose) en parallaxe scroll
 * - Vignette radiale pour lisibilité du texte
 * Pas d'effet souris, pas de WebGL, zéro dépendance externe.
 */

import { useEffect, useRef } from 'react'

export default function HeroBackground() {
  const glowRef = useRef<HTMLDivElement>(null)

  // Parallaxe scroll — les glows bougent à 0.25x la vitesse du scroll
  useEffect(() => {
    const el = glowRef.current
    if (!el) return

    const onScroll = () => {
      const y = window.scrollY
      el.style.transform = `translateY(${y * 0.25}px)`
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ background: '#09090b' }}
    >
      {/* ── Grille de points ──────────────────────────────────────── */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
          maskImage:
            'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)',
        }}
      />

      {/* ── Glows radiaux parallaxe ───────────────────────────────── */}
      <div ref={glowRef} className="absolute inset-0 will-change-transform">
        {/* Glow violet — haut centre */}
        <div
          className="absolute"
          style={{
            top: '-10%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '900px',
            height: '700px',
            background:
              'radial-gradient(ellipse at center, rgba(139,92,246,0.22) 0%, rgba(139,92,246,0.08) 40%, transparent 70%)',
            filter: 'blur(80px)',
            animation: 'vorGlow1 9s ease-in-out infinite alternate',
          }}
        />

        {/* Glow indigo — milieu gauche */}
        <div
          className="absolute"
          style={{
            top: '35%',
            left: '-8%',
            width: '700px',
            height: '600px',
            background:
              'radial-gradient(ellipse at center, rgba(99,102,241,0.18) 0%, rgba(99,102,241,0.06) 45%, transparent 70%)',
            filter: 'blur(90px)',
            animation: 'vorGlow2 12s ease-in-out infinite alternate',
          }}
        />

        {/* Glow rose néon — droite */}
        <div
          className="absolute"
          style={{
            top: '20%',
            right: '-8%',
            width: '600px',
            height: '500px',
            background:
              'radial-gradient(ellipse at center, rgba(255,102,204,0.14) 0%, rgba(255,102,204,0.04) 45%, transparent 70%)',
            filter: 'blur(80px)',
            animation: 'vorGlow3 15s ease-in-out infinite alternate',
          }}
        />

        {/* Glow violet pâle — bas */}
        <div
          className="absolute"
          style={{
            bottom: '5%',
            left: '30%',
            width: '500px',
            height: '400px',
            background:
              'radial-gradient(ellipse at center, rgba(168,85,247,0.12) 0%, transparent 65%)',
            filter: 'blur(70px)',
            animation: 'vorGlow4 11s ease-in-out 2s infinite alternate',
          }}
        />
      </div>

      {/* ── Vignette radiale (lisibilité texte) ───────────────────── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, transparent 50%, rgba(9,9,11,0.7) 100%)',
        }}
      />
      {/* Assombrir le bas */}
      <div
        className="absolute inset-x-0 bottom-0 h-64"
        style={{
          background: 'linear-gradient(to bottom, transparent, rgba(9,9,11,0.95))',
        }}
      />

      {/* ── Keyframes CSS ─────────────────────────────────────────── */}
      <style>{`
        @keyframes vorGlow1 {
          from { opacity: 0.7; transform: translateX(-50%) scale(1);    }
          to   { opacity: 1;   transform: translateX(-50%) scale(1.12); }
        }
        @keyframes vorGlow2 {
          from { opacity: 0.6; transform: translate(0, 0)   scale(1);    }
          to   { opacity: 0.9; transform: translate(3%, 4%)  scale(1.1); }
        }
        @keyframes vorGlow3 {
          from { opacity: 0.5; transform: translate(0, 0)    scale(1);    }
          to   { opacity: 0.8; transform: translate(-3%, 6%) scale(1.15); }
        }
        @keyframes vorGlow4 {
          from { opacity: 0.5; transform: translate(0, 0)   scale(1);    }
          to   { opacity: 0.9; transform: translate(-4%, -3%) scale(1.1); }
        }
      `}</style>
    </div>
  )
}
