import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useProfile } from './hooks/useProfile'
import BottomNavigation from './components/BottomNavigation'
import Login from './pages/Login.jsx'
import Home from './pages/Home.jsx'
import Matches from './pages/Matches.jsx'
import MatchDetails from './pages/MatchDetails.jsx'
import Leaderboard from './pages/Leaderboard.jsx'
import Rules from './pages/Rules.jsx'

function App() {
  const { user, loading } = useAuth()
  useProfile()

  if (loading) {
    return <div className="p-8 text-center">Carregando...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg pb-16">
      <Routes>
        <Route path="/" element={user ? <Navigate to="/matches" replace /> : <Login />} />
        <Route path="/home" element={<Navigate to="/matches" replace />} />
        <Route path="/matches" element={<><Matches /><BottomNavigation /></>} />
        <Route path="/match/:matchId" element={<><MatchDetails /><BottomNavigation /></>} />
        <Route path="/leaderboard" element={<><Leaderboard /><BottomNavigation /></>} />
        <Route path="/rules" element={<><Rules /><BottomNavigation /></>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
