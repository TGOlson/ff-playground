import clsx from 'clsx'
import { ArrowLeftRight, Minus, Plus, Star, TrendingDown, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { CURRENT_WEEK, avgPts, gamesPlayed, nflByAbbr, ownerOf, playerById, seasonPts, type Player } from '../data/mock'
import { useStore } from '../lib/store'
import { WeeklyChart } from './WeeklyChart'
import { Button, IconButton, PlayerAvatar, PosBadge, Segmented, Sheet, StatusBadge, TeamAvatar, fmtSigned } from './ui'

export function matchupTone(rank: number) {
  if (rank >= 23) return 'text-win'
  if (rank <= 10) return 'text-loss'
  return 'text-warn'
}

export function statLines(p: Player): { label: string; value: string | number }[] {
  const s = p.stats
  switch (p.pos) {
    case 'QB':
      return [
        { label: 'Pass yds', value: s.passYds.toLocaleString() },
        { label: 'Pass TD', value: s.passTd },
        { label: 'INT', value: s.int },
        { label: 'Rush yds', value: s.rushYds },
        { label: 'Rush TD', value: s.rushTd },
        { label: 'Yds/G', value: Math.round(s.passYds / Math.max(1, gamesPlayed(p))) },
      ]
    case 'RB':
      return [
        { label: 'Carries', value: s.rushAtt },
        { label: 'Rush yds', value: s.rushYds },
        { label: 'YPC', value: (s.rushYds / Math.max(1, s.rushAtt)).toFixed(1) },
        { label: 'Rush TD', value: s.rushTd },
        { label: 'Rec', value: s.rec },
        { label: 'Rec yds', value: s.recYds },
      ]
    case 'WR':
    case 'TE':
      return [
        { label: 'Targets', value: s.tgt },
        { label: 'Rec', value: s.rec },
        { label: 'Rec yds', value: s.recYds },
        { label: 'Rec TD', value: s.recTd },
        { label: 'Catch %', value: `${Math.round((s.rec / Math.max(1, s.tgt)) * 100)}%` },
        { label: 'Yds/Rec', value: (s.recYds / Math.max(1, s.rec)).toFixed(1) },
      ]
    case 'K':
      return [
        { label: 'FG', value: `${s.fgm}/${s.fga}` },
        { label: 'FG %', value: `${Math.round((s.fgm / Math.max(1, s.fga)) * 100)}%` },
        { label: 'XP', value: s.xpm },
      ]
    case 'DEF':
      return [
        { label: 'Sacks', value: s.sacks },
        { label: 'INT', value: s.defInt },
        { label: 'PA/G', value: (s.ptsAllowed / Math.max(1, gamesPlayed(p))).toFixed(1) },
      ]
  }
}

export function PlayerSheet() {
  const { openPlayer, setOpenPlayer } = useStore()
  const p = openPlayer ? playerById[openPlayer] : null
  return (
    <Sheet open={!!p} onClose={() => setOpenPlayer(null)} wide>
      {p && <PlayerDetail key={p.id} p={p} />}
    </Sheet>
  )
}

function PlayerDetail({ p }: { p: Player }) {
  const { isMine, isAvailable, addPlayer, dropPlayer, watchlist, toggleWatch, setOpenPlayer, toast } = useStore()
  const [tab, setTab] = useState<'overview' | 'log'>('overview')
  const mine = isMine(p.id)
  const avail = isAvailable(p.id)
  const owner = !mine && !avail ? ownerOf(p.id) : undefined
  const nfl = nflByAbbr[p.team]
  const avg = avgPts(p)
  const watching = watchlist.has(p.id)

  return (
    <div className="flex min-h-full flex-col">
      {/* hero */}
      <div className="relative px-5 pb-5 pt-4 sm:pt-6">
        <div className="absolute right-3 top-2 flex gap-1 sm:top-4">
          <IconButton onClick={() => toggleWatch(p.id)} aria-label="Watch" className="bg-surface-2">
            <Star className={clsx('size-4', watching && 'fill-amber-400 text-amber-400')} />
          </IconButton>
          <IconButton onClick={() => setOpenPlayer(null)} aria-label="Close" className="bg-surface-2">
            <span className="text-lg leading-none">×</span>
          </IconButton>
        </div>
        <div className="flex items-center gap-4">
          <PlayerAvatar player={p} size={68} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <PosBadge pos={p.pos} />
              <StatusBadge status={p.status} />
            </div>
            <h2 className="mt-1.5 truncate text-[22px] font-bold leading-tight tracking-[-0.02em]">{p.name}</h2>
            <p className="text-[13px] text-muted">
              {nfl.city} {nfl.name}
              {p.pos !== 'DEF' && <> · #{p.number} · {p.age} yrs · {p.exp ? `${p.exp} yr exp` : 'Rookie'}</>}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-4 divide-x divide-line rounded-2xl border border-line bg-surface-2/50">
          {[
            { k: `Wk ${CURRENT_WEEK} proj`, v: p.proj.toFixed(1) },
            { k: 'Avg', v: avg.toFixed(1) },
            { k: 'Total', v: seasonPts(p).toFixed(1) },
            { k: 'Pos rank', v: `${p.pos}${p.posRank}` },
          ].map((x) => (
            <div key={x.k} className="px-2 py-3 text-center">
              <div className="tnum text-[17px] font-bold tracking-tight">{x.v}</div>
              <div className="mt-0.5 text-[11px] font-medium text-muted">{x.k}</div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px]">
          {p.opp ? (
            <span className="text-ink-2">
              <span className="text-muted">This week</span>{' '}
              <span className="font-semibold">
                {p.home ? 'vs' : '@'} {p.opp}
              </span>{' '}
              · <span className="text-muted">{p.gameClock}</span>
            </span>
          ) : (
            <span className="font-semibold text-muted">On bye this week</span>
          )}
          {p.opp && (
            <span className="text-ink-2">
              <span className="text-muted">Matchup</span>{' '}
              <span className={clsx('font-semibold', matchupTone(p.oppRankVsPos))}>
                {p.oppRankVsPos}
                {ordinal(p.oppRankVsPos)} vs {p.pos}
              </span>
            </span>
          )}
        </div>
      </div>

      <div className="border-t border-line px-5 pt-4">
        <Segmented
          className="w-full"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'overview', label: 'Overview' },
            { value: 'log', label: 'Game log' },
          ]}
        />
      </div>

      {tab === 'overview' ? (
        <div className="space-y-6 px-5 py-5">
          <div>
            <div className="mb-3 flex items-center justify-between text-[13px] font-semibold text-muted">
              Fantasy points by week
              <span className="flex items-center gap-3 text-[11.5px]">
                <span className="flex items-center gap-1.5"><span className="w-4 border-t border-dashed border-faint" />avg {avg.toFixed(1)}</span>
                <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm border border-dashed border-accent/60 bg-accent-soft" />proj</span>
              </span>
            </div>
            <WeeklyChart weekly={p.weekly} proj={p.proj} avg={avg} />
          </div>

          <div className="rounded-2xl border border-line p-4">
            <div className="flex items-center justify-between text-[12px] font-semibold text-muted">
              <span>Latest news</span>
              <span>{p.newsAgo} ago</span>
            </div>
            <p className="mt-1.5 text-[14px] leading-relaxed text-ink-2">{p.news}</p>
          </div>

          <div>
            <div className="mb-2.5 text-[13px] font-semibold text-muted">{p.weekly.length - p.weekly.filter((w) => w === null).length}-game season stats</div>
            <div className="grid grid-cols-3 gap-2">
              {statLines(p).map((s) => (
                <div key={s.label} className="rounded-xl bg-surface-2 px-3 py-2.5">
                  <div className="tnum text-[16px] font-bold">{s.value}</div>
                  <div className="text-[11.5px] font-medium text-muted">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Meter label="Rostered" pct={p.rostered} />
            <Meter label="Started" pct={p.started} />
            <div className="rounded-xl bg-surface-2 px-3 py-2.5">
              <div className={clsx('tnum flex items-center gap-1 text-[16px] font-bold', p.trend >= 0 ? 'text-win' : 'text-loss')}>
                {p.trend >= 0 ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
                {fmtSigned(p.trend)}
              </div>
              <div className="text-[11.5px] font-medium text-muted">Adds · 24h</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-5 py-4">
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="border-b border-line text-left text-[11.5px] font-semibold uppercase tracking-wide text-faint">
                <th className="py-2 font-semibold">Week</th>
                <th className="py-2 text-right font-semibold">Pts</th>
                <th className="py-2 text-right font-semibold">vs avg</th>
              </tr>
            </thead>
            <tbody>
              {p.weekly
                .map((w, i) => ({ w, i }))
                .reverse()
                .map(({ w, i }) => (
                  <tr key={i} className="border-b border-line/60 last:border-0">
                    <td className="py-3 font-medium">Week {i + 1}</td>
                    <td className="tnum py-3 text-right font-semibold">{w === null ? 'BYE' : w.toFixed(1)}</td>
                    <td
                      className={clsx(
                        'tnum py-3 text-right font-semibold',
                        w === null ? 'text-faint' : w >= avg ? 'text-win' : 'text-loss',
                      )}
                    >
                      {w === null ? '—' : `${w - avg >= 0 ? '+' : ''}${(w - avg).toFixed(1)}`}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* action bar */}
      <div className="pb-safe sticky bottom-0 mt-auto border-t border-line bg-surface/90 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-5 py-3">
          {owner ? (
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <TeamAvatar team={owner} size={30} />
              <div className="min-w-0 text-[13px]">
                <div className="truncate font-semibold">{owner.name}</div>
                <div className="text-muted">Rostered by {owner.manager}</div>
              </div>
            </div>
          ) : (
            <div className="flex-1 text-[13px] text-muted">{mine ? 'On your roster' : 'Free agent · no waiver claim needed'}</div>
          )}
          {avail && (
            <Button
              variant="primary"
              onClick={() => {
                addPlayer(p.id)
                setOpenPlayer(null)
              }}
            >
              <Plus className="size-4" /> Add
            </Button>
          )}
          {mine && (
            <Button
              variant="danger"
              onClick={() => {
                dropPlayer(p.id)
                toast(`${p.name} dropped`, 'loss')
                setOpenPlayer(null)
              }}
            >
              <Minus className="size-4" /> Drop
            </Button>
          )}
          {owner && (
            <Button variant="primary" onClick={() => toast('Trade builder coming soon')}>
              <ArrowLeftRight className="size-4" /> Trade
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function Meter({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="rounded-xl bg-surface-2 px-3 py-2.5">
      <div className="tnum text-[16px] font-bold">{pct.toFixed(0)}%</div>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-3">
        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1 text-[11.5px] font-medium text-muted">{label}</div>
    </div>
  )
}

export const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}
