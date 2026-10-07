// "The Gauntlet": six games a week, plus weekly bonus wins and spankings for
// the most / least efficiently managed teams, and the season-long Bucket.
import {
  CURRENT_WEEK, PLAYERS, SEASON, STARTER_SLOTS, TEAMS, bestLineup, isRostered, opponentOf, playerById, projSum, teamLive,
  type Player,
} from './mock'

export type GameKey = 'h2h' | 'median' | 'proj' | 'ghost' | 'ghostMedian' | 'waiver'

export interface GameDef {
  key: GameKey
  title: string
  short: string
  blurb: string
}

export const GAMES: GameDef[] = [
  { key: 'h2h', title: 'Head-to-head', short: 'H2H', blurb: 'Your scheduled opponent. The classic.' },
  { key: 'median', title: 'League median', short: 'MED', blurb: 'Beat the middle score of all 12 teams this week.' },
  { key: 'proj', title: 'Your projection', short: 'PROJ', blurb: 'Outscore what the projections said your starters would do.' },
  { key: 'ghost', title: `Ghost of ${SEASON - 1}`, short: 'GHOST', blurb: `Your own team from this same week last season.` },
  { key: 'ghostMedian', title: `${SEASON - 1} median`, short: 'LY MED', blurb: `The league median from this same week last season.` },
  { key: 'waiver', title: 'Waiver Wire All-Stars', short: 'WW', blurb: 'The best possible lineup built only from free agents, in hindsight.' },
]

export interface GameResult {
  key: GameKey
  you: number
  target: number
  win: boolean
  label: string // who/what you played
}

export interface TeamWeek {
  teamId: number
  week: number
  score: number
  optimal: number
  efficiency: number // score / optimal
  optimalLineup: Record<string, string | null>
  games: GameResult[]
  wins: number
  bonus: boolean
  spanked: boolean
}

export interface WeekSummary {
  week: number
  live: boolean
  median: number
  ghostMedian: number
  waiverScore: number
  waiverLineup: Record<string, string | null>
  scores: { teamId: number; score: number }[]
  teams: TeamWeek[]
}

// deterministic hash → [0, 1)
const h = (...n: number[]) => {
  let x = 2166136261
  for (const v of n) x = Math.imul(x ^ (v + 0x9e3779b9), 16777619)
  x ^= x >>> 13
  x = Math.imul(x, 0x5bd1e995)
  return ((x ^ (x >>> 15)) >>> 0) / 4294967296
}
const r1 = (n: number) => Math.round(n * 10) / 10

const ptsFor = (p: Player, week: number) => (week === CURRENT_WEEK ? p.live : p.weekly[week - 1] ?? 0)
const lineupPts = (l: Record<string, string | null>, week: number) =>
  r1(Object.values(l).reduce((a, id) => a + (id ? ptsFor(playerById[id], week) : 0), 0))

const rosterOf = (teamId: number) => {
  const t = TEAMS[teamId]
  return [...(Object.values(t.lineup).filter(Boolean) as string[]), ...t.bench].map((id) => playerById[id])
}

export const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  const m = s.length / 2
  return r1(s.length % 2 ? s[Math.floor(m)] : (s[m - 1] + s[m]) / 2)
}

/** Last season's numbers (made up, but stable). */
export const ghostScore = (teamId: number, week: number) => r1(92 + h(teamId, week, 7) * 68)
export const ghostMedianFor = (week: number) => r1(112 + h(week, 99) * 22)

export function projectionFor(teamId: number, week: number, liveLineup?: Record<string, string | null>) {
  if (week === CURRENT_WEEK) return projSum(liveLineup ?? TEAMS[teamId].lineup)
  const t = TEAMS[teamId]
  const avg = t.pf / t.history.length
  return r1(avg * (0.9 + h(teamId, week, 3) * 0.2))
}

