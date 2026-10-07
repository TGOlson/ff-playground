import clsx from 'clsx'
import { CalendarDays, ChevronRight, Coins, Settings2, Shield, Trophy, Users } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Rise } from '../components/Layout'
import { Card, PageHeader, SectionTitle, Segmented, TeamAvatar } from '../components/ui'
import { CURRENT_WEEK, MY_TEAM_ID, SEASON, TEAMS, scheduleFor, standings } from '../data/mock'
import { useStore } from '../lib/store'

export function League() {
  const { settings } = useStore()
  const [tab, setTab] = useState<'standings' | 'schedule'>('standings')
  const table = standings()
  const cut = settings.playoffs.teams
  const preset = { std: 'Standard', half: 'Half PPR', ppr: 'PPR', custom: 'Custom' }[settings.scoringPreset]

  return (
    <div>
      <PageHeader
        title={settings.general.name}
        sub={`${settings.general.teams}-team · ${preset} · ${SEASON} season`}
        right={
          <Link
            to="/league/settings"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-semibold shadow-card hover:bg-surface-2"
          >
            <Settings2 className="size-4" /> Settings
          </Link>
        }
      />

      <Rise>
        <div className="no-scrollbar -mx-4 mb-6 flex gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-4 sm:px-0">
          <Fact icon={<Users className="size-4" />} label="Roster" value={`${Object.entries(settings.roster).filter(([k]) => k !== 'BN' && k !== 'IR').reduce((a, [, v]) => a + v, 0)} starters`} />
          <Fact icon={<Coins className="size-4" />} label="Waivers" value={settings.waivers.type === 'faab' ? `$${settings.waivers.budget} FAAB` : settings.waivers.type === 'rolling' ? 'Rolling' : 'Reverse standings'} />
          <Fact icon={<Shield className="size-4" />} label="Trade deadline" value={`Week ${settings.trades.deadlineWeek}`} />
          <Fact icon={<Trophy className="size-4" />} label="Playoffs" value={`${settings.playoffs.teams} teams · Wk ${settings.playoffs.startWeek}`} />
        </div>
      </Rise>

      <Segmented
        className="mb-4"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'standings', label: 'Standings' },
          { value: 'schedule', label: 'Schedule' },
        ]}
      />

      {tab === 'standings' ? (
        <Rise delay={60}>
          <Card className="overflow-hidden">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="border-b border-line bg-surface-2/60 text-left text-[11px] font-bold uppercase tracking-wider text-faint">
                  <th className="w-10 py-2.5 pl-4 text-center font-bold">#</th>
                  <th className="py-2.5 pl-2 font-bold">Team</th>
                  <th className="px-2 py-2.5 text-right font-bold">W-L</th>
                  <th className="px-2 py-2.5 text-right font-bold">PF</th>
                  <th className="hidden px-2 py-2.5 text-right font-bold sm:table-cell">PA</th>
                  <th className="hidden px-2 py-2.5 text-right font-bold md:table-cell">Diff</th>
                  <th className="hidden px-3 py-2.5 font-bold lg:table-cell">Form</th>
                  <th className="py-2.5 pl-2 pr-4 text-right font-bold">Strk</th>
                </tr>
              </thead>
              <tbody>
                {table.map((t, i) => {
                  const diff = t.pf - t.pa
                  return (
                    <tr
                      key={t.id}
                      className={clsx(
                        'border-b border-line last:border-0',
                        i === cut - 1 && 'border-b-2 border-b-accent/40',
                        t.id === MY_TEAM_ID && 'bg-accent-soft/50',
                      )}
                    >
                      <td className="py-3 pl-4 text-center">
                        <span
                          className={clsx(
                            'tnum inline-flex size-6 items-center justify-center rounded-full text-[12px] font-bold',
                            i < 2 ? 'bg-accent text-accent-ink' : i < cut ? 'bg-accent-soft text-accent-strong' : 'text-faint',
                          )}
                        >
                          {i + 1}
                        </span>
                      </td>
                      <td className="py-3 pl-2">
                        <Link to={`/matchup/${t.id}`} className="flex min-w-0 items-center gap-3">
                          <TeamAvatar team={t} size={32} />
                          <div className="min-w-0">
                            <div className="truncate font-semibold hover:underline">{t.name}</div>
                            <div className="text-[12px] text-muted">{t.manager}</div>
                          </div>
                        </Link>
                      </td>
                      <td className="tnum px-2 py-3 text-right font-semibold">
                        {t.wins}-{t.losses}
                      </td>
                      <td className="tnum px-2 py-3 text-right">{t.pf.toFixed(1)}</td>
                      <td className="tnum hidden px-2 py-3 text-right text-ink-2 sm:table-cell">{t.pa.toFixed(1)}</td>
                      <td className={clsx('tnum hidden px-2 py-3 text-right font-semibold md:table-cell', diff >= 0 ? 'text-win' : 'text-loss')}>
                        {diff >= 0 ? '+' : ''}
                        {diff.toFixed(1)}
                      </td>
                      <td className="hidden px-3 py-3 lg:table-cell">
                        <div className="flex gap-1">
                          {t.history.map((h) => (
                            <span
                              key={h.week}
                              title={`Wk ${h.week}: ${h.pf.toFixed(1)}–${h.pa.toFixed(1)}`}
                              className={clsx('size-2.5 rounded-full', h.pf > h.pa ? 'bg-win' : 'bg-loss/70')}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="py-3 pl-2 pr-4 text-right">
                        <span
                          className={clsx(
                            'tnum rounded-md px-1.5 py-0.5 text-[11.5px] font-bold',
                            t.streak.startsWith('W') ? 'bg-win-soft text-win' : 'bg-loss-soft text-loss',
                          )}
                        >
                          {t.streak}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Card>
          <p className="mt-3 flex items-center gap-2 px-1 text-[12.5px] text-muted">
            <span className="h-0.5 w-5 rounded bg-accent/50" /> Playoff line · top 2 earn a first-round bye
          </p>
        </Rise>
      ) : (
        <Rise delay={60} className="space-y-6">
          {Array.from({ length: CURRENT_WEEK }, (_, i) => CURRENT_WEEK - i).map((w) => (
            <div key={w}>
              <SectionTitle title={`Week ${w}`} sub={w === CURRENT_WEEK ? 'In progress' : 'Final'} />
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {scheduleFor(w).map(([a, b]) => {
                  const res = TEAMS[a].history.find((h) => h.week === w)
                  return (
                    <Link key={a} to={w === CURRENT_WEEK ? `/matchup/${a}` : '#'}>
                      <Card className="px-4 py-3 transition hover:border-line-strong">
                        {[
                          { t: TEAMS[a], s: res?.pf },
                          { t: TEAMS[b], s: res?.pa },
                        ].map(({ t, s }, k) => {
                          const won = res ? (k === 0 ? res.pf > res.pa : res.pa > res.pf) : false
                          return (
                            <div key={t.id} className="flex items-center gap-2.5 py-1">
                              <TeamAvatar team={t} size={24} />
                              <span className={clsx('flex-1 truncate text-[13.5px]', won ? 'font-semibold' : 'text-ink-2')}>{t.name}</span>
                              <span className={clsx('tnum text-[14px]', won ? 'font-bold' : 'text-muted')}>{s !== undefined ? s.toFixed(1) : '—'}</span>
                            </div>
                          )
                        })}
                      </Card>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </Rise>
      )}

      <Rise delay={120}>
        <Link to="/league/settings" className="group mt-8 block">
          <Card className="flex items-center gap-4 p-5 transition group-hover:border-line-strong">
            <div className="flex size-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <CalendarDays className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-semibold">Commissioner tools</div>
              <div className="text-[13px] text-muted">Scoring, rosters, waivers, trades, playoffs and draft — all configurable.</div>
            </div>
            <ChevronRight className="size-5 text-faint transition group-hover:translate-x-0.5" />
          </Card>
        </Link>
      </Rise>
    </div>
  )
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="min-w-[156px] px-4 py-3.5">
      <div className="flex items-center gap-1.5 text-[12px] font-medium text-muted">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-[15px] font-semibold">{value}</div>
    </Card>
  )
}
