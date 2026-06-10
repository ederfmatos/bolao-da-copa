import { useLeaderboard } from '../hooks/useLeaderboard'
import { useAuth } from '../hooks/useAuth'
import LeaderboardRow from '../components/LeaderboardRow'
import Podium from '../components/Podium'

function Leaderboard() {
  const { leaderboard, loading, error } = useLeaderboard()
  const { user } = useAuth()

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando classificação...</div>
  }

  if (error) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>Erro: {error}</div>
  }

  if (leaderboard.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Classificação</h1>
        <p style={{ color: '#666' }}>Nenhum palpite registrado ainda.</p>
        <p style={{ color: '#666' }}>Seja o primeiro a palpitar!</p>
      </div>
    )
  }

  const top3 = leaderboard.slice(0, 3)
  const rest = leaderboard.slice(3)

  return (
    <div style={{ padding: '1rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem', textAlign: 'center' }}>
        Classificação
      </h1>

      {top3.length === 3 && <Podium top3={top3} />}

      {top3.map((entry, idx) => (
        <LeaderboardRow
          key={entry.user_id}
          entry={entry}
          rank={idx + 1}
          isCurrentUser={entry.user_id === user?.id}
        />
      ))}

      {rest.map((entry, idx) => (
        <LeaderboardRow
          key={entry.user_id}
          entry={entry}
          rank={idx + 4}
          isCurrentUser={entry.user_id === user?.id}
        />
      ))}
    </div>
  )
}

export default Leaderboard
