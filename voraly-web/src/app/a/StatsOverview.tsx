interface Props {
  totalPageViews: number
  uniqueVisitors: number
  signups: number
  premiumConversions: number
}

function KpiCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <p className="text-sm font-medium text-white/50">{label}</p>
      <p className={['mt-2 text-4xl font-bold tabular-nums', accent ?? 'text-white'].join(' ')}>
        {value.toLocaleString('fr-FR')}
      </p>
    </div>
  )
}

export default function StatsOverview({ totalPageViews, uniqueVisitors, signups, premiumConversions }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <KpiCard label="Pages vues" value={totalPageViews} />
      <KpiCard label="Visiteurs uniques" value={uniqueVisitors} accent="text-indigo-400" />
      <KpiCard label="Inscriptions" value={signups} accent="text-violet-400" />
      <KpiCard label="Conversions Pro" value={premiumConversions} accent="text-[#FF66CC]" />
    </div>
  )
}
