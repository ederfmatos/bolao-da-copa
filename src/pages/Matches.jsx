import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMatches } from '../hooks/useMatches'
import { usePredictions } from '../hooks/usePredictions'
import { useMatchFilters } from '../hooks/useMatchFilters'
import { useScorerPrediction } from '../hooks/useScorerPrediction'
import MatchCard from '../components/MatchCard'
import MatchFilters from '../components/MatchFilters'

function Matches() {
  const [showFilters, setShowFilters] = useState(false)
  const { matches, predictionCounts, loading, error } = useMatches()
  const { predictions } = usePredictions()
  const { prediction, isPastDeadline } = useScorerPrediction()

  const {
    filters,
    availableTeams,
    availableDates,
    availableGroups,
    filteredMatches,
    setTeam,
    setDate,
    setGroup,
    clearFilters
  } = useMatchFilters(matches)

  if (loading) {
    return <div className="p-8 text-center text-gray-500 dark:text-dark-muted">Carregando partidas...</div>
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Erro: {error}</div>
  }

  const now = new Date()
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)

  const openMatches = filteredMatches.filter((m) => {
    const kickoffTime = new Date(m.kickoff_at)
    return m.status === 'scheduled' && kickoffTime > oneHourFromNow
  })

  const closedMatches = filteredMatches.filter((m) => {
    const kickoffTime = new Date(m.kickoff_at)
    return (m.status === 'scheduled' && kickoffTime <= oneHourFromNow) || m.status === 'live'
  })

  const finishedMatches = filteredMatches.filter((m) => m.status === 'finished')

  const predictedMatchIds = new Set(predictions.map((p) => p.match_id))

  const hasActiveFilters = filters.team || filters.date || filters.group
  const activeFiltersCount = [filters.team, filters.date, filters.group].filter(Boolean).length
  const noResults = filteredMatches.length === 0 && hasActiveFilters

  return (
    <div className="p-4 max-w-xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl text-gray-900 dark:text-dark-text">Partidas</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="relative p-2 rounded-lg bg-gray-100 dark:bg-dark-card hover:bg-gray-200 dark:hover:bg-dark-border transition-colors"
          aria-label={showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
        >
          <svg className="w-6 h-6 text-gray-700 dark:text-dark-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          {hasActiveFilters && (
            <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <MatchFilters
          filters={filters}
          availableTeams={availableTeams}
          availableDates={availableDates}
          availableGroups={availableGroups}
          onTeamChange={setTeam}
          onDateChange={setDate}
          onGroupChange={setGroup}
          onClearFilters={clearFilters}
          onClose={() => setShowFilters(false)}
        />
      )}

      {!isPastDeadline && (
        <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800 mb-4 flex items-center justify-between">
          {prediction ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-lg">⚽</span>
                <span className="text-primary-700 dark:text-primary-300">
                  Palpite no artilheiro enviado!
                </span>
              </div>
              <Link
                to="/artilheiro"
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium"
              >
                Ver detalhes
              </Link>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="text-lg">⚽</span>
                <span className="text-primary-700 dark:text-primary-300">
                  Palpite no artilheiro ainda aberto!
                </span>
              </div>
              <Link
                to="/artilheiro"
                className="text-sm bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
              >
                Escolher
              </Link>
            </>
          )}
        </div>
      )}

      {noResults && (
        <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg mb-4">
          <p className="m-0 text-yellow-800 dark:text-yellow-200">
            Nenhuma partida encontrada com os filtros selecionados.
          </p>
        </div>
      )}

      {!noResults && openMatches.length === 0 && !hasActiveFilters && (
        <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg mb-4">
          <p className="m-0 text-yellow-800 dark:text-yellow-200">
            Nenhuma partida aberta para palpites no momento.
          </p>
        </div>
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
