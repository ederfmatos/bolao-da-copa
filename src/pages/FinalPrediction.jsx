import { useState, useEffect } from 'react'
import { useBonusPrediction } from '../hooks/useBonusPrediction'
import { useAllBonusPredictions } from '../hooks/useAllBonusPredictions'
import { getValidTeams, deriveFourthPlace, TEAMS } from '../lib/bracketData'
import TeamPicker from '../components/TeamPicker'
import BonusScorePanel from '../components/BonusScorePanel'
import Avatar from '../components/Avatar'
import BonusPredictionRow from '../components/BonusPredictionRow'

const STEP_LABELS = ['Campeão', 'Vice-campeão', '3º lugar']
const STEP_POSITIONS = ['first', 'second', 'third']

function FinalPrediction() {
  const { prediction, isPastDeadline, savePrediction, loading, error } = useBonusPrediction()
  const { predictions: allPredictions, loading: allLoading } = useAllBonusPredictions()

  const [picks, setPicks] = useState({ first: null, second: null, third: null, fourth: null })
  const [activeStep, setActiveStep] = useState(0)
  const [showPicker, setShowPicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    if (prediction && !isPastDeadline) {
      setPicks({
        first: prediction.first_place,
        second: prediction.second_place,
        third: prediction.third_place,
        fourth: prediction.fourth_place,
      })
    }
  }, [prediction, isPastDeadline])

  useEffect(() => {
    if (picks.first && picks.second && picks.third && !picks.fourth) {
      const fourth = deriveFourthPlace(picks)
      if (fourth) {
        setPicks(prev => ({ ...prev, fourth }))
      }
    }
  }, [picks.first, picks.second, picks.third, picks.fourth])

  const handleSelectTeam = (teamName) => {
    const position = STEP_POSITIONS[activeStep]
    const newPicks = { ...picks, [position]: teamName }

    if (position === 'third') {
      newPicks.fourth = null
      const fourth = deriveFourthPlace(newPicks)
      if (fourth) newPicks.fourth = fourth
    }

    setPicks(newPicks)
    setShowPicker(false)

    if (activeStep < 2) {
      setActiveStep(prev => prev + 1)
    } else {
      setActiveStep(3)
    }
  }

  const handleClear = (position) => {
    const newPicks = { ...picks, [position]: null }
    const idx = STEP_POSITIONS.indexOf(position)
    for (let i = idx + 1; i < STEP_POSITIONS.length; i++) {
      newPicks[STEP_POSITIONS[i]] = null
    }
    newPicks.fourth = null
    setPicks(newPicks)
    setActiveStep(idx)
  }

  const handleSave = async () => {
    if (!picks.first || !picks.second || !picks.third || !picks.fourth) return

    setSaving(true)
    setMessage(null)
    try {
      await savePrediction({
        firstPlace: picks.first,
        secondPlace: picks.second,
        thirdPlace: picks.third,
        fourthPlace: picks.fourth,
      })
      setMessage({ type: 'success', text: 'Palpite salvo com sucesso!' })
    } catch (err) {
      setMessage({ type: 'error', text: `Erro ao salvar: ${err.message}` })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-dark-muted">
        Carregando...
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        {error}
      </div>
    )
  }

  if (isPastDeadline) {
    const currentTeams = prediction
      ? {
          firstPlace: prediction.first_place,
          secondPlace: prediction.second_place,
          thirdPlace: prediction.third_place,
          fourthPlace: prediction.fourth_place,
        }
      : null

    return (
      <div className="p-4 max-w-lg mx-auto space-y-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-dark-text">
          Palpites encerrados
        </h1>

        <BonusScorePanel />

        <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border p-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-dark-text mb-3">
            Seu palpite bônus
          </h2>
          {!currentTeams ? (
            <p className="text-sm text-gray-500 dark:text-dark-muted">
              Prazo encerrado — nenhum palpite enviado
            </p>
          ) : (
            <div className="space-y-2">
              {(['firstPlace', 'secondPlace', 'thirdPlace', 'fourthPlace']).map((key, i) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-lg">
                    {TEAMS.find(t => t.name === currentTeams[key])?.flag}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-dark-text">
                    {currentTeams[key]}
                  </span>
                  <span className="text-xs text-gray-400">
                    — {i + 1}º lugar
                  </span>
                  {prediction.bonus_points > 0 && (
                    <span className="text-green-500">✓</span>
                  )}
                </div>
              ))}
              {prediction.bonus_points > 0 && (
                <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/30 rounded text-sm text-green-700 dark:text-green-300">
                  {prediction.bonus_points} pontos bônus
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-dark-text p-4 pb-0">
            Palpites de todos
          </h2>
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
              {allPredictions.map(p => (
                <BonusPredictionRow key={p.userId} prediction={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  const currentPosition = STEP_POSITIONS[activeStep] || null
  const validTeams = currentPosition ? getValidTeams(currentPosition, picks) : []
  const isReadyToSave = !!(picks.first && picks.second && picks.third && picks.fourth)

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg p-3">
        <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
          ⏰ Você pode editar seu palpite até <strong>quinta-feira, 18/06 às 13:00</strong>
        </p>
      </div>

      <h1 className="text-xl font-bold text-gray-900 dark:text-dark-text">
        Palpite Bônus
      </h1>
      <p className="text-sm text-gray-500 dark:text-dark-muted">
        Escolha as 4 seleções que você acha que vão chegar às finais da Copa 2026
      </p>

      <BonusScorePanel />

      <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border p-4 space-y-3">
        {STEP_POSITIONS.map((pos, idx) => {
          const picked = picks[pos]
          const isActive = activeStep === idx
          const isLocked = idx > 0 && !picks[STEP_POSITIONS[idx - 1]]
          return (
            <div
              key={pos}
              onClick={() => {
                if (!isLocked) {
                  setActiveStep(idx)
                  setShowPicker(true)
                }
              }}
              className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-300 dark:border-primary-700'
                  : picked
                    ? 'bg-gray-50 dark:bg-dark-card border border-gray-200 dark:border-dark-border'
                    : 'bg-gray-50 dark:bg-dark-card border border-gray-200 dark:border-dark-border'
              } ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900 dark:text-dark-text">
                  {idx + 1}º lugar — {STEP_LABELS[idx]}
                </span>
                {picked && (
                  <span className="flex items-center gap-1">
                    <span>{TEAMS.find(t => t.name === picked)?.flag}</span>
                    <span className="text-sm text-gray-600 dark:text-dark-muted">{picked}</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {picked && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleClear(pos) }}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    ✕
                  </button>
                )}
                {!picked && !isLocked && (
                  <span className="text-gray-400">+</span>
                )}
              </div>
            </div>
          )
        })}

        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-dark-card border border-gray-200 dark:border-dark-border">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900 dark:text-dark-text">
              4º lugar
            </span>
            {picks.fourth ? (
              <span className="flex items-center gap-1">
                <span>{TEAMS.find(t => t.name === picks.fourth)?.flag}</span>
                <span className="text-sm text-gray-600 dark:text-dark-muted">
                  {picks.fourth}
                </span>
              </span>
            ) : (
              <span className="text-xs text-gray-400 dark:text-dark-muted">
                Preenchido automaticamente
              </span>
            )}
          </div>
        </div>
      </div>

      {activeStep === 3 && (
        <button
          onClick={handleSave}
          disabled={!isReadyToSave || saving}
          className="w-full py-3 px-4 rounded-lg text-white font-medium transition-colors bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {saving ? 'Salvando...' : 'Confirmar Palpite'}
        </button>
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

      {showPicker && (
        <TeamPicker
          teams={validTeams}
          onSelect={handleSelectTeam}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}

export default FinalPrediction
