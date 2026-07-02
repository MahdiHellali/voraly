'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Clock, Plus, ArrowRight, Unplug, Puzzle, Loader2, Check } from 'lucide-react'
import { disconnectPlatform } from '@/app/dashboard/platforms/actions'

// Plateformes connectées via l'extension Voraly (popup « OAuth-like », sync
// arrière-plan). Doit rester aligné avec SUPPORTED_PLATFORMS de voraly-extension.
const EXTENSION_PLATFORM_IDS = new Set(['fiverr', 'upwork', 'malt'])

export type PlatformCardData = {
  id: string
  label: string
  desc: string
  icon: string
  color: string
  border: string
  glow: string
  /** true si une connexion persistée existe déjà en base. */
  connected: boolean
  /** true pour upwork/fiverr/malt (connexion via extension). */
  isExtension: boolean
  /** OAuth classique disponible (endpoints présents) — pertinent hors extension. */
  oauthConnectable: boolean
  /** Libellé « Connecter {label} » pré-traduit côté serveur. */
  connectLabel: string
}

export type PlatformCardLabels = {
  disconnect: string
  comingSoon: string
  connectExtension: string
  extensionRequired: string
  badgeConnected: string
  badgeNotConnected: string
  badgeSoon: string
}

type Connections = Record<string, { connectedAt?: string } | undefined>

/**
 * Grille des cartes plateforme. Pour les plateformes extension (upwork, fiverr,
 * malt) le bouton est piloté par la présence de l'extension Voraly, détectée via
 * window.postMessage avec le content script (voraly-bridge.js) :
 *  - extension absente  → bouton grisé + tooltip « Extension requise »
 *  - extension présente → « Connecter via l'extension », ouvre la popup login
 *  - après login        → « Connecté » (checkmark émeraude)
 * Aucun faux positif : rien n'est actif tant que VORALY_EXTENSION_READY (ou une
 * réponse de connexions) n'a pas été reçu. LinkedIn conserve son flow OAuth.
 */
