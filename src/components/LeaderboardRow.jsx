import Avatar from './Avatar'

function LeaderboardRow({ entry, rank, isCurrentUser }) {
  return (
    <div
      className={`
        flex items-center p-3 px-4 mb-2 rounded-lg shadow-sm
        ${isCurrentUser ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-400 dark:border-blue-500' : 'bg-white dark:bg-dark-card border-2 border-transparent'}
      `}
    >
      <div className={`w-10 text-xl font-bold shrink-0 ${rank <= 3 ? 'text-amber-500' : 'text-gray-400 dark:text-dark-muted'}`}>
        {rank}
      </div>

      <Avatar src={entry.avatar_url} name={entry.name} className="w-10 h-10 mr-4" />

      <div className="flex-1 min-w-0">
        <div className={`truncate ${isCurrentUser ? 'font-bold' : 'font-normal text-gray-900 dark:text-dark-text'}`}>
          {entry.name}
          {isCurrentUser && <span className="text-blue-500 dark:text-blue-400"> (você)</span>}
        </div>
        <div className="text-sm text-gray-400 dark:text-dark-muted">
          {entry.total_predictions} palpite{entry.total_predictions !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="text-2xl font-bold text-green-500 dark:text-green-400 shrink-0">
        {entry.total_points}
      </div>
    </div>
  )
}

export default LeaderboardRow
