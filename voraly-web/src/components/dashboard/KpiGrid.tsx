'use client'

import { Wallet, Package, Target } from 'lucide-react'
import { BentoGrid, type BentoItem } from '@/components/ui/bento-grid'

// KPI data (unchanged) mapped onto the kokonut Bento Grid structure.
const kpiItems: BentoItem[] = [
  {
    title: 'Revenus du mois',
    meta: '12 450 €',
    description: 'Juin 2026 · ▲ +15% ce mois-ci, toutes plateformes confondues.',
    icon: <Wallet className="h-4 w-4 text-violet-300" />,
    status: '+15%',
    tags: ['Upwork 41%', 'Malt 33%', 'Fiverr 26%'],
    colSpan: 2,
    hasPersistentHover: true,
    cta: 'Voir le détail →',
  },
  {
    title: 'Commandes actives',
    meta: '4',
    description: 'En cours · ▲ +1 vs mois dernier.',
    icon: <Package className="h-4 w-4 text-indigo-300" />,
    status: 'En cours',
    tags: ['Upwork', 'Malt', 'Fiverr'],
    cta: 'Gérer →',
  },
  {
    title: 'Taux de conversion',
    meta: '4.8%',
    description: 'Moyenne toutes plateformes · ▲ +0.6% ce mois-ci.',
    icon: <Target className="h-4 w-4 text-pink-300" />,
    status: '+0.6%',
    tags: ['Upwork 5.2%', 'Malt 4.8%', 'Fiverr 4.1%'],
    cta: 'Optimiser →',
  },
]

export default function KpiGrid() {
  return <BentoGrid items={kpiItems} />
}
