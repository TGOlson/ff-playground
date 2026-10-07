import clsx from 'clsx'
import { Check, Plus, Search, Star, TrendingDown, TrendingUp, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Rise } from '../components/Layout'
import { matchupTone, ordinal, statLines } from '../components/PlayerSheet'
import { PlayerIdentity } from '../components/PlayerRow'
import { Sparkline } from '../components/WeeklyChart'
import { Card, Chip, PageHeader, PlayerAvatar, PosBadge, Segmented, Select, StatusBadge, fmtSigned } from '../components/ui'
import { CURRENT_WEEK, PLAYERS, avgPts, ownerOf, seasonPts, type Player, type Pos } from '../data/mock'
import { useStore } from '../lib/store'

type PosFilter = 'ALL' | Pos | 'FLEX'
type Avail = 'avail' | 'all' | 'watch'
type SortKey = 'proj' | 'avg' | 'total' | 'rost' | 'trend'

const POS_FILTERS: PosFilter[] = ['ALL', 'QB', 'RB', 'WR', 'TE', 'FLEX', 'K', 'DEF']

export function Players() {
  const { isAvailable, isMine, addPlayer, watchlist, toggleWatch, setOpenPlayer } = useStore()
  const [q, setQ] = useState('')
  const [pos, setPos] = useState<PosFilter>('ALL')
  const [avail, setAvail] = useState<Avail>('avail')
  const [sort, setSort] = useState<SortKey>('proj')
  const [limit, setLimit] = useState(40)

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const val = (p: Player) =>
      sort === 'proj' ? p.proj : sort === 'avg' ? avgPts(p) : sort === 'total' ? seasonPts(p) : sort === 'rost' ? p.rostered : p.trend
    return PLAYERS.filter((p) => {
      if (pos === 'FLEX' ? !['RB', 'WR', 'TE'].includes(p.pos) : pos !== 'ALL' && p.pos !== pos) return false
      if (avail === 'avail' && !isAvailable(p.id)) return false
      if (avail === 'watch' && !watchlist.has(p.id)) return false
      if (needle && !`${p.name} ${p.team}`.toLowerCase().includes(needle)) return false
      return true
    }).sort((a, b) => val(b) - val(a))
  }, [q, pos, avail, sort, isAvailable, watchlist])

  const specific = pos !== 'ALL' && pos !== 'FLEX'

  return (
    <div>
      <PageHeader title="Players" sub={`Week ${CURRENT_WEEK} · ${list.length} players`} />

      {/* controls */}
      <Rise className="sticky top-14 z-20 -mx-4 space-y-3 border-b border-line/70 bg-bg/90 px-4 pb-3 pt-1 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:backdrop-blur-none">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search players or teams"
              className="h-11 w-full rounded-xl border border-line bg-surface pl-10 pr-10 text-[15px] outline-none transition placeholder:text-faint focus:border-accent focus:ring-4 focus:ring-accent/10"
            />
            {q && (
              <button onClick={() => setQ('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-faint hover:bg-surface-2" aria-label="Clear">
                <X className="size-4" />
              </button>
            )}
          </label>
          <div className="flex items-center gap-2">
            <Segmented
              size="sm"
              className="flex-1 sm:flex-none"
              value={avail}
              onChange={setAvail}
              options={[
                { value: 'avail', label: 'Available' },
                { value: 'all', label: 'All' },
                { value: 'watch', label: <span className="inline-flex items-center gap-1"><Star className="size-3" />Watch</span> },
              ]}
            />
            <Select
              value={sort}
              onChange={setSort}
              options={[
                { value: 'proj', label: 'Projected' },
                { value: 'avg', label: 'Avg pts' },
                { value: 'total', label: 'Total pts' },
                { value: 'rost', label: 'Rostered %' },
                { value: 'trend', label: 'Trending' },
              ]}
            />
          </div>
        </div>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {POS_FILTERS.map((p) => (
            <Chip key={p} active={pos === p} onClick={() => setPos(p)}>
              {p === 'ALL' ? 'All positions' : p}
            </Chip>
          ))}
        </div>
      </Rise>

      {/* desktop table */}
      <Rise delay={80} className="mt-4 hidden md:block">
        <Card className="overflow-hidden">
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="border-b border-line bg-surface-2/60 text-left text-[11px] font-bold uppercase tracking-wider text-faint">
                <th className="py-2.5 pl-5 font-bold">Player</th>
                <th className="px-2 py-2.5 font-bold">Opp</th>
                <th className="px-2 py-2.5 text-right font-bold">Proj</th>
                <th className="px-2 py-2.5 text-right font-bold">Avg</th>
                <th className="px-2 py-2.5 text-right font-bold">Total</th>
                {specific && list[0] &&
                  statLines(list[0]).slice(0, 3).map((s) => (
                    <th key={s.label} className="hidden px-2 py-2.5 text-right font-bold xl:table-cell">
                      {s.label}
                    </th>
                  ))}
                <th className="hidden px-3 py-2.5 font-bold lg:table-cell">Last {CURRENT_WEEK - 1}</th>
                <th className="px-2 py-2.5 text-right font-bold">Rost</th>
                <th className="px-2 py-2.5 text-right font-bold">Trend</th>
                <th className="py-2.5 pr-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.slice(0, limit).map((p) => {
                const owner = ownerOf(p.id)
                const available = isAvailable(p.id)
                return (
                  <tr key={p.id} className="group cursor-pointer transition hover:bg-surface-2/60" onClick={() => setOpenPlayer(p.id)}>
                    <td className="py-2.5 pl-5">
                      <PlayerIdentity
                        p={p}
                        size={36}
                        meta={
                          <>
                            {p.pos}
                            {p.posRank} · {p.team}
                            {!available && (
                              <span className="text-faint"> · {isMine(p.id) ? 'Your team' : owner?.abbr}</span>
                            )}
                          </>
                        }
                      />
                    </td>
                    <td className="px-2 py-2.5">
                      {p.opp ? (
                        <>
                          <div className="font-medium">
                            {p.home ? 'vs' : '@'} {p.opp}
                          </div>
                          <div className={clsx('text-[11px] font-semibold', matchupTone(p.oppRankVsPos))}>
                            {p.oppRankVsPos}
                            {ordinal(p.oppRankVsPos)} vs {p.pos}
                          </div>
                        </>
                      ) : (
                        <span className="font-semibold text-loss">BYE</span>
                      )}
                    </td>
                    <td className="tnum px-2 py-2.5 text-right text-[14.5px] font-bold">{p.proj.toFixed(1)}</td>
                    <td className="tnum px-2 py-2.5 text-right font-medium">{avgPts(p).toFixed(1)}</td>
                    <td className="tnum px-2 py-2.5 text-right font-medium text-ink-2">{seasonPts(p).toFixed(1)}</td>
                    {specific &&
                      statLines(p).slice(0, 3).map((s) => (
                        <td key={s.label} className="tnum hidden px-2 py-2.5 text-right text-ink-2 xl:table-cell">
                          {s.value}
                        </td>
                      ))}
                    <td className="hidden px-3 py-2.5 lg:table-cell">
                      <Sparkline values={p.weekly} />
                    </td>
                    <td className="tnum px-2 py-2.5 text-right text-ink-2">{p.rostered.toFixed(0)}%</td>
                    <td className="px-2 py-2.5 text-right">
                      <Trend n={p.trend} />
                    </td>
                    <td className="py-2.5 pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <RowAction
                        available={available}
                        mine={isMine(p.id)}
                        watching={watchlist.has(p.id)}
                        onAdd={() => addPlayer(p.id)}
                        onWatch={() => toggleWatch(p.id)}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {list.length === 0 && <Empty />}
        </Card>
      </Rise>

      {/* mobile list */}
      <Rise delay={80} className="mt-3 md:hidden">
        <Card className="divide-y divide-line overflow-hidden">
          {list.slice(0, limit).map((p) => {
            const available = isAvailable(p.id)
            return (
              <div key={p.id} className="flex items-center gap-3 px-3.5 py-3 active:bg-surface-2" onClick={() => setOpenPlayer(p.id)}>
                <PlayerAvatar player={p} size={42} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[14.5px] font-semibold">{p.name}</span>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted">
                    <PosBadge pos={p.pos} className="h-[18px] min-w-0 px-1 text-[9.5px]" />
                    <span className="truncate">
                      {p.opp ? `${p.home ? 'vs' : '@'} ${p.opp}` : 'BYE'} · {p.rostered.toFixed(0)}% rost
                    </span>
                    {Math.abs(p.trend) > 500 && <Trend n={p.trend} small />}
                  </div>
                </div>
                <div className="text-right">
                  <div className="tnum text-[16px] font-bold leading-tight">{p.proj.toFixed(1)}</div>
                  <div className="tnum text-[11px] text-faint">avg {avgPts(p).toFixed(1)}</div>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <RowAction
                    available={available}
                    mine={isMine(p.id)}
                    watching={watchlist.has(p.id)}
                    onAdd={() => addPlayer(p.id)}
                    onWatch={() => toggleWatch(p.id)}
                  />
                </div>
              </div>
            )
          })}
          {list.length === 0 && <Empty />}
        </Card>
      </Rise>

      {list.length > limit && (
        <div className="mt-4 flex justify-center">
          <button onClick={() => setLimit((l) => l + 40)} className="h-10 rounded-md border border-line bg-surface px-5 text-[13.5px] font-semibold shadow-card hover:bg-surface-2">
            Show more
          </button>
        </div>
      )}
    </div>
  )
}

function Trend({ n, small }: { n: number; small?: boolean }) {
  const up = n >= 0
  return (
    <span className={clsx('tnum inline-flex items-center gap-0.5 font-semibold', up ? 'text-win' : 'text-loss', small ? 'text-[11px]' : 'text-[12.5px]')}>
      {up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
      {small ? (Math.abs(n) >= 1000 ? `${(n / 1000).toFixed(1)}k` : n) : fmtSigned(n)}
    </span>
  )
}

function RowAction({
  available,
  mine,
  watching,
  onAdd,
  onWatch,
}: {
  available: boolean
  mine: boolean
  watching: boolean
  onAdd: () => void
  onWatch: () => void
}) {
  if (available)
    return (
      <button
        onClick={onAdd}
        className="inline-flex size-9 items-center justify-center rounded-md bg-accent-soft text-accent transition hover:bg-accent hover:text-accent-ink active:scale-90"
        aria-label="Add player"
      >
        <Plus className="size-[18px]" strokeWidth={2.5} />
      </button>
    )
  if (mine)
    return (
      <span className="inline-flex size-9 items-center justify-center rounded-full bg-win-soft text-win" title="On your team">
        <Check className="size-4" strokeWidth={2.5} />
      </span>
    )
  return (
    <button
      onClick={onWatch}
      className="inline-flex size-9 items-center justify-center rounded-full text-faint transition hover:bg-surface-2 active:scale-90"
      aria-label="Watch player"
    >
      <Star className={clsx('size-4', watching && 'fill-amber-400 text-amber-400')} />
    </button>
  )
}

function Empty() {
  return (
    <div className="px-6 py-14 text-center">
      <div className="text-[15px] font-semibold">No players match</div>
      <div className="mt-1 text-sm text-muted">Try a different position or clear your search.</div>
    </div>
  )
}
