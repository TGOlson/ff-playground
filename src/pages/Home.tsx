import clsx from 'clsx'
import { ArrowLeftRight, ArrowRight, ChevronRight, CircleCheck, Gavel, Megaphone, Sparkles, TriangleAlert, UserPlus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Rise } from '../components/Layout'
import { Card, LiveDot, PosBadge, SectionTitle, TeamAvatar, WinProbBar } from '../components/ui'
import {
  ACTIVITY, CURRENT_WEEK, MY_TEAM_ID, TEAMS, currentMatchups, inProgress, opponentOf, playerById, standings,
  teamLive, teamProjected, winProb, yetToPlay, type Activity,
} from '../data/mock'
import { useStore } from '../lib/store'

export function Home() {
  const { lineup } = useStore()
  const me = TEAMS[MY_TEAM_ID]
  const opp = TEAMS[opponentOf(MY_TEAM_ID)]
  const myLive = teamLive(lineup)
  const oppLive = teamLive(opp.lineup)
  const myProj = teamProjected(lineup)
  const oppProj = teamProjected(opp.lineup)
  const remaining = yetToPlay(lineup) + inProgress(lineup)
  const wp = winProb(myProj, oppProj, remaining)

  const issues = Object.values(lineup)
    .filter(Boolean)
    .map((id) => playerById[id!])
    .filter((p) => p.status !== 'OK' || p.game === 'bye')
  const emptySlots = Object.values(lineup).filter((v) => !v).length

  return (
    <div className="space-y-8">
      <Rise>
        <div className="mb-1 flex items-center gap-2 text-[13px] font-semibold text-muted">
          <LiveDot /> Week {CURRENT_WEEK} is live
        </div>
        <h1 className="text-[28px] font-bold leading-tight tracking-[-0.025em] lg:text-[34px]">
          {wp >= 0.5 ? "You're on track, " : 'Comeback time, '}
          <span className="text-accent">{me.name}</span>
        </h1>
      </Rise>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
        <div className="space-y-6">
          {/* hero matchup */}
          <Rise delay={60}>
            <Link to="/matchup" className="group block">
              <Card className="overflow-hidden transition group-hover:shadow-pop">
                <div className="flex items-center justify-between border-b border-line px-5 py-3 text-[12.5px] font-semibold text-muted">
                  <span>Your matchup</span>
                  <span className="flex items-center gap-1 text-accent">
                    Details <ChevronRight className="size-4 transition group-hover:translate-x-0.5" />
                  </span>
                </div>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-5 pb-4 pt-6 sm:gap-6 sm:px-8">
                  <ScoreSide team={me} live={myLive} proj={myProj} winning={myLive >= oppLive} />
                  <div className="flex flex-col items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-faint">vs</div>
                  <ScoreSide team={opp} live={oppLive} proj={oppProj} winning={oppLive > myLive} right />
                </div>
                <div className="px-5 pb-5 sm:px-8">
                  <div className="mb-2 flex justify-between text-[12px] font-semibold">
                    <span className="tnum" style={{ color: `hsl(${me.hue} 65% 48%)` }}>
                      {Math.round(wp * 100)}% win
                    </span>
                    <span className="text-muted">
                      {inProgress(lineup)} playing · {yetToPlay(lineup)} yet to play
                    </span>
                    <span className="tnum" style={{ color: `hsl(${opp.hue} 65% 48%)` }}>
                      {Math.round((1 - wp) * 100)}%
                    </span>
                  </div>
                  <WinProbBar pct={wp} leftHue={me.hue} rightHue={opp.hue} />
                </div>
              </Card>
            </Link>
          </Rise>

          {/* to-dos */}
          <Rise delay={120}>
            <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 [&>a]:min-w-[250px] [&>a]:snap-start sm:[&>a]:min-w-0">
              <ActionTile
                to="/team"
                tone={issues.length || emptySlots ? 'warn' : 'ok'}
                icon={issues.length || emptySlots ? <TriangleAlert className="size-[18px]" /> : <CircleCheck className="size-[18px]" />}
                title={issues.length || emptySlots ? `${issues.length + emptySlots} lineup alert${issues.length + emptySlots > 1 ? 's' : ''}` : 'Lineup set'}
                sub={issues.length ? `${issues[0].name} is ${issues[0].status === 'OK' ? 'on bye' : issues[0].status === 'Q' ? 'questionable' : 'out'}` : emptySlots ? 'Empty starting slot' : 'All starters active'}
              />
              <ActionTile
                to="/players"
                icon={<UserPlus className="size-[18px]" />}
                title="Waivers"
                sub={`$${me.faab} FAAB · priority #${me.waiverPriority}`}
              />
              <ActionTile
                to="/players"
                icon={<Sparkles className="size-[18px]" />}
                title="Trending adds"
                sub="3 breakout players on waivers"
              />
            </div>
          </Rise>

          {/* scoreboard */}
          <Rise delay={180}>
            <SectionTitle
              title="Scoreboard"
              sub={`Week ${CURRENT_WEEK}`}
              action={
                <Link to="/matchup" className="text-[13px] font-semibold text-accent">
                  All matchups
                </Link>
              }
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {currentMatchups()
                .filter(([a, b]) => a !== MY_TEAM_ID && b !== MY_TEAM_ID)
                .map(([a, b]) => (
                  <MiniMatchup key={a} a={a} b={b} />
                ))}
            </div>
          </Rise>
        </div>

        {/* right column */}
        <div className="space-y-6">
          <Rise delay={140}>
            <SectionTitle
              title="Standings"
              action={
                <Link to="/league" className="text-[13px] font-semibold text-accent">
                  Full table
                </Link>
              }
            />
            <Card className="divide-y divide-line">
              {standings()
                .slice(0, 6)
                .map((t, i) => (
                  <Link
                    to="/league"
                    key={t.id}
                    className={clsx('flex items-center gap-3 px-4 py-2.5 transition hover:bg-surface-2', t.id === MY_TEAM_ID && 'bg-accent-soft/60')}
                  >
                    <span className="tnum w-4 text-center text-[13px] font-bold text-faint">{i + 1}</span>
                    <TeamAvatar team={t} size={28} />
                    <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold">{t.name}</span>
                    <span className="tnum text-[13px] font-semibold text-ink-2">
                      {t.wins}-{t.losses}
                    </span>
                  </Link>
                ))}
            </Card>
          </Rise>

          <Rise delay={200}>
            <SectionTitle title="League activity" />
            <Card className="divide-y divide-line">
              {ACTIVITY.map((a) => (
                <ActivityItem key={a.id} a={a} />
              ))}
            </Card>
          </Rise>
        </div>
      </div>
    </div>
  )
}

