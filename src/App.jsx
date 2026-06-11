import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useProfile } from './hooks/useProfile'
import ProtectedRoute from './components/ProtectedRoute'
import BottomNavigation from './components/BottomNavigation'
import NotificationPrompt from './components/NotificationPrompt'
import NotificationBell from './components/NotificationBell'
import Login from './pages/Login.jsx'
import Home from './pages/Home.jsx'
import Matches from './pages/Matches.jsx'
import MatchDetails from './pages/MatchDetails.jsx'
import Leaderboard from './pages/Leaderboard.jsx'
import Rules from './pages/Rules.jsx'
import UserProfile from './pages/UserProfile.jsx'

function App() {
  const { user, loading } = useAuth()
  useProfile()

  if (loading) {
    return <div className="p-8 text-center">Carregando...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg pb-16">
      {user && (
        <header className="sticky top-0 z-40 bg-white dark:bg-dark-card border-b border-gray-200 dark:border-dark-border">
          <div className="flex items-center justify-end px-4 h-12 max-w-lg mx-auto">
            <NotificationBell />
          </div>
        </header>
      )}
      {user && <NotificationPrompt />}
      <Routes>
        <Route path="/" element={user ? <Navigate to="/matches" replace /> : <Login />} />
        <Route path="/home" element={<Navigate to="/matches" replace />} />
        <Route path="/matches" element={<><Matches /><BottomNavigation /></>} />
        <Route path="/match/:matchId" element={<><MatchDetails /><BottomNavigation /></>} />
        <Route path="/leaderboard" element={<><Leaderboard /><BottomNavigation /></>} />
        <Route path="/rules" element={<><Rules /><BottomNavigation /></>} />
        <Route path="/user/:userId" element={<ProtectedRoute><><UserProfile /><BottomNavigation /></></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
