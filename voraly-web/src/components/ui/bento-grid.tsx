'use client'

import { cn } from '@/lib/utils'

/**
 * BentoGrid — structure & hover physics from 21st.dev (kokonutd/bento-grid):
 * responsive `md:grid-cols-3` with `col-span-2` spanning items, group-hover
 * dot-pattern reveal, `-translate-y-0.5` lift, and the gradient border ring.
 * Palette remapped to Voraly (glass surfaces + violet accents) instead of the
 * original gray/black skin.
 */
export interface BentoItem {
  title: string
  description: string
  icon: React.ReactNode
  status?: string
  tags?: string[]
  meta?: string
  cta?: string
  colSpan?: number
  hasPersistentHover?: boolean
}

interface BentoGridProps {
  items: BentoItem[]
  className?: string
}

export function BentoGrid({ items, className }: BentoGridProps) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 md:grid-cols-3', className)}>
      {items.map((item, index) => (
        <div
          key={index}
          className={cn(
            'group relative overflow-hidden rounded-2xl p-5 transition-all duration-300',
            'border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl',
            'hover:-translate-y-0.5 hover:border-white/[0.14] will-change-transform',
            'shadow-[0_4px_30px_rgba(0,0,0,0.18)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.28)]',
            item.colSpan === 2 ? 'md:col-span-2' : 'col-span-1',
            item.hasPersistentHover && '-translate-y-0.5 border-white/[0.14]',
          )}
        >
          {/* dot-pattern reveal */}
          <div
            className={cn(
              'absolute inset-0 transition-opacity duration-300',
              item.hasPersistentHover ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
            )}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.08)_1px,transparent_1px)] bg-[length:6px_6px]" />
          </div>

          <div className="relative flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.05] transition-colors duration-300 group-hover:bg-violet-500/15">
                {item.icon}
              </div>
              {item.status && (
                <span
                  className={cn(
                    'rounded-lg px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide backdrop-blur-sm',
                    'bg-white/[0.06] text-zinc-400',
                    'transition-colors duration-300 group-hover:bg-violet-500/10 group-hover:text-violet-200',
                  )}
                >
                  {item.status}
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <h3 className="text-[15px] font-semibold tracking-tight text-white">
                  {item.title}
                </h3>
                {item.meta && (
                  <span className="text-sm font-semibold text-zinc-300">{item.meta}</span>
                )}
              </div>
              <p className="text-[13px] font-normal leading-relaxed text-zinc-400">
                {item.description}
              </p>
            </div>

            {(item.tags?.length || item.cta) && (
              <div className="mt-1 flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                  {item.tags?.map((tag, i) => (
                    <span
                      key={i}
                      className="rounded-md bg-white/[0.05] px-2 py-1 backdrop-blur-sm transition-colors duration-200 hover:bg-white/[0.1]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                {item.cta && (
                  <span className="text-[11px] text-violet-300 opacity-0 transition-opacity group-hover:opacity-100">
                    {item.cta}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* gradient border ring */}
          <div
            className={cn(
              'absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-transparent via-violet-400/10 to-transparent p-px transition-opacity duration-300',
              item.hasPersistentHover ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
            )}
          />
        </div>
      ))}
    </div>
  )
}

export default BentoGrid
