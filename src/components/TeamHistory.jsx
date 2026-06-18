function TeamHistory({ history, teamName }) {
  if (!history || history.length === 0) return null

  return (
    <div className="space-y-2">
      {history.map((match) => {
        const isHome = match.home_team === teamName
        const focusTeam = isHome ? match.home_team : match.away_team
        const focusFlag = isHome ? match.home_flag : match.away_flag
        const focusScore = isHome ? match.home_score : match.away_score
        const oppTeam = isHome ? match.away_team : match.home_team
        const oppFlag = isHome ? match.away_flag : match.home_flag
        const oppScore = isHome ? match.away_score : match.home_score

        const date = new Date(match.kickoff_at)
        const label = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

        return (
          <div key={match.id} className="text-xs text-gray-600 dark:text-dark-muted">
            <div className="text-gray-400 dark:text-gray-500 mb-0.5">{label}</div>
            <div className="flex items-center gap-1 flex-wrap">
              <span className="font-semibold text-gray-900 dark:text-dark-text">
                {focusFlag} {focusTeam}
              </span>
              <span className="tabular-nums font-bold text-gray-700 dark:text-dark-text">
                {focusScore} × {oppScore}
              </span>
              <span>
                {oppFlag} {oppTeam}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default TeamHistory
