import Avatar from './Avatar'
import { TEAMS } from '../lib/bracketData'

const POSITIONS = [
  { key: 'firstPlace', label: '1º lugar', title: 'Campeão' },
  { key: 'secondPlace', label: '2º lugar', title: 'Vice-campeão' },
  { key: 'thirdPlace', label: '3º lugar', title: '3º lugar' },
  { key: 'fourthPlace', label: '4º lugar', title: '4º lugar' },
]

function BonusPredictionRow({ prediction }) {
  const teamFlag = (teamName) => TEAMS.find(t => t.name === teamName)?.flag

  return (
    <details className="group">
      <summary className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-card transition-colors">
        <Avatar src={prediction.avatarUrl} name={prediction.userName} className="w-8 h-8" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-dark-text truncate">
            {prediction.userName}
          </p>
        </div>
        {prediction.bonusPoints > 0 && (
          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs font-medium">
            ✓ {prediction.bonusPoints} pts
          </span>
        )}
      </summary>

      <div className="px-3 pb-3 pt-2 space-y-2 bg-gray-50 dark:bg-dark-card/50 border-t border-gray-100 dark:border-dark-border">
        {POSITIONS.map(({ key, label, title }) => (
          <div key={key} className="flex items-center gap-2">
            <span className="text-lg">
              {teamFlag(prediction[key])}
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-dark-text">
                {prediction[key]}
              </p>
              <p className="text-xs text-gray-500 dark:text-dark-muted">
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </details>
  )
}

export default BonusPredictionRow
