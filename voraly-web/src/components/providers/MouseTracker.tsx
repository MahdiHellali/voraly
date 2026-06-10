'use client'

import { useEffect, useState } from 'react'

export default function MouseTracker() {
  const [position, setPosition] = useState({ x: -1000, y: -1000 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
      style={{
        background: `radial-gradient(circle 450px at ${position.x}px ${position.y}px, rgba(139, 92, 246, 0.12) 0%, rgba(99, 102, 241, 0.05) 50%, transparent 80%)`,
      }}
    />
  )
}
