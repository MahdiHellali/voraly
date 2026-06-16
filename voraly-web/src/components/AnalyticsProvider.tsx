'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAnalytics } from '@/lib/analytics/use-analytics'

export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { track } = useAnalytics()

  useEffect(() => {
    if (pathname.includes('/api/') || pathname.includes('/_next/')) return
    track('page_view', { page_url: pathname })
  }, [pathname, track])

  return <>{children}</>
}
