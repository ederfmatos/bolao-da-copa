import { useLeaderboard } from '../hooks/useLeaderboard'
import { useAuth } from '../hooks/useAuth'
import LeaderboardRow from '../components/LeaderboardRow'
import Podium from '../components/Podium'

function Leaderboard() {
  const { leaderboard, loading, error } = useLeaderboard()
  const { user } = useAuth()

  if (loading) {
    return <div className="p-8 text-center text-gray-500 dark:text-dark-muted">Carregando classificação...</div>
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Erro: {error}</div>
  }

  if (leaderboard.length === 0) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl mb-4 text-gray-900 dark:text-dark-text">Classificação</h1>
        <p className="text-gray-400 dark:text-dark-muted">Nenhum palpite registrado ainda.</p>
        <p className="text-gray-400 dark:text-dark-muted">Seja o primeiro a palpitar!</p>
      </div>
    )
  }

  const top3 = leaderboard.slice(0, 3)
  const rest = leaderboard.slice(3)

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl mb-4 text-center text-gray-900 dark:text-dark-text">
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
