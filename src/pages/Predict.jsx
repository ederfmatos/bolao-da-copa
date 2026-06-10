import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { usePredictions } from '../hooks/usePredictions'
import ScorePicker from '../components/ScorePicker'

function Predict() {
  const { matchId } = useParams()
  const navigate = useNavigate()
  const { savePrediction, predictions } = usePredictions()
  
  const [match, setMatch] = useState(null)
  const [homeScore, setHomeScore] = useState(0)
  const [awayScore, setAwayScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    async function fetchMatch() {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single()

      if (error) {
        setMessage({ type: 'error', text: 'Partida não encontrada' })
        setLoading(false)
        return
      }

      setMatch(data)
      setLoading(false)
    }

    fetchMatch()
  }, [matchId])

  useEffect(() => {
    const existing = predictions.find((p) => p.match_id === matchId)
    if (existing) {
      setHomeScore(existing.home_score)
      setAwayScore(existing.away_score)
    }
  }, [predictions, matchId])

  const now = new Date()
  const kickoffTime = match ? new Date(match.kickoff_at) : null
  const threeHoursBefore = kickoffTime ? new Date(kickoffTime.getTime() - 3 * 60 * 60 * 1000) : null
  const oneHourBefore = kickoffTime ? new Date(kickoffTime.getTime() - 60 * 60 * 1000) : null
  
  const isWithinThreeHours = threeHoursBefore && now >= threeHoursBefore && now < oneHourBefore
  const isClosed = oneHourBefore && now >= oneHourBefore

  const handleSave = async () => {
    if (isClosed) return

    setSaving(true)
    setMessage(null)

    try {
      await savePrediction(matchId, homeScore, awayScore)
      setMessage({ type: 'success', text: 'Palpite salvo com sucesso!' })
      setTimeout(() => navigate('/matches'), 1500)
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

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</div>
  }

  if (!match) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Partida não encontrada</div>
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
    <div style={{ padding: '1rem', maxWidth: '600px', margin: '0 auto' }}>
      <button
        onClick={() => navigate('/matches')}
        style={{
          marginBottom: '1rem',
          padding: '0.5rem 1rem',
          backgroundColor: '#f5f5f5',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        ← Voltar
      </button>

      <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
            {match.group_name}
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {match.home_team} × {match.away_team}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>{localTime}</div>
        </div>

        {isWithinThreeHours && !isClosed && (
          <div style={{ padding: '0.75rem', backgroundColor: '#fff3cd', borderRadius: '4px', marginBottom: '1rem', textAlign: 'center' }}>
            ⚠️ Atenção: partida começando em menos de 3 horas!
          </div>
        )}

        {isClosed && (
          <div style={{ padding: '0.75rem', backgroundColor: '#f8d7da', borderRadius: '4px', marginBottom: '1rem', textAlign: 'center' }}>
            🔒 Palpites encerrados para esta partida
          </div>
        )}

        <div style={{ marginBottom: '1.5rem' }}>
          <ScorePicker
            homeScore={homeScore}
            awayScore={awayScore}
            onChange={(h, a) => {
              setHomeScore(h)
              setAwayScore(a)
            }}
            disabled={isClosed}
          />
        </div>

        {!isClosed && (
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '1rem',
              backgroundColor: saving ? '#ccc' : '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Salvando...' : 'Salvar Palpite'}
          </button>
        )}

        {message && (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.75rem',
              borderRadius: '4px',
              textAlign: 'center',
              backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
              color: message.type === 'success' ? '#155724' : '#721c24',
            }}
          >
            {message.text}
          </div>
        )}
      </div>
    </div>
  )
}

export default Predict
