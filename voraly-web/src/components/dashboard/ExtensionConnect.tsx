'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Puzzle, Check, Loader2 } from 'lucide-react'

// Plateformes prises en charge par l'extension (sync « OAuth-like » via popup).
// Doit rester aligné avec SUPPORTED_PLATFORMS de voraly-extension.
const EXT_PLATFORMS = [
  { id: 'fiverr', label: 'Fiverr' },
  { id: 'upwork', label: 'Upwork' },
  { id: 'malt', label: 'Malt' },
] as const

type ExtPlatformId = (typeof EXT_PLATFORMS)[number]['id']
type Connections = Record<string, { connectedAt?: string } | undefined>

/**
 * Bandeau « Connexion via l'extension Voraly ». Communique avec le content
 * script (voraly-bridge.js) par window.postMessage. Ne s'affiche QUE si
 * l'extension a signalé sa présence (VORALY_EXTENSION_READY) — jamais de bouton
 * mort si l'extension n'est pas installée.
 */
export function ExtensionConnect() {
  const [detected, setDetected] = useState(false)
  const [connections, setConnections] = useState<Connections>({})
  const [pending, setPending] = useState<ExtPlatformId | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollStopRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const stopPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current)
    if (pollStopRef.current) clearTimeout(pollStopRef.current)
    pollRef.current = null
    pollStopRef.current = null
  }, [])

  useEffect(() => {
    const origin = window.location.origin

    function onMessage(event: MessageEvent) {
      // On n'accepte que les messages de notre propre page.
      if (event.origin !== origin || event.source !== window) return
      const data = event.data
      if (!data || typeof data.type !== 'string') return

      if (data.type === 'VORALY_EXTENSION_READY') {
        // NE PAS re-poster GET_CONNECTIONS ici : le bridge ré-émet READY à chaque
        // GET_CONNECTIONS, ce qui créerait une boucle infinie READY↔GET_CONNECTIONS
        // (crash de l'onglet). Les pings programmés ci-dessous récupèrent l'état.
        setDetected(true)
      }
      if (data.type === 'VORALY_CONNECTIONS') {
        // Une réponse de connexions PROUVE aussi la présence de l'extension :
        // évite le bandeau grisé si le READY initial a été manqué (race mount).
        setDetected(true)
        const next: Connections = data.connections ?? {}
        setConnections(next)
        // Ne lève le spinner que si la plateforme visée est désormais connectée.
        setPending((p) => {
          if (p && next[p]) {
            stopPolling()
            return null
          }
          return p
        })
      }
    }

    window.addEventListener('message', onMessage)

    // Ping de découverte répété : couvre les deux ordres de course (bridge
    // injecté avant OU après le montage du composant). On arrête dès détection.
    const pings = [0, 400, 1000, 2200, 4000].map((delay) =>
      setTimeout(() => window.postMessage({ type: 'VORALY_GET_CONNECTIONS' }, origin), delay),
    )

    return () => {
      window.removeEventListener('message', onMessage)
      pings.forEach(clearTimeout)
      stopPolling()
    }
  }, [stopPolling])

  const connect = useCallback(
    (platform: ExtPlatformId) => {
      setPending(platform)
      window.postMessage({ type: 'VORALY_CONNECT_PLATFORM', platform }, window.location.origin)
      // Après la popup de login, on re-sonde l'état (le SW se met à jour à la
      // détection de session). On ne garde qu'un seul poll actif à la fois.
      stopPolling()
      pollRef.current = setInterval(() => {
        window.postMessage({ type: 'VORALY_GET_CONNECTIONS' }, window.location.origin)
      }, 4000)
      pollStopRef.current = setTimeout(stopPolling, 5 * 60 * 1000)
    },
    [stopPolling],
  )

  return (
    <AnimatePresence>
      {detected && (
        <motion.div
          initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass relative overflow-hidden rounded-3xl border border-violet-500/20 p-6"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.18), transparent 70%)' }}
          />
          <div className="relative z-10">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]">
                <Puzzle className="h-4 w-4 text-violet-300" />
              </div>
              <div>
                <div className="text-[13px] font-bold text-zinc-100">
                  Extension Voraly détectée
                </div>
                <div className="text-[11.5px] text-zinc-400">
                  Connectez-vous une fois, la synchronisation se fait ensuite en arrière-plan.
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {EXT_PLATFORMS.map((p) => {
                const isConnected = Boolean(connections[p.id])
                const isPending = pending === p.id && !isConnected
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={isConnected || isPending}
                    onClick={() => connect(p.id)}
                    className={
                      'flex items-center gap-2 rounded-xl border px-3.5 py-2 text-[12px] font-semibold transition-all duration-200 ' +
                      (isConnected
                        ? 'cursor-default border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                        : 'border-indigo-500/20 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 disabled:opacity-60')
                    }
                  >
                    {isConnected ? (
                      <Check size={13} />
                    ) : isPending ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : null}
                    {isConnected ? `${p.label} connecté` : `Connecter ${p.label}`}
                  </button>
                )
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
