// Mocked results for the three simulation flows. Nothing here actually
// simulates; numbers are derived from real Gauntlet results with simple
// formulas so they look coherent across screens.
import { GAMES, type GameKey, type SeasonRow, type WeekSummary } from './gauntlet'
import { CURRENT_WEEK, STARTER_SLOTS, TEAMS, avgPts, playerById } from './mock'

export const SEASON_WEEKS = 17
export const WEEK_RUNS = 2000
export const SEASON_RUNS = 500

const h = (...n: number[]) => {
  let x = 2166136261
  for (const v of n) x = Math.imul(x ^ (v + 0x9e3779b9), 16777619)
  x ^= x >>> 13
  x = Math.imul(x, 0x5bd1e995)
  return ((x ^ (x >>> 15)) >>> 0) / 4294967296
}
const r1 = (n: number) => Math.round(n * 10) / 10
const logistic = (x: number) => 1 / (1 + Math.exp(-x))

// ─── sim-off ────────────────────────────────────────────────────────────────
export interface SimOffReveal {
  side: 0 | 1
  slot: string
  playerId: string
  pts: number
}
export interface SimOff {
  week: number
  teams: [number, number]
  records: [number, number]
  reveals: SimOffReveal[]
  totals: [number, number]
  winner: number
  preview: boolean
}

/** Top two teams by Gauntlet record that week (points break ties). */
export function simOffPair(W: WeekSummary): [number, number] {
  const top = [...W.teams].sort((a, b) => b.wins - a.wins || b.score - a.score)
  return [top[0].teamId, top[1].teamId]
}

/** A replay of the week for the top two teams. `salt` varies preview runs. */
export function mockSimOff(W: WeekSummary, salt = 0): SimOff {
  const [a, b] = simOffPair(W)
  const reveals: SimOffReveal[] = []
  const totals: [number, number] = [0, 0]
  STARTER_SLOTS.forEach((s, si) => {
    ;[a, b].forEach((tid, side) => {
      const id = TEAMS[tid].lineup[s.key]
      if (!id) return
      const p = playerById[id]
      const base = W.live ? avgPts(p) : p.weekly[W.week - 1] ?? avgPts(p)
      const pts = r1(Math.max(0, base * (0.6 + h(W.week, tid, si, salt) * 0.8)))
      totals[side] += pts
      reveals.push({ side: side as 0 | 1, slot: s.slot, playerId: id, pts })
    })
  })
  totals[0] = r1(totals[0])
  totals[1] = r1(totals[1])
  return {
    week: W.week,
    teams: [a, b],
    records: [W.teams[a].wins, W.teams[b].wins],
    reveals,
    totals,
    winner: totals[0] >= totals[1] ? a : b,
    preview: W.live,
  }
}

export const officialSimOffs = (weeks: WeekSummary[]) => weeks.filter((w) => !w.live).map((w) => mockSimOff(w))

// ─── sim week ───────────────────────────────────────────────────────────────
export interface WeekSim {
  hist: number[] // P(wins = 0..6)
  expWins: number
  gameP: Record<GameKey, number>
  pBonus: number
  pSpank: number
  pTop: number
  p10: number
  p90: number
}

export function mockWeekSim(W: WeekSummary, teamId: number, salt = 0): WeekSim {
  const T = W.teams[teamId]
  const jitter = (k: number) => (h(W.week, teamId, k, salt) - 0.5) * 0.06
  // each game's win odds come from the actual margin, softened
  const gameP = Object.fromEntries(
    T.games.map((g, i) => [g.key, Math.min(0.98, Math.max(0.02, logistic((g.you - g.target) / 14) + jitter(i)))]),
  ) as Record<GameKey, number>
  // distribution of total wins: sum of independent games (exact convolution)
  let hist = [1]
  GAMES.forEach((g) => {
    const p = gameP[g.key]
    const next = new Array(hist.length + 1).fill(0)
    hist.forEach((v, k) => {
      next[k] += v * (1 - p)
      next[k + 1] += v * p
    })
    hist = next
  })
  const effRank = [...W.teams].sort((a, b) => b.efficiency - a.efficiency).findIndex((t) => t.teamId === teamId)
  const recRank = [...W.teams].sort((a, b) => b.wins - a.wins || b.score - a.score).findIndex((t) => t.teamId === teamId)
  return {
    hist,
    expWins: hist.reduce((a, p, k) => a + p * k, 0),
    gameP,
    pBonus: Math.max(0.01, 0.42 * Math.exp(-effRank * 0.55) + jitter(7)),
    pSpank: Math.max(0.01, 0.42 * Math.exp(-(11 - effRank) * 0.55) + jitter(8)),
    pTop: Math.max(0.01, 0.38 * Math.exp(-recRank * 0.5) + jitter(9)),
    p10: r1(T.score * 0.8),
    p90: r1(T.score * 1.17),
  }
}

// ─── sim season ─────────────────────────────────────────────────────────────
export interface SeasonSimRow {
  teamId: number
  current: number
  expWins: number
  p10: number
  p90: number
  pFirst: number
  pBucket: number
}

export function mockSeasonSim(rows: SeasonRow[], weeksDone: number, salt = 0): SeasonSimRow[] {
  const remaining = SEASON_WEEKS - weeksDone
  const proj = rows.map((r) => {
    const pace = r.wins / weeksDone
    const regress = pace * 0.7 + 3.6 * 0.3 // pull toward an average 3.6 W/week
    const exp = r.wins + regress * remaining * (0.96 + h(r.teamId, salt) * 0.08)
    return { r, exp, spread: 7 + h(r.teamId, 2, salt) * 5 }
  })
  const softmax = (xs: number[], t: number) => {
    const m = Math.max(...xs)
    const e = xs.map((x) => Math.exp((x - m) / t))
    const s = e.reduce((a, b) => a + b, 0)
    return e.map((x) => x / s)
  }
  const pFirst = softmax(proj.map((p) => p.exp), 4)
  const pBucket = softmax(rows.map((r) => -r.efficiency * 100), 1.6)
  return proj
    .map((p, i) => ({
      teamId: p.r.teamId,
      current: p.r.wins,
      expWins: r1(p.exp),
      p10: Math.round(p.exp - p.spread),
      p90: Math.round(p.exp + p.spread),
      pFirst: pFirst[i],
      pBucket: pBucket[i],
    }))
    .sort((a, b) => b.expWins - a.expWins)
}

export const isLiveWeek = (w: number) => w === CURRENT_WEEK
