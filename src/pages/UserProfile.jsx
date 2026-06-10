import { useParams, useNavigate } from 'react-router-dom'
import { useUserPredictions } from '../hooks/useUserPredictions'
import { useLeaderboard } from '../hooks/useLeaderboard'
import UserProfileHeader from '../components/UserProfileHeader'
import UserStats from '../components/UserStats'
import UserPredictionRow from '../components/UserPredictionRow'

function UserProfile() {
  const { userId } = useParams()
  const navigate = useNavigate()

  const { predictions, loading: predictionsLoading, error: predictionsError } = useUserPredictions(userId)
  const { leaderboard, loading: leaderboardLoading, error: leaderboardError } = useLeaderboard()

  const loading = predictionsLoading || leaderboardLoading
  const error = predictionsError || leaderboardError

  const leaderboardEntry =
    !leaderboardLoading && leaderboard.length > 0
      ? leaderboard.find((entry) => entry.user_id === userId) || null
      : null

  const rank = leaderboardEntry
    ? leaderboard.findIndex((entry) => entry.user_id === userId) + 1
    : null

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-dark-muted">
        Carregando perfil...
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        Erro ao carregar perfil: {error}
      </div>
    )
  }

  if (!leaderboardEntry) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-dark-muted">
        Usuário não encontrado
      </div>
    )
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-gray-500 dark:text-dark-muted hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        ← Voltar
      </button>

      <UserProfileHeader
        name={leaderboardEntry.name}
        avatarUrl={leaderboardEntry.avatar_url}
        totalPoints={leaderboardEntry.total_points}
        rank={rank}
      />

      <UserStats predictions={predictions} />

      <div className="pt-2">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-dark-text mb-3">
          Histórico de Palpites
        </h2>

        {predictions.length === 0 ? (
          <div className="text-center text-sm text-gray-400 dark:text-dark-muted py-8">
            Nenhum palpite registrado
          </div>
        ) : (
          predictions.map((prediction) => (
            <UserPredictionRow key={prediction.prediction_id} prediction={prediction} />
          ))
        )}
      </div>
    </div>
  )
}

export default UserProfile
