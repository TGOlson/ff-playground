import clsx from 'clsx'
import { ArrowRight, ChevronDown, Ghost, History, Info, Scale, Star, Swords, Target } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Rise } from '../components/Layout'
import { Card, LiveDot, PageHeader, PlayerAvatar, PosBadge, SectionTitle, Select, Sheet, TeamAvatar } from '../components/ui'
import {
  GAMES, STARTER_SLOTS, buildSeason, buildWeek, ghostMedianFor, ghostScore, projectionFor,
  type GameKey, type GameResult, type SeasonRow, type TeamWeek, type WeekSummary,
} from '../data/gauntlet'
import { CURRENT_WEEK, MY_TEAM_ID, SEASON, TEAMS, playerById, type FantasyTeam } from '../data/mock'
import { useStore } from '../lib/store'

const ICONS: Record<GameKey, typeof Swords> = {
  h2h: Swords,
  median: Scale,
  proj: Target,
  ghost: Ghost,
  ghostMedian: History,
  waiver: Star,
}
const pct = (x: number) => `${(x * 100).toFixed(1)}%`
const signed = (n: number) => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(1)}`

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
  const pickTeam = (id: number) => {
    setFocus(id)
    setSheet(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const bonusTeam = W.teams.find((t) => t.bonus)!
  const spankTeam = W.teams.find((t) => t.spanked)!
  const bucketRow = [...season].sort((a, b) => a.efficiency - b.efficiency)[0]

  return (
    <div className="space-y-8">
      <PageHeader
        title="The Gauntlet"
        sub="Six games every week. Bonus wins for the best-managed team, spankings for the worst."
        right={
          <button
            onClick={() => setSheet('rules')}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-semibold shadow-card hover:bg-surface-2"
          >
            <Info className="size-4" /> How it works
          </button>
        }
      />

      {/* week + team pickers */}
      <div className="-mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {weeks.map((w) => (
            <button
              key={w.week}
              onClick={() => setWeek(w.week)}
              className={clsx(
                'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold transition active:scale-95',
                week === w.week ? 'border-ink bg-ink text-surface' : 'border-line bg-surface text-ink-2 hover:border-line-strong',
              )}
            >
              {w.live && <LiveDot className="scale-75" />}
              Week {w.week}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-muted">Viewing</span>
          <Select
            value={focus}
            onChange={setFocus}
            options={TEAMS.map((t) => ({ value: t.id, label: t.id === MY_TEAM_ID ? `${t.name} (you)` : t.name }))}
          />
        </div>
      </div>

      {/* hero */}
      <Rise>
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-6 p-5 sm:p-7 lg:flex-row lg:items-center">
            <div className="flex items-center gap-4 lg:w-[300px] lg:shrink-0">
              <TeamAvatar team={team} size={56} />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-muted">
                  {W.live && <LiveDot className="scale-75" />}
                  Week {week} · {W.live ? 'In progress' : 'Final'}
                </div>
                <div className="truncate text-[15px] font-semibold">{team.name}</div>
                <div className="flex items-baseline gap-2">
                  <span className="tnum text-[44px] font-bold leading-none tracking-[-0.04em]">
                    {T.wins}–{6 - T.wins}
                  </span>
                  {T.bonus && <span className="text-[13px] font-semibold text-win">+1 bonus</span>}
                </div>
              </div>
            </div>

            <div className="grid flex-1 grid-cols-3 gap-2 sm:grid-cols-6">
              {T.games.map((g) => {
                const def = GAMES.find((d) => d.key === g.key)!
                const Icon = ICONS[g.key]
                return (
                  <button
                    key={g.key}
                    onClick={() => {
                      setOpen(g.key)
                      document.getElementById(`game-${g.key}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    }}
                    className={clsx(
                      'flex flex-col items-center gap-1 rounded-xl px-1 py-2.5 transition hover:brightness-95 active:scale-95',
                      g.win ? 'bg-win-soft text-win' : 'bg-loss-soft text-loss',
                    )}
                  >
                    <Icon className="size-4" />
                    <span className="text-[15px] font-bold leading-none">{g.win ? 'W' : 'L'}</span>
                    <span className="text-[10px] font-bold tracking-wide opacity-80">{def.short}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {(T.bonus || T.spanked) && (
            <div
              className={clsx(
                'border-t px-5 py-3 text-[13.5px] font-semibold sm:px-7',
                T.bonus ? 'border-win/20 bg-win-soft text-win' : 'border-loss/20 bg-loss-soft text-loss',
              )}
            >
              {T.bonus
                ? `🏅 ${W.live ? 'On pace for' : 'Earned'} the bonus win — most efficient manager this week (${pct(T.efficiency)}).`
                : `🖐️ ${W.live ? 'On pace for' : 'Received'} this week's spanking — least efficient manager (${pct(T.efficiency)}).`}
            </div>
          )}
        </Card>
      </Rise>

      {/* the six games */}
      <section>
        <SectionTitle title="This week's six games" sub="Tap any game for the details." />
        <div className="grid grid-flow-row-dense grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {T.games.map((g) => (
            <GameCard
              key={g.key}
              g={g}
              open={open === g.key}
              onToggle={() => setOpen(open === g.key ? null : g.key)}
            >
              <GameDetail g={g} W={W} T={T} weeks={weeks} focus={focus} onWeek={setWeek} onTeam={pickTeam} />
            </GameCard>
          ))}
        </div>
      </section>

      {/* efficiency + awards */}
      <section>
        <SectionTitle title="Management report" sub="Efficiency = points you started ÷ best lineup you could have started." />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <EfficiencyCard T={T} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <AwardCard
              emoji="🏅"
              title={W.live ? 'Bonus win · leading' : 'Bonus win'}
              team={TEAMS[bonusTeam.teamId]}
              stat={`${pct(bonusTeam.efficiency)} efficient`}
              tone="win"
              onClick={() => setSheet('weekly')}
            />
            <AwardCard
              emoji="🖐️"
              title={W.live ? 'Spanking · leading' : 'Spanking'}
              team={TEAMS[spankTeam.teamId]}
              stat={`${(spankTeam.optimal - spankTeam.score).toFixed(1)} pts left on bench`}
              tone="loss"
              onClick={() => setSheet('weekly')}
            />
            <AwardCard
              emoji="🪣"
              title="Bucket watch · season"
              team={TEAMS[bucketRow.teamId]}
              stat={`${pct(bucketRow.efficiency)} season efficiency`}
              tone="warn"
              onClick={() => setSheet('bucket')}
            />
          </div>
        </div>
      </section>

      {/* season standings */}
      <section>
        <SectionTitle
          title="Gauntlet standings"
          sub={`Weeks 1–${CURRENT_WEEK - 1} · 6 games a week + bonus wins · tap a row to expand`}
        />
        <SeasonTable rows={season} focus={focus} onTeam={pickTeam} />
      </section>

      {/* sheets */}
      <Sheet open={sheet === 'rules'} onClose={() => setSheet(null)} title="How the Gauntlet works">
        <Rules />
      </Sheet>
      <Sheet open={sheet === 'weekly'} onClose={() => setSheet(null)} title={`Week ${week} efficiency`}>
        <EfficiencyLadder
          items={[...W.teams].sort((a, b) => b.efficiency - a.efficiency).map((t) => ({
            teamId: t.teamId,
            eff: t.efficiency,
            sub: `${t.score.toFixed(1)} of ${t.optimal.toFixed(1)} possible`,
            badge: t.bonus ? '🏅' : t.spanked ? '🖐️' : undefined,
          }))}
          focus={focus}
          onTeam={pickTeam}
        />
      </Sheet>
      <Sheet open={sheet === 'bucket'} onClose={() => setSheet(null)} title="Bucket watch">
        <div className="px-5 pb-1 pt-1 text-[13.5px] leading-relaxed text-muted">
          At season's end, the least efficient manager over all weeks gets the bucket. Ranked worst first.
        </div>
        <EfficiencyLadder
          items={[...season].sort((a, b) => a.efficiency - b.efficiency).map((r, i) => ({
            teamId: r.teamId,
            eff: r.efficiency,
            sub: `${r.spankings} spanking${r.spankings === 1 ? '' : 's'} · ${r.bonuses} bonus win${r.bonuses === 1 ? '' : 's'}`,
            badge: i === 0 ? '🪣' : undefined,
          }))}
          focus={focus}
          onTeam={pickTeam}
        />
      </Sheet>
    </div>
  )
}

