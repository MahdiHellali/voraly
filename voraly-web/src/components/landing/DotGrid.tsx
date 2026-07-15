"use client"

import { useEffect, useRef } from "react"

/**
 * DotGrid — dot grid with drifting light orbs.
 * Linear/Vercel dots + subtle aurora blobs for depth.
 */
export default function DotGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!

    let mouseX = 0.5, mouseY = 0.5
    let raf = 0, t = 0

    const SPACING = 36
    const GLOW_R = 120

    // Light orbs — 3 large subtle blobs
    const orbs = [
      { x: 0.25, y: 0.3, r: 0.4, h: 270, s: 80, l: 55, a: 0.12, speed: 0.0003 },
      { x: 0.7, y: 0.6, r: 0.35, h: 242, s: 85, l: 60, a: 0.10, speed: 0.0004 },
      { x: 0.5, y: 0.15, r: 0.3, h: 318, s: 90, l: 60, a: 0.08, speed: 0.00035 },
    ]

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.scale(dpr, dpr)
    }
    resize()
    window.addEventListener("resize", resize)

    const onMouse = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
    }
    window.addEventListener("mousemove", onMouse, { passive: true })

    let scrollY = 0
    const scrollEl = document.getElementById("main-content")
    const onScroll = () => { scrollY = scrollEl?.scrollTop ?? window.scrollY }
    scrollEl?.addEventListener("scroll", onScroll, { passive: true })

    const render = () => {
      raf = requestAnimationFrame(render)
      t++
      const w = window.innerWidth
      const h = window.innerHeight

      // Background — slightly lifted from pure black
      ctx.fillStyle = "#0a0a10"
      ctx.fillRect(0, 0, w, h)

      // ── Light orbs ──────────────────────────────────────────────────
      for (const o of orbs) {
        const ox = w * (o.x + Math.sin(t * o.speed) * 0.08 + (mouseX / w - 0.5) * 0.04)
        const oy = h * (o.y + Math.cos(t * o.speed * 1.3) * 0.08 + (mouseY / h - 0.5) * 0.03 - scrollY * 0.00008)
        const or = Math.min(w, h) * o.r

        ctx.save()
        ctx.filter = `blur(${Math.round(or * 0.6)}px)`
        const grad = ctx.createRadialGradient(ox, oy, 0, ox, oy, or)
        grad.addColorStop(0, `hsla(${o.h},${o.s}%,${o.l}%,${o.a})`)
        grad.addColorStop(0.5, `hsla(${o.h},${o.s}%,${o.l}%,${o.a * 0.4})`)
        grad.addColorStop(1, "transparent")
        ctx.fillStyle = grad
        ctx.fillRect(ox - or, oy - or, or * 2, or * 2)
        ctx.restore()
      }

      // ── Dot grid ────────────────────────────────────────────────────
      const py = scrollY * 0.12
      const cols = Math.ceil(w / SPACING) + 1
      const rows = Math.ceil(h / SPACING) + 1
      const ox = (scrollY * 0.015) % SPACING

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * SPACING - ox
          const y = r * SPACING - (py % SPACING)
          const dx = mouseX - x
          const dy = mouseY - y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const mt = Math.max(0, 1 - dist / GLOW_R)

          const alpha = 0.12 + mt * 0.28
          const radius = 1.0 + mt * 2.5

          ctx.beginPath()
          ctx.arc(x, y, Math.max(0.5, radius), 0, Math.PI * 2)
          ctx.fillStyle = `rgba(180,160,240,${alpha.toFixed(3)})`
          ctx.fill()
        }
      }
    }

    render()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
      window.removeEventListener("mousemove", onMouse)
      scrollEl?.removeEventListener("scroll", onScroll)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
    />
  )
}
