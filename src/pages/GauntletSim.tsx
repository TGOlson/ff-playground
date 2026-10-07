import clsx from 'clsx'
import { FastForward, Play, RotateCcw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Diverging, ICONS, Micro, Num, Panel, ResultCell, def, pct } from '../components/data'
import { PosBadge, TeamAvatar } from '../components/ui'
import type { SeasonRow, WeekSummary } from '../data/gauntlet'
import { CURRENT_WEEK, STARTER_SLOTS, TEAMS, playerById } from '../data/mock'
import {
  SEASON_RUNS, SEASON_WEEKS, WEEK_RUNS, mockSeasonSim, mockWeekSim, type SimOff,
} from '../data/simMock'
import { useStore } from '../lib/store'

/** Fake "work": eases 0 → 1 over `ms`, restarting whenever `runKey` changes. */
function useFakeRun(ms: number, runKey: number) {
  const [p, setP] = useState(0)
  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const tick = (t: number) => {
      const x = Math.min(1, (t - start) / ms)
      setP(1 - (1 - x) ** 2.2)
      if (x < 1) raf = requestAnimationFrame(tick)
    }
    setP(0)
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [ms, runKey])
  return { progress: p, done: p >= 1 }
}

function RunBar({ progress, label }: { progress: number; label: string }) {
  const cells = 40
  const lit = Math.round(progress * cells)
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between font-mono text-[11px]">
        <span className="text-muted">{label}</span>
        <span className={progress >= 1 ? 'font-semibold text-win' : 'text-ink-2'}>{progress >= 1 ? 'DONE' : `${Math.round(progress * 100)}%`}</span>
      </div>
      <div className="flex gap-[2px]">
        {Array.from({ length: cells }).map((_, i) => (
          <span key={i} className={clsx('h-2 flex-1', i < lit ? 'bg-accent' : 'bg-surface-3')} />
        ))}
      </div>
    </div>
  )
}

function ActionButton({ onClick, children, primary }: { onClick: () => void; children: React.ReactNode; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'inline-flex h-9 items-center gap-1.5 rounded-md px-3.5 font-mono text-[11.5px] font-semibold tracking-wide transition active:scale-[0.98]',
        primary ? 'bg-ink text-surface hover:opacity-90' : 'border border-line bg-surface text-ink hover:bg-surface-2',
      )}
    >
      {children}
    </button>
  )
}

// ─── sim-off: rail panel ────────────────────────────────────────────────────
export function SimOffPanel({ so, onOpen }: { so: SimOff; onOpen: () => void }) {
  return (
    <Panel title="Sim-off ⚡" meta={so.preview ? 'IF IT ENDED NOW' : `WK${String(so.week).padStart(2, '0')} · TOP 2 REPLAY`} flush>
      <div className="divide-y divide-line">
        {so.teams.map((tid, i) => {
          const won = !so.preview && so.winner === tid
          return (
            <div key={tid} className="flex items-center gap-2.5 px-3.5 py-2.5">
              <TeamAvatar team={TEAMS[tid]} size={24} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold">{TEAMS[tid].name}</div>
                <div className="font-mono text-[10.5px] text-muted">{so.records[i]}–{6 - so.records[i]} GAUNTLET</div>
              </div>
              <Num className={clsx('text-[15px] font-semibold', so.preview ? 'text-faint' : won ? 'text-ink' : 'text-muted')}>
                {so.preview ? '—' : so.totals[i].toFixed(1)}
              </Num>
              <span className={clsx('w-5 text-center text-[13px]', won ? 'opacity-100' : 'opacity-0')}>⚡</span>
            </div>
          )
        })}
      </div>
      <button
        onClick={onOpen}
        className="flex w-full items-center justify-between border-t border-line px-3.5 py-2.5 font-mono text-[11px] font-semibold text-accent hover:bg-surface-2"
      >
        {so.preview ? 'RUN A PREVIEW' : 'WATCH REPLAY'}
        <Play className="size-3.5" />
      </button>
    </Panel>
  )
}