export function PlatformCards({
  cards,
  labels,
}: {
  cards: PlatformCardData[]
  labels: PlatformCardLabels
}) {
  const router = useRouter()
  const [extDetected, setExtDetected] = useState(false)
  const [connections, setConnections] = useState<Connections>({})
  const [pending, setPending] = useState<string | null>(null)
  // Miroir de `pending` lisible dans le handler de message sans le mettre en dep.
  const pendingRef = useRef<string | null>(null)
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
        // GET_CONNECTIONS → boucle infinie. Les pings programmés récupèrent l'état.
        setExtDetected(true)
      }
      if (data.type === 'VORALY_CONNECTIONS') {
        // Une réponse de connexions prouve aussi la présence de l'extension :
        // évite les boutons grisés si le READY initial a été manqué (race mount).
        setExtDetected(true)
        const next: Connections = data.connections ?? {}
        setConnections(next)
        const p = pendingRef.current
        if (p && next[p]) {
          pendingRef.current = null
          setPending(null)
          stopPolling()
          // Laisse le SW appeler POST /api/platforms/register (création de la
          // ligne BDD) puis resynchronise les données rendues côté serveur
          // (stat « X/4 » + empty state du dashboard au prochain rendu).
          setTimeout(() => router.refresh(), 2200)
        }
      }
    }

    window.addEventListener('message', onMessage)

    // Ping de découverte répété : couvre les deux ordres de course (bridge injecté
    // avant OU après le montage). On s'arrête dès qu'une réponse arrive.
    const pings = [0, 400, 1000, 2200, 4000].map((delay) =>
      setTimeout(() => window.postMessage({ type: 'VORALY_GET_CONNECTIONS' }, origin), delay),
    )

    return () => {
      window.removeEventListener('message', onMessage)
      pings.forEach(clearTimeout)
      stopPolling()
    }
  }, [stopPolling, router])

  const disconnect = useCallback((platform: string) => {
    // Efface l'état local de l'extension : sans ça, le bridge continuerait de
    // rapporter la plateforme comme connectée (liveConnected) → faux « Connecté »
    // malgré la suppression de la ligne BDD par la Server Action.
    window.postMessage({ type: 'VORALY_DISCONNECT_PLATFORM', platform }, window.location.origin)
    setConnections((prev) => {
      if (!prev[platform]) return prev
      const next = { ...prev }
      delete next[platform]
      return next
    })
    if (pendingRef.current === platform) pendingRef.current = null
    setPending((p) => (p === platform ? null : p))
    stopPolling()
  }, [stopPolling])

  const connect = useCallback(
    (platform: string) => {
      pendingRef.current = platform
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
    <div className="grid grid-cols-1 gap-5 fade-3 md:grid-cols-2">
      {cards.map((p) => {
        const isExtension = p.isExtension && EXTENSION_PLATFORM_IDS.has(p.id)
        // « Connecté » = persistance BDD OU signal live de l'extension.
        const liveConnected = Boolean(connections[p.id])
        const connected = p.connected || liveConnected
        const isPending = pending === p.id && !connected

        return (
          <div
            key={p.id}
            className={`glass group relative overflow-hidden rounded-3xl border p-6 transition-all duration-300 ${p.border}`}
          >
            {/* Background glow tint */}
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br ${p.color} opacity-60`}
            />
            {/* Inner glow orb */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{ background: `radial-gradient(circle, ${p.glow} 0%, transparent 70%)`, filter: 'blur(20px)' }}
            />

            <div className="relative z-10">
              {/* Header row */}
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-lg overflow-hidden bg-zinc-900/60 border border-white/10 p-0.5">
                    <Image
                      src={p.icon}
                      alt={p.label}
                      width={24}
                      height={24}
                      className="object-contain select-none"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-base font-bold text-zinc-100">{p.label}</div>
                  </div>
                </div>
                <CardBadge
                  connected={connected}
                  isExtension={isExtension}
                  extDetected={extDetected}
                  oauthConnectable={p.oauthConnectable}
                  labels={labels}
                />
              </div>

              {/* Description */}
              <p className="mb-5 text-[12px] leading-relaxed text-zinc-400">{p.desc}</p>

              {/* CTA */}
              <CardCta
                card={p}
                isExtension={isExtension}
                connected={connected}
                isPending={isPending}
                extDetected={extDetected}
                labels={labels}
                onConnect={connect}
                onDisconnect={disconnect}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── CTA ──────────────────────────────────────────────────────────────────────
function CardCta({
  card,
  isExtension,
  connected,
  isPending,
  extDetected,
  labels,
  onConnect,
  onDisconnect,
}: {
  card: PlatformCardData
  isExtension: boolean
  connected: boolean
  isPending: boolean
  extDetected: boolean
  labels: PlatformCardLabels
  onConnect: (platform: string) => void
  onDisconnect: (platform: string) => void
}) {
  // Connecté (BDD ou live) → bouton de déconnexion (server action).
  if (connected) {
    return (
      // onSubmit efface l'état local extension AVANT que la Server Action ne
      // supprime la ligne BDD + revalide — sinon la carte resterait « Connecté ».
      <form action={disconnectPlatform} onSubmit={() => onDisconnect(card.id)}>
        <input type="hidden" name="provider" value={card.id} />
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 py-2.5 text-[12px] font-semibold text-rose-300 transition-all duration-200 hover:bg-rose-500/20"
        >
          <Unplug size={13} /> {labels.disconnect}
        </button>
      </form>
    )
  }

  // Plateforme extension : bouton piloté par la présence de l'extension.
  if (isExtension) {
    if (!extDetected) {
      // Extension absente → grisé + tooltip.
      return (
        <button
          type="button"
          disabled
          title={labels.extensionRequired}
          aria-label={labels.extensionRequired}
          className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] py-2.5 text-[12px] font-semibold text-zinc-500 opacity-60"
        >
          <Puzzle size={13} /> {card.connectLabel}
        </button>
      )
    }
    // Extension présente → connexion via popup.
    return (
      <button
        type="button"
        disabled={isPending}
        onClick={() => onConnect(card.id)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/10 py-2.5 text-[12px] font-semibold text-indigo-300 transition-all duration-200 hover:bg-indigo-500/20 group-hover:border-indigo-400/40 disabled:opacity-60"
      >
        {isPending ? <Loader2 size={13} className="animate-spin" /> : <Puzzle size={13} />}
        {labels.connectExtension}
      </button>
    )
  }

  // Plateforme OAuth classique (LinkedIn) → inchangé.
  if (card.oauthConnectable) {
    return (
      <a
        href={`/api/platforms/${card.id}/connect`}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/10 py-2.5 text-[12px] font-semibold text-indigo-300 transition-all duration-200 hover:bg-indigo-500/20 group-hover:border-indigo-400/40"
      >
        <Plus size={13} /> {card.connectLabel}
        <ArrowRight size={12} className="ml-auto opacity-0 transition-opacity group-hover:opacity-100" />
      </a>
    )
  }

  // OAuth non disponible → bloc inerte.
  return (
    <div className="w-full rounded-xl border border-white/[0.04] bg-white/[0.02] py-2.5 text-center text-[12px] text-zinc-500">
      {labels.comingSoon}
    </div>
  )
}

// ─── Badge ──────────────────────────────────────────────────────────────────────
function CardBadge({
  connected,
  isExtension,
  extDetected,
  oauthConnectable,
  labels,
}: {
  connected: boolean
  isExtension: boolean
  extDetected: boolean
  oauthConnectable: boolean
  labels: PlatformCardLabels
}) {
  if (connected) {
    return (
      <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-400">
        <Check size={10} className="shrink-0" /> {labels.badgeConnected}
      </span>
    )
  }
  // Extension absente + aucune autre voie de connexion → « Bientôt ».
  if (isExtension && !extDetected) {
    return (
      <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-[10px] font-bold text-indigo-400">
        <Clock size={10} className="shrink-0" /> {labels.badgeSoon}
      </span>
    )
  }
  // Non extension et non connectable → « Bientôt ».
  if (!isExtension && !oauthConnectable) {
    return (
      <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-[10px] font-bold text-indigo-400">
        <Clock size={10} className="shrink-0" /> {labels.badgeSoon}
      </span>
    )
  }
  return (
    <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold text-zinc-500">
      {labels.badgeNotConnected}
    </span>
  )
}
