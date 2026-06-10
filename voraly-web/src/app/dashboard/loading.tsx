// Instant route-transition loading UI for all /dashboard segments.
// Rendered automatically by Next.js (App Router) while a Server Component
// page is fetching. No 'use client' needed — pure CSS animation.

export default function DashboardLoading() {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center">
      <div className="relative flex flex-col items-center gap-7">
        {/* Soft neon glow aura — violet → pink */}
        <div
          aria-hidden="true"
          className="absolute -inset-16 animate-pulse rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(139,92,246,0.22) 0%, rgba(232,121,249,0.10) 45%, transparent 70%)',
          }}
        />

        {/* Liquid-glass disc holding the spinner */}
        <div className="glass relative flex h-20 w-20 items-center justify-center rounded-full">
          {/* track */}
          <div className="absolute inset-3 rounded-full border-2 border-white/[0.06]" />
          {/* spinning arc */}
          <div
            className="absolute inset-3 animate-spin rounded-full border-2 border-transparent [animation-duration:0.85s]"
            style={{
              borderTopColor: '#a78bfa',
              borderRightColor: '#e879f9',
              filter: 'drop-shadow(0 0 9px rgba(139,92,246,0.65))',
            }}
          />
          {/* inner pulsing core */}
          <div className="h-2 w-2 animate-pulse rounded-full bg-violet-300/80 shadow-[0_0_12px_rgba(167,139,250,0.9)]" />
        </div>

        <span className="relative text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500">
          Chargement…
        </span>
      </div>
    </div>
  )
}
