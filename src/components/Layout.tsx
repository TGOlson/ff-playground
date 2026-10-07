import clsx from 'clsx'
import { Bell, ChevronsUpDown, Flame, House, Moon, Search, Settings2, Shirt, Sun, Swords, Trophy, Monitor } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { CURRENT_WEEK, LEAGUE_NAME, MY_TEAM_ID, SEASON, TEAMS } from '../data/mock'
import { useStore } from '../lib/store'
import { PlayerSheet } from './PlayerSheet'
import { IconButton, TeamAvatar } from './ui'

const NAV = [
  { to: '/', label: 'Home', icon: House, end: true },
  { to: '/matchup', label: 'Matchup', icon: Swords },
  { to: '/team', label: 'My Team', icon: Shirt },
  { to: '/players', label: 'Players', icon: Search },
  { to: '/league', label: 'League', icon: Trophy },
]

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <div className="flex size-8 items-center justify-center rounded-[10px] bg-accent text-accent-ink">
        <svg viewBox="0 0 32 32" className="size-5">
          <path d="M6 24c4-11 12-16 20-16-1.5 6-6.5 14-20 16Z" fill="currentColor" />
          <path d="M11 21l8-8" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </div>
      <span className="text-[19px] font-bold tracking-[-0.03em]">huddle</span>
    </Link>
  )
}

function ThemeSwitch({ compact }: { compact?: boolean }) {
  const { theme, setTheme } = useStore()
  const opts = [
    { v: 'light' as const, icon: Sun },
    { v: 'system' as const, icon: Monitor },
    { v: 'dark' as const, icon: Moon },
  ]
  if (compact) {
    const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
    const Icon = opts.find((o) => o.v === theme)!.icon
    return (
      <IconButton onClick={() => setTheme(next)} aria-label="Toggle theme">
        <Icon className="size-[18px]" />
      </IconButton>
    )
  }
  return (
    <div className="flex rounded-xl bg-surface-2 p-1">
      {opts.map(({ v, icon: Icon }) => (
        <button
          key={v}
          onClick={() => setTheme(v)}
          aria-label={`${v} theme`}
          className={clsx(
            'flex h-7 flex-1 items-center justify-center rounded-lg transition',
            theme === v ? 'bg-surface text-ink shadow-card ring-1 ring-line' : 'text-muted hover:text-ink',
          )}
        >
          <Icon className="size-3.5" />
        </button>
      ))}
    </div>
  )
}

function LeagueSwitcher() {
  const me = TEAMS[MY_TEAM_ID]
  return (
    <button className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface p-2.5 text-left transition hover:border-line-strong">
      <TeamAvatar team={me} size={36} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13.5px] font-semibold">{LEAGUE_NAME}</div>
        <div className="truncate text-xs text-muted">
          {me.name} · {me.wins}-{me.losses}
        </div>
      </div>
      <ChevronsUpDown className="size-4 text-faint" />
    </button>
  )
}

