import clsx from 'clsx'
import { ArrowUpDown, Check, Wand2, X } from 'lucide-react'
import { useState } from 'react'
import { Rise } from '../components/Layout'
import { matchupTone, ordinal } from '../components/PlayerSheet'
import { PlayerIdentity } from '../components/PlayerRow'
import { Button, Card, PosBadge, SectionTitle, TeamAvatar } from '../components/ui'
import {
  CURRENT_WEEK, MY_TEAM_ID, STARTER_SLOTS, TEAMS, optimalLineup, playerById, projSum, standings, teamLive,
  teamProjected, type Player,
} from '../data/mock'
import { useStore } from '../lib/store'

type Sel = { kind: 'slot'; key: string } | { kind: 'bench'; id: string } | null

export function Team() {
  const { lineup, bench, ir, setRoster, optimize, toast } = useStore()
  const me = TEAMS[MY_TEAM_ID]
  const rank = standings().findIndex((t) => t.id === MY_TEAM_ID) + 1
  const [sel, setSel] = useState<Sel>(null)

  const proj = teamProjected(lineup)
  const live = teamLive(lineup)
  const all = [...(Object.values(lineup).filter(Boolean) as string[]), ...bench]
  const gain = Math.round((projSum(optimalLineup(all)) - projSum(lineup)) * 10) / 10

  const slotDef = (key: string) => STARTER_SLOTS.find((s) => s.key === key)!
  const fits = (p: Player | undefined, key: string) => !p || slotDef(key).eligible.includes(p.pos)
  const pOf = (id: string | null | undefined) => (id ? playerById[id] : undefined)

  const isTarget = (t: Sel): boolean => {
    if (!sel || !t) return false
    if (sel.kind === 'slot') {
      const mine = pOf(lineup[sel.key])
      if (t.kind === 'slot') return t.key !== sel.key && fits(mine, t.key) && fits(pOf(lineup[t.key]), sel.key)
      return fits(pOf(t.id), sel.key)
    }
    const mine = pOf(sel.id)
    if (t.kind === 'slot') return fits(mine, t.key)
    return false
  }

  const swap = (t: NonNullable<Sel>) => {
    if (!sel) return
    const l = { ...lineup }
    let b = [...bench]
    const moved: string[] = []
    if (sel.kind === 'slot' && t.kind === 'slot') {
      ;[l[sel.key], l[t.key]] = [l[t.key], l[sel.key]]
      moved.push(pOf(l[t.key])?.name ?? '')
    } else {
      const slotKey = sel.kind === 'slot' ? sel.key : (t as { key: string }).key
      const benchId = sel.kind === 'bench' ? sel.id : (t as { id: string }).id
      const out = l[slotKey]
      l[slotKey] = benchId
      b = out ? b.map((x) => (x === benchId ? out : x)) : b.filter((x) => x !== benchId)
      moved.push(playerById[benchId].name)
    }
    setRoster(l, b)
    setSel(null)
    toast(`${moved[0]} moved`)
  }

  const onTap = (t: NonNullable<Sel>) => {
    if (sel && isTarget(t)) return swap(t)
    if (sel && JSON.stringify(sel) === JSON.stringify(t)) return setSel(null)
    setSel(t)
  }

  return (
    <div className="space-y-6">
      {/* header */}
      <Rise>
        <div className="flex flex-wrap items-center gap-4">
          <TeamAvatar team={me} size={64} />
          <div className="min-w-0 flex-1">
            <h1 className="text-[26px] font-bold leading-tight tracking-[-0.02em] lg:text-[30px]">{me.name}</h1>
            <p className="text-sm text-muted">
              {me.wins}-{me.losses} · {rank}
              {ordinal(rank)} place · {me.pf.toFixed(1)} PF
            </p>
          </div>
        </div>
      </Rise>

      <Rise delay={60}>
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          <Stat label={`Wk ${CURRENT_WEEK} projected`} value={proj.toFixed(1)} />
          <Stat label="Live points" value={live.toFixed(1)} />
          <Stat label="FAAB remaining" value={`$${me.faab}`} />
          <Stat label="Waiver priority" value={`#${me.waiverPriority}`} />
        </div>
      </Rise>

      {/* season strip */}
      <Rise delay={100}>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {me.history.map((h) => {
            const w = h.pf > h.pa
            return (
              <div key={h.week} className="min-w-[140px] flex-1 rounded-2xl border border-line bg-surface px-3.5 py-3 shadow-card">
                <div className="flex items-center justify-between text-[11.5px] font-semibold text-muted">
                  Week {h.week}
                  <span className={clsx('rounded-md px-1.5 py-0.5 text-[10.5px] font-bold', w ? 'bg-win-soft text-win' : 'bg-loss-soft text-loss')}>
                    {w ? 'W' : 'L'}
                  </span>
                </div>
                <div className="tnum mt-1.5 whitespace-nowrap text-[15px] font-bold">
                  {h.pf.toFixed(1)} <span className="text-[12px] font-medium text-faint">– {h.pa.toFixed(1)}</span>
                </div>
                <div className="truncate text-[11.5px] text-muted">vs {TEAMS[h.opp].name}</div>
              </div>
            )
          })}
        </div>
      </Rise>

      {/* optimize banner */}
      {gain > 0.05 && !sel && (
        <Rise>
          <div className="flex items-center gap-3 rounded-2xl border border-accent/25 bg-accent-soft px-4 py-3">
            <Wand2 className="size-5 shrink-0 text-accent" />
            <div className="min-w-0 flex-1 text-[13.5px]">
              <span className="font-semibold text-accent-strong">Leaving +{gain.toFixed(1)} pts on the bench.</span>{' '}
              <span className="text-ink-2">Auto-set your best projected lineup.</span>
            </div>
            <Button variant="primary" size="sm" onClick={() => { optimize(); toast('Lineup optimized', 'win') }}>
              Optimize
            </Button>
          </div>
        </Rise>
      )}

      {sel && (
        <div className="sticky top-[60px] z-20 flex items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-surface shadow-pop lg:top-4">
          <ArrowUpDown className="size-4 shrink-0" />
          <div className="flex-1 text-[13.5px] font-medium">
            Moving{' '}
            <span className="font-bold">
              {sel.kind === 'slot' ? pOf(lineup[sel.key])?.name ?? `empty ${sel.key}` : playerById[sel.id].name}
            </span>{' '}
            — tap a highlighted spot
          </div>
          <button onClick={() => setSel(null)} className="rounded-full p-1 hover:bg-white/10" aria-label="Cancel">
            <X className="size-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Rise delay={140}>
          <SectionTitle title="Starters" sub={`${proj.toFixed(1)} projected`} />
          <Card className="divide-y divide-line overflow-hidden">
            {STARTER_SLOTS.map((s) => {
              const t: Sel = { kind: 'slot', key: s.key }
              return (
                <LineupRow
                  key={s.key}
                  slot={s.slot}
                  p={pOf(lineup[s.key])}
                  selected={sel?.kind === 'slot' && sel.key === s.key}
                  target={isTarget(t)}
                  dim={!!sel && !isTarget(t) && !(sel.kind === 'slot' && sel.key === s.key)}
                  onTap={() => onTap(t)}
                />
              )
            })}
          </Card>
        </Rise>

        <Rise delay={200} className="space-y-6">
          <div>
            <SectionTitle title="Bench" sub={`${bench.length} players`} />
            <Card className="divide-y divide-line overflow-hidden">
              {bench.map((id) => {
                const t: Sel = { kind: 'bench', id }
                return (
                  <LineupRow
                    key={id}
                    slot="BN"
                    p={playerById[id]}
                    selected={sel?.kind === 'bench' && sel.id === id}
                    target={isTarget(t)}
                    dim={!!sel && !isTarget(t) && !(sel.kind === 'bench' && sel.id === id)}
                    onTap={() => onTap(t)}
                  />
                )
              })}
              {bench.length === 0 && <div className="px-4 py-6 text-center text-sm text-muted">Bench is empty</div>}
            </Card>
          </div>
          {ir.length > 0 && (
            <div>
              <SectionTitle title="Injured reserve" />
              <Card className="divide-y divide-line overflow-hidden">
                {ir.map((id) => (
                  <LineupRow key={id} slot="IR" p={playerById[id]} dim={!!sel} />
                ))}
              </Card>
            </div>
          )}
        </Rise>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="px-2.5 py-3 sm:px-4 sm:py-3.5">
      <div className="tnum text-[17px] font-bold tracking-tight sm:text-[22px]">{value}</div>
      <div className="text-[11px] font-medium leading-tight text-muted sm:text-[12px]">{label}</div>
    </Card>
  )
}

function LineupRow({
  slot,
  p,
  selected,
  target,
  dim,
  onTap,
}: {
  slot: string
  p?: Player
  selected?: boolean
  target?: boolean
  dim?: boolean
  onTap?: () => void
}) {
  return (
    <div
      className={clsx(
        'flex items-center gap-3 px-3 py-3 transition sm:px-4',
        selected && 'bg-accent-soft',
        target && 'bg-win-soft/60',
        dim && 'opacity-40',
      )}
    >
      <button
        onClick={onTap}
        disabled={!onTap}
        className={clsx(
          'rounded-lg transition active:scale-95',
          target && 'ring-2 ring-win ring-offset-2 ring-offset-surface',
          selected && 'ring-2 ring-accent ring-offset-2 ring-offset-surface',
        )}
        aria-label={`Move ${p?.name ?? slot}`}
      >
        <PosBadge pos={slot} className="h-8 w-12 text-[11.5px]" />
      </button>
      <div className="min-w-0 flex-1">
        {p ? (
          <PlayerIdentity p={p} />
        ) : (
          <button onClick={onTap} className="text-[14px] font-medium text-faint">
            Empty — tap to fill
          </button>
        )}
      </div>
      {p && (
        <>
          <div className="hidden w-16 text-right sm:block">
            {p.opp ? (
              <div className={clsx('text-[12px] font-semibold', matchupTone(p.oppRankVsPos))}>
                {p.oppRankVsPos}
                {ordinal(p.oppRankVsPos)}
              </div>
            ) : (
              <div className="text-[12px] font-semibold text-loss">BYE</div>
            )}
            <div className="text-[10.5px] text-faint">opp rank</div>
          </div>
          <div className="w-12 text-right">
            <div className="tnum text-[15px] font-bold">{p.live.toFixed(1)}</div>
            <div className="tnum text-[10.5px] text-faint">{p.proj.toFixed(1)}</div>
          </div>
        </>
      )}
      {onTap && (
        <button
          onClick={onTap}
          className={clsx(
            'hidden size-8 shrink-0 items-center justify-center rounded-full transition sm:flex',
            target ? 'bg-win text-white' : 'text-faint hover:bg-surface-2 hover:text-ink',
          )}
          aria-label="Move"
        >
          {target ? <Check className="size-4" /> : <ArrowUpDown className="size-4" />}
        </button>
      )}
    </div>
  )
}
