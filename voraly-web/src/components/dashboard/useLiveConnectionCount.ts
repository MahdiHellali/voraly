'use client'

import { useEffect, useState, useRef } from 'react'

/**
 * Écoute l'extension Voraly et expose le nombre de plateformes connectées
 * (source de vérité = extension locale). Envoie un seul ping au montage.
 */
export function useLiveConnectionCount(): number {
  const [count, setCount] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    const origin = window.location.origin

    function onMessage(event: MessageEvent) {
      if (event.origin !== origin || event.source !== window) return
      if (event.data?.type === 'VORALY_CONNECTIONS') {
        const connections = event.data.connections ?? {}
        setCount(Object.keys(connections).length)
      }
    }

    window.addEventListener('message', onMessage)

    // Un seul ping après un court délai (le temps que l'extension s'initialise)
    const t = setTimeout(() => window.postMessage({ type: 'VORALY_GET_CONNECTIONS' }, origin), 800)

    return () => {
      window.removeEventListener('message', onMessage)
      clearTimeout(t)
    }
  }, [])

  return count
}
