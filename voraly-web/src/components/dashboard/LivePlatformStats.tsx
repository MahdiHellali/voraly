'use client'

import { useEffect, useState } from 'react'

interface Props {
  connectableCount: number
}

/**
 * Affiche le compteur réel de plateformes connectées depuis l'extension Voraly.
 * Remplace le compteur serveur (0/X) qui dépend des records DB.
 */
export function LivePlatformStats({ connectableCount }: Props) {
  const [connectedCount, setConnectedCount] = useState(0)

  useEffect(() => {
    const origin = window.location.origin

    function onMessage(event: MessageEvent) {
      if (event.origin !== origin || event.source !== window) return
      if (event.data?.type === 'VORALY_CONNECTIONS') {
        const connections = event.data.connections ?? {}
        setConnectedCount(Object.keys(connections).length)
      }
    }

    window.addEventListener('message', onMessage)

    // Demander les connexions
    const t = setTimeout(() => window.postMessage({ type: 'VORALY_GET_CONNECTIONS' }, origin), 500)

    return () => {
      window.removeEventListener('message', onMessage)
      clearTimeout(t)
    }
  }, [])

  return (
    <span>{connectedCount} / {connectableCount}</span>
  )
}