// ─── game cards ─────────────────────────────────────────────────────────────
function GameCard({ g, open, onToggle, children }: { g: GameResult; open: boolean; onToggle: () => void; children: ReactNode }) {
  const def = GAMES.find((d) => d.key === g.key)!
  const Icon = ICONS[g.key]
  const margin = g.you - g.target
  const max = Math.max(g.you, g.target, 1)
  return (
    <Card id={`game-${g.key}`} className={clsx('overflow-hidden transition', open && 'sm:col-span-2 lg:col-span-3')}>
      <button onClick={onToggle} className="block w-full p-4 text-left transition hover:bg-surface-2/50">
        <div className="flex items-center gap-3">
          <div className={clsx('flex size-9 shrink-0 items-center justify-center rounded-xl', g.win ? 'bg-win-soft text-win' : 'bg-loss-soft text-loss')}>
            <Icon className="size-[18px]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[14.5px] font-semibold">{def.title}</div>
            <div className="truncate text-[12px] text-muted">vs {g.label}</div>
          </div>
          <span className={clsx('rounded-lg px-2 py-1 text-[12px] font-bold', g.win ? 'bg-win text-white dark:text-black' : 'bg-loss text-white dark:text-black')}>
            {g.win ? 'WIN' : 'LOSS'}
          </span>
          <ChevronDown className={clsx('size-4 shrink-0 text-faint transition', open && 'rotate-180')} />
        </div>
        <div className="mt-4 space-y-1.5">
          <Bar label="You" value={g.you} max={max} strong={g.win} />
          <Bar label={def.short} value={g.target} max={max} strong={!g.win} muted />
        </div>
        <div className={clsx('tnum mt-2 text-right text-[12px] font-semibold', g.win ? 'text-win' : 'text-loss')}>
          {signed(margin)} pts
        </div>
      </button>
      {open && <div className="animate-fade-in border-t border-line bg-surface-2/40 p-4 sm:p-5">{children}</div>}
    </Card>
  )
}

