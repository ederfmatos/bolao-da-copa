import Avatar from './Avatar'

function UserProfileHeader({ name, avatarUrl, totalPoints, rank }) {
  return (
    <div className="flex items-center p-4 bg-white dark:bg-dark-card rounded-lg shadow-sm mb-4">
      <Avatar src={avatarUrl} name={name} className="w-16 h-16 mr-4" />

      <div className="flex-1 min-w-0">
        <h1 className="text-xl font-bold text-gray-900 dark:text-dark-text truncate">
          {name}
        </h1>

        <div className="flex items-center gap-4 mt-1">
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-400 dark:text-dark-muted">Pontos:</span>
            <span className="text-lg font-bold text-green-500 dark:text-green-400">
              {totalPoints}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-400 dark:text-dark-muted">Rank:</span>
            <span
              className={`text-lg font-bold shrink-0 ${
                rank <= 3 ? 'text-amber-500' : 'text-gray-400 dark:text-dark-muted'
              }`}
            >
              #{rank}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserProfileHeader
