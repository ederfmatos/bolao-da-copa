function pointsBadgeColor(points) {
  if (points >= 10) return 'bg-green-500 text-white'
  if (points >= 7) return 'bg-blue-500 text-white'
  if (points >= 3) return 'bg-orange-500 text-white'
  return 'bg-gray-400 text-white'
}

function UserPredictionRow({ prediction }) {
  const isFinished = prediction.match_status === 'finished'

  const kickoffDate = new Date(prediction.kickoff_at)
  const localTime = kickoffDate.toLocaleString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="p-4 mb-3 bg-white dark:bg-dark-card rounded-lg shadow-sm">
      <div className="mb-2 text-sm text-gray-500 dark:text-dark-muted">
        {prediction.group_name} &bull; {localTime}
      </div>

      <div className="flex justify-between items-center">
        <div className="flex-1">
          <div className="font-bold mb-1 text-gray-900 dark:text-dark-text">
            {prediction.home_flag} {prediction.home_team}
          </div>
          <div className="font-bold text-gray-900 dark:text-dark-text">
            {prediction.away_flag} {prediction.away_team}
          </div>
        </div>

        <div className="text-center min-w-[72px]">
          <div className="text-base font-semibold text-gray-800 dark:text-dark-text">
            {prediction.predicted_home} &times; {prediction.predicted_away}
          </div>
          <div className="text-xs text-gray-400 dark:text-dark-muted mt-0.5">
            Palpite
          </div>
        </div>

        <div className="text-center min-w-[72px]">
          {isFinished ? (
            <>
              <div className="text-base font-semibold text-gray-800 dark:text-dark-text">
                {prediction.actual_home != null ? prediction.actual_home : '-'} &times;{' '}
                {prediction.actual_away != null ? prediction.actual_away : '-'}
              </div>
              <div className="text-xs text-gray-400 dark:text-dark-muted mt-0.5">
                Real
              </div>
            </>
          ) : (
            <div className="text-xs text-gray-500 dark:text-dark-muted">
              Aguardando
            </div>
          )}
        </div>
      </div>

      {isFinished && prediction.points != null && (
        <div className="mt-3 flex justify-center">
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full ${pointsBadgeColor(prediction.points)}`}
          >
            {prediction.points} pts
          </span>
        </div>
      )}
    </div>
  )
}

export default UserPredictionRow
