import { useMatches } from '../hooks/useMatches'
import { usePredictions } from '../hooks/usePredictions'
import MatchCard from '../components/MatchCard'

function Matches() {
  const { matches, loading, error } = useMatches()
  const { predictions } = usePredictions()

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando partidas...</div>
  }

  if (error) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>Erro: {error}</div>
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
    <div style={{ padding: '1rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Partidas</h1>

      {openMatches.length === 0 && (
        <div style={{ padding: '1rem', backgroundColor: '#fff3cd', borderRadius: '8px', marginBottom: '1rem' }}>
          <p style={{ margin: 0 }}>Nenhuma partida aberta para palpites no momento.</p>
        </div>
      )}

      {openMatches.length > 0 && (
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: '#4caf50' }}>
            Abertas para Palpite ({openMatches.length})
          </h2>
          {openMatches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              hasPrediction={predictedMatchIds.has(match.id)}
            />
          ))}
        </section>
      )}

      {closedMatches.length > 0 && (
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: '#ff9800' }}>
            Fechadas ({closedMatches.length})
          </h2>
          {closedMatches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              hasPrediction={predictedMatchIds.has(match.id)}
            />
          ))}
        </section>
      )}

      {finishedMatches.length > 0 && (
        <section>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: '#9e9e9e' }}>
            Encerradas ({finishedMatches.length})
          </h2>
          {finishedMatches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              hasPrediction={predictedMatchIds.has(match.id)}
            />
          ))}
        </section>
      )}
    </div>
  )
}

export default Matches
