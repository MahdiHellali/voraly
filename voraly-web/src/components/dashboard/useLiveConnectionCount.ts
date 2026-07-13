'use client'

import { useEffect, useState } from 'react'

/**
 * Écoute l'extension Voraly et expose le nombre de plateformes connectées
 * (source de vérité = extension locale, pas seulement la DB).
 */
export function useLiveConnectionCount(): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const origin = window.location.origin

    function onMessage(event: MessageEvent) {
      if (event.origin !== origin || event.source !== window) return
      const data = event.data
      if (!data || typeof data.type !== 'string') return

      if (data.type === 'VORALY_CONNECTIONS') {
        const connections = data.connections ?? {}
        setCount(Object.keys(connections).length)
      }

      // Extension ready = on interroge les connexions
      if (data.type === 'VORALY_EXTENSION_READY') {
        window.postMessage({ type: 'VORALY_GET_CONNECTIONS' }, origin)
      }
    }

    window.addEventListener('message', onMessage)

    // Demander les connexions au chargement
    const pings = [100, 500, 1500].map(delay =>
      setTimeout(() => window.postMessage({ type: 'VORALY_GET_CONNECTIONS' }, origin), delay)
    )

    return () => {
      window.removeEventListener('message', onMessage)
      pings.forEach(clearTimeout)
    }
  }, [])

  return count
}
