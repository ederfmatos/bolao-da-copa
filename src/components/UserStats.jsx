function UserStats({ predictions = [] }) {
  const totalPredictions = predictions.length

  const distribution = {
    10: predictions.filter(p => p.points === 10).length,
    7: predictions.filter(p => p.points === 7).length,
    6: predictions.filter(p => p.points === 6).length,
    5: predictions.filter(p => p.points === 5).length,
    0: predictions.filter(p => p.points === 0).length,
  }

  const exactScoreCount = distribution[10]
  const exactScoreRate =
    totalPredictions > 0
      ? ((exactScoreCount / totalPredictions) * 100).toFixed(1)
      : '0.0'

  return (
    <div className="p-4 bg-white dark:bg-dark-card rounded-lg shadow-sm mb-4">
      <h2 className="text-sm font-semibold text-gray-400 dark:text-dark-muted uppercase tracking-wide mb-3">
        Estatísticas
      </h2>

      <div className="flex items-center justify-around text-center mb-4">
        <div>
          <div className="text-2xl font-bold text-gray-900 dark:text-dark-text">
            {totalPredictions}
          </div>
          <div className="text-xs text-gray-400 dark:text-dark-muted">
            Palpites
          </div>
        </div>
        <div className="w-px h-10 bg-gray-200 dark:bg-gray-700" />
        <div>
          <div className="text-2xl font-bold text-green-500 dark:text-green-400">
            {exactScoreRate}%
          </div>
          <div className="text-xs text-gray-400 dark:text-dark-muted">
            Placar Exato
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-gray-400 dark:text-dark-muted uppercase">
          Distribuição por Pontos
        </h3>
        {[10, 7, 6, 5, 0].map(points => {
          const count = distribution[points]
          const percentage =
            totalPredictions > 0
              ? ((count / totalPredictions) * 100).toFixed(0)
              : '0'
          return (
            <div key={points} className="flex items-center gap-2">
              <span className="w-12 text-sm font-medium text-gray-600 dark:text-dark-muted shrink-0">
                {points}pts
              </span>
              <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="w-8 text-sm text-right text-gray-600 dark:text-dark-muted shrink-0">
                {count}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default UserStats
