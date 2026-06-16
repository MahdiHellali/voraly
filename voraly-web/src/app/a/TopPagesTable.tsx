interface Props {
  topPages: { page_url: string; count: number }[]
}

export default function TopPagesTable({ topPages }: Props) {
  const max = topPages[0]?.count ?? 1

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <h2 className="mb-4 text-base font-semibold text-white/80">Top pages</h2>
      {topPages.length === 0 ? (
        <p className="text-sm text-white/30">Aucune donnée</p>
      ) : (
        <div className="space-y-3">
          {topPages.map(({ page_url, count }) => (
            <div key={page_url} className="flex items-center gap-3">
              <span className="w-52 truncate text-sm text-white/70 shrink-0">{page_url}</span>
              <div className="flex-1 overflow-hidden rounded-full bg-white/5 h-2">
                <div
                  className="h-full rounded-full bg-violet-500"
                  style={{ width: `${(count / max) * 100}%` }}
                />
              </div>
              <span className="w-10 text-right text-sm tabular-nums text-white/50">{count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
