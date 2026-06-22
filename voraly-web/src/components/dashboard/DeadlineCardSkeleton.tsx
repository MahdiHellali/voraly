// ─── Voraly · Dashboard · DeadlineCard skeleton ──────────────────────────────
// Fallback <Suspense> pendant le fetch live de l'agenda Google Calendar.
// Conserve le gabarit verre pour éviter tout saut de layout.

export default function DeadlineCardSkeleton() {
  return (
    <div
      className="glass rounded-2xl p-6 flex flex-col"
      style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
      aria-busy="true"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-sm font-bold text-zinc-100">⚡ Urgences &amp; Deadlines</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">Livraisons imminentes</div>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-10">
        <div className="h-10 w-10 animate-pulse rounded-2xl border border-white/[0.08] bg-white/[0.05]" />
        <div className="h-2.5 w-44 animate-pulse rounded-full bg-white/[0.06]" />
        <div className="h-2.5 w-32 animate-pulse rounded-full bg-white/[0.04]" />
      </div>
    </div>
  )
}
