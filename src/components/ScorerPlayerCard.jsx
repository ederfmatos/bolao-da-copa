function ScorerPlayerCard({
  flag,
  name,
  nationality,
  position,
  goals,
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

      <div className="text-center mb-2">
        <span className="text-3xl">{flag}</span>
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