// ─── sim-off: replay ────────────────────────────────────────────────────────
export function SimOffView({ so, onRerun }: { so: SimOff; onRerun?: () => void }) {
  const { setOpenPlayer } = useStore()
  const [idx, setIdx] = useState(0)
  const [key, setKey] = useState(0)
  useEffect(() => {
    setIdx(0)
    const t = setInterval(() => setIdx((i) => (i >= so.reveals.length ? i : i + 1)), 240)
    return () => clearInterval(t)
  }, [so, key])

  const shown = so.reveals.slice(0, idx)
  const run: [number, number] = [0, 0]
  shown.forEach((r) => (run[r.side] += r.pts))
  const done = idx >= so.reveals.length
  const lead = run[0] - run[1]

  return (
    <div className="pb-4">
      <p className="px-5 pb-3 text-[12.5px] text-muted">
        The top two Gauntlet records of Week {so.week} replay the week with fresh luck. Winner banks a bonus win.
      </p>

      {/* scoreboard */}
      <div className="mx-5 overflow-hidden rounded-md border border-line">
        <div className="grid grid-cols-2 gap-px bg-line">
          {so.teams.map((tid, side) => {
            const winning = done ? so.winner === tid : side === 0 ? lead >= 0 : lead < 0
            return (
              <div key={tid} className={clsx('bg-surface p-3', side === 1 && 'text-right')}>
                <div className={clsx('flex items-center gap-2', side === 1 && 'flex-row-reverse')}>
                  <TeamAvatar team={TEAMS[tid]} size={22} />
                  <span className="truncate text-[12.5px] font-semibold">{TEAMS[tid].name}</span>
                </div>
                <Num className={clsx('mt-2 block text-[34px] font-semibold leading-none tracking-[-0.04em]', !winning && 'text-ink/40')}>
                  {run[side].toFixed(1)}
                </Num>
                <div className="mt-1 font-mono text-[10.5px] text-muted">{so.records[side]}–{6 - so.records[side]} GAUNTLET</div>
              </div>
            )
          })}
        </div>
        <div className="border-t border-line bg-surface-2/50 px-3 py-2">
          <Diverging value={-lead} scale={40} />
        </div>
      </div>

      {/* slot by slot */}
      <div className="mx-5 mt-3 overflow-hidden rounded-md border border-line">
        {STARTER_SLOTS.map((s) => {
          const all = so.reveals.filter((r) => r.slot === s.slot)
          // slots like RB/WR appear twice; pair them up by order
          const nth = STARTER_SLOTS.filter((x) => x.slot === s.slot).indexOf(s)
          const A = all.filter((r) => r.side === 0)[nth]
          const B = all.filter((r) => r.side === 1)[nth]
          const showA = !!A && shown.includes(A)
          const showB = !!B && shown.includes(B)
          return (
            <div key={s.key} className="grid grid-cols-[minmax(0,1fr)_44px_44px_44px_minmax(0,1fr)] items-center gap-2 border-b border-line/60 px-3 py-1.5 last:border-0">
              <button onClick={() => A && setOpenPlayer(A.playerId)} className="truncate text-left text-[12px] font-medium">
                {A ? playerById[A.playerId].name : '—'}
              </button>
              <Num className={clsx('text-right text-[12.5px] font-semibold', !showA && 'text-faint', showA && showB && A.pts > B.pts && 'text-win')}>
                {showA ? A.pts.toFixed(1) : '··'}
              </Num>
              <PosBadge pos={s.slot} className="h-5 w-11 rounded-[2px] text-[10px]" />
              <Num className={clsx('text-[12.5px] font-semibold', !showB && 'text-faint', showA && showB && B.pts > A.pts && 'text-win')}>
                {showB ? B.pts.toFixed(1) : '··'}
              </Num>
              <button onClick={() => B && setOpenPlayer(B.playerId)} className="truncate text-right text-[12px] font-medium">
                {B ? playerById[B.playerId].name : '—'}
              </button>
            </div>
          )
        })}
      </div>

      {done && (
        <div className="mx-5 mt-3 animate-fade-in rounded-md border border-win/30 bg-win-soft px-3.5 py-2.5 text-[13px] font-semibold text-win">
          ⚡ {TEAMS[so.winner].name} {so.preview ? 'would win' : 'wins'} the sim-off · +1 Gauntlet win
        </div>
      )}

      <div className="mt-4 flex gap-2 px-5">
        {!done && (
          <ActionButton onClick={() => setIdx(so.reveals.length)}>
            <FastForward className="size-3.5" /> SKIP
          </ActionButton>
        )}
        {done && (
          <ActionButton onClick={() => setKey((k) => k + 1)}>
            <RotateCcw className="size-3.5" /> REPLAY
          </ActionButton>
        )}
        {done && so.preview && onRerun && (
          <ActionButton primary onClick={onRerun}>
            <Play className="size-3.5" /> RUN AGAIN
          </ActionButton>
        )}
      </div>
      {!so.preview && <p className="mt-3 px-5 font-mono text-[10.5px] text-faint">OFFICIAL RESULT · SEEDED · REPLAYS ARE IDENTICAL</p>}
    </div>
  )
}

