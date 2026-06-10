import type { Metadata } from 'next'
import { TrendingUp, Sparkles } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Optimisation des Offres — Voraly',
  description: "Analysez et optimisez vos offres freelance grâce à l'IA Voraly.",
}

export default function OptimizePage() {
  return (
    <div className="flex w-full flex-col gap-8 fade-1">
      {/* Header */}
      <div>
        <p className="text-[11px] font-bold text-orange-400 uppercase tracking-[0.15em] mb-2">
          📈 Analyse IA
        </p>
        <h1 className="text-2xl font-extrabold text-white tracking-tight mb-2">
          Optimisation des Offres
        </h1>
        <p className="text-sm text-zinc-400">
          Analysez la performance de vos offres et recevez des recommandations IA pour maximiser votre taux de conversion.
        </p>
      </div>

      {/* Coming soon glass card */}
      <div className="glass-hero rounded-3xl p-12 flex flex-col items-center justify-center text-center gap-6 fade-2 relative overflow-hidden">
        <div className="glow-sphere" />
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #f97316, #fb923c)',
            boxShadow: '0 0 30px rgba(249,115,22,0.4)',
          }}
        >
          <TrendingUp size={28} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white mb-2">Analyse en cours de développement</h2>
          <p className="text-sm text-zinc-400 max-w-sm">
            Cette section analysera automatiquement vos offres Upwork, Fiverr et Malt pour identifier les axes d'amélioration.
          </p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-orange-300 bg-orange-500/10 border border-orange-500/25 hover:bg-orange-500/20 transition-all duration-200">
          <Sparkles size={14} />
          Être notifié au lancement
        </button>
      </div>
    </div>
  )
}
