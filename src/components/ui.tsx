import clsx from 'clsx'
import { X } from 'lucide-react'
import { useEffect, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react'
import type { FantasyTeam, InjuryStatus, Player, Pos } from '../data/mock'

// ─── surfaces ───────────────────────────────────────────────────────────────
export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx('rounded-2xl border border-line bg-surface shadow-card', className)}
      {...rest}
    >
      {children}
    </div>
  )
}

export function SectionTitle({ title, sub, action }: { title: ReactNode; sub?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3 px-1">
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold tracking-tight text-ink">{title}</h2>
        {sub && <p className="mt-0.5 text-[13px] text-muted">{sub}</p>}
      </div>
      {action}
    </div>
  )
}

export function PageHeader({ title, sub, right }: { title: ReactNode; sub?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 lg:mb-7">
      <div className="min-w-0">
        <h1 className="text-[26px] font-bold leading-tight tracking-[-0.02em] text-ink lg:text-[30px]">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      {right}
    </div>
  )
}

// ─── buttons ────────────────────────────────────────────────────────────────
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <button
      className={clsx(
        'inline-flex select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-xl font-semibold transition-[background,transform,box-shadow] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40',
        size === 'sm' && 'h-8 px-3 text-[13px]',
        size === 'md' && 'h-10 px-4 text-sm',
        size === 'lg' && 'h-12 px-5 text-[15px]',
        variant === 'primary' && 'bg-accent text-accent-ink shadow-sm hover:brightness-110',
        variant === 'secondary' && 'border border-line bg-surface text-ink hover:bg-surface-2',
        variant === 'ghost' && 'text-ink-2 hover:bg-surface-2',
        variant === 'danger' && 'bg-loss-soft text-loss hover:brightness-95',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

export function IconButton({ className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx(
        'inline-flex size-9 shrink-0 items-center justify-center rounded-full text-ink-2 transition hover:bg-surface-2 active:scale-95',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

// ─── badges ─────────────────────────────────────────────────────────────────
export const POS_STYLE: Record<string, string> = {
  QB: 'bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300',
  RB: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300',
  WR: 'bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300',
  TE: 'bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300',
  K: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-400/15 dark:text-zinc-300',
  DEF: 'bg-violet-100 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300',
  FLEX: 'bg-gradient-to-br from-emerald-100 via-sky-100 to-amber-100 text-ink-2 dark:from-emerald-400/15 dark:via-sky-400/15 dark:to-amber-400/15',
  SUPERFLEX: 'bg-gradient-to-br from-rose-100 to-sky-100 text-ink-2 dark:from-rose-400/15 dark:to-sky-400/15',
  BN: 'bg-surface-2 text-muted',
  IR: 'bg-loss-soft text-loss',
}
export const POS_DOT: Record<Pos, string> = {
  QB: 'bg-rose-500',
  RB: 'bg-emerald-500',
  WR: 'bg-sky-500',
  TE: 'bg-amber-500',
  K: 'bg-zinc-400',
  DEF: 'bg-violet-500',
}

export function PosBadge({ pos, className }: { pos: string; className?: string }) {
  return (
    <span
      className={clsx(
        'inline-flex h-6 min-w-9 items-center justify-center rounded-md px-1.5 text-[11px] font-bold tracking-wide',
        POS_STYLE[pos] ?? POS_STYLE.BN,
        className,
      )}
    >
      {pos === 'SUPERFLEX' ? 'SF' : pos}
    </span>
  )
}

export function StatusBadge({ status }: { status: InjuryStatus }) {
  if (status === 'OK') return null
  return (
    <span
      className={clsx(
        'inline-flex h-[18px] items-center rounded px-1 text-[10px] font-bold leading-none',
        status === 'Q' && 'bg-warn-soft text-warn',
        (status === 'D' || status === 'O' || status === 'IR') && 'bg-loss-soft text-loss',
      )}
    >
      {status}
    </span>
  )
}

export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={clsx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold', className)}>
      {children}
    </span>
  )
}

export function LiveDot({ className }: { className?: string }) {
  return (
    <span className={clsx('relative inline-flex size-2', className)}>
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-loss opacity-60" />
      <span className="relative inline-flex size-2 rounded-full bg-loss" />
    </span>
  )
}

// ─── avatars ────────────────────────────────────────────────────────────────
export function TeamAvatar({ team, size = 40, className }: { team: FantasyTeam; size?: number; className?: string }) {
  return (
    <div
      className={clsx('relative flex shrink-0 items-center justify-center rounded-[30%] font-bold text-white', className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.32,
        background: `linear-gradient(135deg, hsl(${team.hue} 75% 58%), hsl(${(team.hue + 40) % 360} 70% 42%))`,
        boxShadow: 'inset 0 0 0 1px rgb(255 255 255 / 0.15)',
      }}
    >
      {size >= 28 ? team.abbr : team.abbr[0]}
    </div>
  )
}

export function PlayerAvatar({ player, size = 40 }: { player: Player; size?: number }) {
  const initials = player.pos === 'DEF' ? player.team : player.first[0] + player.last[0]
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className={clsx(
          'flex size-full items-center justify-center rounded-full font-semibold',
          POS_STYLE[player.pos],
        )}
        style={{ fontSize: size * 0.34 }}
      >
        {initials}
      </div>
      {player.pos !== 'DEF' && size >= 36 && (
        <span className="absolute -bottom-0.5 -right-1 rounded-[5px] border-2 border-surface bg-ink px-[3px] text-[8.5px] font-bold leading-[12px] text-surface">
          {player.team}
        </span>
      )}
    </div>
  )
}

// ─── controls ───────────────────────────────────────────────────────────────
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  size = 'md',
}: {
  options: { value: T; label: ReactNode }[]
  value: T
  onChange: (v: T) => void
  className?: string
  size?: 'sm' | 'md'
}) {
  return (
    <div
      role="tablist"
      className={clsx('inline-flex rounded-xl bg-surface-2 p-1', size === 'sm' ? 'text-[12.5px]' : 'text-[13.5px]', className)}
    >
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            'flex-1 whitespace-nowrap rounded-[9px] font-semibold transition-all',
            size === 'sm' ? 'h-7 px-2.5' : 'h-8 px-3.5',
            value === o.value ? 'bg-surface text-ink shadow-card ring-1 ring-line' : 'text-muted hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Chip({
  active,
  children,
  onClick,
  className,
}: {
  active?: boolean
  children: ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold transition active:scale-95',
        active ? 'border-ink bg-ink text-surface' : 'border-line bg-surface text-ink-2 hover:border-line-strong',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={clsx(
        'relative inline-flex h-[26px] w-11 shrink-0 items-center rounded-full transition-colors',
        checked ? 'bg-accent' : 'bg-surface-3',
      )}
    >
      <span
        className={clsx(
          'inline-block size-[22px] rounded-full bg-white shadow-sm transition-transform',
          checked ? 'translate-x-[20px]' : 'translate-x-[2px]',
        )}
      />
    </button>
  )
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 99,
  step = 1,
  format,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  format?: (v: number) => string
}) {
  const fix = (n: number) => Math.round(n * 100) / 100
  return (
    <div className="inline-flex h-9 items-center rounded-xl border border-line bg-surface">
      <button
        className="flex h-full w-9 items-center justify-center rounded-l-xl text-lg text-ink-2 hover:bg-surface-2 disabled:opacity-30"
        onClick={() => onChange(fix(Math.max(min, value - step)))}
        disabled={value <= min}
        aria-label="Decrease"
      >
        −
      </button>
      <span className="tnum min-w-12 text-center text-sm font-semibold">{format ? format(value) : value}</span>
      <button
        className="flex h-full w-9 items-center justify-center rounded-r-xl text-lg text-ink-2 hover:bg-surface-2 disabled:opacity-30"
        onClick={() => onChange(fix(Math.min(max, value + step)))}
        disabled={value >= max}
        aria-label="Increase"
      >
        +
      </button>
    </div>
  )
}

