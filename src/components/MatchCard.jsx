import { useNavigate } from 'react-router-dom'

function MatchCard({ match, hasPrediction }) {
  const navigate = useNavigate()
  
  const kickoffDate = new Date(match.kickoff_at)
  const localTime = kickoffDate.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

  const statusColors = {
    scheduled: '#4caf50',
    live: '#f44336',
    finished: '#9e9e9e',
  }

  const statusLabels = {
    scheduled: 'Agendado',
    live: 'Ao Vivo',
    finished: 'Encerrado',
  }

  const now = new Date()
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)
  const kickoffTime = new Date(match.kickoff_at)
  
  const isClosed = kickoffTime <= oneHourFromNow || match.status === 'live'
  const isFinished = match.status === 'finished'
  const isClickable = !isClosed && !isFinished

  const handleClick = () => {
    if (isClickable) {
      navigate(`/predict/${match.id}`)
    }
  }

  return (
    <div
      onClick={handleClick}
      style={{
        padding: '1rem',
        marginBottom: '0.75rem',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        cursor: isClickable ? 'pointer' : 'default',
        opacity: isFinished ? 0.7 : 1,
        position: 'relative',
      }}
    >
      {hasPrediction && (
        <div
          style={{
            position: 'absolute',
            top: '0.5rem',
            right: '0.5rem',
            backgroundColor: '#4caf50',
            color: 'white',
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            fontSize: '0.75rem',
          }}
        >
          Palpitado
        </div>
      )}
      
      <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
        {match.group_name} • {localTime}
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
            {match.home_flag} {match.home_team}
          </div>
          <div style={{ fontWeight: 'bold' }}>
            {match.away_flag} {match.away_team}
          </div>
        </div>
        
        <div style={{ textAlign: 'center', minWidth: '80px' }}>
          {match.status !== 'scheduled' && (
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
              {match.home_score ?? '-'} × {match.away_score ?? '-'}
            </div>
          )}
          <div
            style={{
              display: 'inline-block',
              padding: '0.25rem 0.5rem',
              backgroundColor: statusColors[match.status],
              color: 'white',
              borderRadius: '4px',
              fontSize: '0.75rem',
              marginTop: '0.5rem',
            }}
          >
            {statusLabels[match.status]}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MatchCard
