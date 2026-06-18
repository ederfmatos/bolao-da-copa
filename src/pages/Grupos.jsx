import { useNavigate } from 'react-router-dom'
import { useGroupStandings } from '../hooks/useGroupStandings'

function GroupTable({ groupName, teams }) {
  return (
    <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm mb-4 overflow-hidden">
      <div className="px-3 py-2 bg-gray-50 dark:bg-dark-border">
        <h2 className="text-sm font-bold text-gray-700 dark:text-dark-text">{groupName}</h2>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-gray-400 dark:text-dark-muted border-b border-gray-100 dark:border-dark-border">
            <th className="text-left px-3 py-1.5 font-medium w-6">#</th>
            <th className="text-left px-2 py-1.5 font-medium">Seleção</th>
            <th className="text-center px-1 py-1.5 font-medium">J</th>
            <th className="text-center px-1 py-1.5 font-medium">V</th>
            <th className="text-center px-1 py-1.5 font-medium">E</th>
            <th className="text-center px-1 py-1.5 font-medium">D</th>
            <th className="text-center px-1 py-1.5 font-medium">GP</th>
            <th className="text-center px-1 py-1.5 font-medium">GC</th>
            <th className="text-center px-1 py-1.5 font-medium">SG</th>
            <th className="text-center px-2 py-1.5 font-medium text-primary-600">Pts</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team, idx) => {
            const qualifies = team.position <= 2
            return (
              <tr
                key={team.team}
                className={`border-b border-gray-50 dark:border-dark-border last:border-0 ${
                  qualifies ? 'bg-green-50 dark:bg-green-900/10' : ''
                }`}
              >
                <td className="px-3 py-2 text-gray-400 dark:text-dark-muted">{idx + 1}</td>
                <td className="px-2 py-2">
                  <span className="flex items-center gap-1.5">
                    <span>{team.flag}</span>
                    <span className={`font-medium ${qualifies ? 'text-green-700 dark:text-green-400' : 'text-gray-800 dark:text-dark-text'}`}>
                      {team.team}
                    </span>
                  </span>
                </td>
                <td className="text-center px-1 py-2 text-gray-600 dark:text-dark-muted">{team.played}</td>
                <td className="text-center px-1 py-2 text-gray-600 dark:text-dark-muted">{team.won}</td>
                <td className="text-center px-1 py-2 text-gray-600 dark:text-dark-muted">{team.drawn}</td>
                <td className="text-center px-1 py-2 text-gray-600 dark:text-dark-muted">{team.lost}</td>
                <td className="text-center px-1 py-2 text-gray-600 dark:text-dark-muted">{team.goals_for}</td>
                <td className="text-center px-1 py-2 text-gray-600 dark:text-dark-muted">{team.goals_against}</td>
                <td className="text-center px-1 py-2 text-gray-600 dark:text-dark-muted">
                  {team.goal_diff > 0 ? `+${team.goal_diff}` : team.goal_diff}
                </td>
                <td className="text-center px-2 py-2 font-bold text-primary-600">{team.points}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function Grupos() {
  const navigate = useNavigate()
  const { standings, loading, error } = useGroupStandings()

  return (
    <div className="p-4 max-w-xl mx-auto">
      <div className="relative mb-4">
        <button
          onClick={() => navigate(-1)}
          className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-full bg-gray-100 dark:bg-dark-border hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-500 dark:text-dark-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl text-center text-gray-900 dark:text-dark-text">Grupos</h1>
      </div>

      <div className="flex items-center gap-2 mb-4 text-xs text-gray-500 dark:text-dark-muted">
        <span className="inline-block w-3 h-3 rounded-sm bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700"></span>
        Classificados para as oitavas
      </div>

      {loading && (
        <div className="p-8 text-center text-gray-500 dark:text-dark-muted">Carregando grupos...</div>
      )}

      {error && (
        <div className="p-8 text-center text-red-500">Erro: {error}</div>
      )}

      {!loading && !error && Object.entries(standings).map(([groupName, teams]) => (
        <GroupTable key={groupName} groupName={groupName} teams={teams} />
      ))}
    </div>
  )
}

export default Grupos
