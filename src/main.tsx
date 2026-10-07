import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { StoreProvider } from './lib/store'
import { Home } from './pages/Home'
import { League } from './pages/League'
import { Matchup } from './pages/Matchup'
import { Players } from './pages/Players'
import { Settings } from './pages/Settings'
import { Team } from './pages/Team'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="matchup" element={<Matchup />} />
            <Route path="matchup/:teamId" element={<Matchup />} />
            <Route path="team" element={<Team />} />
            <Route path="players" element={<Players />} />
            <Route path="league" element={<League />} />
            <Route path="league/settings" element={<Settings />} />
          </Route>
        </Routes>
      </HashRouter>
    </StoreProvider>
  </StrictMode>,
)
