import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useScorerPlayers } from '../hooks/useScorerPlayers'
import { useScorerPrediction } from '../hooks/useScorerPrediction'
import { useAllScorerPredictions } from '../hooks/useAllScorerPredictions'
import { SCORER_DEADLINE } from '../lib/bracketData'
import ScorerPlayerCard from '../components/ScorerPlayerCard'
import Avatar from '../components/Avatar'

function Artilheiro() {
  const { user, signInWithGoogle } = useAuth()
  const { players, loading: playersLoading, error: playersError } = useScorerPlayers()
  const { prediction, isPastDeadline, savePrediction, loading: predLoading, error: predError } = useScorerPrediction()
  const { predictions: allPredictions, loading: allLoading } = useAllScorerPredictions()

  const [selectedPlayerId, setSelectedPlayerId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    if (prediction?.player_id) {
      setSelectedPlayerId(prediction.player_id)
    }
  }, [prediction])

  const handleSelectPlayer = async (playerId) => {
    if (!user || isPastDeadline || saving) return

    if (playerId === selectedPlayerId) return

    setSaving(true)
    setMessage(null)

    try {
      await savePrediction(playerId)
      setSelectedPlayerId(playerId)
      setMessage({ type: 'success', text: 'Palpite salvo com sucesso!' })
    } catch (err) {
      setMessage({ type: 'error', text: `Erro ao salvar: ${err.message}` })
    } finally {
      setSaving(false)
    }
  }

  const loading = playersLoading || predLoading

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-dark-muted">
        Carregando...
      </div>
    )
  }

  if (playersError || predError) {
    return (
      <div className="p-8 text-center text-red-500">
        {playersError || predError}
      </div>
    )
  }

  const deadlineDate = new Date(SCORER_DEADLINE)
  const deadlineFormatted = deadlineDate.toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })

  const getPlayerName = (playerId) => {
    return players.find(p => p.id === playerId)?.name ?? 'Jogador não encontrado'
  }

  const getPlayerFlag = (playerId) => {
    return players.find(p => p.id === playerId)?.flag ?? ''
  }

  if (isPastDeadline) {
    const sortedPlayers = [...players].sort((a, b) => {
      if (b.goals !== a.goals) return b.goals - a.goals
      return a.name.localeCompare(b.name)
    })

    const userPredictionPlayerId = prediction?.player_id

    return (
      <div className="p-4 max-w-lg mx-auto space-y-4">
        <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border p-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-dark-text mb-2">
            Artilheiro da Copa
          </h1>
          <div className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-600 dark:text-gray-300">
            🔒 Palpites encerrados
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-dark-border">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-dark-text">
              Artilheiros
            </h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-dark-border">
            {sortedPlayers.map((player, idx) => {
              const isUserPick = player.id === userPredictionPlayerId
              return (
                <div key={player.id} className="flex items-center gap-3 p-3">
                  <span className={`w-6 text-center text-sm font-bold ${
                    idx === 0 ? 'text-yellow-500' :
                    idx === 1 ? 'text-gray-400' :
                    idx === 2 ? 'text-amber-600' :
                    'text-gray-500'
                  }`}>
                    {idx + 1}
                  </span>
                  <span className="text-2xl">{player.flag}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-dark-text truncate">
                      {player.name}
                      {isUserPick && (
                        <span className="ml-2 inline-block px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded">
                          Seu palpite
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-dark-muted">
                      {player.nationality} — {player.position}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary-600 dark:text-primary-500">
                      {player.goals}
                    </p>
                    <p className="text-xs text-gray-400">gols</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-dark-border">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-dark-text">
              Palpites de todos
            </h2>
          </div>
          {allLoading ? (
            <div className="text-center text-sm text-gray-400 py-4">
              Carregando...
            </div>
          ) : allPredictions.length === 0 ? (
            <div className="text-center text-sm text-gray-400 dark:text-dark-muted py-4">
              Nenhum palpite enviado
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-dark-border">
              {allPredictions.map(p => {
                const isCurrentUser = p.userId === user?.id
                return (
                  <div key={p.userId} className="flex items-center gap-3 p-3">
                    <Avatar src={p.userAvatarUrl} name={p.userName} className="w-8 h-8" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-dark-text truncate">
                        {p.userName || 'Usuário'}
                        {isCurrentUser && (
                          <span className="ml-2 inline-block px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded">
                            Seu palpite
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-dark-muted">
                        {getPlayerFlag(p.playerId)} {getPlayerName(p.playerId)}
                      </p>
                    </div>
                    {p.scorerPoints > 0 && (
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs font-medium">
                        ✓ {p.scorerPoints} pts
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg p-3">
        <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
          ⏰ Você pode escolher o artilheiro da Copa até <strong>{deadlineFormatted}</strong>
        </p>
      </div>

      <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border p-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-dark-text mb-1">
          Artilheiro da Copa
        </h1>
        <p className="text-sm text-gray-500 dark:text-dark-muted">
          Escolha quem será o artilheiro da Copa do Mundo 2026
        </p>
      </div>

      {!user ? (
        <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border p-6 text-center">
          <p className="text-sm text-gray-500 dark:text-dark-muted mb-3">
            Faça login para escolher o artilheiro
          </p>
          <button
            onClick={signInWithGoogle}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Entrar com Google
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {players.map(player => (
              <div key={player.id} className="relative">
                {player.id === selectedPlayerId && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 px-2 py-0.5 bg-blue-500 text-white text-xs font-medium rounded-full whitespace-nowrap">
                    Seu palpite
                  </div>
                )}
                <ScorerPlayerCard
                  flag={player.flag}
                  name={player.name}
                  nationality={player.nationality}
                  position={player.position}
                  goals={player.goals}
                  isSelected={player.id === selectedPlayerId}
                  onClick={() => handleSelectPlayer(player.id)}
                  disabled={saving}
                />
              </div>
            ))}
          </div>

          {saving && (
            <div className="text-center text-sm text-gray-500 dark:text-dark-muted">
              Salvando...
            </div>
          )}

          {message && (
            <div
              className={`p-3 rounded-lg text-sm text-center ${
                message.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700'
                  : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700'
              }`}
            >
              {message.text}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Artilheiro
