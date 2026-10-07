import clsx from 'clsx'
import { ArrowLeft, ChevronDown, Coins, Gavel, LayoutGrid, ListOrdered, Medal, RotateCcw, Settings2, Shuffle } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Rise } from '../components/Layout'
import { Button, Card, PosBadge, Segmented, Select, Stepper, Toggle } from '../components/ui'
import { scoringFor, type LeagueSettings, type ScoringPreset } from '../data/settings'
import { useStore } from '../lib/store'

const SECTIONS = [
  { id: 'general', label: 'General', icon: Settings2 },
  { id: 'roster', label: 'Roster', icon: LayoutGrid },
  { id: 'scoring', label: 'Scoring', icon: ListOrdered },
  { id: 'waivers', label: 'Waivers', icon: Coins },
  { id: 'trades', label: 'Trades', icon: Gavel },
  { id: 'playoffs', label: 'Playoffs', icon: Medal },
  { id: 'draft', label: 'Draft', icon: Shuffle },
] as const

const ROSTER_LABELS: Record<string, string> = {
  QB: 'Quarterback',
  RB: 'Running back',
  WR: 'Wide receiver',
  TE: 'Tight end',
  FLEX: 'Flex (RB/WR/TE)',
  SUPERFLEX: 'Superflex (QB/RB/WR/TE)',
  K: 'Kicker',
  DEF: 'Team defense',
  BN: 'Bench',
  IR: 'Injured reserve',
}

