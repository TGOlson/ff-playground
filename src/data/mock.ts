// Deterministic mock league. Everything is generated from a seed so the
// prototype looks the same on every load.

export type Pos = 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DEF'
export type Slot = 'QB' | 'RB' | 'WR' | 'TE' | 'FLEX' | 'K' | 'DEF' | 'BN' | 'IR'
export type InjuryStatus = 'OK' | 'Q' | 'D' | 'O' | 'IR'
export type GameState = 'final' | 'live' | 'upcoming' | 'bye'

export interface NflTeam {
  abbr: string
  city: string
  name: string
  bye: number
}

export interface SeasonStats {
  passYds: number
  passTd: number
  int: number
  rushAtt: number
  rushYds: number
  rushTd: number
  tgt: number
  rec: number
  recYds: number
  recTd: number
  fgm: number
  fga: number
  xpm: number
  sacks: number
  defInt: number
  ptsAllowed: number
}

export interface Player {
  id: string
  name: string
  first: string
  last: string
  pos: Pos
  team: string
  number: number
  age: number
  exp: number
  status: InjuryStatus
  posRank: number
  weekly: (number | null)[] // weeks 1..CURRENT_WEEK-1 (null = bye)
  proj: number // projection for the current week
  live: number // points so far in the current week
  game: GameState
  gameClock: string
  opp: string
  home: boolean
  oppRankVsPos: number // 1 = toughest, 32 = easiest
  rostered: number // %
  started: number // %
  trend: number // net adds over last 24h
  adp: number
  stats: SeasonStats
  news: string
  newsAgo: string
}

export interface FantasyTeam {
  id: number
  name: string
  abbr: string
  manager: string
  hue: number
  wins: number
  losses: number
  ties: number
  pf: number
  pa: number
  streak: string
  faab: number
  waiverPriority: number
  lineup: Record<string, string | null> // slotKey -> playerId
  bench: string[]
  ir: string[]
  history: { week: number; opp: number; pf: number; pa: number }[]
}

export interface Activity {
  id: string
  kind: 'trade' | 'add' | 'drop' | 'waiver' | 'commish'
  teamId: number
  otherTeamId?: number
  players: { id: string; dir: 'in' | 'out' }[]
  bid?: number
  ago: string
  note?: string
}

export const CURRENT_WEEK = 6
export const MY_TEAM_ID = 0
export const LEAGUE_NAME = 'The Dynasty League'
export const SEASON = 2026

export const STARTER_SLOTS: { key: string; slot: Slot; eligible: Pos[] }[] = [
  { key: 'QB', slot: 'QB', eligible: ['QB'] },
  { key: 'RB1', slot: 'RB', eligible: ['RB'] },
  { key: 'RB2', slot: 'RB', eligible: ['RB'] },
  { key: 'WR1', slot: 'WR', eligible: ['WR'] },
  { key: 'WR2', slot: 'WR', eligible: ['WR'] },
  { key: 'TE', slot: 'TE', eligible: ['TE'] },
  { key: 'FLEX', slot: 'FLEX', eligible: ['RB', 'WR', 'TE'] },
  { key: 'K', slot: 'K', eligible: ['K'] },
  { key: 'DEF', slot: 'DEF', eligible: ['DEF'] },
]

