import { NavLink } from 'react-router-dom'

function BottomNavigation() {
  const tabs = [
    { to: '/matches', label: 'Partidas', icon: '⚽' },
    { to: '/leaderboard', label: 'Classificação', icon: '🏆' },
    { to: '/bracket-prediction', label: 'Mata-Mata', icon: '🏅' },
    { to: '/artilheiro', label: 'Artilheiro', icon: '🥅' },
    { to: '/rules', label: 'Regras', icon: '📋' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-card border-t border-gray-200 dark:border-dark-border z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {tabs.map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full text-xs ${
                isActive
                  ? 'text-primary-600 dark:text-primary-500'
                  : 'text-gray-500 dark:text-dark-muted'
              }`
            }
          >
            <span className="text-xl mb-1">{tab.icon}</span>
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default BottomNavigation
