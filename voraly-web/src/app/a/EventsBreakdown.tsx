const TYPE_COLORS: Record<string, string> = {
  page_view:       '#6366f1',
  signup:          '#8b5cf6',
  premium_upgrade: '#FF66CC',
  feature_use:     '#22d3ee',
}

interface Props {
  eventsByType: { event_type: string; count: number }[]
}

export default function EventsBreakdown({ eventsByType }: Props) {
  const total = eventsByType.reduce((s, e) => s + e.count, 0)

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <h2 className="mb-4 text-base font-semibold text-white/80">Répartition par événement</h2>
      {eventsByType.length === 0 ? (
        <p className="text-sm text-white/30">Aucune donnée</p>
      ) : (
        <div className="space-y-3">
          {eventsByType.map(({ event_type, count }) => {
            const pct = total > 0 ? Math.round((count / total) * 100) : 0
            const color = TYPE_COLORS[event_type] ?? '#ffffff40'
            return (
              <div key={event_type} className="flex items-center gap-3">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: color }}
                />
                <span className="flex-1 truncate text-sm text-white/70">{event_type}</span>
                <span className="text-sm tabular-nums text-white/40">{pct}%</span>
                <span className="w-10 text-right text-sm tabular-nums text-white/60">{count}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
