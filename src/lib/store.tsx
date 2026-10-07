import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { MY_TEAM_ID, TEAMS, isRostered, optimalLineup, playerById } from '../data/mock'
import { DEFAULT_SETTINGS, type LeagueSettings } from '../data/settings'

type Theme = 'light' | 'dark' | 'system'

interface Toast {
  id: number
  text: string
  tone?: 'default' | 'win' | 'loss'
}

interface Store {
  lineup: Record<string, string | null>
  bench: string[]
  ir: string[]
  setRoster: (lineup: Record<string, string | null>, bench: string[]) => void
  optimize: () => void
  addPlayer: (id: string, dropId?: string) => void
  dropPlayer: (id: string) => void
  isMine: (id: string) => boolean
  isAvailable: (id: string) => boolean
  watchlist: Set<string>
  toggleWatch: (id: string) => void
  openPlayer: string | null
  setOpenPlayer: (id: string | null) => void
  settings: LeagueSettings
  setSettings: (s: LeagueSettings) => void
  theme: Theme
  setTheme: (t: Theme) => void
  toasts: Toast[]
  toast: (text: string, tone?: Toast['tone']) => void
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const me = TEAMS[MY_TEAM_ID]
  const [lineup, setLineup] = useState(me.lineup)
  const [bench, setBench] = useState(me.bench)
  const [ir] = useState(me.ir)
  const [added, setAdded] = useState<Set<string>>(new Set())
  const [dropped, setDropped] = useState<Set<string>>(new Set())
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set())
  const [openPlayer, setOpenPlayer] = useState<string | null>(null)
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      return (localStorage.getItem('huddle-theme') as Theme) || 'system'
    } catch {
      return 'system'
    }
  })

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && mq.matches)
      document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    try {
      localStorage.setItem('huddle-theme', t)
    } catch {
      /* ignore */
    }
  }, [])

  const toast = useCallback((text: string, tone: Toast['tone'] = 'default') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, text, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600)
  }, [])

  const setRoster = useCallback((l: Record<string, string | null>, b: string[]) => {
    setLineup(l)
    setBench(b)
  }, [])

  const optimize = useCallback(() => {
    const all = [...(Object.values(lineup).filter(Boolean) as string[]), ...bench]
    const next = optimalLineup(all)
    const starters = new Set(Object.values(next).filter(Boolean))
    setLineup(next)
    setBench(all.filter((id) => !starters.has(id)))
  }, [lineup, bench])

  const isMine = useCallback(
    (id: string) => Object.values(lineup).includes(id) || bench.includes(id) || ir.includes(id),
    [lineup, bench, ir],
  )
  const isAvailable = useCallback(
    (id: string) => (!isRostered(id) && !added.has(id)) || dropped.has(id),
    [added, dropped],
  )

  const dropPlayer = useCallback(
    (id: string) => {
      setLineup((l) => Object.fromEntries(Object.entries(l).map(([k, v]) => [k, v === id ? null : v])))
      setBench((b) => b.filter((x) => x !== id))
      setDropped((d) => new Set(d).add(id))
      setAdded((a) => {
        const n = new Set(a)
        n.delete(id)
        return n
      })
    },
    [],
  )

  const addPlayer = useCallback(
    (id: string, dropId?: string) => {
      if (dropId) dropPlayer(dropId)
      setBench((b) => [...b, id])
      setAdded((a) => new Set(a).add(id))
      setDropped((d) => {
        const n = new Set(d)
        n.delete(id)
        return n
      })
      toast(`${playerById[id].name} added to your bench`, 'win')
    },
    [dropPlayer, toast],
  )

  const toggleWatch = useCallback((id: string) => {
    setWatchlist((w) => {
      const n = new Set(w)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }, [])

  const value = useMemo<Store>(
    () => ({
      lineup, bench, ir, setRoster, optimize, addPlayer, dropPlayer, isMine, isAvailable,
      watchlist, toggleWatch, openPlayer, setOpenPlayer, settings, setSettings, theme, setTheme, toasts, toast,
    }),
    [lineup, bench, ir, setRoster, optimize, addPlayer, dropPlayer, isMine, isAvailable, watchlist, toggleWatch,
      openPlayer, settings, theme, setTheme, toasts, toast],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore outside provider')
  return s
}