export function Settings() {
  const { settings, setSettings, toast } = useStore()
  const [draft, setDraft] = useState<LeagueSettings>(settings)
  const [active, setActive] = useState<string>('general')
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings)

  // scroll-spy
  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[]
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (vis[0]) setActive(vis[0].target.id)
      },
      { rootMargin: '-120px 0px -60% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  const jump = (id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 128, behavior: 'smooth' })
  }

  // typed updaters
  const up = <K extends keyof LeagueSettings>(k: K, patch: Partial<LeagueSettings[K]>) =>
    setDraft((d) => ({ ...d, [k]: { ...(d[k] as object), ...patch } }))

  const setRule = (gid: string, key: string, value: number) =>
    setDraft((d) => ({
      ...d,
      scoringPreset: 'custom',
      scoring: d.scoring.map((g) =>
        g.id !== gid ? g : { ...g, rules: g.rules.map((r) => (r.key === key ? { ...r, value } : r)) },
      ),
    }))

  const setPreset = (p: ScoringPreset) =>
    setDraft((d) => ({ ...d, scoringPreset: p, scoring: p === 'custom' ? d.scoring : scoringFor(p) }))

  const starters = Object.entries(draft.roster).filter(([k]) => k !== 'BN' && k !== 'IR')

  return (
    <div className="pb-16">
      <Link to="/league" className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> League
      </Link>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold leading-tight tracking-[-0.02em] lg:text-[30px]">League settings</h1>
          <p className="mt-1 text-sm text-muted">You're the commissioner. Changes apply to everyone after saving.</p>
        </div>
      </div>

      {/* mobile section nav */}
      <div className="no-scrollbar sticky top-14 z-20 -mx-4 mb-5 flex gap-2 overflow-x-auto border-b border-line/70 bg-bg/90 px-4 py-2.5 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:hidden">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => jump(s.id)}
            className={clsx(
              'h-8 shrink-0 rounded-md px-3.5 text-[13px] font-semibold transition',
              active === s.id ? 'bg-ink text-surface' : 'text-muted hover:text-ink',
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav className="sticky top-10 hidden self-start lg:block">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => jump(id)}
              className={clsx(
                'flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-[13.5px] font-semibold transition',
                active === id ? 'bg-surface text-ink shadow-card ring-1 ring-line' : 'text-muted hover:text-ink',
              )}
            >
              <Icon className={clsx('size-4', active === id && 'text-accent')} />
              {label}
            </button>
          ))}
        </nav>

        <div className="space-y-10">
          {/* GENERAL */}
          <Section id="general" title="General" desc="The basics of your league.">
            <Group>
              <Row label="League name">
                <input
                  value={draft.general.name}
                  onChange={(e) => up('general', { name: e.target.value })}
                  className="h-9 w-full max-w-[240px] rounded-xl border border-line bg-surface px-3 text-right text-sm font-semibold outline-none focus:border-accent sm:text-left"
                />
              </Row>
              <Row label="Number of teams">
                <Select
                  value={draft.general.teams}
                  onChange={(v) => up('general', { teams: v })}
                  options={[8, 10, 12, 14, 16].map((n) => ({ value: n, label: `${n} teams` }))}
                />
              </Row>
              <Row label="Visibility" hint="Public leagues can be viewed by anyone with the link.">
                <Segmented
                  size="sm"
                  value={draft.general.visibility}
                  onChange={(v) => up('general', { visibility: v })}
                  options={[
                    { value: 'private', label: 'Private' },
                    { value: 'public', label: 'Public' },
                  ]}
                />
              </Row>
              <Row label="League median game" hint="Each week, every team also plays the league median score.">
                <Toggle checked={draft.general.medianGame} onChange={(v) => up('general', { medianGame: v })} />
              </Row>
              <Row label="Standings tiebreaker">
                <Select
                  value={draft.general.tiebreaker}
                  onChange={(v) => up('general', { tiebreaker: v })}
                  options={[
                    { value: 'pf', label: 'Points for' },
                    { value: 'h2h', label: 'Head-to-head' },
                    { value: 'pa', label: 'Points against' },
                  ]}
                />
              </Row>
            </Group>
          </Section>

          {/* ROSTER */}
          <Section id="roster" title="Roster" desc="Starting lineup slots, bench depth and IR rules.">
            <Card className="mb-3 p-4">
              <div className="mb-2.5 text-[12px] font-semibold text-muted">Starting lineup preview</div>
              <div className="flex flex-wrap gap-1.5">
                {starters.flatMap(([k, n]) => Array.from({ length: n }, (_, i) => <PosBadge key={k + i} pos={k} className="h-7 min-w-11" />))}
                <span className="mx-1 self-center text-faint">+</span>
                <span className="inline-flex h-7 items-center rounded-md bg-surface-2 px-2 text-[11px] font-bold text-muted">
                  {draft.roster.BN} BN
                </span>
                <span className="inline-flex h-7 items-center rounded-md bg-loss-soft px-2 text-[11px] font-bold text-loss">
                  {draft.roster.IR} IR
                </span>
              </div>
            </Card>
            <Group>
              {Object.keys(draft.roster).map((k) => (
                <Row key={k} label={<span className="flex items-center gap-2.5"><PosBadge pos={k} />{ROSTER_LABELS[k]}</span>}>
                  <Stepper
                    value={draft.roster[k]}
                    min={0}
                    max={k === 'BN' ? 12 : 4}
                    onChange={(v) => setDraft((d) => ({ ...d, roster: { ...d.roster, [k]: v } }))}
                  />
                </Row>
              ))}
            </Group>
            <Group title="IR eligibility">
              {Object.entries(draft.irEligibility).map(([k, v]) => (
                <Row key={k} label={k[0] + k.slice(1).toLowerCase()}>
                  <Toggle checked={v} onChange={(nv) => setDraft((d) => ({ ...d, irEligibility: { ...d.irEligibility, [k]: nv } }))} />
                </Row>
              ))}
            </Group>
          </Section>

          {/* SCORING */}
          <Section
            id="scoring"
            title="Scoring"
            desc="Start from a preset, then fine-tune any category."
            action={
              draft.scoringPreset === 'custom' && (
                <Button size="sm" variant="ghost" onClick={() => setPreset('half')}>
                  <RotateCcw className="size-3.5" /> Reset
                </Button>
              )
            }
          >
            <Segmented
              className="mb-4 w-full sm:w-auto"
              value={draft.scoringPreset}
              onChange={setPreset}
              options={[
                { value: 'std', label: 'Standard' },
                { value: 'half', label: 'Half PPR' },
                { value: 'ppr', label: 'PPR' },
                { value: 'custom', label: 'Custom' },
              ]}
            />
            <div className="space-y-3">
              {draft.scoring.map((g, i) => (
                <ScoringGroupCard key={g.id} group={g} defaultOpen={i < 3} onChange={(k, v) => setRule(g.id, k, v)} />
              ))}
            </div>
          </Section>

          {/* WAIVERS */}
          <Section id="waivers" title="Waivers" desc="How players move from free agency onto rosters.">
            <div className="mb-3 grid gap-2 sm:grid-cols-3">
              {(
                [
                  ['faab', 'FAAB bidding', 'Blind auction with a season budget'],
                  ['rolling', 'Rolling list', 'Use a claim, drop to the back'],
                  ['reverse', 'Reverse standings', 'Worst team picks first, weekly reset'],
                ] as const
              ).map(([v, t, d]) => (
                <button
                  key={v}
                  onClick={() => up('waivers', { type: v })}
                  className={clsx(
                    'rounded-2xl border p-4 text-left transition',
                    draft.waivers.type === v ? 'border-accent bg-accent-soft ring-1 ring-accent' : 'border-line bg-surface hover:border-line-strong',
                  )}
                >
                  <div className="text-[14px] font-semibold">{t}</div>
                  <div className="mt-0.5 text-[12.5px] text-muted">{d}</div>
                </button>
              ))}
            </div>
            <Group>
              {draft.waivers.type === 'faab' && (
                <>
                  <Row label="FAAB budget">
                    <Stepper value={draft.waivers.budget} step={25} min={25} max={1000} format={(v) => `$${v}`} onChange={(v) => up('waivers', { budget: v })} />
                  </Row>
                  <Row label="Minimum bid">
                    <Stepper value={draft.waivers.minBid} min={0} max={10} format={(v) => `$${v}`} onChange={(v) => up('waivers', { minBid: v })} />
                  </Row>
                  <Row label="Allow $0 bids">
                    <Toggle checked={draft.waivers.zeroBids} onChange={(v) => up('waivers', { zeroBids: v })} />
                  </Row>
                </>
              )}
              <Row label="Waivers process" hint="Claims run at 3:00 AM ET on this day.">
                <Select
                  value={draft.waivers.processDay}
                  onChange={(v) => up('waivers', { processDay: v })}
                  options={['Tue', 'Wed', 'Thu'].map((d) => ({ value: d, label: d === 'Tue' ? 'Tuesday' : d === 'Wed' ? 'Wednesday' : 'Thursday' }))}
                />
              </Row>
              <Row label="Dropped players clear after">
                <Stepper value={draft.waivers.clearDays} min={0} max={5} format={(v) => `${v}d`} onChange={(v) => up('waivers', { clearDays: v })} />
              </Row>
              <Row label="Lock players at kickoff" hint="Players go on waivers once their game starts.">
                <Toggle checked={draft.waivers.lockAtKickoff} onChange={(v) => up('waivers', { lockAtKickoff: v })} />
              </Row>
            </Group>
          </Section>

          {/* TRADES */}
          <Section id="trades" title="Trades" desc="Review process and what can be traded.">
            <Group>
              <Row label="Trade review">
                <Select
                  value={draft.trades.review}
                  onChange={(v) => up('trades', { review: v })}
                  options={[
                    { value: 'vote', label: 'League vote' },
                    { value: 'commish', label: 'Commissioner' },
                    { value: 'none', label: 'No review' },
                  ]}
                />
              </Row>
              {draft.trades.review !== 'none' && (
                <Row label="Review period">
                  <Stepper value={draft.trades.reviewHours} step={12} min={12} max={72} format={(v) => `${v}h`} onChange={(v) => up('trades', { reviewHours: v })} />
                </Row>
              )}
              <Row label="Trade deadline">
                <Select
                  value={draft.trades.deadlineWeek}
                  onChange={(v) => up('trades', { deadlineWeek: v })}
                  options={Array.from({ length: 8 }, (_, i) => i + 8).map((w) => ({ value: w, label: `Week ${w}` }))}
                />
              </Row>
              <Row label="Allow draft pick trades">
                <Toggle checked={draft.trades.allowPicks} onChange={(v) => up('trades', { allowPicks: v })} />
              </Row>
              <Row label="Allow FAAB in trades">
                <Toggle checked={draft.trades.allowFaab} onChange={(v) => up('trades', { allowFaab: v })} />
              </Row>
            </Group>
          </Section>

          {/* PLAYOFFS */}
          <Section id="playoffs" title="Playoffs" desc="Bracket size, timing and seeding.">
            <PlayoffPreview teams={draft.playoffs.teams} start={draft.playoffs.startWeek} perRound={draft.playoffs.weeksPerRound} />
            <Group>
              <Row label="Playoff teams">
                <Segmented
                  size="sm"
                  value={String(draft.playoffs.teams)}
                  onChange={(v) => up('playoffs', { teams: Number(v) })}
                  options={['4', '6', '8'].map((n) => ({ value: n, label: n }))}
                />
              </Row>
              <Row label="Starts">
                <Select
                  value={draft.playoffs.startWeek}
                  onChange={(v) => up('playoffs', { startWeek: v })}
                  options={[14, 15, 16].map((w) => ({ value: w, label: `Week ${w}` }))}
                />
              </Row>
              <Row label="Weeks per round">
                <Segmented
                  size="sm"
                  value={String(draft.playoffs.weeksPerRound)}
                  onChange={(v) => up('playoffs', { weeksPerRound: Number(v) })}
                  options={[
                    { value: '1', label: '1 week' },
                    { value: '2', label: '2 weeks' },
                  ]}
                />
              </Row>
              <Row label="Re-seed each round" hint="Top remaining seed always plays the lowest.">
                <Toggle checked={draft.playoffs.reseed} onChange={(v) => up('playoffs', { reseed: v })} />
              </Row>
              <Row label="Non-playoff teams">
                <Select
                  value={draft.playoffs.consolation}
                  onChange={(v) => up('playoffs', { consolation: v })}
                  options={[
                    { value: 'toilet', label: 'Toilet bowl' },
                    { value: 'consolation', label: 'Consolation bracket' },
                    { value: 'none', label: 'Season ends' },
                  ]}
                />
              </Row>
            </Group>
          </Section>

          {/* DRAFT */}
          <Section id="draft" title="Draft" desc="Settings for next season's draft.">
            <Group>
              <Row label="Draft type">
                <Segmented
                  size="sm"
                  value={draft.draft.type}
                  onChange={(v) => up('draft', { type: v })}
                  options={[
                    { value: 'snake', label: 'Snake' },
                    { value: 'auction', label: 'Auction' },
                    { value: 'linear', label: 'Linear' },
                  ]}
                />
              </Row>
              <Row label="Time per pick">
                <Select
                  value={draft.draft.pickSeconds}
                  onChange={(v) => up('draft', { pickSeconds: v })}
                  options={[30, 60, 90, 120, 300, 28800].map((s) => ({ value: s, label: s >= 3600 ? `${s / 3600} hours` : `${s} seconds` }))}
                />
              </Row>
              {draft.draft.type === 'snake' && (
                <Row label="Third-round reversal">
                  <Toggle checked={draft.draft.thirdRoundReversal} onChange={(v) => up('draft', { thirdRoundReversal: v })} />
                </Row>
              )}
              <Row label="Keepers per team">
                <Stepper value={draft.draft.keepers} min={0} max={5} onChange={(v) => up('draft', { keepers: v })} />
              </Row>
            </Group>
          </Section>
        </div>
      </div>

      {/* save bar */}
      <div
        className={clsx(
          'fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-30 px-4 transition-all duration-300 lg:bottom-6 lg:left-[264px]',
          dirty ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-6 opacity-0',
        )}
      >
        <div className="mx-auto flex max-w-xl items-center gap-3 rounded-2xl bg-ink py-2.5 pl-5 pr-2.5 text-surface shadow-pop">
          <span className="flex-1 text-[13.5px] font-semibold">Unsaved changes</span>
          <button onClick={() => setDraft(settings)} className="h-9 rounded-xl px-3 text-[13.5px] font-semibold text-surface/70 hover:text-surface">
            Discard
          </button>
          <button
            onClick={() => {
              setSettings(draft)
              toast('League settings saved', 'win')
            }}
            className="h-9 rounded-xl bg-accent px-4 text-[13.5px] font-semibold text-accent-ink hover:brightness-110"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ id, title, desc, action, children }: { id: string; title: string; desc: string; action?: ReactNode; children: ReactNode }) {
  return (
    <Rise>
      <section id={id} className="scroll-mt-32">
        <div className="mb-3 flex items-end justify-between gap-3 px-1">
          <div>
            <h2 className="text-[18px] font-bold tracking-tight">{title}</h2>
            <p className="text-[13px] text-muted">{desc}</p>
          </div>
          {action}
        </div>
        <div className="space-y-3">{children}</div>
      </section>
    </Rise>
  )
}