function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-[264px] shrink-0 flex-col gap-6 border-r border-line bg-bg px-4 py-6 lg:flex">
      <div className="px-2">
        <Logo />
      </div>
      <LeagueSwitcher />
      <nav className="flex flex-col gap-0.5">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              clsx(
                'group flex h-10 items-center gap-3 rounded-xl px-3 text-[14px] font-semibold transition',
                isActive ? 'bg-surface text-ink shadow-card ring-1 ring-line' : 'text-muted hover:bg-surface-2 hover:text-ink',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={clsx('size-[18px]', isActive ? 'text-accent' : '')} strokeWidth={isActive ? 2.4 : 2} />
                {label}
              </>
            )}
          </NavLink>
        ))}
        <NavLink
          to="/gauntlet"
          className={({ isActive }) =>
            clsx(
              'mt-2 flex h-10 items-center gap-3 rounded-xl px-3 text-[14px] font-semibold transition',
              isActive ? 'bg-surface text-ink shadow-card ring-1 ring-line' : 'text-muted hover:bg-surface-2 hover:text-ink',
            )
          }
        >
          <Flame className="size-[18px]" />
          The Gauntlet
          <span className="ml-auto rounded-md bg-loss-soft px-1.5 py-0.5 text-[10px] font-bold text-loss">NEW</span>
        </NavLink>
        <NavLink
          to="/league/settings"
          className={({ isActive }) =>
            clsx(
              'flex h-10 items-center gap-3 rounded-xl px-3 text-[14px] font-semibold transition',
              isActive ? 'bg-surface text-ink shadow-card ring-1 ring-line' : 'text-muted hover:bg-surface-2 hover:text-ink',
            )
          }
        >
          <Settings2 className="size-[18px]" />
          League settings
        </NavLink>
      </nav>
      <div className="mt-auto space-y-3">
        <div className="rounded-2xl bg-accent-soft p-4">
          <div className="text-[13px] font-semibold text-accent-strong">Waivers process Wed 3:00a</div>
          <div className="mt-1 text-xs leading-relaxed text-ink-2">
            You're #{TEAMS[MY_TEAM_ID].waiverPriority} in priority with ${TEAMS[MY_TEAM_ID].faab} FAAB left.
          </div>
        </div>
        <ThemeSwitch />
      </div>
    </aside>
  )
}

function MobileHeader() {
  const me = TEAMS[MY_TEAM_ID]
  return (
    <header className="pt-safe sticky top-0 z-30 border-b border-line/70 bg-bg/85 backdrop-blur-xl lg:hidden">
      <div className="flex h-14 items-center gap-2 px-4">
        <TeamAvatar team={me} size={32} />
        <button className="flex min-w-0 flex-1 flex-col items-start text-left">
          <span className="flex items-center gap-1 text-[15px] font-semibold leading-tight">
            <span className="truncate">{LEAGUE_NAME}</span>
            <ChevronsUpDown className="size-3.5 shrink-0 text-faint" />
          </span>
          <span className="text-[11.5px] font-medium text-muted">
            Week {CURRENT_WEEK} · {SEASON}
          </span>
        </button>
        <ThemeSwitch compact />
        <IconButton aria-label="Notifications" className="relative">
          <Bell className="size-[18px]" />
          <span className="absolute right-2 top-2 size-2 rounded-full border-2 border-bg bg-loss" />
        </IconButton>
      </div>
    </header>
  )
}

function TabBar() {
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line/70 bg-surface/85 backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid h-16 max-w-lg grid-cols-5">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center justify-center gap-1 text-[10.5px] font-semibold transition active:scale-95',
                isActive ? 'text-accent' : 'text-faint',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={clsx(
                    'flex h-7 w-12 items-center justify-center rounded-full transition-colors',
                    isActive && 'bg-accent-soft',
                  )}
                >
                  <Icon className="size-[20px]" strokeWidth={isActive ? 2.4 : 2} />
                </span>
                {label === 'My Team' ? 'Team' : label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

function Toasts() {
  const { toasts } = useStore()
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-8">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="animate-rise rounded-full bg-ink px-4 py-2.5 text-[13.5px] font-semibold text-surface shadow-pop"
        >
          {t.text}
        </div>
      ))}
    </div>
  )
}

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo(0, 0), [pathname])
  return null
}

export function Layout() {
  return (
    <div className="flex min-h-dvh">
      <ScrollTop />
      <Sidebar />
      <div className="min-w-0 flex-1">
        <MobileHeader />
        <main className="mx-auto w-full max-w-[1180px] px-4 pb-28 pt-5 sm:px-6 lg:px-10 lg:pb-16 lg:pt-10">
          <Outlet />
        </main>
      </div>
      <TabBar />
      <PlayerSheet />
      <Toasts />
    </div>
  )
}

export function Rise({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <div className={clsx('animate-rise', className)} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}
