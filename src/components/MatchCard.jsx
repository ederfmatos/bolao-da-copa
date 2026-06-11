import { useNavigate } from 'react-router-dom'

function MatchCard({ match, hasPrediction, predictionCount = 0 }) {
  const navigate = useNavigate()

  const kickoffDate = new Date(match.kickoff_at)
  const localTime = kickoffDate.toLocaleString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

  const statusColors = {
    scheduled: 'bg-primary-500',
    live: 'bg-red-500',
    finished: 'bg-gray-400',
  }

  const statusLabels = {
    scheduled: 'Agendado',
    live: 'Ao Vivo',
    finished: 'Encerrado',
  }

  const isFinished = match.status === 'finished'

  const handleClick = () => {
    navigate(`/match/${match.id}`)
  }

  return (
    <div
      onClick={handleClick}
      className={`p-4 mb-3 bg-white dark:bg-dark-card rounded-lg shadow relative cursor-pointer ${isFinished ? 'opacity-70' : ''}`}
    >
      {hasPrediction && (
        <div className="absolute top-2 right-2 bg-primary-500 text-white px-2 py-1 rounded text-xs">
          Palpitado
        </div>
      )}

      <div className="mb-2 text-sm text-gray-500 dark:text-dark-muted">
        {match.group_name} &bull; {localTime}
        {predictionCount > 0 && (
          <span className="ml-1">&bull; {predictionCount} palpites</span>
        )}
      </div>

      <div className="flex justify-between items-center">
        <div className="flex-1">
          <div className="font-bold mb-1">
            {match.home_flag} {match.home_team}
          </div>
          <div className="font-bold">
            {match.away_flag} {match.away_team}
          </div>
        </div>

        <div className="text-center min-w-[80px]">
          {match.status !== 'scheduled' && (
            <div className="text-xl font-bold">
              {match.home_score ?? '-'} &times; {match.away_score ?? '-'}
            </div>
          )}
          <div
            className={`inline-block px-2 py-1 text-white rounded text-xs mt-2 ${statusColors[match.status]}`}
          >
            {statusLabels[match.status]}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MatchCard
