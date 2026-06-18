function ScorerPlayerCard({
  flag,
  name,
  nationality,
  position,
  goals,
  photo_url,
  isSelected = false,
  onClick,
  disabled = false,
}) {
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick()
    }
  }

  return (
    <div
      onClick={handleClick}
      aria-pressed={isSelected}
      className={`
        p-4 bg-white dark:bg-dark-card rounded-lg border-2 shadow relative
        ${isSelected ? 'border-primary-600 dark:border-primary-600' : 'border-transparent'}
        ${disabled ? 'opacity-60 cursor-default' : 'cursor-pointer hover:shadow-md transition-shadow'}
      `}
    >
      {isSelected && (
        <div className="absolute top-2 right-2 bg-primary-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
          ✓
        </div>
      )}

      <div className="flex justify-center mb-2">
        {photo_url ? (
          <img
            src={photo_url}
            alt={name}
            className="w-16 h-16 rounded-full object-cover object-top border-2 border-gray-100 dark:border-dark-border"
            onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex' }}
          />
        ) : null}
        <span
          className={`text-3xl w-16 h-16 rounded-full bg-gray-100 dark:bg-dark-border flex items-center justify-center ${photo_url ? 'hidden' : 'flex'}`}
        >
          {flag}
        </span>
      </div>

      <div className="text-center">
        <p className="font-bold text-sm text-gray-900 dark:text-dark-text truncate">
          {name}
        </p>
        <p className="text-xs text-gray-500 dark:text-dark-muted">
          {nationality}
        </p>
        <p className="text-xs text-gray-500 dark:text-dark-muted mt-1">
          {position}
        </p>
        <p className="text-lg font-bold text-primary-600 dark:text-primary-500 mt-2">
          {goals}
        </p>
      </div>
    </div>
  )
}

export default ScorerPlayerCard