function Group({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div>
      {title && <div className="mb-2 mt-4 px-1 text-[12px] font-bold uppercase tracking-wider text-faint">{title}</div>}
      <Card className="divide-y divide-line">{children}</Card>
    </div>
  )
}

function Row({ label, hint, children }: { label: ReactNode; hint?: string; children: ReactNode }) {
  return (
    <div className="flex min-h-[60px] items-center justify-between gap-4 px-4 py-3">
      <div className="min-w-0">
        <div className="text-[14px] font-medium">{label}</div>
        {hint && <div className="mt-0.5 text-[12.5px] leading-snug text-muted">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function ScoringGroupCard({
  group,
  defaultOpen,
  onChange,
}: {
  group: LeagueSettings['scoring'][number]
  defaultOpen?: boolean
  onChange: (key: string, v: number) => void
}) {
  const [open, setOpen] = useState(!!defaultOpen)
  const summary = group.rules
    .filter((r) => r.value !== 0)
    .slice(0, 3)
    .map((r) => `${r.label.replace(/ \(.*\)/, '')} ${r.value > 0 ? '+' : ''}${r.value}`)
    .join(' · ')
  return (
    <Card className="overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
        <div className="min-w-0 flex-1">
          <div className="text-[14.5px] font-semibold">{group.label}</div>
          {!open && <div className="truncate text-[12.5px] text-muted">{summary}</div>}
        </div>
        <ChevronDown className={clsx('size-4 shrink-0 text-muted transition', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="divide-y divide-line border-t border-line">
          {group.rules.map((r) => (
            <div key={r.key} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="min-w-0">
                <div className="text-[13.5px] font-medium">{r.label}</div>
                {r.hint && <div className="text-[12px] text-muted">{r.hint}</div>}
              </div>
              <Stepper value={r.value} step={r.step} min={-10} max={20} onChange={(v) => onChange(r.key, v)} format={(v) => (v > 0 ? `+${v}` : String(v))} />
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

function PlayoffPreview({ teams, start, perRound }: { teams: number; start: number; perRound: number }) {
  const rounds = Math.ceil(Math.log2(teams))
  const byes = 2 ** rounds - teams
  const labels = rounds === 2 ? ['Semifinals', 'Final'] : ['Quarterfinals', 'Semifinals', 'Final']
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between text-[12px] font-semibold text-muted">
        <span>Bracket preview</span>
        {byes > 0 && <span>Top {byes} seeds get a bye</span>}
      </div>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${rounds}, minmax(0, 1fr))` }}>
        {labels.map((l, i) => {
          const wStart = start + i * perRound
          const games = 2 ** (rounds - i - 1)
          return (
            <div key={l}>
              <div className="text-[12.5px] font-semibold">{l}</div>
              <div className="mb-2 text-[11.5px] text-muted">
                Wk {wStart}
                {perRound > 1 && `–${wStart + perRound - 1}`}
              </div>
              <div className="space-y-1.5">
                {Array.from({ length: games }).map((_, g) => (
                  <div key={g} className={clsx('h-7 rounded-lg', i === rounds - 1 ? 'bg-accent/80' : 'bg-accent-soft')} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
      {start + rounds * perRound - 1 > 18 && (
        <div className="mt-3 rounded-lg bg-warn-soft px-3 py-2 text-[12.5px] font-medium text-warn">
          Heads up: the final would land in Week {start + rounds * perRound - 1}, after the regular NFL season.
        </div>
      )}
    </Card>
  )
}
