import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { usePredictions } from '../hooks/usePredictions'
import { formatTimeRemaining } from '../lib/timeUtils'
import { useMatchPredictions } from '../hooks/useMatchPredictions'
import ScorePicker from '../components/ScorePicker'
import PredictionRow from '../components/PredictionRow'

function MatchDetails() {
  const { matchId } = useParams()
  const navigate = useNavigate()
  const { user, signInWithGoogle } = useAuth()
  const { predictions: userPredictions, savePrediction } = usePredictions()
  const { predictions: allPredictions, loading: socialLoading } = useMatchPredictions(matchId)

  const [match, setMatch] = useState(null)
  const [matchLoading, setMatchLoading] = useState(true)
  const [matchError, setMatchError] = useState(null)
  const [homeScore, setHomeScore] = useState(0)
  const [awayScore, setAwayScore] = useState(0)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    if (!matchId) return

    async function fetchMatch() {
      try {
        const { data, error } = await supabase
          .from('matches')
          .select('*')
          .eq('id', matchId)
          .single()

        if (error) throw error
        setMatch(data)
      } catch (err) {
        setMatchError(err.message)
      } finally {
        setMatchLoading(false)
      }
    }

    fetchMatch()
  }, [matchId])

  const userPrediction = userPredictions.find((p) => p.match_id === matchId)

  useEffect(() => {
    if (userPrediction) {
      setHomeScore(userPrediction.home_score)
      setAwayScore(userPrediction.away_score)
    } else {
      setHomeScore(0)
      setAwayScore(0)
    }
  }, [userPrediction])

  const matchTimes = useMemo(() => {
    if (!match) return null

    const kickoffTime = new Date(match.kickoff_at)
    const oneHourBefore = new Date(kickoffTime.getTime() - 60 * 60 * 1000)
    const threeHoursBefore = new Date(kickoffTime.getTime() - 3 * 60 * 60 * 1000)

    return { kickoffTime, oneHourBefore, threeHoursBefore }
  }, [match])

  const now = useMemo(() => new Date(), [])

  const isFinished = match?.status === 'finished'
  const isLive = match?.status === 'live'
  const isDeadlinePassed = matchTimes && now >= matchTimes.oneHourBefore
  const isEditable = !isFinished && !isLive && !isDeadlinePassed
  const isWithinThreeHours = matchTimes && now >= matchTimes.threeHoursBefore && !isDeadlinePassed && !isLive && !isFinished
  const canSeeOtherPredictions = isDeadlinePassed || isLive || isFinished

  const otherPredictions = allPredictions.filter((p) => p.user_id !== user?.id)

  const handleSave = async () => {
    if (!isEditable) return

    setSaving(true)
    setMessage(null)

    try {
      await savePrediction(matchId, homeScore, awayScore)
      setMessage({ type: 'success', text: 'Palpite salvo com sucesso!' })
    } catch (error) {
      if (error.message.includes('deadline') || error.code === '42501') {
        setMessage({
          type: 'error',
          text: 'Prazo encerrado. Não é possível salvar palpites com menos de 1 hora para o início da partida.',
        })
      } else {
        setMessage({ type: 'error', text: `Erro ao salvar: ${error.message}` })
      }
    } finally {
      setSaving(false)
    }
  }

  if (matchLoading) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-dark-muted">
        Carregando...
      </div>
    )
  }

  if (matchError || !match) {
    return (
      <div className="p-8 text-center text-red-500">
        {matchError || 'Partida não encontrada'}
      </div>
    )
  }

  const kickoffDate = new Date(match.kickoff_at)
  const localTime = kickoffDate.toLocaleString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-gray-500 dark:text-dark-muted hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        ← Voltar
      </button>

      <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border p-5">
        <div className="text-center mb-2">
          {match.group_name && (
            <div className="text-xs text-gray-500 dark:text-dark-muted uppercase tracking-wide mb-1">
              {match.group_name}
            </div>
          )}
          <div className="flex items-center justify-center gap-3 text-lg font-bold text-gray-900 dark:text-dark-text">
            <span className="flex items-center gap-2">
              {match.home_flag} {match.home_team}
            </span>
            {isFinished && match.home_score != null ? (
              <span className="tabular-nums">
                {match.home_score} × {match.away_score}
              </span>
            ) : (
              <span className="text-gray-400">×</span>
            )}
            <span className="flex items-center gap-2">
              {match.away_flag} {match.away_team}
            </span>
          </div>
          <div className="text-sm text-gray-500 dark:text-dark-muted mt-1">
            {localTime}
          </div>
          {isFinished && (
            <div className="mt-2 inline-block px-3 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-medium rounded-full">
              Finalizada
            </div>
          )}
          {isLive && (
            <div className="mt-2 inline-block px-3 py-0.5 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-xs font-medium rounded-full">
              Ao vivo
            </div>
          )}
        </div>
      </div>

      {isWithinThreeHours && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg text-center text-sm text-yellow-700 dark:text-yellow-300">
          ⚠️ Atenção: partida começando em {formatTimeRemaining(matchTimes.kickoffTime)}
        </div>
      )}

      {!isEditable && !isFinished && !isLive && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-center text-sm text-red-700 dark:text-red-300">
          🔒 Palpites encerrados para esta partida
        </div>
      )}

      {isEditable && (
        <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border p-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-dark-text mb-3">
            Seu palpite
          </h2>
          {!user ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 dark:text-dark-muted mb-3">
                Faça login para salvar seu palpite
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
              <ScorePicker
                homeScore={homeScore}
                awayScore={awayScore}
                onChange={(h, a) => {
                  setHomeScore(h)
                  setAwayScore(a)
                }}
                disabled={!isEditable}
              />
              {isEditable && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="mt-4 w-full py-2.5 px-4 rounded-lg text-white font-medium text-sm transition-colors bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  {saving ? 'Salvando...' : 'Salvar Palpite'}
                </button>
              )}
              {message && (
                <div
                  className={`mt-3 p-3 rounded-lg text-sm text-center ${message.type === 'success'
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
      )}

      {canSeeOtherPredictions && (
        <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-dark-text">
              Palpites da galera
            </h2>
            <span className="text-xs text-gray-500 dark:text-dark-muted bg-gray-100 dark:bg-dark-border px-2 py-0.5 rounded-full">
              {allPredictions.length} {allPredictions.length === 1 ? 'palpite' : 'palpites'}
            </span>
          </div>

          {socialLoading ? (
            <div className="text-center text-sm text-gray-400 py-4">Carregando palpites...</div>
          ) : otherPredictions.length === 0 && !userPrediction ? (
            <div className="text-center text-sm text-gray-400 dark:text-dark-muted py-4">
              Nenhum palpite ainda. Seja o primeiro!
            </div>
          ) : (
            <div className="space-y-2">
              {userPrediction && (
                <PredictionRow
                  prediction={{
                    ...userPrediction,
                    user_name: user?.user_metadata?.full_name || 'Você',
                    user_avatar_url: user?.user_metadata?.avatar_url || null,
                  }}
                  isCurrentUser
                  isFinished={isFinished}
                />
              )}
              {otherPredictions.map((p) => (
                <PredictionRow
                  key={p.prediction_id}
                  prediction={p}
                  isCurrentUser={false}
                  isFinished={isFinished}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MatchDetails
