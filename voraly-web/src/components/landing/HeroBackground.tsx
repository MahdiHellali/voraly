'use client'

/**
 * HeroBackground — Aurora mesh gradient canvas 2D
 * Inspiré de "nouveau fond.mp4" : grands blobs flous violet/indigo/rose sur fond
 * noir avec grain noise, réactifs souris + scroll.
 * Zéro WebGL, zéro dépendance externe.
 */

import { useEffect, useRef } from 'react'

// ── Types ─────────────────────────────────────────────────────────
interface Blob {
  x: number        // position cible normalisée [0,1]
  y: number
  vx: number       // vitesse drift autonome
  vy: number
  cx: number       // position courante interpolée
  cy: number
  r: number        // rayon relatif [0,1]
  h: number        // hue HSL
  s: number        // saturation
  l: number        // luminosité
  a: number        // alpha max
  phase: number    // phase d'oscillation
  speed: number    // vitesse d'oscillation
}

function createBlob(W: number, H: number, i: number): Blob {
  // Palette Voraly : violet, indigo, rose, violet pâle
  const palettes = [
    { h: 270, s: 80, l: 58 },  // violet  #8b5cf6
    { h: 240, s: 84, l: 63 },  // indigo  #6366f1
    { h: 320, s: 95, l: 64 },  // rose    #FF66CC
    { h: 285, s: 75, l: 62 },  // violet pâle
  ]
  const p = palettes[i % palettes.length]
  const x = 0.15 + Math.random() * 0.7
  const y = 0.1 + Math.random() * 0.8
  return {
    x, y, cx: x, cy: y,
    vx: (Math.random() - 0.5) * 0.00015,
    vy: (Math.random() - 0.5) * 0.00015,
    r: 0.35 + Math.random() * 0.25,
    h: p.h + (Math.random() - 0.5) * 20,
    s: p.s,
    l: p.l,
    a: 0.28 + Math.random() * 0.18,
    phase: Math.random() * Math.PI * 2,
    speed: 0.0003 + Math.random() * 0.0004,
  }
}

// Génère une texture grain (offscreen canvas 256×256)
function buildGrainTexture(): HTMLCanvasElement {
  const size = 256
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')!
  const img = ctx.createImageData(size, size)
  for (let i = 0; i < img.data.length; i += 4) {
    const v = (Math.random() * 255) | 0
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v
    img.data[i + 3] = 18  // très transparent
  }
  ctx.putImageData(img, 0, 0)
  return c
}

export default function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // Souris normalisée [-1, 1]
  const mouse = useRef({ x: 0, y: 0, tx: 0, ty: 0 })
  // Scroll normalisé [0, 1]
  const scrollRef = useRef(0)
  const rafRef = useRef<number>(0)
  const blobsRef = useRef<Blob[]>([])
  const grainRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    // ── Resize ──────────────────────────────────────────────────
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize, { passive: true })

    // ── Init blobs ──────────────────────────────────────────────
    const N = 5
    blobsRef.current = Array.from({ length: N }, (_, i) =>
      createBlob(canvas.width, canvas.height, i)
    )

    // ── Grain texture ───────────────────────────────────────────
    grainRef.current = buildGrainTexture()

    // ── Events ──────────────────────────────────────────────────
    const onMouse = (e: MouseEvent) => {
      // Normalise en [-1, 1] : position relative au centre
      mouse.current.tx = (e.clientX / window.innerWidth - 0.5) * 2
      mouse.current.ty = (e.clientY / window.innerHeight - 0.5) * 2
    }
    const onScroll = () => {
      // scrollRef normalisé [0, 1] sur 2000px de scroll
      scrollRef.current = Math.min(window.scrollY / 2000, 1)
    }

    window.addEventListener('mousemove', onMouse, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })

    // ── Render loop ──────────────────────────────────────────────
    let t = 0
    const render = () => {
      rafRef.current = requestAnimationFrame(render)
      t++

      const W = canvas.width
      const H = canvas.height

      // Lerp souris
      mouse.current.x += (mouse.current.tx - mouse.current.x) * 0.04
      mouse.current.y += (mouse.current.ty - mouse.current.y) * 0.04

      const mx = mouse.current.x  // [-1, 1]
      const my = mouse.current.y
      const scroll = scrollRef.current  // [0, 1]

      // Fond
      ctx.fillStyle = '#09090b'
      ctx.fillRect(0, 0, W, H)

      // Blobs
      ctx.save()
      ctx.filter = 'blur(0px)' // reset
      ctx.globalCompositeOperation = 'screen'

      for (const blob of blobsRef.current) {
        // Drift autonome
        blob.x += blob.vx
        blob.y += blob.vy

        // Rebond aux bords
        if (blob.x < 0.05 || blob.x > 0.95) blob.vx *= -1
        if (blob.y < 0.05 || blob.y > 0.95) blob.vy *= -1

        // Interpolation douce vers position cible
        blob.cx += (blob.x - blob.cx) * 0.008
        blob.cy += (blob.y - blob.cy) * 0.008

        // Offset souris : chaque blob réagit différemment
        const mouseScale = 0.08 + (blobsRef.current.indexOf(blob) * 0.03)
        const px = (blob.cx + mx * mouseScale) * W
        // Offset scroll : les blobs dérivent vers le haut au scroll
        const py = (blob.cy + my * mouseScale * 0.5 - scroll * 0.15) * H

        // Pulsation
        const pulse = Math.sin(t * blob.speed + blob.phase) * 0.08
        const r = (blob.r + pulse) * Math.min(W, H) * 0.85

        // Dégradé radial
        const grad = ctx.createRadialGradient(px, py, 0, px, py, r)
        const alpha = blob.a * (0.85 + Math.sin(t * blob.speed * 0.7 + blob.phase) * 0.15)
        grad.addColorStop(0,   `hsla(${blob.h}, ${blob.s}%, ${blob.l}%, ${alpha})`)
        grad.addColorStop(0.4, `hsla(${blob.h}, ${blob.s}%, ${blob.l}%, ${alpha * 0.4})`)
        grad.addColorStop(1,   `hsla(${blob.h}, ${blob.s}%, ${blob.l}%, 0)`)

        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(px, py, r, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.restore()

      // Vignette radiale
      const vign = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.75)
      vign.addColorStop(0.35, 'transparent')
      vign.addColorStop(1, 'rgba(9,9,11,0.88)')
      ctx.fillStyle = vign
      ctx.fillRect(0, 0, W, H)

      // Gradient bas (lisibilité scroll)
      const gBot = ctx.createLinearGradient(0, H * 0.65, 0, H)
      gBot.addColorStop(0, 'transparent')
      gBot.addColorStop(1, 'rgba(9,9,11,0.96)')
      ctx.fillStyle = gBot
      ctx.fillRect(0, 0, W, H)

      // Grain noise (tuilé)
      if (grainRef.current) {
        ctx.save()
        ctx.globalAlpha = 0.055
        ctx.globalCompositeOperation = 'overlay'
        const grain = grainRef.current
        // Décalage aléatoire chaque frame pour effet animé
        const ox = ((t * 3) % 256)
        const oy = ((t * 2) % 256)
        for (let gx = -ox; gx < W + 256; gx += 256) {
          for (let gy = -oy; gy < H + 256; gy += 256) {
            ctx.drawImage(grain, gx, gy)
          }
        }
        ctx.restore()
      }
    }

    render()

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      style={{ display: 'block' }}
    />
  )
}