function ScoreSide({
  team,
  live,
  proj,
  winning,
  right,
}: {
  team: (typeof TEAMS)[number]
  live: number
  proj: number
  winning: boolean
  right?: boolean
}) {
  return (
    <div className={clsx('flex min-w-0 flex-col gap-3', right ? 'items-end text-right' : 'items-start')}>
      <div className={clsx('flex min-w-0 max-w-full flex-col gap-2 sm:flex-row sm:items-center sm:gap-2.5', right ? 'items-end sm:flex-row-reverse' : 'items-start')}>
        <TeamAvatar team={team} size={40} />
        <div className="min-w-0 max-w-full">
          <div className="truncate text-[14px] font-semibold leading-tight">{team.name}</div>
          <div className="text-[12px] text-muted">
            {team.wins}-{team.losses} · {team.manager}
          </div>
        </div>
      </div>
      <div>
        <div className={clsx('tnum text-[44px] font-bold leading-none tracking-[-0.04em] sm:text-[56px]', !winning && 'text-ink/45')}>
          {live.toFixed(1)}
        </div>
        <div className="tnum mt-1.5 text-[12.5px] font-medium text-muted">Proj {proj.toFixed(1)}</div>
      </div>
    </div>
  )
}

function ActionTile({
  to,
  icon,
  title,
  sub,
  tone,
}: {
  to: string
  icon: React.ReactNode
  title: string
  sub: string
  tone?: 'warn' | 'ok'
}) {
  return (
    <Link to={to} className="group">
      <Card className="flex h-full items-center gap-3 p-4 transition group-hover:border-line-strong">
        <div
          className={clsx(
            'flex size-10 shrink-0 items-center justify-center rounded-xl',
            tone === 'warn' ? 'bg-warn-soft text-warn' : tone === 'ok' ? 'bg-win-soft text-win' : 'bg-accent-soft text-accent',
          )}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold">{title}</div>
          <div className="truncate text-[12.5px] text-muted">{sub}</div>
        </div>
        <ArrowRight className="size-4 shrink-0 text-faint transition group-hover:translate-x-0.5 group-hover:text-ink" />
      </Card>
    </Link>
  )
}

