function pointsBadgeColor(points) {
  if (points >= 10) return 'bg-green-500 text-white'
  if (points >= 7) return 'bg-blue-500 text-white'
  if (points >= 3) return 'bg-orange-500 text-white'
  return 'bg-gray-400 text-white'
}

function PredictionRow({ prediction, isCurrentUser, isFinished }) {
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg ${
        isCurrentUser
          ? 'bg-primary-50 dark:bg-dark-card border border-primary-200 dark:border-dark-border'
          : 'bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border'
      }`}
    >
      <div className="flex items-center gap-3">
        {prediction.user_avatar_url ? (
          <img
            src={prediction.user_avatar_url}
            alt=""
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-300">
            {prediction.user_name?.charAt(0).toUpperCase() || '?'}
          </div>
        )}
        <span
          className={`text-sm ${
            isCurrentUser ? 'font-bold text-primary-700 dark:text-primary-500' : 'text-gray-800 dark:text-dark-text'
          }`}
        >
          {prediction.user_name}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-base font-semibold text-gray-800 dark:text-dark-text min-w-[4rem] text-center">
          {prediction.home_score} × {prediction.away_score}
        </span>
        {isFinished && prediction.points != null && (
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${pointsBadgeColor(prediction.points)}`}
          >
            {prediction.points}pts
          </span>
        )}
      </div>
    </div>
  )
}

export default PredictionRow