// ─── seeded randomness ──────────────────────────────────────────────────────
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(20261007)
const rr = (min: number, max: number) => min + rand() * (max - min)
const ri = (min: number, max: number) => Math.floor(rr(min, max + 1))
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)]
const round1 = (n: number) => Math.round(n * 10) / 10
const gauss = () => {
  let u = 0
  let v = 0
  while (u === 0) u = rand()
  while (v === 0) v = rand()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

// ─── NFL teams (fictional franchises, real-feeling cities) ──────────────────
export const NFL: NflTeam[] = [
  ['ATL', 'Atlanta', 'Firebirds'], ['BAL', 'Baltimore', 'Harbormen'], ['BOS', 'Boston', 'Minutemen'],
  ['CHI', 'Chicago', 'Ironworks'], ['CIN', 'Cincinnati', 'Rivermen'], ['CLE', 'Cleveland', 'Foundry'],
  ['DAL', 'Dallas', 'Outlaws'], ['DEN', 'Denver', 'Summit'], ['DET', 'Detroit', 'Gears'],
  ['GB', 'Green Bay', 'Lumberjacks'], ['HOU', 'Houston', 'Rockets'], ['IND', 'Indianapolis', 'Racers'],
  ['JAX', 'Jacksonville', 'Tides'], ['KC', 'Kansas City', 'Monarchs'], ['LV', 'Las Vegas', 'Aces'],
  ['LA', 'Los Angeles', 'Waves'], ['MIA', 'Miami', 'Herons'], ['MIN', 'Minnesota', 'North Stars'],
  ['NO', 'New Orleans', 'Krewe'], ['NY', 'New York', 'Empire'], ['OAK', 'Oakland', 'Redwoods'],
  ['ORL', 'Orlando', 'Suns'], ['PHI', 'Philadelphia', 'Liberty'], ['PIT', 'Pittsburgh', 'Steelmen'],
  ['POR', 'Portland', 'Pines'], ['SA', 'San Antonio', 'Missions'], ['SD', 'San Diego', 'Surf'],
  ['SEA', 'Seattle', 'Squall'], ['SF', 'San Francisco', 'Fog'], ['STL', 'St. Louis', 'Arch'],
  ['TB', 'Tampa Bay', 'Corsairs'], ['TEN', 'Tennessee', 'Rhythm'],
].map(([abbr, city, name]) => ({ abbr, city, name, bye: ri(5, 14) }))
// Make sure nobody we care about is on bye in the current week by default
NFL.forEach((t, i) => {
  if (t.bye === CURRENT_WEEK && i % 4 !== 0) t.bye = CURRENT_WEEK + 3
})
export const nflByAbbr = Object.fromEntries(NFL.map((t) => [t.abbr, t]))

// Opponents this week (pair teams up)
const shuffled = [...NFL].sort(() => rand() - 0.5)
const weekOpp: Record<string, { opp: string; home: boolean; kickoff: number }> = {}
for (let i = 0; i < shuffled.length; i += 2) {
  const a = shuffled[i]
  const b = shuffled[i + 1]
  const kickoff = i < 2 ? 0 : i < 16 ? 1 : i < 26 ? 2 : 3 // 0 = Thu final, 1 = early live, 2 = late live, 3 = SNF/MNF upcoming
  weekOpp[a.abbr] = { opp: b.abbr, home: true, kickoff }
  weekOpp[b.abbr] = { opp: a.abbr, home: false, kickoff }
}
const clocks: Record<number, string[]> = {
  1: ['Q4 2:14', 'Q4 6:41', 'Q3 0:52', 'Q4 11:03', 'Q3 4:20'],
  2: ['Q2 1:37', 'Q1 8:12', 'Q2 9:55', 'Half'],
}

// ─── names ──────────────────────────────────────────────────────────────────
const FIRST = [
  'Jalen', 'Marcus', 'Tyrell', 'Caleb', 'Devon', 'Andre', 'Isaiah', 'Malik', 'Jordan', 'Trey', 'Darius', 'Cole',
  'Bryce', 'Xavier', 'Quentin', 'Rashad', 'Elijah', 'Tavon', 'Micah', 'Garrett', 'Keenan', 'Dante', 'Brock',
  'Cam', 'Jaylen', 'Desmond', 'Owen', 'Zion', 'Rhett', 'Terrance', 'Josh', 'Nico', 'Amari', 'Kendrick', 'Lamar',
  'Wyatt', 'Deshawn', 'Mason', 'Grady', 'Corey', 'Emeka', 'Theo', 'Kobe', 'Reggie', 'Hunter', 'Beau', 'Javon',
  'Luca', 'Rome', 'Santino', 'Dalton', 'Tre', 'Mekhi', 'Silas', 'Kai', 'Jace', 'Ty', 'Omar', 'Bo',
]
const LAST = [
  'Whitaker', 'Okafor', 'Delacroix', 'Brennan', 'Hollis', 'Mathers', 'Vance', 'Castellanos', 'Pruitt', 'Ashby',
  'Kincaid', 'Mbeki', 'Langford', 'Thornton', 'Reyes', 'Holloway', 'Sutton', 'Bishop', 'Rowe', 'Dunleavy',
  'Ferris', 'Calloway', 'Abernathy', 'Pettigrew', 'Lockett', 'Navarro', 'Ellison', 'Osei', 'Granger', 'Hartley',
  'McBride', 'Stroud', 'Tillman', 'Booker', 'Fontenot', 'Whitfield', 'Ruckert', 'Adeyemi', 'Kessler', 'Moreau',
  'Banks', 'Coleman', 'Draper', 'Easley', 'Fairbanks', 'Goins', 'Huxley', 'Ivory', 'Jankowski', 'Knox',
  'Lyle', 'Mayfield', 'Nash', 'Oduya', 'Prescott', 'Quarles', 'Radcliffe', 'Sterling', 'Tate', 'Underwood',
  'Valdez', 'Wynn', 'Yates', 'Zeller', 'Archer', 'Blount', 'Crowder', 'Dorsey', 'Eskridge', 'Flowers',
]

// ─── players ────────────────────────────────────────────────────────────────
const POS_COUNTS: Record<Pos, number> = { QB: 34, RB: 56, WR: 72, TE: 30, K: 22, DEF: 32 }
const BASE_PPG: Record<Pos, [number, number]> = {
  QB: [25, 0.42],
  RB: [21, 0.3],
  WR: [20, 0.24],
  TE: [15, 0.33],
  K: [10.5, 0.14],
  DEF: [11, 0.2],
}
const SPREAD: Record<Pos, number> = { QB: 0.32, RB: 0.45, WR: 0.5, TE: 0.5, K: 0.45, DEF: 0.6 }

const NEWS_HEALTHY = [
  'Logged a full practice Wednesday and is expected to handle his usual workload.',
  'Out-snapped the rest of the room 52-19 last week; role looks secure.',
  'Coaches said they want to get him more touches in the red zone going forward.',
  'Saw a season-high target share last week and remains a weekly starter.',
  'Has scored in three straight games and faces a defense allowing big plays.',
  'Was limited early in the week with a minor ankle tweak but is off the report.',
]
const NEWS_Q = 'Listed as questionable (hamstring) after logging limited practices all week. Game-time decision.'
const NEWS_D = 'Doubtful (knee). Did not practice Thursday or Friday; plan accordingly.'
const NEWS_O = 'Ruled out (concussion) and will miss this week. Backup expected to start.'
const NEWS_IR = 'Placed on injured reserve (ankle). Eligible to return in four weeks at the earliest.'

const usedNames = new Set<string>()
function makeName() {
  for (;;) {
    const f = pick(FIRST)
    const l = pick(LAST)
    if (!usedNames.has(f + l)) {
      usedNames.add(f + l)
      return [f, l]
    }
  }
}

export const PLAYERS: Player[] = []
;(Object.keys(POS_COUNTS) as Pos[]).forEach((pos) => {
  const teams = [...NFL].sort(() => rand() - 0.5)
  for (let r = 0; r < POS_COUNTS[pos]; r++) {
    const nfl = pos === 'DEF' ? teams[r] : teams[r % 32]
    const [base, decay] = BASE_PPG[pos]
    const ppg = Math.max(pos === 'K' || pos === 'DEF' ? 4.5 : 3, base - r * decay + gauss() * 0.9)
    const weekly: (number | null)[] = []
    for (let w = 1; w < CURRENT_WEEK; w++) {
      if (nflByAbbr[nfl.abbr].bye === w) weekly.push(null)
      else weekly.push(Math.max(pos === 'DEF' ? -2 : 0, round1(ppg * (1 + gauss() * SPREAD[pos]))))
    }
    const played = weekly.filter((x): x is number => x !== null)
    const games = played.length
    const sched = weekOpp[nfl.abbr]
    const onBye = nfl.bye === CURRENT_WEEK
    const statusRoll = rand()
    const status: InjuryStatus =
      pos === 'DEF' ? 'OK' : statusRoll < 0.78 ? 'OK' : statusRoll < 0.89 ? 'Q' : statusRoll < 0.93 ? 'D' : statusRoll < 0.97 ? 'O' : 'IR'
    const out = status === 'O' || status === 'IR' || onBye
    const proj = out ? 0 : round1(ppg * rr(0.88, 1.12) * (status === 'Q' ? 0.85 : status === 'D' ? 0.4 : 1))
    const game: GameState = onBye ? 'bye' : sched.kickoff === 0 ? 'final' : sched.kickoff === 3 ? 'upcoming' : 'live'
    const progress = game === 'final' ? 1 : game === 'live' ? (sched.kickoff === 1 ? rr(0.7, 0.95) : rr(0.25, 0.55)) : 0
    const live = out ? 0 : round1(Math.max(0, proj * progress * (1 + gauss() * 0.45)))
    const [first, last] = pos === 'DEF' ? [nfl.city, nfl.name] : makeName()
    const name = pos === 'DEF' ? `${nfl.name}` : `${first} ${last}`
    const total = played.reduce((a, b) => a + b, 0)

    // Back into box-score stats from points so numbers feel coherent
    const s: SeasonStats = {
      passYds: 0, passTd: 0, int: 0, rushAtt: 0, rushYds: 0, rushTd: 0, tgt: 0, rec: 0, recYds: 0, recTd: 0,
      fgm: 0, fga: 0, xpm: 0, sacks: 0, defInt: 0, ptsAllowed: 0,
    }
    if (pos === 'QB') {
      s.passTd = Math.round((total * 0.3) / 4)
      s.passYds = Math.round((total * 0.55) / 0.04)
      s.int = ri(0, games + 1)
      s.rushAtt = ri(games * 2, games * 7)
      s.rushYds = Math.round((total * 0.15) / 0.1)
      s.rushTd = ri(0, 2)
    } else if (pos === 'RB') {
      s.rushTd = Math.round((total * 0.25) / 6)
      s.rushYds = Math.round((total * 0.45) / 0.1)
      s.rushAtt = Math.round(s.rushYds / rr(3.8, 5.2))
      s.rec = Math.round(total * 0.12)
      s.tgt = Math.round(s.rec * rr(1.15, 1.4))
      s.recYds = Math.round(s.rec * rr(6, 9))
      s.recTd = ri(0, 1)
    } else if (pos === 'WR' || pos === 'TE') {
      s.rec = Math.round(total * 0.24)
      s.tgt = Math.round(s.rec * rr(1.3, 1.65))
      s.recYds = Math.round((total * 0.5) / 0.1)
      s.recTd = Math.round((total * 0.22) / 6)
      if (pos === 'WR') {
        s.rushAtt = ri(0, 4)
        s.rushYds = s.rushAtt * ri(3, 9)
      }
    } else if (pos === 'K') {
      s.fga = Math.round(total / 4.2)
      s.fgm = Math.max(0, s.fga - ri(0, 2))
      s.xpm = ri(games, games * 3)
    } else {
      s.sacks = Math.round(total / 3)
      s.defInt = ri(1, games + 2)
      s.ptsAllowed = Math.round(games * rr(16, 27))
    }

    const rosteredBase = Math.max(0.5, 100 - r * (pos === 'K' ? 4.4 : pos === 'DEF' ? 3.2 : pos === 'QB' ? 2.4 : 1.25) + gauss() * 4)
    PLAYERS.push({
      id: `${pos}${r}`,
      name,
      first,
      last,
      pos,
      team: nfl.abbr,
      number: pos === 'DEF' ? 0 : pos === 'QB' ? ri(1, 19) : pos === 'K' ? ri(1, 9) : pos === 'TE' ? ri(80, 89) : pos === 'RB' ? ri(20, 39) : ri(10, 19),
      age: ri(21, 33),
      exp: ri(0, 10),
      status,
      posRank: r + 1,
      weekly,
      proj,
      live: game === 'upcoming' ? 0 : live,
      game,
      gameClock: game === 'final' ? 'Final' : game === 'live' ? pick(clocks[sched.kickoff]) : game === 'bye' ? 'BYE' : sched.kickoff === 3 && rand() > 0.5 ? 'Mon 8:15p' : 'Sun 8:20p',
      opp: onBye ? '' : sched.opp,
      home: sched.home,
      oppRankVsPos: ri(1, 32),
      rostered: round1(Math.min(99.9, rosteredBase)),
      started: round1(Math.max(0, Math.min(98, rosteredBase - rr(5, 40)))),
      trend: Math.round(gauss() * 900 + (r > 20 && rand() > 0.85 ? 4000 : 0)),
      adp: round1(r * 3.2 + rr(1, 20)),
      stats: s,
      news: status === 'Q' ? NEWS_Q : status === 'D' ? NEWS_D : status === 'O' ? NEWS_O : status === 'IR' ? NEWS_IR : pick(NEWS_HEALTHY),
      newsAgo: `${ri(1, 23)}h`,
    })
  }
})

export const playerById: Record<string, Player> = Object.fromEntries(PLAYERS.map((p) => [p.id, p]))

export const seasonPts = (p: Player) => round1(p.weekly.reduce<number>((a, b) => a + (b ?? 0), 0))
export const gamesPlayed = (p: Player) => p.weekly.filter((w) => w !== null).length
export const avgPts = (p: Player) => {
  const g = gamesPlayed(p)
  return g ? round1(seasonPts(p) / g) : 0
}

// ─── fantasy teams ──────────────────────────────────────────────────────────
const TEAM_DEFS: [string, string, string, number][] = [
  ['Sunday Scaries', 'SUN', 'You', 248],
  ['Hail Mary Poppins', 'HMP', 'Priya', 330],
  ['Pick Six Pack', 'P6P', 'Marcus', 28],
  ['Red Zone Rejects', 'RZR', 'Dana', 4],
  ['Waiver Wire Wizards', 'WWW', 'Theo', 270],
  ['The Replacements', 'REP', 'Sam', 200],
  ['Fourth & Long Island', '4LI', 'Jules', 172],
  ['Turf Toe Truckers', 'TTT', 'Ravi', 145],
  ['Bench Warmers FC', 'BWF', 'Alex', 95],
  ['Fumble Bees', 'BEE', 'Morgan', 48],
  ['Audible Alchemists', 'AUD', 'Chris', 300],
  ['Blitz Happens', 'BLZ', 'Nadia', 350],
]

export const TEAMS: FantasyTeam[] = TEAM_DEFS.map(([name, abbr, manager, hue], id) => ({
  id, name, abbr, manager, hue,
  wins: 0, losses: 0, ties: 0, pf: 0, pa: 0, streak: '',
  faab: ri(18, 100),
  waiverPriority: 0,
  lineup: {}, bench: [], ir: [], history: [],
}))

// Snake draft by positional plan, best available at each pick
const PLAN: Pos[] = ['RB', 'WR', 'RB', 'WR', 'QB', 'TE', 'WR', 'RB', 'WR', 'RB', 'QB', 'TE', 'DEF', 'K', 'WR']
const taken = new Set<string>()
const nextBest = (pos: Pos) => {
  const p = PLAYERS.find((x) => x.pos === pos && !taken.has(x.id))!
  taken.add(p.id)
  return p
}
const rosters: Player[][] = TEAMS.map(() => [])
for (let round = 0; round < PLAN.length; round++) {
  const order = round % 2 === 0 ? TEAMS : [...TEAMS].reverse()
  order.forEach((t) => {
    // add a little chaos to the plan so rosters differ
    const pos = rand() < 0.15 ? pick<Pos>(['RB', 'WR']) : PLAN[round]
    rosters[t.id].push(nextBest(pos))
  })
}
// Give "you" a mix of statuses so the lineup screen has interesting states
PLAYERS.forEach((p) => {
  if (!taken.has(p.id)) {
    // free agents are rostered less
    p.rostered = round1(Math.max(0.2, p.rostered * 0.35))
    p.started = round1(p.started * 0.2)
  }
})

export function bestLineup(roster: Player[], score: (p: Player) => number) {
  const lineup: Record<string, string | null> = {}
  const used = new Set<string>()
  const pool = [...roster].filter((p) => p.status !== 'IR')
  for (const s of STARTER_SLOTS) {
    const cand = pool
      .filter((p) => s.eligible.includes(p.pos) && !used.has(p.id))
      .sort((a, b) => score(b) - score(a))[0]
    lineup[s.key] = cand ? cand.id : null
    if (cand) used.add(cand.id)
  }
  return { lineup, used }
}
export const optimalLineup = (ids: string[]) => bestLineup(ids.map((id) => playerById[id]), (p) => p.proj).lineup

TEAMS.forEach((t) => {
  const roster = rosters[t.id]
  const { lineup, used } = bestLineup(roster, (p) => p.proj)
  t.lineup = lineup
  t.ir = roster.filter((p) => p.status === 'IR').map((p) => p.id)
  t.bench = roster.filter((p) => !used.has(p.id) && p.status !== 'IR').map((p) => p.id)
})

// Make the user's lineup a touch sub-optimal so "Optimize" has something to do
{
  const me = TEAMS[MY_TEAM_ID]
  const flex = me.lineup.FLEX
  const swap = me.bench.find((id) => ['RB', 'WR', 'TE'].includes(playerById[id].pos))
  if (flex && swap) {
    me.lineup.FLEX = swap
    me.bench = me.bench.filter((x) => x !== swap).concat(flex)
  }
}

// ─── schedule + results for past weeks ──────────────────────────────────────
function roundRobin(n: number, week: number): [number, number][] {
  const ids = Array.from({ length: n }, (_, i) => i)
  const fixed = ids[0]
  const rest = ids.slice(1)
  const rot = week % (n - 1)
  const rotated = rest.slice(rot).concat(rest.slice(0, rot))
  const arr = [fixed, ...rotated]
  const pairs: [number, number][] = []
  for (let i = 0; i < n / 2; i++) pairs.push([arr[i], arr[n - 1 - i]])
  return pairs
}
export const scheduleFor = (week: number) => roundRobin(TEAMS.length, week - 1)

for (let w = 1; w < CURRENT_WEEK; w++) {
  const scores = TEAMS.map((t) => {
    const ids = [...Object.values(t.lineup), ...t.bench].filter(Boolean) as string[]
    const roster = ids.map((id) => playerById[id])
    // managers aren't perfect: score their projected-best lineup on actuals
    const { lineup } = bestLineup(roster, (p) => avgPts(p) + rr(-3, 3))
    return round1(
      Object.values(lineup).reduce((a, id) => a + (id ? playerById[id].weekly[w - 1] ?? 0 : 0), 0),
    )
  })
  scheduleFor(w).forEach(([a, b]) => {
    const A = TEAMS[a]
    const B = TEAMS[b]
    A.history.push({ week: w, opp: b, pf: scores[a], pa: scores[b] })
    B.history.push({ week: w, opp: a, pf: scores[b], pa: scores[a] })
  })
}
TEAMS.forEach((t) => {
  t.history.forEach((h) => {
    if (h.pf > h.pa) t.wins++
    else if (h.pf < h.pa) t.losses++
    else t.ties++
    t.pf += h.pf
    t.pa += h.pa
  })
  t.pf = round1(t.pf)
  t.pa = round1(t.pa)
  const last = t.history.slice().reverse()
  const won = last[0].pf > last[0].pa
  let n = 0
  for (const h of last) {
    if (h.pf > h.pa === won) n++
    else break
  }
  t.streak = `${won ? 'W' : 'L'}${n}`
})
export const standings = () =>
  [...TEAMS].sort((a, b) => b.wins - a.wins || b.pf - a.pf)
standings()
  .slice()
  .reverse()
  .forEach((t, i) => (t.waiverPriority = i + 1))

// ─── activity ───────────────────────────────────────────────────────────────
const fa = PLAYERS.filter((p) => !taken.has(p.id))
const rostered = (tid: number) => [...Object.values(TEAMS[tid].lineup), ...TEAMS[tid].bench].filter(Boolean) as string[]
export const ACTIVITY: Activity[] = [
  {
    id: 'a1', kind: 'trade', teamId: 4, otherTeamId: 7, ago: '2h',
    players: [{ id: rostered(4)[3], dir: 'out' }, { id: rostered(7)[5], dir: 'in' }, { id: rostered(7)[10], dir: 'in' }],
  },
  { id: 'a2', kind: 'waiver', teamId: 2, ago: 'Wed', bid: 23, players: [{ id: fa[3].id, dir: 'in' }, { id: rostered(2)[12], dir: 'out' }] },
  { id: 'a3', kind: 'add', teamId: 9, ago: 'Wed', players: [{ id: fa[8].id, dir: 'in' }, { id: rostered(9)[13], dir: 'out' }] },
  { id: 'a4', kind: 'commish', teamId: 1, ago: 'Tue', players: [], note: 'Trade deadline moved to Week 11. Playoff seeding now uses points-for as the first tiebreaker.' },
  { id: 'a5', kind: 'waiver', teamId: 11, ago: 'Wed', bid: 41, players: [{ id: fa[1].id, dir: 'in' }, { id: rostered(11)[14], dir: 'out' }] },
]

export const isRostered = (id: string) => taken.has(id)
export const ownerOf = (id: string): FantasyTeam | undefined =>
  TEAMS.find((t) => Object.values(t.lineup).includes(id) || t.bench.includes(id) || t.ir.includes(id))

// ─── live matchup helpers ───────────────────────────────────────────────────
export const projSum = (lineup: Record<string, string | null>) =>
  round1(Object.values(lineup).reduce((a, id) => a + (id ? playerById[id].proj : 0), 0))

export const teamLive = (lineup: Record<string, string | null>) =>
  round1(Object.values(lineup).reduce((a, id) => a + (id ? playerById[id].live : 0), 0))

export const teamProjected = (lineup: Record<string, string | null>) =>
  round1(
    Object.values(lineup).reduce((a, id) => {
      if (!id) return a
      const p = playerById[id]
      if (p.game === 'final') return a + p.live
      if (p.game === 'upcoming') return a + p.proj
      // live: what's banked plus remaining share of projection
      return a + Math.max(p.live, p.live + p.proj * 0.35)
    }, 0),
  )

export const yetToPlay = (lineup: Record<string, string | null>) =>
  Object.values(lineup).filter((id) => id && playerById[id].game === 'upcoming').length
export const inProgress = (lineup: Record<string, string | null>) =>
  Object.values(lineup).filter((id) => id && playerById[id].game === 'live').length

export function winProb(myProj: number, oppProj: number, remaining: number) {
  // logistic on projected margin, sharper when fewer players remain
  const k = 0.055 + (9 - Math.min(remaining, 9)) * 0.015
  return 1 / (1 + Math.exp(-k * (myProj - oppProj)))
}

export const currentMatchups = () => scheduleFor(CURRENT_WEEK)
export const opponentOf = (teamId: number) => {
  const m = currentMatchups().find(([a, b]) => a === teamId || b === teamId)!
  return m[0] === teamId ? m[1] : m[0]
}
