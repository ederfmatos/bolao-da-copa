import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login.jsx'
import Home from './pages/Home.jsx'
import Matches from './pages/Matches.jsx'
import Predict from './pages/Predict.jsx'
import Leaderboard from './pages/Leaderboard.jsx'
import Rules from './pages/Rules.jsx'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</div>
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/matches" replace /> : <Login />} />
      <Route path="/home" element={<Navigate to="/matches" replace />} />
      <Route
        path="/matches"
        element={
          <ProtectedRoute>
            <Matches />
          </ProtectedRoute>
        }
      />
      <Route
        path="/predict/:matchId"
        element={
          <ProtectedRoute>
            <Predict />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leaderboard"
        element={
          <ProtectedRoute>
            <Leaderboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/rules"
        element={
          <ProtectedRoute>
            <Rules />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
