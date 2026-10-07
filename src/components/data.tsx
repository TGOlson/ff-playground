import clsx from 'clsx'
import { Ghost, History, Scale, Star, Swords, Target } from 'lucide-react'
import type { ReactNode } from 'react'
import { GAMES, type GameKey } from '../data/gauntlet'

// Shared building blocks for the dense, data-terminal style views (Gauntlet + sims).

export const ICONS: Record<GameKey, typeof Swords> = {
  h2h: Swords,
  median: Scale,
  proj: Target,
  ghost: Ghost,
  ghostMedian: History,
  waiver: Star,
}

export const pct = (x: number, d = 1) => `${(x * 100).toFixed(d)}%`
export const signed = (n: number) => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(1)}`
export const def = (k: GameKey) => GAMES.find((g) => g.key === k)!
/** Background for a 0..1 intensity on the win color, blended into the neutral track. */
export const winMix = (t: number) => `color-mix(in srgb, var(--win) ${Math.round(12 + t * 88)}%, var(--surface-3))`

// ─── primitives (local to this data-dense view) ─────────────────────────────
export function Panel({ title, meta, right, children, className, flush }: {
  title: ReactNode
  meta?: ReactNode
  right?: ReactNode
  children: ReactNode
  className?: string
  flush?: boolean
}) {
  return (
    <section className={clsx('overflow-hidden rounded-md border border-line bg-surface', className)}>
      <header className="flex h-10 items-center gap-3 border-b border-line px-3.5">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink">{title}</h2>
        {meta && <span className="truncate font-mono text-[11px] text-faint">{meta}</span>}
        <div className="ml-auto flex items-center gap-2">{right}</div>
      </header>
      <div className={flush ? '' : 'p-3.5'}>{children}</div>
    </section>
  )
}

export const Micro = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span className={clsx('text-[10px] font-bold uppercase tracking-[0.08em] text-faint', className)}>{children}</span>
)

export const Num = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span className={clsx('font-mono tabular-nums', className)}>{children}</span>
)

export function ResultCell({ win, size = 22, live, title }: { win: boolean; size?: number; live?: boolean; title?: string }) {
  return (
    <span
      title={title}
      className={clsx(
        'inline-flex shrink-0 items-center justify-center rounded-[2px] font-mono text-[10.5px] font-bold',
        win ? 'bg-win text-white dark:text-black' : 'bg-loss/15 text-loss',
        live && 'opacity-55',
      )}
      style={{ width: size, height: size }}
    >
      {win ? 'W' : 'L'}
    </span>
  )
}

/** Centered bar: grows right (green) for positive margins, left (red) for negative. */
export function Diverging({ value, scale }: { value: number; scale: number }) {
  const w = Math.min(Math.abs(value) / scale, 1) * 50
  return (
    <div className="relative h-1.5 w-full bg-surface-3">
      <div className="absolute inset-y-[-3px] left-1/2 w-px bg-line-strong" />
      <div
        className={clsx('absolute inset-y-0', value >= 0 ? 'left-1/2 bg-win' : 'right-1/2 bg-loss')}
        style={{ width: `${w}%` }}
      />
    </div>
  )
}

