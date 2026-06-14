'use client'

/**
 * HeroBackground — Aurora canvas 2D réactif souris + scroll
 * 5 blobs flous (violet/indigo/rose) sur fond #09090b.
 * Grain noise cinématique. Zéro WebGL, zéro dépendance.
 */

import { useEffect, useRef } from 'react'

interface Blob {
  x: number       // position courante px
  y: number
  tx: number      // cible drift autonome px
  ty: number
  r: number       // rayon px (calculé au resize)
  rBase: number   // rayon de base relatif [0.25–0.45]
  phase: number
  speed: number
  h: number       // hue HSL
  s: number
  l: number
  a: number       // alpha max
  mouseWeight: number  // sensibilité souris [0.04–0.12]
}

// Palette Voraly
const PALETTE = [
  { h: 270, s: 78, l: 58, a: 0.9 },  // violet
  { h: 242, s: 82, l: 62, a: 0.8 },  // indigo
  { h: 318, s: 92, l: 62, a: 0.75 }, // rose #FF66CC
  { h: 260, s: 72, l: 65, a: 0.7 },  // violet pâle
  { h: 300, s: 80, l: 55, a: 0.65 }, // magenta doux
]

function initBlobs(W: number, H: number): Blob[] {
  return PALETTE.map((p, i) => {
    const x = W * (0.15 + (i / PALETTE.length) * 0.7 + (Math.random() - 0.5) * 0.12)
    const y = H * (0.1 + Math.random() * 0.8)
    return {
      x, y, tx: x, ty: y,
      r: 0, rBase: 0.28 + Math.random() * 0.18,
      phase: (i / PALETTE.length) * Math.PI * 2,
      speed: 0.00025 + Math.random() * 0.0003,
      h: p.h + (Math.random() - 0.5) * 18,
      s: p.s, l: p.l, a: p.a,
      mouseWeight: 0.04 + i * 0.02,
    }
  })
}

function buildGrain(size = 200): OffscreenCanvas | HTMLCanvasElement {
  const makeCanvas = () => {
    try { return new OffscreenCanvas(size, size) } catch { return document.createElement('canvas') }
  }
  const c = makeCanvas() as HTMLCanvasElement
  c.width = c.height = size
  const ctx = c.getContext('2d') as CanvasRenderingContext2D
  const img = ctx.createImageData(size, size)
  for (let i = 0; i < img.data.length; i += 4) {
    const v = (Math.random() * 255) | 0
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v
    img.data[i + 3] = 22
  }
  ctx.putImageData(img, 0, 0)
  return c
}

export default function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    // ── Scroll : lire depuis le scroll container (main#main-content)
    const getScrollProgress = () => {
      const el = document.getElementById('main-content')
      if (el) return Math.min(el.scrollTop / 1800, 1)
      return Math.min(window.scrollY / 1800, 1)
    }

    // ── State
    let W = 0, H = 0
    let blobs: Blob[] = []
    let mouseX = 0.5, mouseY = 0.5    // normalisé [0,1]
    let tMouseX = 0.5, tMouseY = 0.5  // cible lerp
    let raf = 0
    let t = 0
    const grain = buildGrain(256) as HTMLCanvasElement

    // ── Resize
    const resize = () => {
      W = canvas.width  = window.innerWidth
      H = canvas.height = window.innerHeight
      blobs = initBlobs(W, H)
      blobs.forEach(b => { b.r = b.rBase * Math.min(W, H) })
    }
    resize()
    window.addEventListener('resize', resize, { passive: true })

    // ── Souris
    const onMouse = (e: MouseEvent) => {
      tMouseX = e.clientX / W
      tMouseY = e.clientY / H
    }
    window.addEventListener('mousemove', onMouse, { passive: true })

    // ── Scroll — écoute sur le container ET window
    const scrollEl = document.getElementById('main-content')
    const onScroll = () => { /* lu directement dans render */ }
    scrollEl?.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })

    // ── Drift cibles autonomes (changent lentement)
    let driftT = 0
    const updateDrift = () => {
      driftT += 0.0005
      blobs.forEach((b, i) => {
        b.tx = W * (0.12 + 0.76 * (0.5 + 0.38 * Math.sin(driftT * (1 + i * 0.3) + b.phase)))
        b.ty = H * (0.08 + 0.84 * (0.5 + 0.38 * Math.cos(driftT * (0.8 + i * 0.25) + b.phase * 1.3)))
      })
    }

    // ── Render
    const render = () => {
      raf = requestAnimationFrame(render)
      t++

      // Lerp souris
      mouseX += (tMouseX - mouseX) * 0.05
      mouseY += (tMouseY - mouseY) * 0.05

      const scroll = getScrollProgress()
      updateDrift()

      // Fond
      ctx.fillStyle = '#09090b'
      ctx.fillRect(0, 0, W, H)

      // ── Blobs avec ctx.filter blur (rendu flou natif canvas 2D)
      for (const blob of blobs) {
        // Lerp vers cible
        blob.x += (blob.tx - blob.x) * 0.012
        blob.y += (blob.ty - blob.y) * 0.012

        // Offset souris
        const mx = (mouseX - 0.5) * W * blob.mouseWeight
        const my = (mouseY - 0.5) * H * blob.mouseWeight * 0.7

        // Offset scroll (remonte)
        const sy = -scroll * H * 0.18

        const px = blob.x + mx
        const py = blob.y + my + sy

        // Pulsation rayon
        const pulse = Math.sin(t * blob.speed * 60 + blob.phase) * 0.12
        const r = blob.r * (1 + pulse)

        // Blur natif
        ctx.save()
        ctx.filter = `blur(${Math.round(r * 0.72)}px)`

        const grad = ctx.createRadialGradient(px, py, 0, px, py, r)
        grad.addColorStop(0,   `hsla(${blob.h},${blob.s}%,${blob.l}%,${blob.a})`)
        grad.addColorStop(0.5, `hsla(${blob.h},${blob.s}%,${blob.l}%,${blob.a * 0.35})`)
        grad.addColorStop(1,   `hsla(${blob.h},${blob.s}%,${blob.l}%,0)`)

        ctx.beginPath()
        ctx.arc(px, py, r, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
        ctx.restore()
      }

      // Vignette radiale
      const vign = ctx.createRadialGradient(W * 0.5, H * 0.45, 0, W * 0.5, H * 0.45, Math.max(W, H) * 0.72)
      vign.addColorStop(0.3, 'transparent')
      vign.addColorStop(1,   'rgba(9,9,11,0.82)')
      ctx.fillStyle = vign
      ctx.fillRect(0, 0, W, H)

      // Gradient bas
      const bot = ctx.createLinearGradient(0, H * 0.6, 0, H)
      bot.addColorStop(0, 'transparent')
      bot.addColorStop(1, 'rgba(9,9,11,0.97)')
      ctx.fillStyle = bot
      ctx.fillRect(0, 0, W, H)

      // Grain animé
      ctx.save()
      ctx.globalAlpha = 0.045
      ctx.globalCompositeOperation = 'overlay'
      const ox = (t * 4) % 256
      const oy = (t * 3) % 256
      for (let gx = -ox; gx < W + 256; gx += 256)
        for (let gy = -oy; gy < H + 256; gy += 256)
          ctx.drawImage(grain, gx, gy)
      ctx.restore()
    }

    render()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouse)
      scrollEl?.removeEventListener('scroll', onScroll)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      style={{ display: 'block', background: '#09090b' }}
    />
  )
}
