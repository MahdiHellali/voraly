'use client'

import { BentoGrid, type BentoItem } from '@/components/ui/bento-grid'
import { KpiEmptyState } from './KpiEmptyState'

interface KpiGridProps {
  items?: BentoItem[] | null
}

export default function KpiGrid({ items }: KpiGridProps) {
  if (!items || items.length === 0) {
    return <KpiEmptyState />
  }

  return <BentoGrid items={items} />
}
