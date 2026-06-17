interface Props {
  dailyViews: { date: string; count: number }[]
}

export default function DailyChart({ dailyViews }: Props) {
  const max = Math.max(...dailyViews.map(d => d.count), 1)
  const H = 120
  const W = 40

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <h2 className="mb-4 text-base font-semibold text-white/80">Pages vues / jour</h2>
      {dailyViews.length === 0 ? (
        <p className="text-sm text-white/30">Aucune donnée</p>
      ) : (
        <div className="overflow-x-auto">
          <svg
            width={Math.max(dailyViews.length * W, 300)}
            height={H + 40}
            aria-label="Graphique pages vues par jour"
          >
            {dailyViews.map(({ date, count }, i) => {
              const barH = Math.max((count / max) * H, 2)
              const x = i * W + 4
              const y = H - barH
              return (
                <g key={date}>
                  <rect
                    x={x}
                    y={y}
                    width={W - 8}
                    height={barH}
                    rx={4}
                    fill="#8b5cf6"
                    fillOpacity={0.8}
                  />
                  <title>{date} : {count} vue{count > 1 ? 's' : ''}</title>
                  <text
                    x={x + (W - 8) / 2}
                    y={H + 16}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.35)"
                    fontSize={9}
                  >
                    {date.slice(5)}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      )}
    </div>
  )
}
