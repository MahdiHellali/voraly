"use client"

import { useEffect, useRef } from "react"

/**
 * DotGrid — subtle animated dot grid background.
 * Dots react to mouse proximity and scroll. Linear/Vercel inspired.
 */
export default function DotGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!

    let mouseX = 0.5, mouseY = 0.5
    let raf = 0

    const SPACING = 32
    const DOT_R = 1.0
    const GLOW_R = 100

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

    // Scroll listener
    let scrollY = 0
    const scrollEl = document.getElementById("main-content")
    const onScroll = () => {
      scrollY = scrollEl?.scrollTop ?? window.scrollY
    }
    scrollEl?.addEventListener("scroll", onScroll, { passive: true })

    const render = () => {
      raf = requestAnimationFrame(render)

      const w = window.innerWidth
      const h = window.innerHeight
      ctx.clearRect(0, 0, w, h)

      // Parallax offset
      const py = scrollY * 0.15

      const cols = Math.ceil(w / SPACING) + 1
      const rows = Math.ceil(h / SPACING) + 1
      const ox = (scrollY * 0.02) % SPACING

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * SPACING - ox
          const y = r * SPACING - (py % SPACING)

          // Distance from mouse
          const dx = mouseX - x
          const dy = mouseY - y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const t = Math.max(0, 1 - dist / GLOW_R)

          // Base dot: very subtle
          const alpha = 0.08 + t * 0.22
          const radius = DOT_R + t * 2.0

          ctx.beginPath()
          ctx.arc(x, y, Math.max(0.5, radius), 0, Math.PI * 2)
          ctx.fillStyle = `rgba(139,92,246,${alpha.toFixed(3)})`
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
      style={{ background: "#09090b" }}
    />
  )
}
