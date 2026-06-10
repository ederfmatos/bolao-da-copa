import { useMatches } from '../hooks/useMatches'
import { usePredictions } from '../hooks/usePredictions'
import MatchCard from '../components/MatchCard'

function Matches() {
  const { matches, predictionCounts, loading, error } = useMatches()
  const { predictions } = usePredictions()

  if (loading) {
    return <div className="p-8 text-center text-gray-500 dark:text-dark-muted">Carregando partidas...</div>
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Erro: {error}</div>
  }

  const now = new Date()
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)

  const openMatches = matches.filter((m) => {
    const kickoffTime = new Date(m.kickoff_at)
    return m.status === 'scheduled' && kickoffTime > oneHourFromNow
  })

  const closedMatches = matches.filter((m) => {
    const kickoffTime = new Date(m.kickoff_at)
    return (m.status === 'scheduled' && kickoffTime <= oneHourFromNow) || m.status === 'live'
  })

  const finishedMatches = matches.filter((m) => m.status === 'finished')

  const predictedMatchIds = new Set(predictions.map((p) => p.match_id))

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl mb-4 text-gray-900 dark:text-dark-text">Partidas</h1>

      {openMatches.length === 0 && (
        <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg mb-4">
          <p className="m-0 text-yellow-800 dark:text-yellow-200">
            Nenhuma partida aberta para palpites no momento.
          </p>
        </div>
      )}

      {openMatches.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl mb-3 text-primary-600 dark:text-primary-500">
            Abertas para Palpite ({openMatches.length})
          </h2>
          {openMatches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              hasPrediction={predictedMatchIds.has(match.id)}
              predictionCount={predictionCounts[match.id] || 0}
            />
          ))}
        </section>
      )}

      {closedMatches.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl mb-3 text-accent-orange dark:text-orange-400">
            Fechadas ({closedMatches.length})
          </h2>
          {closedMatches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              hasPrediction={predictedMatchIds.has(match.id)}
              predictionCount={predictionCounts[match.id] || 0}
            />
          ))}
        </section>
      )}

      {finishedMatches.length > 0 && (
        <section>
          <h2 className="text-xl mb-3 text-gray-400 dark:text-dark-muted">
            Encerradas ({finishedMatches.length})
          </h2>
          {finishedMatches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              hasPrediction={predictedMatchIds.has(match.id)}
              predictionCount={predictionCounts[match.id] || 0}
            />
          ))}
        </section>
      )}
    </div>
  )
}

export default Matches
