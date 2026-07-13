'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Recharge la page une seule fois quand une plateforme est connectée/déconnectée.
 * Évite les boucles infinies en ne rafraîchissant qu'au changement de count.
 */
export function ConnectionWatcher() {
  const router = useRouter()
  const lastCount = useRef(0)

  useEffect(() => {
    const origin = window.location.origin
    let firstPing = true

    function onMessage(event: MessageEvent) {
      if (event.origin !== origin || event.source !== window) return
      const data = event.data
      if (!data || typeof data.type !== 'string') return

      if (data.type === 'VORALY_CONNECTIONS') {
        const connections = data.connections ?? {}
        const count = Object.keys(connections).length

        // Premier ping = initialisation, on ignore
        if (firstPing) {
          firstPing = false
          lastCount.current = count
          return
        }

        // Rafraîchir seulement si le count a changé (connect/déconnect)
        if (count !== lastCount.current) {
          lastCount.current = count
          router.refresh()
        }
      }
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [router])

  return null
}
