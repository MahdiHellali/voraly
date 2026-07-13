'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Écoute les messages de l'extension Voraly et rafraîchit le dashboard
 * quand une plateforme est connectée (mise à jour du compteur X/4 et des métriques).
 */
export function ConnectionWatcher() {
  const router = useRouter()

  useEffect(() => {
    const origin = window.location.origin

    function onMessage(event: MessageEvent) {
      if (event.origin !== origin || event.source !== window) return
      const data = event.data
      if (!data || typeof data.type !== 'string') return

      // Quand l'extension nous dit qu'une connexion a été établie
      if (data.type === 'VORALY_CONNECTIONS') {
        const connections = data.connections ?? {}
        const count = Object.keys(connections).length
        if (count > 0) {
          // Rafraîchir le dashboard côté serveur pour le nouveau compteur
          router.refresh()
        }
      }
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [router])

  return null
}