function Bar({ label, value, max, strong, muted }: { label: string; value: number; max: number; strong?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-12 shrink-0 text-[11px] font-bold tracking-wide text-faint">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
        <div className={clsx('h-full rounded-full', muted ? 'bg-faint/60' : 'bg-accent')} style={{ width: `${(value / max) * 100}%` }} />
      </div>
      <span className={clsx('tnum w-12 text-right text-[13.5px]', strong ? 'font-bold' : 'font-medium text-muted')}>{value.toFixed(1)}</span>
    </div>
  )
}

function GameDetail({
  g,
  W,
  T,
  weeks,
  focus,
  onWeek,
  onTeam,
}: {
  g: GameResult
  W: WeekSummary
  T: TeamWeek
  weeks: WeekSummary[]
  focus: number
  onWeek: (w: number) => void
  onTeam: (id: number) => void
}) {
  const def = GAMES.find((d) => d.key === g.key)!
  const intro = <p className="mb-4 text-[13px] text-muted">{def.blurb}</p>

  if (g.key === 'h2h') {
    const oppId = TEAMS.findIndex((t) => t.name === g.label)
    return (
      <div>
        {intro}
        <div className="grid gap-4 sm:grid-cols-2">
          <TopScorers teamId={focus} week={W.week} lineup={T.optimalLineup} />
          <TopScorers teamId={oppId} week={W.week} lineup={W.teams[oppId].optimalLineup} onTeam={onTeam} />
        </div>
        {W.live && (
          <Link to={`/matchup/${focus}`} className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-accent">
            Open live matchup <ArrowRight className="size-3.5" />
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
        <div className="space-y-1">
          {sorted.map((s, i) => (
            <div key={s.teamId}>
              {i === sorted.length / 2 && (
                <div className="my-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-accent">
                  <span className="h-px flex-1 bg-accent/40" /> Median {W.median.toFixed(1)} <span className="h-px flex-1 bg-accent/40" />
                </div>
              )}
              <button
                onClick={() => onTeam(s.teamId)}
                className={clsx('flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-surface', s.teamId === focus && 'bg-accent-soft')}
              >
                <TeamAvatar team={TEAMS[s.teamId]} size={22} />
                <span className="w-32 truncate text-[13px] font-medium sm:w-44">{TEAMS[s.teamId].name}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
                  <div className={clsx('h-full rounded-full', s.score > W.median ? 'bg-win' : 'bg-loss/70')} style={{ width: `${(s.score / max) * 100}%` }} />
                </div>
                <span className="tnum w-12 text-right text-[13px] font-semibold">{s.score.toFixed(1)}</span>
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

  // proj / ghost / ghostMedian: week-by-week history against that target
  const targetFor = (w: number) =>
    g.key === 'proj' ? projectionFor(focus, w) : g.key === 'ghost' ? ghostScore(focus, w) : ghostMedianFor(w)
  return (
    <div>
      {intro}
      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-line text-left text-[11px] font-bold uppercase tracking-wider text-faint">
              <th className="px-3 py-2 font-bold">Week</th>
              <th className="px-3 py-2 text-right font-bold">You</th>
              <th className="px-3 py-2 text-right font-bold">{def.short}</th>
              <th className="px-3 py-2 text-right font-bold">Margin</th>
              <th className="px-3 py-2 text-right font-bold">Result</th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((w) => {
              const you = w.teams[focus].score
              const target = w.week === W.week ? g.target : targetFor(w.week)
              const win = you > target
              return (
                <tr
                  key={w.week}
                  onClick={() => onWeek(w.week)}
                  className={clsx('cursor-pointer border-b border-line/60 last:border-0 hover:bg-surface-2', w.week === W.week && 'bg-accent-soft/60')}
                >
                  <td className="px-3 py-2.5 font-medium">
                    Week {w.week}
                    {w.live && <span className="ml-1.5 text-[11px] font-semibold text-loss">LIVE</span>}
                  </td>
                  <td className="tnum px-3 py-2.5 text-right font-semibold">{you.toFixed(1)}</td>
                  <td className="tnum px-3 py-2.5 text-right text-ink-2">{target.toFixed(1)}</td>
                  <td className={clsx('tnum px-3 py-2.5 text-right font-semibold', win ? 'text-win' : 'text-loss')}>{signed(you - target)}</td>
                  <td className="px-3 py-2.5 text-right">
                    <span className={clsx('rounded-md px-1.5 py-0.5 text-[11px] font-bold', win ? 'bg-win-soft text-win' : 'bg-loss-soft text-loss')}>
                      {win ? 'W' : 'L'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[12px] text-faint">Tap a week to jump to it.</p>
    </div>
  )
}

function TopScorers({ teamId, week, lineup, onTeam }: { teamId: number; week: number; lineup: Record<string, string | null>; onTeam?: (id: number) => void }) {
  const { setOpenPlayer } = useStore()
  const pts = (id: string) => (week === CURRENT_WEEK ? playerById[id].live : playerById[id].weekly[week - 1] ?? 0)
  const top = (Object.values(lineup).filter(Boolean) as string[]).sort((a, b) => pts(b) - pts(a)).slice(0, 4)
  const t = TEAMS[teamId]
  return (
    <div className="rounded-xl border border-line bg-surface p-3">
      <button onClick={() => onTeam?.(teamId)} disabled={!onTeam} className="mb-2 flex items-center gap-2 text-left">
        <TeamAvatar team={t} size={24} />
        <span className="text-[13.5px] font-semibold">{t.name}</span>
        {onTeam && <ArrowRight className="size-3.5 text-faint" />}
      </button>
      <div className="text-[11px] font-bold uppercase tracking-wider text-faint">Top performers</div>
      {top.map((id) => (
        <button key={id} onClick={() => setOpenPlayer(id)} className="flex w-full items-center gap-2 py-1.5 text-left hover:opacity-80">
          <PlayerAvatar player={playerById[id]} size={26} />
          <span className="flex-1 truncate text-[13px] font-medium">{playerById[id].name}</span>
          <span className="tnum text-[13px] font-semibold">{pts(id).toFixed(1)}</span>
        </button>
      ))}
    </div>
  )
}

function LineupList({ lineup, week, total, title }: { lineup: Record<string, string | null>; week: number; total: number; title: string }) {
  const { setOpenPlayer } = useStore()
  const pts = (id: string) => (week === CURRENT_WEEK ? playerById[id].live : playerById[id].weekly[week - 1] ?? 0)
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-3 py-2 text-[12px] font-semibold text-muted">
        <span>{title}</span>
        <span className="tnum text-ink">{total.toFixed(1)}</span>
      </div>
      <div className="grid sm:grid-cols-2">
        {STARTER_SLOTS.map((s) => {
          const id = lineup[s.key]
          if (!id) return null
          const p = playerById[id]
          return (
            <button key={s.key} onClick={() => setOpenPlayer(id)} className="flex items-center gap-2.5 border-b border-line/60 px-3 py-2 text-left hover:bg-surface-2 sm:odd:border-r">
              <PosBadge pos={s.slot} className="w-11" />
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{p.name}</span>
              <span className="tnum text-[13px] font-semibold">{pts(id).toFixed(1)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── efficiency + awards ────────────────────────────────────────────────────
function EfficiencyCard({ T }: { T: TeamWeek }) {
  const [open, setOpen] = useState(false)
  const left = T.optimal - T.score
  return (
    <Card className="overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="block w-full p-5 text-left transition hover:bg-surface-2/50">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[13px] font-semibold text-muted">Manager efficiency · Week {T.week}</div>
            <div className="tnum mt-1 text-[40px] font-bold leading-none tracking-[-0.03em]">{pct(T.efficiency)}</div>
          </div>
          <ChevronDown className={clsx('mt-1 size-4 text-faint transition', open && 'rotate-180')} />
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-surface-3">
          <div
            className={clsx('h-full rounded-full', T.efficiency > 0.92 ? 'bg-win' : T.efficiency > 0.8 ? 'bg-warn' : 'bg-loss')}
            style={{ width: `${T.efficiency * 100}%` }}
          />
        </div>
        <div className="tnum mt-3 grid grid-cols-3 gap-2 text-[12px]">
          <div>
            <div className="text-[16px] font-bold">{T.score.toFixed(1)}</div>
            <div className="text-muted">Started</div>
          </div>
          <div>
            <div className="text-[16px] font-bold">{T.optimal.toFixed(1)}</div>
            <div className="text-muted">Best possible</div>
          </div>
          <div>
            <div className={clsx('text-[16px] font-bold', left > 0.05 ? 'text-loss' : 'text-win')}>{left.toFixed(1)}</div>
            <div className="text-muted">Left on bench</div>
          </div>
        </div>
        <div className="mt-3 text-[12.5px] font-semibold text-accent">{open ? 'Hide' : 'Show'} the lineup you should have started</div>
      </button>
      {open && (
        <div className="animate-fade-in border-t border-line bg-surface-2/40 p-4">
          <LineupList lineup={T.optimalLineup} week={T.week} total={T.optimal} title="Best possible lineup (hindsight)" />
        </div>
      )}
    </Card>
  )
}

function AwardCard({
  emoji,
  title,
  team,
  stat,
  tone,
  onClick,
}: {
  emoji: string
  title: string
  team: FantasyTeam
  stat: string
  tone: 'win' | 'loss' | 'warn'
  onClick: () => void
}) {
  return (
    <button onClick={onClick} className="group text-left">
      <Card className="flex h-full items-center gap-3 p-4 transition group-hover:border-line-strong">
        <div
          className={clsx(
            'flex size-11 shrink-0 items-center justify-center rounded-xl text-[22px]',
            tone === 'win' ? 'bg-win-soft' : tone === 'loss' ? 'bg-loss-soft' : 'bg-warn-soft',
          )}
        >
          {emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11.5px] font-bold uppercase tracking-wider text-faint">{title}</div>
          <div className="flex items-center gap-1.5">
            <TeamAvatar team={team} size={20} />
            <span className="truncate text-[14px] font-semibold">{team.name}</span>
          </div>
          <div className="truncate text-[12px] text-muted">{stat}</div>
        </div>
        <ArrowRight className="size-4 shrink-0 text-faint transition group-hover:translate-x-0.5 group-hover:text-ink" />
      </Card>
    </button>
  )
}

function EfficiencyLadder({
  items,
  focus,
  onTeam,
}: {
  items: { teamId: number; eff: number; sub: string; badge?: string }[]
  focus: number
  onTeam: (id: number) => void
}) {
  return (
    <div className="divide-y divide-line px-2 pb-4">
      {items.map((it, i) => (
        <button
          key={it.teamId}
          onClick={() => onTeam(it.teamId)}
          className={clsx('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-surface-2', it.teamId === focus && 'bg-accent-soft/60')}
        >
          <span className="tnum w-5 text-center text-[12px] font-bold text-faint">{i + 1}</span>
          <TeamAvatar team={TEAMS[it.teamId]} size={30} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13.5px] font-semibold">
              {TEAMS[it.teamId].name} {it.badge}
            </div>
            <div className="text-[12px] text-muted">{it.sub}</div>
          </div>
          <span className="tnum text-[14px] font-bold">{pct(it.eff)}</span>
        </button>
      ))}
    </div>
  )
}

// ─── season table ───────────────────────────────────────────────────────────
function SeasonTable({ rows, focus, onTeam }: { rows: SeasonRow[]; focus: number; onTeam: (id: number) => void }) {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <Card className="divide-y divide-line overflow-hidden">
      <div className="grid grid-cols-[24px_minmax(0,1fr)_64px_40px_40px_20px] items-center gap-2 bg-surface-2/60 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-faint sm:grid-cols-[24px_minmax(0,1fr)_80px_56px_56px_72px_20px]">
        <span>#</span>
        <span>Team</span>
        <span className="text-right">W-L</span>
        <span className="text-center">🏅</span>
        <span className="text-center">🖐️</span>
        <span className="hidden text-right sm:block">Eff</span>
        <span />
      </div>
      {rows.map((r, i) => {
        const t = TEAMS[r.teamId]
        const isOpen = open === r.teamId
        return (
          <div key={r.teamId} className={clsx(r.teamId === focus && 'bg-accent-soft/40')}>
            <button
              onClick={() => setOpen(isOpen ? null : r.teamId)}
              className="grid w-full grid-cols-[24px_minmax(0,1fr)_64px_40px_40px_20px] items-center gap-2 px-4 py-3 text-left transition hover:bg-surface-2/60 sm:grid-cols-[24px_minmax(0,1fr)_80px_56px_56px_72px_20px]"
            >
              <span className="tnum text-[12.5px] font-bold text-faint">{i + 1}</span>
              <span className="flex min-w-0 items-center gap-2.5">
                <TeamAvatar team={t} size={28} />
                <span className="truncate text-[13.5px] font-semibold">{t.name}</span>
              </span>
              <span className="tnum text-right text-[13.5px] font-semibold">
                {r.wins}-{r.losses}
              </span>
              <span className="tnum text-center text-[13px] font-semibold">{r.bonuses || '–'}</span>
              <span className="tnum text-center text-[13px] font-semibold">{r.spankings || '–'}</span>
              <span className="tnum hidden text-right text-[13px] text-ink-2 sm:block">{pct(r.efficiency)}</span>
              <ChevronDown className={clsx('size-4 text-faint transition', isOpen && 'rotate-180')} />
            </button>
            {isOpen && (
              <div className="animate-fade-in border-t border-line bg-surface-2/40 px-4 py-4">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <div className="mb-2 text-[11.5px] font-bold uppercase tracking-wider text-faint">Wins by game</div>
                    <div className="space-y-1.5">
                      {GAMES.map((g) => {
                        const Icon = ICONS[g.key]
                        const n = r.byGame[g.key]
                        const total = CURRENT_WEEK - 1
                        return (
                          <div key={g.key} className="flex items-center gap-2.5">
                            <Icon className="size-3.5 shrink-0 text-muted" />
                            <span className="w-36 truncate text-[12.5px] font-medium">{g.title}</span>
                            <div className="flex flex-1 gap-1">
                              {Array.from({ length: total }).map((_, k) => (
                                <span key={k} className={clsx('h-2 flex-1 rounded-full', k < n ? 'bg-win' : 'bg-surface-3')} />
                              ))}
                            </div>
                            <span className="tnum w-8 text-right text-[12.5px] font-semibold">
                              {n}/{total}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 text-[11.5px] font-bold uppercase tracking-wider text-faint">Week by week</div>
                    <div className="space-y-1">
                      {r.weeks.map((w) => (
                        <div key={w.week} className="flex items-center gap-2 text-[12.5px]">
                          <span className="w-12 font-medium text-muted">Wk {w.week}</span>
                          <div className="flex gap-1">
                            {w.games.map((g) => (
                              <span
                                key={g.key}
                                title={`${GAMES.find((d) => d.key === g.key)!.title}: ${g.you.toFixed(1)} vs ${g.target.toFixed(1)}`}
                                className={clsx('size-4 rounded', g.win ? 'bg-win' : 'bg-loss/60', w.week === CURRENT_WEEK && 'opacity-50')}
                              />
                            ))}
                          </div>
                          <span className="tnum ml-1 font-semibold">{w.wins}–{6 - w.wins}</span>
                          <span>{w.bonus ? '🏅' : w.spanked ? '🖐️' : ''}</span>
                          {w.week === CURRENT_WEEK && <span className="text-[11px] font-semibold text-loss">LIVE</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <button onClick={() => onTeam(r.teamId)} className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-accent">
                  View {t.name}'s Gauntlet <ArrowRight className="size-3.5" />
                </button>
              </div>
            )}
          </div>
        )
      })}
    </Card>
  )
}

// ─── rules ──────────────────────────────────────────────────────────────────
function Rules() {
  return (
    <div className="space-y-5 px-5 pb-6 pt-1 text-[14px] leading-relaxed">
      <div>
        <div className="mb-2 text-[12px] font-bold uppercase tracking-wider text-faint">Every week, six games</div>
        <ol className="space-y-2.5">
          {GAMES.map((g, i) => {
            const Icon = ICONS[g.key]
            return (
              <li key={g.key} className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                  <Icon className="size-4" />
                </span>
                <div>
                  <div className="font-semibold">
                    {i + 1}. {g.title}
                  </div>
                  <div className="text-[13px] text-muted">{g.blurb}</div>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
      <div className="space-y-2.5 rounded-2xl bg-surface-2 p-4">
        <p>
          <span className="font-semibold">🏅 Bonus win.</span>{' '}
          <span className="text-ink-2">The most efficiently managed team each week gets a 7th win. Efficiency is points started ÷ best possible lineup from your roster.</span>
        </p>
        <p>
          <span className="font-semibold">🖐️ Spanking.</span>{' '}
          <span className="text-ink-2">The least efficient team each week gets a spanking. It's not a loss. It's worse.</span>
        </p>
        <p>
          <span className="font-semibold">🪣 The Bucket.</span>{' '}
          <span className="text-ink-2">The least efficient manager over the full {SEASON} season has a bucket of piss dropped on them. No appeals.</span>
        </p>
      </div>
    </div>
  )
}
