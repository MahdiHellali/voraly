'use client'

/**
 * HeroBackground — orchestre le fond 3D ou le fallback CSS.
 * - Si prefers-reduced-motion OU largeur<768 OU WebGL indispo → HeroFallback
 * - Sinon → HeroSceneCanvas chargé dynamiquement (ssr:false)
 */

import { Suspense, useRef, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'

// Chargement paresseux ssr:false — ne se monte QUE côté client, JAMAIS en SSR
const HeroSceneCanvas = dynamic(
  () => import('./HeroScene').then((m) => ({ default: m.HeroSceneCanvas })),
  { ssr: false }
)

// ── Fallback CSS ──────────────────────────────────────────────────────────────

function HeroFallback() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Logo flottant */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="relative h-48 w-48 opacity-20"
          style={{ animation: 'spherePulse 6s ease-in-out infinite alternate' }}
        >
          <Image
            src="/volary-logo.png"
            alt=""
            fill
            priority
            className="object-contain"
            style={{ filter: 'drop-shadow(0 0 40px rgba(139,92,246,0.6))' }}
          />
        </div>
      </div>

      {/* Halos CSS */}
      <div
        className="absolute -top-32 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'spherePulse 7s ease-in-out infinite alternate',
        }}
      />
      <div
        className="absolute bottom-0 right-1/4 h-[350px] w-[350px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(255,102,204,0.14) 0%, transparent 70%)',
          filter: 'blur(50px)',
          animation: 'spherePulse 9s ease-in-out 1s infinite alternate',
        }}
      />
      <div
        className="absolute left-1/4 top-1/2 h-[280px] w-[280px] -translate-y-1/2 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
          filter: 'blur(40px)',
          animation: 'spherePulse 11s ease-in-out 0.5s infinite alternate',
        }}
      />
    </div>
  )
}

// ── Détection WebGL ────────────────────────────────────────────────────────────

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')
    )
  } catch {
    return false
  }
}

// ── Composant principal ────────────────────────────────────────────────────────

export default function HeroBackground() {
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const [use3D, setUse3D] = useState(false)

  useEffect(() => {
    // Détection client-only dans une microtask pour satisfaire la règle
    // react-hooks/set-state-in-effect (pas de setState synchrone).
    const detect = () => {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const isNarrow = window.innerWidth < 768
      const hasWebGL = detectWebGL()
      setUse3D(!reducedMotion && !isNarrow && hasWebGL)
    }
    // queueMicrotask évite le setState synchrone tout en restant dans l'effect
    queueMicrotask(detect)
  }, [])

  // Parallaxe souris
  useEffect(() => {
    if (!use3D) return
    const handleMouse = (e: MouseEvent) => {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,   // -1 à +1
        y: -(e.clientY / window.innerHeight - 0.5) * 2,  // -1 à +1
      }
    }
    window.addEventListener('mousemove', handleMouse, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouse)
  }, [use3D])

  if (!use3D) {
    return <HeroFallback />
  }

  return (
    <>
      {/* Scène 3D */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <Suspense fallback={<HeroFallback />}>
          <HeroSceneCanvas mouseRef={mouseRef} />
        </Suspense>
      </div>

      {/* Scrim lisibilité texte */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-[5]"
        style={{
          background:
            'linear-gradient(to bottom, rgba(9,9,11,0.4) 0%, rgba(9,9,11,0.1) 40%, rgba(9,9,11,0.95) 100%)',
        }}
      />
      {/* Vignette radiale */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-[5]"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 40%, #09090b 85%)',
        }}
      />
    </>
  )
}
