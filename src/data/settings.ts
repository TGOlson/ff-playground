export type ScoringPreset = 'std' | 'half' | 'ppr' | 'custom'

export interface ScoringRule {
  key: string
  label: string
  hint?: string
  value: number
  step: number
}

export interface ScoringGroup {
  id: string
  label: string
  rules: ScoringRule[]
}

export interface LeagueSettings {
  general: {
    name: string
    teams: number
    visibility: 'private' | 'public'
    medianGame: boolean
    tiebreaker: 'pf' | 'h2h' | 'pa'
    commishCanEdit: boolean
  }
  roster: Record<string, number>
  irEligibility: Record<string, boolean>
  scoringPreset: ScoringPreset
  scoring: ScoringGroup[]
  waivers: {
    type: 'faab' | 'rolling' | 'reverse'
    budget: number
    minBid: number
    zeroBids: boolean
    processDay: string
    clearDays: number
    lockAtKickoff: boolean
  }
  trades: {
    review: 'commish' | 'vote' | 'none'
    reviewHours: number
    deadlineWeek: number
    allowPicks: boolean
    allowFaab: boolean
  }
  playoffs: {
    teams: number
    startWeek: number
    weeksPerRound: number
    reseed: boolean
    consolation: 'none' | 'toilet' | 'consolation'
  }
  draft: {
    type: 'snake' | 'auction' | 'linear'
    pickSeconds: number
    thirdRoundReversal: boolean
    keepers: number
  }
}

const rule = (key: string, label: string, value: number, step = 1, hint?: string): ScoringRule => ({
  key, label, value, step, hint,
})

export const scoringFor = (preset: Exclude<ScoringPreset, 'custom'>): ScoringGroup[] => [
  {
    id: 'passing',
    label: 'Passing',
    rules: [
      rule('passYd', 'Passing yards', 0.04, 0.01, '1 pt / 25 yds'),
      rule('passTd', 'Passing TD', 4),
      rule('int', 'Interception', -2, 0.5),
      rule('pass2pt', '2-pt conversion', 2),
      rule('pass300', '300+ yard bonus', 0, 1),
    ],
  },
  {
    id: 'rushing',
    label: 'Rushing',
    rules: [
      rule('rushYd', 'Rushing yards', 0.1, 0.01, '1 pt / 10 yds'),
      rule('rushTd', 'Rushing TD', 6),
      rule('rush2pt', '2-pt conversion', 2),
      rule('rush100', '100+ yard bonus', 0, 1),
      rule('fumLost', 'Fumble lost', -2, 0.5),
    ],
  },
  {
    id: 'receiving',
    label: 'Receiving',
    rules: [
      rule('rec', 'Reception', preset === 'ppr' ? 1 : preset === 'half' ? 0.5 : 0, 0.25),
      rule('teRec', 'TE reception bonus', 0, 0.25, 'Premium'),
      rule('recYd', 'Receiving yards', 0.1, 0.01, '1 pt / 10 yds'),
      rule('recTd', 'Receiving TD', 6),
      rule('rec100', '100+ yard bonus', 0, 1),
    ],
  },
  {
    id: 'kicking',
    label: 'Kicking',
    rules: [
      rule('fg0', 'FG made 0–39', 3),
      rule('fg40', 'FG made 40–49', 4),
      rule('fg50', 'FG made 50+', 5),
      rule('fgMiss', 'FG missed', -1, 0.5),
      rule('xp', 'PAT made', 1),
    ],
  },
  {
    id: 'defense',
    label: 'Team defense',
    rules: [
      rule('sack', 'Sack', 1, 0.5),
      rule('defInt', 'Interception', 2),
      rule('fumRec', 'Fumble recovery', 2),
      rule('defTd', 'Defensive TD', 6),
      rule('safety', 'Safety', 2),
      rule('pa0', 'Points allowed 0', 10),
      rule('pa7', 'Points allowed 1–6', 7),
      rule('pa14', 'Points allowed 7–13', 4),
    ],
  },
]

export const DEFAULT_SETTINGS: LeagueSettings = {
  general: {
    name: 'The Dynasty League',
    teams: 12,
    visibility: 'private',
    medianGame: false,
    tiebreaker: 'pf',
    commishCanEdit: true,
  },
  roster: { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, SUPERFLEX: 0, K: 1, DEF: 1, BN: 6, IR: 2 },
  irEligibility: { OUT: true, DOUBTFUL: false, IR: true, SUSPENDED: false },
  scoringPreset: 'half',
  scoring: scoringFor('half'),
  waivers: {
    type: 'faab',
    budget: 100,
    minBid: 0,
    zeroBids: true,
    processDay: 'Wed',
    clearDays: 2,
    lockAtKickoff: true,
  },
  trades: {
    review: 'vote',
    reviewHours: 24,
    deadlineWeek: 11,
    allowPicks: true,
    allowFaab: true,
  },
  playoffs: {
    teams: 6,
    startWeek: 15,
    weeksPerRound: 1,
    reseed: true,
    consolation: 'toilet',
  },
  draft: {
    type: 'snake',
    pickSeconds: 90,
    thirdRoundReversal: false,
    keepers: 0,
  },
}
