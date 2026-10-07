import clsx from 'clsx'
import type { ReactNode } from 'react'
import type { Player } from '../data/mock'
import { useStore } from '../lib/store'
import { LiveDot, PlayerAvatar, StatusBadge } from './ui'

export function GameLine({ p, className }: { p: Player; className?: string }) {
  if (p.game === 'bye') return <span className={clsx('text-loss', className)}>BYE</span>
  return (
    <span className={clsx('inline-flex items-center gap-1.5', className)}>
      {p.game === 'live' && <LiveDot className="scale-75" />}
      <span className={p.game === 'live' ? 'font-semibold text-ink-2' : ''}>{p.gameClock}</span>
      <span className="text-faint">·</span>
      <span>
        {p.home ? 'vs' : '@'} {p.opp}
      </span>
    </span>
  )
}

/** Compact player identity: avatar + name + meta line. Tapping opens the player sheet. */
export function PlayerIdentity({
  p,
  size = 40,
  meta,
  align = 'left',
}: {
  p: Player
  size?: number
  meta?: ReactNode
  align?: 'left' | 'right'
}) {
  const { setOpenPlayer } = useStore()
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        setOpenPlayer(p.id)
      }}
      className={clsx('flex min-w-0 items-center gap-3 text-left', align === 'right' && 'flex-row-reverse text-right')}
    >
      <PlayerAvatar player={p} size={size} />
      <div className="min-w-0">
        <div className={clsx('flex items-center gap-1.5', align === 'right' && 'flex-row-reverse')}>
          <span className="truncate text-[14.5px] font-semibold tracking-[-0.01em] hover:underline">{p.name}</span>
          <StatusBadge status={p.status} />
        </div>
        <div className="truncate text-[12px] text-muted">
          {meta ?? (
            <>
              {p.pos} · <GameLine p={p} />
            </>
          )}
        </div>
      </div>
    </button>
  )
}