export function Select<T extends string | number>({
  value,
  onChange,
  options,
  className,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
  className?: string
}) {
  return (
    <select
      value={value}
      onChange={(e) => {
        const raw = e.target.value
        onChange((typeof value === 'number' ? Number(raw) : raw) as T)
      }}
      className={clsx(
        'h-9 appearance-none rounded-xl border border-line bg-surface bg-[length:16px] bg-[right_10px_center] bg-no-repeat pl-3 pr-8 text-sm font-semibold text-ink outline-none focus:border-accent',
        className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

// ─── bars ───────────────────────────────────────────────────────────────────
export function WinProbBar({ pct, leftHue, rightHue }: { pct: number; leftHue: number; rightHue: number }) {
  return (
    <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
      <div
        className="h-full rounded-l-full transition-[width] duration-700"
        style={{ width: `${pct * 100}%`, background: `hsl(${leftHue} 70% 52%)` }}
      />
      <div className="w-0.5 bg-surface" />
      <div className="h-full flex-1 rounded-r-full" style={{ background: `hsl(${rightHue} 70% 52%)` }} />
    </div>
  )
}

// ─── overlays ───────────────────────────────────────────────────────────────
export function Sheet({
  open,
  onClose,
  children,
  title,
  wide,
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
  title?: ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={clsx(
          'relative flex max-h-[92dvh] w-full animate-sheet-up flex-col overflow-hidden rounded-t-[28px] bg-surface shadow-pop sm:rounded-3xl',
          wide ? 'sm:max-w-2xl' : 'sm:max-w-md',
        )}
      >
        <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-surface-3 sm:hidden" />
        {title !== undefined && (
          <div className="flex items-center justify-between gap-2 px-5 pb-2 pt-3 sm:pt-5">
            <div className="text-[17px] font-semibold tracking-tight">{title}</div>
            <IconButton onClick={onClose} aria-label="Close" className="bg-surface-2">
              <X className="size-4" />
            </IconButton>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>
  )
}

export const fmt = (n: number, d = 1) => n.toFixed(d)
export const fmtSigned = (n: number) => (n > 0 ? `+${n.toLocaleString()}` : n.toLocaleString())
