# huddle — fantasy football prototype

A front-end-only prototype of a fantasy football app: Yahoo-level simplicity, Sleeper-level depth on league settings and player stats, and mobile first.

**Stack:** React 19 · Vite · Tailwind CSS v4 · React Router · lucide icons. No backend; a deterministic mock league is generated in `src/data/mock.ts`.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static build in dist/ (hash routing, deployable anywhere)
```

## Screens

| Route | What's there |
| --- | --- |
| `#/` Home | Live matchup hero with win probability, lineup alerts, league scoreboard, standings snapshot, transaction feed |
| `#/matchup` | Head-to-head scoreboard, slot-by-slot comparison, bench, switch between all matchups |
| `#/team` | Tap-to-swap lineup editor (eligible slots light up), one-tap Optimize, season results strip, bench/IR |
| `#/players` | Search, position filters, available/all/watchlist, sorting; full stat table on desktop, compact list on mobile |
| Player sheet | Bottom sheet on mobile, modal on desktop: weekly points chart, news, season stats, roster %, trends, add/drop/trade |
| `#/league` | Standings with playoff line and form, full schedule |
| `#/league/settings` | Commissioner settings: general, roster slots, scoring presets with per-stat tuning, waivers (FAAB/rolling/reverse), trades, playoff bracket preview, draft. Changes wait in a draft until you save. |

Light, dark and system themes are supported (toggle in the sidebar, or the header icon on mobile).

## Layout

- `src/data/` has the mock league generator and the settings schema
- `src/lib/store.tsx` holds client state (lineup, adds/drops, watchlist, settings, theme, toasts)
- `src/components/` has the design primitives (`ui.tsx`), app shell, player sheet and charts
- `src/pages/` has one file per screen

All players and NFL franchises are fictional.
