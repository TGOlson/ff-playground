import clsx from 'clsx'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Rise } from '../components/Layout'
import { GameLine } from '../components/PlayerRow'
import { Card, LiveDot, PlayerAvatar, PosBadge, StatusBadge, TeamAvatar, WinProbBar } from '../components/ui'
import {
  CURRENT_WEEK, MY_TEAM_ID, STARTER_SLOTS, TEAMS, currentMatchups, inProgress, playerById, teamLive,
  teamProjected, winProb, yetToPlay, type FantasyTeam, type Player,
} from '../data/mock'
import { useStore } from '../lib/store'

export function Matchup() {
  const params = useParams()
  const store = useStore()
  const focus = params.teamId ? Number(params.teamId) : MY_TEAM_ID
  const pair = currentMatchups().find(([a, b]) => a === focus || b === focus)!
  // keep the focused team on the left
  const [aId, bId] = pair[0] === focus ? pair : [pair[1], pair[0]]
  const A = TEAMS[aId]
  const B = TEAMS[bId]
  const lineupOf = (t: FantasyTeam) => (t.id === MY_TEAM_ID ? store.lineup : t.lineup)
  const benchOf = (t: FantasyTeam) => (t.id === MY_TEAM_ID ? store.bench : t.bench)
  const la = lineupOf(A)
  const lb = lineupOf(B)
  const sA = teamLive(la)
  const sB = teamLive(lb)
  const pA = teamProjected(la)
  const pB = teamProjected(lb)
  const wp = winProb(pA, pB, yetToPlay(la) + inProgress(la))
  const [showBench, setShowBench] = useState(false)

  return (
    <div className="space-y-5">
      {/* matchup switcher */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
        {currentMatchups().map(([a, b]) => {
          const active = a === aId || b === aId
          return (
            <Link
              key={a}
              to={`/matchup/${a === MY_TEAM_ID || b === MY_TEAM_ID ? MY_TEAM_ID : a}`}
              className={clsx(
                'flex shrink-0 items-center gap-1.5 rounded-md border py-1 pl-1 pr-3 text-[12.5px] font-semibold transition',
                active ? 'border-ink bg-ink text-surface' : 'border-line bg-surface text-ink-2 hover:border-line-strong',
              )}
            >
              <div className="flex -space-x-1.5">
                <TeamAvatar team={TEAMS[a]} size={22} className="ring-2 ring-surface" />
                <TeamAvatar team={TEAMS[b]} size={22} className="ring-2 ring-surface" />
              </div>
              {TEAMS[a].abbr} v {TEAMS[b].abbr}
            </Link>
          )
        })}
      </div>

      {/* scoreboard */}
      <Rise>
        <Card className="overflow-hidden">
          <div className="flex items-center justify-center gap-2 border-b border-line py-2.5 text-[12px] font-semibold text-muted">
            <LiveDot /> Week {CURRENT_WEEK} · Live
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-5 sm:px-8">
            <Side t={A} score={sA} proj={pA} lead={sA >= sB} />
            <div className="text-[11px] font-bold uppercase tracking-widest text-faint">vs</div>
            <Side t={B} score={sB} proj={pB} lead={sB > sA} right />
          </div>
          <div className="px-4 pb-5 sm:px-8">
            <div className="tnum mb-2 flex justify-between text-[12px] font-semibold">
              <span style={{ color: `hsl(${A.hue} 65% 48%)` }}>{Math.round(wp * 100)}%</span>
              <span className="text-muted">Win probability</span>
              <span style={{ color: `hsl(${B.hue} 65% 48%)` }}>{Math.round((1 - wp) * 100)}%</span>
            </div>
            <WinProbBar pct={wp} leftHue={A.hue} rightHue={B.hue} />
          </div>
        </Card>
      </Rise>

      {/* starters */}
      <Rise delay={80}>
        <Card className="overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_1fr] border-b border-line bg-surface-2/60 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-faint sm:px-5">
            <span>{A.abbr}</span>
            <span>Starters</span>
            <span className="text-right">{B.abbr}</span>
          </div>
          <div className="divide-y divide-line">
            {STARTER_SLOTS.map((s) => (
              <Row
                key={s.key}
                slot={s.slot}
                a={la[s.key] ? playerById[la[s.key]!] : undefined}
                b={lb[s.key] ? playerById[lb[s.key]!] : undefined}
              />
            ))}
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center border-t border-line bg-surface-2/60 px-3 py-3 sm:px-5">
            <span className="tnum text-[15px] font-bold">{sA.toFixed(1)}</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-faint">Total</span>
            <span className="tnum text-right text-[15px] font-bold">{sB.toFixed(1)}</span>
          </div>
        </Card>
      </Rise>

      {/* bench */}
      <Rise delay={140}>
        <button
          onClick={() => setShowBench((v) => !v)}
          className="flex w-full items-center justify-between rounded-2xl border border-line bg-surface px-5 py-3.5 text-[14px] font-semibold shadow-card"
        >
          Bench
          <ChevronDown className={clsx('size-4 text-muted transition', showBench && 'rotate-180')} />
        </button>
        {showBench && (
          <Card className="mt-2 divide-y divide-line overflow-hidden">
            {Array.from({ length: Math.max(benchOf(A).length, benchOf(B).length) }).map((_, i) => (
              <Row
                key={i}
                slot="BN"
                a={benchOf(A)[i] ? playerById[benchOf(A)[i]] : undefined}
                b={benchOf(B)[i] ? playerById[benchOf(B)[i]] : undefined}
                muted
              />
            ))}
          </Card>
        )}
      </Rise>
    </div>
  )
}

function Side({ t, score, proj, lead, right }: { t: FantasyTeam; score: number; proj: number; lead: boolean; right?: boolean }) {
  return (
    <div className={clsx('flex min-w-0 flex-col gap-2', right ? 'items-end text-right' : 'items-start')}>
      <div className={clsx('flex min-w-0 max-w-full flex-col gap-2 sm:flex-row sm:items-center sm:gap-2.5', right ? 'items-end sm:flex-row-reverse' : 'items-start')}>
        <TeamAvatar team={t} size={44} />
        <div className="min-w-0 max-w-full">
          <div className="truncate text-[14px] font-semibold leading-tight sm:text-[15px]">{t.name}</div>
          <div className="text-[12px] text-muted">
            {t.wins}-{t.losses} · {t.manager}
          </div>
        </div>
      </div>
      <div className={clsx('tnum text-[40px] font-bold leading-none tracking-[-0.04em] sm:text-[52px]', !lead && 'text-ink/45')}>
        {score.toFixed(1)}
      </div>
      <div className="tnum text-[12.5px] font-medium text-muted">Proj {proj.toFixed(1)}</div>
    </div>
  )
}

function Row({ slot, a, b, muted }: { slot: string; a?: Player; b?: Player; muted?: boolean }) {
  const aWin = (a?.live ?? 0) > (b?.live ?? 0)
  const bWin = (b?.live ?? 0) > (a?.live ?? 0)
  return (
    <div className={clsx('grid grid-cols-[1fr_auto_auto_auto_1fr] items-center gap-2 px-3 py-3 sm:gap-4 sm:px-5', muted && 'opacity-80')}>
      <PlayerCell p={a} />
      <Pts p={a} win={aWin} />
      <PosBadge pos={slot} className="w-11" />
      <Pts p={b} win={bWin} />
      <PlayerCell p={b} right />
    </div>
  )
}

function Pts({ p, win }: { p?: Player; win: boolean }) {
  if (!p) return <span className="w-11 text-center text-faint">—</span>
  return (
    <div className="w-11 text-center">
      <div className={clsx('tnum text-[15px] font-bold leading-tight', win ? 'text-ink' : 'text-ink/55', p.game === 'upcoming' && 'text-ink/30')}>
        {p.live.toFixed(1)}
      </div>
      <div className="tnum text-[10.5px] text-faint">{p.proj.toFixed(1)}</div>
    </div>
  )
}

function PlayerCell({ p, right }: { p?: Player; right?: boolean }) {
  const { setOpenPlayer } = useStore()
  if (!p) return <div className={clsx('text-[13px] font-medium text-faint', right && 'text-right')}>Empty</div>
  return (
    <button
      onClick={() => setOpenPlayer(p.id)}
      className={clsx('flex min-w-0 items-center gap-2.5', right ? 'flex-row-reverse text-right' : 'text-left')}
    >
      <span className="hidden sm:block">
        <PlayerAvatar player={p} size={36} />
      </span>
      <div className="min-w-0">
        <div className={clsx('flex items-center gap-1', right && 'flex-row-reverse')}>
          <span className="truncate text-[13.5px] font-semibold hover:underline">
            <span className="sm:hidden">{p.pos === 'DEF' ? p.team : `${p.first[0]}. ${p.last}`}</span>
            <span className="hidden sm:inline">{p.name}</span>
          </span>
          <StatusBadge status={p.status} />
        </div>
        <div className="truncate text-[11.5px] text-muted">
          <span className="sm:hidden">{p.game === 'bye' ? 'BYE' : p.gameClock}</span>
          <span className="hidden sm:inline">
            <GameLine p={p} />
          </span>
        </div>
      </div>
    </button>
  )
}