// ─── sim week ───────────────────────────────────────────────────────────────
export function SimWeekView({ W, teamId }: { W: WeekSummary; teamId: number }) {
  const [salt, setSalt] = useState(0)
  const { progress, done } = useFakeRun(1500, salt)
  const sim = useMemo(() => mockWeekSim(W, teamId, salt), [W, teamId, salt])
  const T = W.teams[teamId]
  const luck = T.wins - sim.expWins
  const maxH = Math.max(...sim.hist)

  return (
    <div className="space-y-4 px-5 pb-5">
      <p className="text-[12.5px] text-muted">
        {W.live
          ? `Sims the rest of Week ${W.week} for ${TEAMS[teamId].name}. Finished games are locked; everything else is re-rolled.`
          : `Replays Week ${W.week} ${WEEK_RUNS.toLocaleString()} times for ${TEAMS[teamId].name} with fresh player luck. How lucky was the real result?`}
      </p>
      <RunBar progress={progress} label={`${Math.round(progress * WEEK_RUNS).toLocaleString()} / ${WEEK_RUNS.toLocaleString()} SIMS`} />

      {/* headline numbers */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-4">
        {[
          { k: 'Expected W', v: done ? sim.expWins.toFixed(2) : '··' },
          { k: W.live ? 'Current W' : 'Actual W', v: String(T.wins) },
          { k: 'Luck', v: done ? `${luck >= 0 ? '+' : '−'}${Math.abs(luck).toFixed(2)}` : '··', tone: done ? (luck >= 0 ? 'text-win' : 'text-loss') : '' },
          { k: 'Score P10–P90', v: done ? `${sim.p10.toFixed(0)}–${sim.p90.toFixed(0)}` : '··' },
        ].map((x) => (
          <div key={x.k} className="bg-surface px-3 py-2.5">
            <Micro>{x.k}</Micro>
            <Num className={clsx('block text-[20px] font-semibold leading-tight', x.tone)}>{x.v}</Num>
          </div>
        ))}
      </div>

      {/* histogram */}
      <div className="rounded-md border border-line p-3">
        <div className="mb-2 flex items-center justify-between">
          <Micro>Gauntlet wins distribution</Micro>
          <span className="flex items-center gap-1.5 font-mono text-[10.5px] text-muted">
            <span className="size-2.5 border-2 border-accent" /> actual
          </span>
        </div>
        <div className="flex h-28 items-end gap-1.5">
          {sim.hist.map((p, k) => (
            <div key={k} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <Num className="text-[10px] text-muted">{done ? pct(p, 0) : ''}</Num>
              <div
                className={clsx('w-full transition-[height] duration-200', k === T.wins ? 'bg-accent' : 'bg-faint/40', k === T.wins && 'outline-2 outline-offset-1 outline-accent')}
                style={{ height: `${Math.max(2, (p / maxH) * 82 * progress)}%` }}
              />
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex gap-1.5">
          {sim.hist.map((_, k) => (
            <Num key={k} className={clsx('flex-1 text-center text-[10.5px]', k === T.wins ? 'font-semibold text-ink' : 'text-faint')}>
              {k}–{6 - k}
            </Num>
          ))}
        </div>
      </div>

      {/* per game */}
      <div className="overflow-hidden rounded-md border border-line">
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_44px_28px] gap-3 border-b border-line bg-surface-2/50 px-3 py-1.5">
          <Micro>Game</Micro>
          <Micro>Win odds</Micro>
          <span />
          <Micro className="text-center">{W.live ? 'Now' : 'Real'}</Micro>
        </div>
        {T.games.map((g) => {
          const Icon = ICONS[g.key]
          const p = sim.gameP[g.key]
          return (
            <div key={g.key} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_44px_28px] items-center gap-3 border-b border-line/60 px-3 py-2 last:border-0">
              <span className="flex min-w-0 items-center gap-2 text-[12.5px] font-medium">
                <Icon className="size-3.5 shrink-0 text-faint" />
                <span className="truncate">{def(g.key).title}</span>
              </span>
              <div className="h-1.5 bg-surface-3">
                <div className={clsx('h-full', p >= 0.5 ? 'bg-win' : 'bg-loss')} style={{ width: `${p * 100 * progress}%` }} />
              </div>
              <Num className="text-right text-[12px] font-semibold">{done ? pct(p, 0) : '··'}</Num>
              <span className="flex justify-center">
                <ResultCell win={g.win} size={18} live={W.live} />
              </span>
            </div>
          )
        })}
      </div>

      {/* odds */}
      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-md border border-line bg-line">
        {[
          { e: '🏅', k: 'Bonus win', v: sim.pBonus },
          { e: '🖐️', k: 'Spanked', v: sim.pSpank },
          { e: '👑', k: 'Best record', v: sim.pTop },
        ].map((x) => (
          <div key={x.k} className="bg-surface px-3 py-2.5">
            <Micro>
              {x.e} {x.k}
            </Micro>
            <Num className="block text-[18px] font-semibold">{done ? pct(x.v, 0) : '··'}</Num>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <ActionButton primary onClick={() => setSalt((s) => s + 1)}>
          <RotateCcw className="size-3.5" /> RE-RUN {WEEK_RUNS.toLocaleString()}
        </ActionButton>
      </div>
    </div>
  )
}

// ─── sim season ─────────────────────────────────────────────────────────────
export function SimSeasonView({ rows, focus, onTeam }: { rows: SeasonRow[]; focus: number; onTeam: (id: number) => void }) {
  const [salt, setSalt] = useState(0)
  const { progress, done } = useFakeRun(2200, salt)
  const weeksDone = CURRENT_WEEK - 1
  const sim = useMemo(() => mockSeasonSim(rows, weeksDone, salt), [rows, weeksDone, salt])
  const me = sim.find((r) => r.teamId === focus)!
  const lo = Math.min(...sim.map((r) => r.p10))
  const hi = Math.max(...sim.map((r) => r.p90))
  const x = (v: number) => ((v - lo) / (hi - lo)) * 100
  const maxFirst = Math.max(...sim.map((r) => r.pFirst))
  const maxBucket = Math.max(...sim.map((r) => r.pBucket))

  return (
    <div className="space-y-4 px-5 pb-5">
      <p className="text-[12.5px] text-muted">
        Plays out Weeks {CURRENT_WEEK}–{SEASON_WEEKS} {SEASON_RUNS} times on top of real results so far, including bonus wins, spankings and sim-offs.
      </p>
      <RunBar progress={progress} label={`SEASON ${Math.round(progress * SEASON_RUNS)} / ${SEASON_RUNS}`} />

      {/* focus team */}
      <div className="overflow-hidden rounded-md border border-line">
        <div className="flex items-center gap-2 border-b border-line bg-surface-2/50 px-3 py-2">
          <TeamAvatar team={TEAMS[focus]} size={20} />
          <span className="text-[12.5px] font-semibold">{TEAMS[focus].name}</span>
        </div>
        <div className="grid grid-cols-3 gap-px bg-line">
          {[
            { k: 'Proj. final W', v: done ? me.expWins.toFixed(0) : '··', sub: done ? `${me.p10}–${me.p90}` : '' },
            { k: '👑 Finish 1st', v: done ? pct(me.pFirst, 0) : '··', sub: '' },
            { k: '🪣 Bucket odds', v: done ? pct(me.pBucket, 0) : '··', sub: '', tone: me.pBucket > 0.15 ? 'text-warn' : '' },
          ].map((c) => (
            <div key={c.k} className="bg-surface px-3 py-2.5">
              <Micro>{c.k}</Micro>
              <Num className={clsx('block text-[22px] font-semibold leading-tight', c.tone)}>{c.v}</Num>
              {c.sub && <Num className="text-[10.5px] text-muted">P10–P90 {c.sub}</Num>}
            </div>
          ))}
        </div>
      </div>

      {/* league table */}
      <div className="overflow-hidden rounded-md border border-line">
        <div className="grid grid-cols-[18px_minmax(0,1fr)_minmax(0,1.3fr)_44px_44px] items-center gap-2.5 border-b border-line bg-surface-2/50 px-3 py-1.5">
          <span />
          <Micro>Team</Micro>
          <Micro>Final W · P10–P90</Micro>
          <Micro className="text-right">1st</Micro>
          <Micro className="text-right">🪣</Micro>
        </div>
        {sim.map((r, i) => (
          <button
            key={r.teamId}
            onClick={() => onTeam(r.teamId)}
            className={clsx(
              'relative grid w-full grid-cols-[18px_minmax(0,1fr)_minmax(0,1.3fr)_44px_44px] items-center gap-2.5 border-b border-line/60 px-3 py-2 text-left last:border-0 hover:bg-surface-2/60',
              r.teamId === focus && 'bg-accent-soft/50',
            )}
          >
            {r.teamId === focus && <span className="absolute inset-y-0 left-0 w-0.5 bg-accent" />}
            <Num className="text-[10.5px] text-faint">{String(i + 1).padStart(2, '0')}</Num>
            <span className="truncate text-[12.5px] font-medium">{TEAMS[r.teamId].name}</span>
            <div className="flex items-center gap-2">
              <div className="relative h-3 flex-1 bg-surface-3">
                <div
                  className="absolute inset-y-0 bg-accent/30 transition-all duration-300"
                  style={{ left: `${x(r.p10)}%`, width: `${(x(r.p90) - x(r.p10)) * progress}%` }}
                />
                {done && <div className="absolute inset-y-[-2px] w-0.5 bg-accent" style={{ left: `${x(r.expWins)}%` }} />}
              </div>
              <Num className="w-7 text-right text-[12px] font-semibold">{done ? r.expWins.toFixed(0) : '··'}</Num>
            </div>
            <div className="text-right">
              <Num className="text-[12px] font-semibold">{done ? pct(r.pFirst, 0) : '··'}</Num>
              <div className="mt-0.5 h-0.5 bg-surface-3">
                <div className="ml-auto h-full bg-win" style={{ width: `${(r.pFirst / maxFirst) * 100 * progress}%` }} />
              </div>
            </div>
            <div className="text-right">
              <Num className={clsx('text-[12px] font-semibold', done && r.pBucket > 0.15 && 'text-warn')}>{done ? pct(r.pBucket, 0) : '··'}</Num>
              <div className="mt-0.5 h-0.5 bg-surface-3">
                <div className="ml-auto h-full bg-warn" style={{ width: `${(r.pBucket / maxBucket) * 100 * progress}%` }} />
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <ActionButton primary onClick={() => setSalt((s) => s + 1)}>
          <RotateCcw className="size-3.5" /> RE-RUN {SEASON_RUNS}
        </ActionButton>
      </div>
    </div>
  )
}

