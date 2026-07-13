'use client'

import { BentoGrid, type BentoItem } from '@/components/ui/bento-grid'

interface KpiGridProps {
  items?: BentoItem[] | null
}

export default function KpiGrid({ items }: KpiGridProps) {
  if (!items || items.length === 0) {
    // Ne rien afficher — pas de métriques = pas de KPI grid
    return null
  }

  return <BentoGrid items={items} />
}
