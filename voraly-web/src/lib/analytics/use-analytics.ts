'use client'

import { useCallback, useEffect, useRef } from 'react'

export interface TrackOptions {
  page_url?: string
  referrer?: string
  event_data?: Record<string, unknown>
}

interface QueuedEvent {
  event_type: string
  session_id: string
  page_url: string
  referrer?: string
  event_data?: Record<string, unknown>
}

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return ''
  const key = 'voralytics_sid'
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(key, id)
  }
  return id
}

export function useAnalytics() {
  const queueRef = useRef<QueuedEvent[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flush = useCallback(async () => {
    if (queueRef.current.length === 0) return
    const batch = queueRef.current.splice(0)
    for (const event of batch) {
      try {
        await fetch('/api/analytics/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
          keepalive: true,
        })
      } catch {
        // best-effort — un event manqué ne bloque pas l'UI
      }
    }
  }, [])

  const track = useCallback(
    (event_type: string, options?: TrackOptions) => {
      const session_id = getOrCreateSessionId()
      queueRef.current.push({
        event_type,
        session_id,
        page_url: options?.page_url ?? window.location.pathname,
        referrer: options?.referrer ?? (document.referrer || undefined),
        event_data: options?.event_data,
      })
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(flush, 3_000)
    },
    [flush],
  )

  const trackPageView = useCallback(() => {
    track('page_view')
  }, [track])

  // Flush avant fermeture / passage en arrière-plan
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    window.addEventListener('visibilitychange', onVisibilityChange)
    return () => window.removeEventListener('visibilitychange', onVisibilityChange)
  }, [flush])

  return { track, trackPageView }
}
