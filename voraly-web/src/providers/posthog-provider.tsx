'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import posthog from 'posthog-js'
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react'
import { Suspense, useEffect } from 'react'

// ─── Voraly · PostHog Provider ────────────────────────────────────────────────
// Initialise PostHog uniquement si NEXT_PUBLIC_POSTHOG_KEY est présent.
// Pas de crash si la clé est absente (dev sans tracking).
// usePostHog est ré-exporté pour les composants qui veulent identifier l'utilisateur.

export { usePostHog }

function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const ph = usePostHog()

  useEffect(() => {
    if (!ph) return
    let url = window.location.origin + pathname
    if (searchParams.toString()) {
      url += `?${searchParams.toString()}`
    }
    ph.capture('$pageview', { $current_url: url })
  }, [pathname, searchParams, ph])

  return null
}

// Suspense boundary obligatoire pour useSearchParams en App Router
function PageViewTracker() {
  return (
    <Suspense fallback={null}>
      <PostHogPageView />
    </Suspense>
  )
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com'

  useEffect(() => {
    if (!key) return
    posthog.init(key, {
      api_host: host,
      capture_pageview: false, // géré manuellement via PageViewTracker
      capture_pageleave: true,
    })
  }, [key, host])

  if (!key) {
    return <>{children}</>
  }

  return (
    <PHProvider client={posthog}>
      <PageViewTracker />
      {children}
    </PHProvider>
  )
}