export function buildWeek(week: number, myLineup?: Record<string, string | null>, myId = 0): WeekSummary {
  const live = week === CURRENT_WEEK
  const scores = TEAMS.map((t) => {
    if (!live) return { teamId: t.id, score: t.history.find((x) => x.week === week)!.pf }
    return { teamId: t.id, score: teamLive(t.id === myId && myLineup ? myLineup : t.lineup) }
  })
  const scoreOf = (id: number) => scores[id].score
  const med = median(scores.map((s) => s.score))
  const ghostMedian = ghostMedianFor(week)

  const freeAgents = PLAYERS.filter((p) => !isRostered(p.id))
  const waiverLineup = bestLineup(freeAgents, (p) => ptsFor(p, week)).lineup
  const waiverScore = lineupPts(waiverLineup, week)

  const teams: TeamWeek[] = TEAMS.map((t) => {
    const score = scoreOf(t.id)
    const opt = bestLineup(rosterOf(t.id), (p) => ptsFor(p, week)).lineup
    const optimal = Math.max(score, lineupPts(opt, week))
    const oppId = live ? opponentOf(t.id) : t.history.find((x) => x.week === week)!.opp
    const proj = projectionFor(t.id, week, t.id === myId ? myLineup : undefined)
    const ghost = ghostScore(t.id, week)
    const games: GameResult[] = [
      { key: 'h2h', you: score, target: scoreOf(oppId), win: score > scoreOf(oppId), label: TEAMS[oppId].name },
      { key: 'median', you: score, target: med, win: score > med, label: 'Middle of all 12 scores' },
      { key: 'proj', you: score, target: proj, win: score > proj, label: "Starters' pre-game projection" },
      { key: 'ghost', you: score, target: ghost, win: score > ghost, label: `${SEASON - 1} ${t.name}` },
      { key: 'ghostMedian', you: score, target: ghostMedian, win: score > ghostMedian, label: `League median, Week ${week} ${SEASON - 1}` },
      { key: 'waiver', you: score, target: waiverScore, win: score > waiverScore, label: 'Best free-agent lineup, in hindsight' },
    ]
    return {
      teamId: t.id,
      week,
      score,
      optimal,
      efficiency: optimal ? score / optimal : 1,
      optimalLineup: opt,
      games,
      wins: games.filter((g) => g.win).length,
      bonus: false,
      spanked: false,
    }
  })
  const byEff = [...teams].sort((a, b) => b.efficiency - a.efficiency || b.score - a.score)
  byEff[0].bonus = true
  byEff[byEff.length - 1].spanked = true

  return { week, live, median: med, ghostMedian, waiverScore, waiverLineup, scores, teams }
}

export interface SeasonRow {
  teamId: number
  wins: number
  losses: number
  bonuses: number
  spankings: number
  efficiency: number // average across completed weeks
  byGame: Record<GameKey, number> // wins per game type
  weeks: TeamWeek[]
}

export function buildSeason(weeks: WeekSummary[]): SeasonRow[] {
  const done = weeks.filter((w) => !w.live)
  return TEAMS.map((t) => {
    const tw = done.map((w) => w.teams[t.id])
    const byGame = Object.fromEntries(GAMES.map((g) => [g.key, 0])) as Record<GameKey, number>
    tw.forEach((w) => w.games.forEach((g) => g.win && byGame[g.key]++))
    const wins = tw.reduce((a, w) => a + w.wins + (w.bonus ? 1 : 0), 0)
    return {
      teamId: t.id,
      wins,
      losses: tw.length * 6 - tw.reduce((a, w) => a + w.wins, 0),
      bonuses: tw.filter((w) => w.bonus).length,
      spankings: tw.filter((w) => w.spanked).length,
      efficiency: tw.reduce((a, w) => a + w.efficiency, 0) / Math.max(1, tw.length),
      byGame,
      weeks: weeks.map((w) => w.teams[t.id]),
    }
  }).sort((a, b) => b.wins - a.wins || b.efficiency - a.efficiency)
}

export { STARTER_SLOTS }