function MiniMatchup({ a, b }: { a: number; b: number }) {
  const A = TEAMS[a]
  const B = TEAMS[b]
  const la = teamLive(A.lineup)
  const lb = teamLive(B.lineup)
  const pa = teamProjected(A.lineup)
  const pb = teamProjected(B.lineup)
  const wp = winProb(pa, pb, yetToPlay(A.lineup) + inProgress(A.lineup))
  return (
    <Link to={`/matchup/${a}`}>
      <Card className="p-4 transition hover:border-line-strong">
        {[
          { t: A, l: la, p: pa, lead: la >= lb },
          { t: B, l: lb, p: pb, lead: lb > la },
        ].map(({ t, l, p, lead }) => (
          <div key={t.id} className="flex items-center gap-3 py-1">
            <TeamAvatar team={t} size={28} />
            <div className="min-w-0 flex-1">
              <div className={clsx('truncate text-[13.5px]', lead ? 'font-semibold' : 'font-medium text-ink-2')}>{t.name}</div>
            </div>
            <span className="tnum text-[11.5px] text-faint">{p.toFixed(1)}</span>
            <span className={clsx('tnum w-12 text-right text-[16px] font-bold', !lead && 'text-ink/45')}>{l.toFixed(1)}</span>
          </div>
        ))}
        <div className="mt-2.5">
          <WinProbBar pct={wp} leftHue={A.hue} rightHue={B.hue} />
        </div>
      </Card>
    </Link>
  )
}

function ActivityItem({ a }: { a: Activity }) {
  const { setOpenPlayer } = useStore()
  const t = TEAMS[a.teamId]
  const icon =
    a.kind === 'trade' ? <ArrowLeftRight className="size-3.5" /> : a.kind === 'commish' ? <Megaphone className="size-3.5" /> : a.kind === 'waiver' ? <Gavel className="size-3.5" /> : <UserPlus className="size-3.5" />
  const title =
    a.kind === 'trade'
      ? `${t.name} ⇄ ${TEAMS[a.otherTeamId!].name}`
      : a.kind === 'commish'
        ? 'Commissioner note'
        : a.kind === 'waiver'
          ? `${t.name} won a claim${a.bid ? ` · $${a.bid}` : ''}`
          : `${t.name} added a free agent`
  return (
    <div className="flex gap-3 px-4 py-3.5">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-2 text-ink-2">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <div className="truncate text-[13px] font-semibold">{title}</div>
          <div className="shrink-0 text-[11.5px] text-faint">{a.ago}</div>
        </div>
        {a.note && <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{a.note}</p>}
        {a.players.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {a.players.map(({ id, dir }) => {
              const p = playerById[id]
              return (
                <button
                  key={id}
                  onClick={() => setOpenPlayer(id)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-surface-2 py-0.5 pl-1 pr-2 text-[12px] font-medium hover:bg-surface-3"
                >
                  <span className={clsx('font-bold', dir === 'in' ? 'text-win' : 'text-loss')}>{dir === 'in' ? '+' : '−'}</span>
                  <PosBadge pos={p.pos} className="h-[18px] min-w-0 px-1 text-[9.5px]" />
                  {p.name}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
