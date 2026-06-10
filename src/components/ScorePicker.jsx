function ScorePicker({ homeScore, awayScore, onChange, disabled }) {
  const handleHomeIncrement = () => {
    if (!disabled) onChange(homeScore + 1, awayScore)
  }

  const handleHomeDecrement = () => {
    if (!disabled && homeScore > 0) onChange(homeScore - 1, awayScore)
  }

  const handleAwayIncrement = () => {
    if (!disabled) onChange(homeScore, awayScore + 1)
  }

  const handleAwayDecrement = () => {
    if (!disabled && awayScore > 0) onChange(homeScore, awayScore - 1)
  }

  const btnBase = [
    'w-10 h-10 text-2xl rounded border flex items-center justify-center transition-colors',
    disabled
      ? 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 cursor-not-allowed text-gray-400 dark:text-gray-500'
      : 'bg-white dark:bg-dark-card border-gray-300 dark:border-dark-border cursor-pointer text-gray-900 dark:text-dark-text hover:bg-gray-50 dark:hover:bg-gray-800',
  ].join(' ')

  return (
    <div className="flex items-center justify-center gap-8">
      <div className="flex items-center gap-2">
        <button onClick={handleHomeDecrement} className={btnBase} disabled={disabled}>
          −
        </button>
        <div className="text-3xl font-bold min-w-[60px] text-center text-gray-900 dark:text-dark-text">
          {homeScore}
        </div>
        <button onClick={handleHomeIncrement} className={btnBase} disabled={disabled}>
          +
        </button>
      </div>

      <div className="text-2xl text-gray-400 dark:text-dark-muted">×</div>

      <div className="flex items-center gap-2">
        <button onClick={handleAwayDecrement} className={btnBase} disabled={disabled}>
          −
        </button>
        <div className="text-3xl font-bold min-w-[60px] text-center text-gray-900 dark:text-dark-text">
          {awayScore}
        </div>
        <button onClick={handleAwayIncrement} className={btnBase} disabled={disabled}>
          +
        </button>
      </div>
    </div>
  )
}

export default ScorePicker
