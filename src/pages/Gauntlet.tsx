import clsx from 'clsx'
import { ArrowUpRight, ChevronDown, ChevronRight, Ghost, History, Info, Scale, Star, Swords, Target } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Rise } from '../components/Layout'
import { PlayerAvatar, PosBadge, Select, Sheet, TeamAvatar } from '../components/ui'
import {
  GAMES, STARTER_SLOTS, buildSeason, buildWeek, ghostMedianFor, ghostScore, projectionFor,
  type GameKey, type GameResult, type SeasonRow, type TeamWeek, type WeekSummary,
} from '../data/gauntlet'
import { CURRENT_WEEK, MY_TEAM_ID, SEASON, TEAMS, playerById } from '../data/mock'
import { useStore } from '../lib/store'

const ICONS: Record<GameKey, typeof Swords> = {
  h2h: Swords,
  median: Scale,
  proj: Target,
  ghost: Ghost,
  ghostMedian: History,
  waiver: Star,
}
const pct = (x: number, d = 1) => `${(x * 100).toFixed(d)}%`
const signed = (n: number) => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(1)}`
const def = (k: GameKey) => GAMES.find((g) => g.key === k)!
/** Background for a 0..1 intensity on the win color, blended into the neutral track. */
const winMix = (t: number) => `color-mix(in srgb, var(--win) ${Math.round(12 + t * 88)}%, var(--surface-3))`

// ─── primitives (local to this data-dense view) ─────────────────────────────
function Panel({ title, meta, right, children, className, flush }: {
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

const Micro = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span className={clsx('text-[10px] font-bold uppercase tracking-[0.08em] text-faint', className)}>{children}</span>
)

const Num = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span className={clsx('font-mono tabular-nums', className)}>{children}</span>
)

function ResultCell({ win, size = 22, live, title }: { win: boolean; size?: number; live?: boolean; title?: string }) {
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
function Diverging({ value, scale }: { value: number; scale: number }) {
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

// ─── page ───────────────────────────────────────────────────────────────────
export function Gauntlet() {
  const { lineup } = useStore()
  const weeks = useMemo(
    () => Array.from({ length: CURRENT_WEEK }, (_, i) => buildWeek(i + 1, lineup, MY_TEAM_ID)),
    [lineup],
  )
  const season = useMemo(() => buildSeason(weeks), [weeks])
  // open on the latest finished week where you had a mixed result (more to look at than a sweep)
  const [week, setWeek] = useState(() => {
    const done = weeks.filter((w) => !w.live).reverse()
    return (done.find((w) => w.teams[MY_TEAM_ID].wins > 0 && w.teams[MY_TEAM_ID].wins < 6) ?? done[0]).week
  })
  const [focus, setFocus] = useState(MY_TEAM_ID)
  const [open, setOpen] = useState<GameKey | null>(null)
  const [sheet, setSheet] = useState<null | 'rules' | 'weekly' | 'bucket'>(null)

  const W = weeks[week - 1]
  const T = W.teams[focus]
  const team = TEAMS[focus]
  const weekRank = [...W.teams].sort((a, b) => b.wins - a.wins || b.score - a.score).findIndex((t) => t.teamId === focus) + 1
  const seasonRow = season.find((r) => r.teamId === focus)!

  const pickTeam = (id: number) => {
    setFocus(id)
    setSheet(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const openGame = (k: GameKey) => {
    setOpen(k)
    requestAnimationFrame(() => document.getElementById(`game-${k}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  const bonusTeam = W.teams.find((t) => t.bonus)!
  const spankTeam = W.teams.find((t) => t.spanked)!
  const bucketRow = [...season].sort((a, b) => a.efficiency - b.efficiency)[0]

  return (
    <div className="space-y-4">
      {/* ── title bar ── */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[24px] font-bold tracking-[-0.02em] lg:text-[28px]">The Gauntlet</h1>
            <span className="rounded-[2px] bg-ink px-1.5 py-0.5 font-mono text-[10px] font-semibold text-surface">6×/WK</span>
          </div>
          <div className="mt-1 font-mono text-[11.5px] text-muted">
            {SEASON} · 12 TEAMS · 6 GAMES/WK · +1 BONUS · BUCKET @ WK 17
          </div>
        </div>
        <button
          onClick={() => setSheet('rules')}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-surface px-3 text-[12.5px] font-semibold hover:bg-surface-2"
        >
          <Info className="size-3.5" /> Rules
        </button>
      </div>

      {/* ── controls ── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="inline-flex divide-x divide-line overflow-hidden rounded-md border border-line bg-surface">
            {weeks.map((w) => (
              <button
                key={w.week}
                onClick={() => setWeek(w.week)}
                className={clsx(
                  'relative flex h-8 min-w-[52px] items-center justify-center gap-1.5 px-3 font-mono text-[12px] font-semibold transition',
                  week === w.week ? 'bg-ink text-surface' : 'text-ink-2 hover:bg-surface-2',
                )}
              >
                {w.live && <span className="size-1.5 rounded-full bg-loss" />}
                WK{String(w.week).padStart(2, '0')}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Micro>Team</Micro>
          <Select
            className="h-8 flex-1 rounded-md text-[13px] sm:flex-none"
            value={focus}
            onChange={setFocus}
            options={TEAMS.map((t) => ({ value: t.id, label: t.id === MY_TEAM_ID ? `${t.name} (you)` : t.name }))}
          />
        </div>
      </div>

      {/* ── scorecard ── */}
      <Rise>
        <section className="overflow-hidden rounded-md border border-line bg-line">
          <div className="grid gap-px lg:grid-cols-[300px_minmax(0,1fr)]">
            <div className="flex flex-col justify-between gap-4 bg-surface p-4">
              <div className="flex items-center gap-3">
                <TeamAvatar team={team} size={36} />
                <div className="min-w-0">
                  <div className="truncate text-[14px] font-semibold">{team.name}</div>
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted">
                    {W.live && <span className="size-1.5 rounded-full bg-loss" />}
                    WK{String(week).padStart(2, '0')} · {W.live ? 'LIVE' : 'FINAL'} · {team.manager.toUpperCase()}
                  </div>
                </div>
              </div>
              <div className="flex items-end gap-3">
                <Num className="text-[56px] font-semibold leading-[0.85] tracking-[-0.05em]">
                  {T.wins}–{6 - T.wins}
                </Num>
                <div className="pb-1">
                  {T.bonus && <div className="font-mono text-[11px] font-semibold text-win">+1 BONUS 🏅</div>}
                  {T.spanked && <div className="font-mono text-[11px] font-semibold text-loss">SPANKED 🖐️</div>}
                  <div className="font-mono text-[11px] text-muted">#{weekRank} of 12 this week</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-px overflow-hidden rounded-[3px] border border-line bg-line">
                {[
                  { k: 'Points', v: T.score.toFixed(1) },
                  { k: 'Eff', v: pct(T.efficiency) },
                  { k: 'Season', v: `${seasonRow.wins}-${seasonRow.losses}` },
                ].map((x) => (
                  <div key={x.k} className="bg-surface-2/60 px-2.5 py-2">
                    <Micro>{x.k}</Micro>
                    <Num className="block text-[14px] font-semibold">{x.v}</Num>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-px sm:grid-cols-6">
              {T.games.map((g) => {
                const Icon = ICONS[g.key]
                const m = g.you - g.target
                return (
                  <button
                    key={g.key}
                    onClick={() => openGame(g.key)}
                    className={clsx(
                      'group relative flex flex-col justify-between gap-3 bg-surface p-3 text-left transition hover:bg-surface-2',
                      open === g.key && 'bg-surface-2',
                    )}
                  >
                    <span className={clsx('absolute inset-x-0 top-0 h-0.5', g.win ? 'bg-win' : 'bg-loss')} />
                    <div className="flex items-center justify-between">
                      <Micro className="flex items-center gap-1">
                        <Icon className="size-3" />
                        {def(g.key).short}
                      </Micro>
                      <ArrowUpRight className="size-3 text-faint opacity-0 transition group-hover:opacity-100" />
                    </div>
                    <div className={clsx('font-mono text-[28px] font-semibold leading-none', g.win ? 'text-win' : 'text-loss')}>
                      {g.win ? 'W' : 'L'}
                    </div>
                    <div className="space-y-0.5 font-mono text-[11px] leading-tight">
                      <div className="flex justify-between">
                        <span className="text-faint">you</span>
                        <span className="font-semibold">{g.you.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-faint">vs</span>
                        <span className="text-ink-2">{g.target.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-faint">Δ</span>
                        <span className={clsx('font-semibold', m >= 0 ? 'text-win' : 'text-loss')}>{signed(m)}</span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </section>
      </Rise>

      {/* ── games + management ── */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Rise delay={60}>
          <Panel title="Games" meta={`${T.wins} W · ${6 - T.wins} L · tap a row`} flush>
            <div className="hidden grid-cols-[minmax(0,1fr)_64px_64px_150px_36px_16px] items-center gap-3 border-b border-line bg-surface-2/50 px-3.5 py-1.5 md:grid">
              <Micro>Game</Micro>
              <Micro className="text-right">You</Micro>
              <Micro className="text-right">Opp</Micro>
              <Micro className="text-center">Margin</Micro>
              <Micro className="text-center">Res</Micro>
              <span />
            </div>
            <div className="divide-y divide-line">
              {T.games.map((g) => (
                <GameRow key={g.key} g={g} open={open === g.key} onToggle={() => setOpen(open === g.key ? null : g.key)}>
                  <GameDetail g={g} W={W} T={T} weeks={weeks} focus={focus} onWeek={setWeek} onTeam={pickTeam} />
                </GameRow>
              ))}
            </div>
          </Panel>
        </Rise>

        <div className="space-y-4">
          <Rise delay={100}>
            <EfficiencyPanel T={T} weeks={weeks} focus={focus} week={week} onWeek={setWeek} />
          </Rise>
          <Rise delay={140}>
            <Panel title="Awards" meta={`WK${String(week).padStart(2, '0')}${W.live ? ' · LEADING' : ''}`} flush>
              <div className="divide-y divide-line">
                <AwardRow emoji="🏅" label="Bonus win" teamId={bonusTeam.teamId} stat={pct(bonusTeam.efficiency)} tone="win" onClick={() => setSheet('weekly')} />
                <AwardRow emoji="🖐️" label="Spanking" teamId={spankTeam.teamId} stat={`−${(spankTeam.optimal - spankTeam.score).toFixed(1)}`} tone="loss" onClick={() => setSheet('weekly')} />
                <AwardRow emoji="🪣" label="Bucket · season" teamId={bucketRow.teamId} stat={pct(bucketRow.efficiency)} tone="warn" onClick={() => setSheet('bucket')} />
              </div>
            </Panel>
          </Rise>
        </div>
      </div>

      {/* ── league views ── */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-2">
        <Rise delay={160}>
          <WeekMatrix W={W} focus={focus} onTeam={pickTeam} />
        </Rise>
        <Rise delay={200}>
          <SeasonTable rows={season} focus={focus} onTeam={pickTeam} onWeek={setWeek} />
        </Rise>
      </div>

      {/* ── sheets ── */}
      <Sheet open={sheet === 'rules'} onClose={() => setSheet(null)} title="Rules">
        <Rules />
      </Sheet>
      <Sheet open={sheet === 'weekly'} onClose={() => setSheet(null)} title={`Week ${week} efficiency`}>
        <Ladder
          items={[...W.teams].sort((a, b) => b.efficiency - a.efficiency).map((t) => ({
            teamId: t.teamId,
            eff: t.efficiency,
            sub: `${t.score.toFixed(1)} / ${t.optimal.toFixed(1)} · −${(t.optimal - t.score).toFixed(1)} benched`,
            badge: t.bonus ? '🏅' : t.spanked ? '🖐️' : undefined,
          }))}
          focus={focus}
          onTeam={pickTeam}
        />
      </Sheet>
      <Sheet open={sheet === 'bucket'} onClose={() => setSheet(null)} title="Bucket watch">
        <p className="px-5 pb-2 text-[13px] text-muted">Lowest season efficiency at Week 17 gets the bucket. Worst first.</p>
        <Ladder
          items={[...season].sort((a, b) => a.efficiency - b.efficiency).map((r, i) => ({
            teamId: r.teamId,
            eff: r.efficiency,
            sub: `${r.spankings}× 🖐️ · ${r.bonuses}× 🏅`,
            badge: i === 0 ? '🪣' : undefined,
          }))}
          focus={focus}
          onTeam={pickTeam}
        />
      </Sheet>
    </div>
  )
}

// ─── games table ────────────────────────────────────────────────────────────
function GameRow({ g, open, onToggle, children }: { g: GameResult; open: boolean; onToggle: () => void; children: ReactNode }) {
  const d = def(g.key)
  const Icon = ICONS[g.key]
  const m = g.you - g.target
  return (
    <div id={`game-${g.key}`} className="scroll-mt-20">
      <button
        onClick={onToggle}
        className={clsx(
          'grid w-full grid-cols-[minmax(0,1fr)_auto_16px] items-center gap-3 px-3.5 py-3 text-left transition hover:bg-surface-2/60 md:grid-cols-[minmax(0,1fr)_64px_64px_150px_36px_16px]',
          open && 'bg-surface-2/60',
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className={clsx('flex size-7 shrink-0 items-center justify-center rounded-[3px] border', g.win ? 'border-win/30 text-win' : 'border-loss/30 text-loss')}>
            <Icon className="size-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13.5px] font-semibold">{d.title}</div>
            <div className="truncate text-[11.5px] text-muted">{g.label}</div>
            <div className="mt-1.5 md:hidden">
              <Diverging value={m} scale={40} />
            </div>
          </div>
        </div>
        {/* mobile: stacked numbers + result */}
        <div className="flex items-center gap-3 md:hidden">
          <div className="text-right font-mono text-[12px] leading-tight">
            <div className="font-semibold">{g.you.toFixed(1)}</div>
            <div className="text-faint">{g.target.toFixed(1)}</div>
            <div className={clsx('font-semibold', m >= 0 ? 'text-win' : 'text-loss')}>{signed(m)}</div>
          </div>
          <ResultCell win={g.win} />
        </div>
        {/* desktop columns */}
        <Num className="hidden text-right text-[13px] font-semibold md:block">{g.you.toFixed(1)}</Num>
        <Num className="hidden text-right text-[13px] text-muted md:block">{g.target.toFixed(1)}</Num>
        <div className="hidden items-center gap-2 md:flex">
          <Diverging value={m} scale={40} />
          <Num className={clsx('w-11 shrink-0 text-right text-[12px] font-semibold', m >= 0 ? 'text-win' : 'text-loss')}>{signed(m)}</Num>
        </div>
        <span className="hidden justify-center md:flex">
          <ResultCell win={g.win} />
        </span>
        <ChevronDown className={clsx('size-4 text-faint transition', open && 'rotate-180')} />
      </button>
      {open && <div className="animate-fade-in border-t border-dashed border-line bg-bg/60 px-3.5 py-4">{children}</div>}
    </div>
  )
}

function GameDetail({ g, W, T, weeks, focus, onWeek, onTeam }: {
  g: GameResult
  W: WeekSummary
  T: TeamWeek
  weeks: WeekSummary[]
  focus: number
  onWeek: (w: number) => void
  onTeam: (id: number) => void
}) {
  const intro = <p className="mb-3 text-[12.5px] text-muted">{def(g.key).blurb}</p>

  if (g.key === 'h2h') {
    const oppId = TEAMS.findIndex((t) => t.name === g.label)
    return (
      <div>
        {intro}
        <div className="grid gap-3 sm:grid-cols-2">
          <TopScorers teamId={focus} week={W.week} lineup={T.optimalLineup} />
          <TopScorers teamId={oppId} week={W.week} lineup={W.teams[oppId].optimalLineup} onTeam={onTeam} />
        </div>
        {W.live && (
          <Link to={`/matchup/${focus}`} className="mt-3 inline-flex items-center gap-1 font-mono text-[11.5px] font-semibold text-accent">
            OPEN LIVE MATCHUP <ArrowUpRight className="size-3.5" />
          </Link>
        )}
      </div>
    )
  }

  if (g.key === 'median') {
    const sorted = [...W.scores].sort((a, b) => b.score - a.score)
    const max = sorted[0].score
    return (
      <div>
        {intro}
        <div className="overflow-hidden rounded-[3px] border border-line bg-surface">
          {sorted.map((s, i) => (
            <div key={s.teamId}>
              {i === sorted.length / 2 && (
                <div className="flex items-center gap-2 border-y border-accent/40 bg-accent-soft px-3 py-1 font-mono text-[10.5px] font-semibold text-accent-strong">
                  MEDIAN <span className="ml-auto">{W.median.toFixed(1)}</span>
                </div>
              )}
              <button
                onClick={() => onTeam(s.teamId)}
                className={clsx('grid w-full grid-cols-[18px_minmax(0,140px)_minmax(0,1fr)_48px] items-center gap-2.5 px-3 py-1.5 text-left hover:bg-surface-2', s.teamId === focus && 'bg-accent-soft/60')}
              >
                <Num className="text-[10.5px] text-faint">{String(i + 1).padStart(2, '0')}</Num>
                <span className="truncate text-[12.5px] font-medium">{TEAMS[s.teamId].name}</span>
                <div className="h-1.5 bg-surface-3">
                  <div className={clsx('h-full', s.score > W.median ? 'bg-win' : 'bg-loss/60')} style={{ width: `${(s.score / max) * 100}%` }} />
                </div>
                <Num className="text-right text-[12px] font-semibold">{s.score.toFixed(1)}</Num>
              </button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (g.key === 'waiver') {
    return (
      <div>
        {intro}
        <LineupList lineup={W.waiverLineup} week={W.week} total={W.waiverScore} title="Waiver Wire All-Stars" />
      </div>
    )
  }

  // proj / ghost / ghostMedian → week-by-week ledger
  const targetFor = (w: number) =>
    g.key === 'proj' ? projectionFor(focus, w) : g.key === 'ghost' ? ghostScore(focus, w) : ghostMedianFor(w)
  return (
    <div>
      {intro}
      <div className="overflow-hidden rounded-[3px] border border-line bg-surface">
        <div className="grid grid-cols-[52px_1fr_1fr_minmax(0,1.6fr)_28px] gap-3 border-b border-line bg-surface-2/50 px-3 py-1.5">
          <Micro>Wk</Micro>
          <Micro className="text-right">You</Micro>
          <Micro className="text-right">{def(g.key).short}</Micro>
          <Micro className="text-center">Margin</Micro>
          <span />
        </div>
        {weeks.map((w) => {
          const you = w.teams[focus].score
          const target = w.week === W.week ? g.target : targetFor(w.week)
          const m = you - target
          return (
            <button
              key={w.week}
              onClick={() => onWeek(w.week)}
              className={clsx(
                'grid w-full grid-cols-[52px_1fr_1fr_minmax(0,1.6fr)_28px] items-center gap-3 border-b border-line/60 px-3 py-2 text-left last:border-0 hover:bg-surface-2',
                w.week === W.week && 'bg-accent-soft/60',
              )}
            >
              <Num className="text-[12px] font-semibold">
                {String(w.week).padStart(2, '0')}
                {w.live && <span className="ml-1 text-loss">•</span>}
              </Num>
              <Num className="text-right text-[12px] font-semibold">{you.toFixed(1)}</Num>
              <Num className="text-right text-[12px] text-muted">{target.toFixed(1)}</Num>
              <Diverging value={m} scale={40} />
              <ResultCell win={m > 0} size={20} live={w.live} />
            </button>
          )
        })}
      </div>
    </div>
  )
}

function TopScorers({ teamId, week, lineup, onTeam }: { teamId: number; week: number; lineup: Record<string, string | null>; onTeam?: (id: number) => void }) {
  const { setOpenPlayer } = useStore()
  const pts = (id: string) => (week === CURRENT_WEEK ? playerById[id].live : playerById[id].weekly[week - 1] ?? 0)
  const top = (Object.values(lineup).filter(Boolean) as string[]).sort((a, b) => pts(b) - pts(a)).slice(0, 4)
  const t = TEAMS[teamId]
  return (
    <div className="overflow-hidden rounded-[3px] border border-line bg-surface">
      <button
        onClick={() => onTeam?.(teamId)}
        disabled={!onTeam}
        className="flex w-full items-center gap-2 border-b border-line bg-surface-2/50 px-3 py-2 text-left enabled:hover:bg-surface-2"
      >
        <TeamAvatar team={t} size={20} />
        <span className="flex-1 truncate text-[12.5px] font-semibold">{t.name}</span>
        {onTeam && <ChevronRight className="size-3.5 text-faint" />}
      </button>
      {top.map((id) => (
        <button key={id} onClick={() => setOpenPlayer(id)} className="flex w-full items-center gap-2.5 border-b border-line/60 px-3 py-1.5 text-left last:border-0 hover:bg-surface-2">
          <PlayerAvatar player={playerById[id]} size={22} />
          <span className="flex-1 truncate text-[12.5px] font-medium">{playerById[id].name}</span>
          <Num className="text-[12px] font-semibold">{pts(id).toFixed(1)}</Num>
        </button>
      ))}
    </div>
  )
}

function LineupList({ lineup, week, total, title, single }: { lineup: Record<string, string | null>; week: number; total: number; title: string; single?: boolean }) {
  const { setOpenPlayer } = useStore()
  const pts = (id: string) => (week === CURRENT_WEEK ? playerById[id].live : playerById[id].weekly[week - 1] ?? 0)
  return (
    <div className="overflow-hidden rounded-[3px] border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line bg-surface-2/50 px-3 py-1.5">
        <Micro>{title}</Micro>
        <Num className="text-[12px] font-semibold">{total.toFixed(1)}</Num>
      </div>
      <div className={clsx('grid', !single && 'sm:grid-cols-2')}>
        {STARTER_SLOTS.map((s) => {
          const id = lineup[s.key]
          if (!id) return null
          return (
            <button key={s.key} onClick={() => setOpenPlayer(id)} className={clsx("flex items-center gap-2.5 border-b border-line/60 px-3 py-1.5 text-left hover:bg-surface-2", !single && 'sm:odd:border-r')}>
              <PosBadge pos={s.slot} className="h-5 w-10 rounded-[2px] text-[10px]" />
              <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium">{playerById[id].name}</span>
              <Num className="text-[12px] font-semibold">{pts(id).toFixed(1)}</Num>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── management ─────────────────────────────────────────────────────────────
function EfficiencyPanel({ T, weeks, focus, week, onWeek }: { T: TeamWeek; weeks: WeekSummary[]; focus: number; week: number; onWeek: (w: number) => void }) {
  const [open, setOpen] = useState(false)
  const left = T.optimal - T.score
  const ticks = 24
  const lit = Math.round(T.efficiency * ticks)
  const hist = weeks.map((w) => w.teams[focus].efficiency)
  const lo = Math.min(...hist, 0.75)
  return (
    <Panel title="Efficiency" meta="started ÷ best possible" flush>
      <div className="p-3.5">
        <div className="flex items-end justify-between">
          <Num className="text-[36px] font-semibold leading-none tracking-[-0.04em]">{pct(T.efficiency)}</Num>
          <Num className={clsx('pb-1 text-[12px] font-semibold', left > 0.05 ? 'text-loss' : 'text-win')}>−{left.toFixed(1)} pts benched</Num>
        </div>
        <div className="mt-3 flex gap-[3px]">
          {Array.from({ length: ticks }).map((_, i) => (
            <span
              key={i}
              className={clsx('h-3 flex-1', i < lit ? (T.efficiency > 0.92 ? 'bg-win' : T.efficiency > 0.82 ? 'bg-warn' : 'bg-loss') : 'bg-surface-3')}
            />
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-[3px] border border-line bg-line">
          <div className="bg-surface-2/60 px-2.5 py-1.5">
            <Micro>Started</Micro>
            <Num className="block text-[13px] font-semibold">{T.score.toFixed(1)}</Num>
          </div>
          <div className="bg-surface-2/60 px-2.5 py-1.5">
            <Micro>Optimal</Micro>
            <Num className="block text-[13px] font-semibold">{T.optimal.toFixed(1)}</Num>
          </div>
        </div>

        {/* by-week mini chart */}
        <div className="mt-4">
          <Micro>By week</Micro>
          <div className="mt-1.5 flex h-14 items-end gap-1">
            {hist.map((e, i) => (
              <button
                key={i}
                onClick={() => onWeek(i + 1)}
                title={`Week ${i + 1}: ${pct(e)}`}
                className="group flex h-full flex-1 flex-col justify-end"
              >
                <span
                  className={clsx('w-full transition', i + 1 === week ? 'bg-accent' : 'bg-faint/40 group-hover:bg-faint/70', weeks[i].live && 'opacity-50')}
                  style={{ height: `${Math.max(6, ((e - lo) / (1 - lo)) * 100)}%` }}
                />
              </button>
            ))}
          </div>
          <div className="mt-1 flex gap-1">
            {hist.map((_, i) => (
              <Num key={i} className={clsx('flex-1 text-center text-[10px]', i + 1 === week ? 'font-semibold text-ink' : 'text-faint')}>
                {String(i + 1).padStart(2, '0')}
              </Num>
            ))}
          </div>
        </div>
      </div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between border-t border-line px-3.5 py-2.5 font-mono text-[11px] font-semibold text-accent hover:bg-surface-2"
      >
        {open ? 'HIDE' : 'SHOW'} OPTIMAL LINEUP
        <ChevronDown className={clsx('size-3.5 transition', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="animate-fade-in border-t border-line bg-bg/60 p-3">
          <LineupList lineup={T.optimalLineup} week={T.week} total={T.optimal} title="Hindsight best" single />
        </div>
      )}
    </Panel>
  )
}

function AwardRow({ emoji, label, teamId, stat, tone, onClick }: {
  emoji: string
  label: string
  teamId: number
  stat: string
  tone: 'win' | 'loss' | 'warn'
  onClick: () => void
}) {
  const t = TEAMS[teamId]
  return (
    <button onClick={onClick} className="group flex w-full items-center gap-3 px-3.5 py-2.5 text-left hover:bg-surface-2/60">
      <span
        className={clsx(
          'flex size-8 shrink-0 items-center justify-center rounded-[3px] text-[16px]',
          tone === 'win' ? 'bg-win-soft' : tone === 'loss' ? 'bg-loss-soft' : 'bg-warn-soft',
        )}
      >
        {emoji}
      </span>
      <div className="min-w-0 flex-1">
        <Micro>{label}</Micro>
        <div className="truncate text-[13px] font-semibold">{t.name}</div>
      </div>
      <Num className={clsx('text-[12.5px] font-semibold', tone === 'win' ? 'text-win' : tone === 'loss' ? 'text-loss' : 'text-warn')}>{stat}</Num>
      <ChevronRight className="size-4 text-faint transition group-hover:translate-x-0.5" />
    </button>
  )
}

function Ladder({ items, focus, onTeam }: {
  items: { teamId: number; eff: number; sub: string; badge?: string }[]
  focus: number
  onTeam: (id: number) => void
}) {
  const max = Math.max(...items.map((i) => i.eff))
  const min = Math.min(...items.map((i) => i.eff))
  return (
    <div className="divide-y divide-line border-t border-line pb-4">
      {items.map((it, i) => (
        <button
          key={it.teamId}
          onClick={() => onTeam(it.teamId)}
          className={clsx('grid w-full grid-cols-[22px_minmax(0,1fr)_64px] items-center gap-3 px-5 py-2.5 text-left hover:bg-surface-2', it.teamId === focus && 'bg-accent-soft/60')}
        >
          <Num className="text-[11px] text-faint">{String(i + 1).padStart(2, '0')}</Num>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold">
              {TEAMS[it.teamId].name} {it.badge}
            </div>
            <div className="mt-1 h-1 bg-surface-3">
              <div className="h-full bg-accent" style={{ width: `${8 + ((it.eff - min) / Math.max(0.0001, max - min)) * 92}%` }} />
            </div>
            <div className="mt-1 font-mono text-[10.5px] text-muted">{it.sub}</div>
          </div>
          <Num className="text-right text-[13px] font-semibold">{pct(it.eff)}</Num>
        </button>
      ))}
    </div>
  )
}

// ─── league views ───────────────────────────────────────────────────────────
function WeekMatrix({ W, focus, onTeam }: { W: WeekSummary; focus: number; onTeam: (id: number) => void }) {
  const rows = [...W.teams].sort((a, b) => b.wins - a.wins || b.score - a.score)
  const cols = 'grid-cols-[18px_minmax(0,1fr)_repeat(6,20px)_28px_48px] sm:grid-cols-[18px_minmax(0,1fr)_repeat(6,22px)_32px_52px_52px]'
  return (
    <Panel title={`League · Week ${W.week}`} meta={W.live ? 'LIVE' : 'FINAL'} flush>
      <div className={clsx('grid items-center gap-x-1.5 border-b border-line bg-surface-2/50 px-3.5 py-1.5', cols)}>
        <span />
        <Micro>Team</Micro>
        {GAMES.map((g) => {
          const Icon = ICONS[g.key]
          return (
            <span key={g.key} title={g.title} className="flex justify-center text-faint">
              <Icon className="size-3" />
            </span>
          )
        })}
        <Micro className="text-right">W</Micro>
        <Micro className="hidden text-right sm:block">Pts</Micro>
        <Micro className="text-right">Eff</Micro>
      </div>
      {rows.map((t, i) => (
        <button
          key={t.teamId}
          onClick={() => onTeam(t.teamId)}
          className={clsx(
            'relative grid w-full items-center gap-x-1.5 border-b border-line/60 px-3.5 py-1.5 text-left last:border-0 hover:bg-surface-2/60',
            cols,
            t.teamId === focus && 'bg-accent-soft/50',
          )}
        >
          {t.teamId === focus && <span className="absolute inset-y-0 left-0 w-0.5 bg-accent" />}
          <Num className="text-[10.5px] text-faint">{String(i + 1).padStart(2, '0')}</Num>
          <span className="truncate text-[12.5px] font-medium">
            <span className="font-mono text-[12px] sm:hidden">{TEAMS[t.teamId].abbr}</span>
            <span className="hidden sm:inline">{TEAMS[t.teamId].name}</span>
            {t.bonus && ' 🏅'}
            {t.spanked && ' 🖐️'}
          </span>
          {t.games.map((g) => (
            <ResultCell key={g.key} win={g.win} size={20} live={W.live} title={`${def(g.key).title}: ${g.you.toFixed(1)} vs ${g.target.toFixed(1)}`} />
          ))}
          <Num className="text-right text-[13px] font-semibold">{t.wins}</Num>
          <Num className="hidden text-right text-[12px] text-muted sm:block">{t.score.toFixed(1)}</Num>
          <Num className="text-right text-[12px] text-ink-2">{pct(t.efficiency, 0)}</Num>
        </button>
      ))}
    </Panel>
  )
}

function SeasonTable({ rows, focus, onTeam, onWeek }: { rows: SeasonRow[]; focus: number; onTeam: (id: number) => void; onWeek: (w: number) => void }) {
  const [open, setOpen] = useState<number | null>(null)
  const cols = 'grid-cols-[18px_minmax(0,1fr)_48px_24px_24px_16px] sm:grid-cols-[18px_minmax(0,1fr)_96px_48px_24px_24px_44px_16px]'
  return (
    <Panel title="Season" meta={`WK01–WK${String(CURRENT_WEEK - 1).padStart(2, '0')} · tap to expand`} flush>
      <div className={clsx('grid items-center gap-x-2 border-b border-line bg-surface-2/50 px-3.5 py-1.5', cols)}>
        <span />
        <Micro>Team</Micro>
        <Micro className="hidden sm:block">Weekly W</Micro>
        <Micro className="text-right">W-L</Micro>
        <span className="text-center text-[10px]">🏅</span>
        <span className="text-center text-[10px]">🖐️</span>
        <Micro className="hidden text-right sm:block">Eff</Micro>
        <span />
      </div>
      {rows.map((r, i) => {
        const isOpen = open === r.teamId
        return (
          <div key={r.teamId} className={clsx('relative border-b border-line/60 last:border-0', r.teamId === focus && 'bg-accent-soft/40')}>
            {r.teamId === focus && <span className="absolute inset-y-0 left-0 w-0.5 bg-accent" />}
            <button
              onClick={() => setOpen(isOpen ? null : r.teamId)}
              className={clsx('grid w-full items-center gap-x-2 px-3.5 py-2 text-left hover:bg-surface-2/60', cols)}
            >
              <Num className="text-[10.5px] text-faint">{String(i + 1).padStart(2, '0')}</Num>
              <span className="truncate text-[12.5px] font-medium">{TEAMS[r.teamId].name}</span>
              <span className="hidden gap-[3px] sm:flex">
                {r.weeks.map((w) => (
                  <span
                    key={w.week}
                    title={`Wk ${w.week}: ${w.wins}-${6 - w.wins}`}
                    className={clsx('h-4 flex-1 rounded-[1px]', w.week === CURRENT_WEEK && 'opacity-40')}
                    style={{ background: winMix(w.wins / 6) }}
                  />
                ))}
              </span>
              <Num className="text-right text-[12.5px] font-semibold">
                {r.wins}-{r.losses}
              </Num>
              <Num className="text-center text-[12px]">{r.bonuses || '·'}</Num>
              <Num className="text-center text-[12px]">{r.spankings || '·'}</Num>
              <Num className="hidden text-right text-[12px] text-ink-2 sm:block">{pct(r.efficiency, 0)}</Num>
              <ChevronDown className={clsx('size-3.5 text-faint transition', isOpen && 'rotate-180')} />
            </button>
            {isOpen && (
              <div className="animate-fade-in border-t border-dashed border-line bg-bg/60 px-3.5 py-3">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Micro>Wins by game</Micro>
                    <div className="mt-2 space-y-1.5">
                      {GAMES.map((g) => {
                        const Icon = ICONS[g.key]
                        const n = r.byGame[g.key]
                        const total = CURRENT_WEEK - 1
                        return (
                          <div key={g.key} className="flex items-center gap-2">
                            <Icon className="size-3 shrink-0 text-faint" />
                            <span className="w-14 font-mono text-[10.5px] font-semibold text-muted">{g.short}</span>
                            <div className="flex flex-1 gap-[3px]">
                              {Array.from({ length: total }).map((_, k) => (
                                <span key={k} className={clsx('h-2 flex-1', k < n ? 'bg-win' : 'bg-surface-3')} />
                              ))}
                            </div>
                            <Num className="w-7 text-right text-[11px] font-semibold">
                              {n}/{total}
                            </Num>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div>
                    <Micro>Week by week</Micro>
                    <div className="mt-2 space-y-1">
                      {r.weeks.map((w) => (
                        <button key={w.week} onClick={() => onWeek(w.week)} className="flex w-full items-center gap-2 hover:opacity-80">
                          <Num className="w-6 text-left text-[10.5px] text-faint">{String(w.week).padStart(2, '0')}</Num>
                          <span className="flex gap-[3px]">
                            {w.games.map((g) => (
                              <ResultCell key={g.key} win={g.win} size={14} live={w.week === CURRENT_WEEK} />
                            ))}
                          </span>
                          <Num className="text-[11px] font-semibold">
                            {w.wins}–{6 - w.wins}
                          </Num>
                          <span className="text-[11px]">{w.bonus ? '🏅' : w.spanked ? '🖐️' : ''}</span>
                          {w.week === CURRENT_WEEK && <Num className="text-[10px] font-semibold text-loss">LIVE</Num>}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <button onClick={() => onTeam(r.teamId)} className="mt-3 inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-accent">
                  VIEW TEAM <ArrowUpRight className="size-3.5" />
                </button>
              </div>
            )}
          </div>
        )
      })}
    </Panel>
  )
}

// ─── rules ──────────────────────────────────────────────────────────────────
function Rules() {
  return (
    <div className="pb-5">
      <div className="divide-y divide-line border-y border-line">
        {GAMES.map((g, i) => {
          const Icon = ICONS[g.key]
          return (
            <div key={g.key} className="flex gap-3 px-5 py-3">
              <Num className="w-5 pt-0.5 text-[11px] text-faint">{String(i + 1).padStart(2, '0')}</Num>
              <Icon className="mt-0.5 size-4 shrink-0 text-accent" />
              <div>
                <div className="text-[13.5px] font-semibold">{g.title}</div>
                <div className="text-[12.5px] text-muted">{g.blurb}</div>
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-4 space-y-3 px-5 text-[13px] leading-relaxed">
        <p>
          <span className="font-semibold">🏅 Bonus win</span>{' '}
          <span className="text-ink-2">Most efficient manager each week gets a 7th win. Efficiency = points started ÷ best lineup possible from your roster.</span>
        </p>
        <p>
          <span className="font-semibold">🖐️ Spanking</span>{' '}
          <span className="text-ink-2">Least efficient manager each week. Not a loss. Worse.</span>
        </p>
        <p>
          <span className="font-semibold">🪣 The Bucket</span>{' '}
          <span className="text-ink-2">Lowest efficiency across the {SEASON} season. A bucket of piss. No appeals.</span>
        </p>
      </div>
    </div>
  )
}
