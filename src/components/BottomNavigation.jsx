import { NavLink } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

function BottomNavigation() {
  const { theme, toggleTheme } = useTheme()

  const tabs = [
    { to: '/matches', label: 'Partidas', icon: '⚽' },
    { to: '/leaderboard', label: 'Classificação', icon: '🏆' },
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
        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
          className="flex flex-col items-center justify-center w-full h-full text-xs text-gray-500 dark:text-dark-muted"
        >
          <span className="text-xl mb-1">{theme === 'dark' ? '☀️' : '🌙'}</span>
          <span aria-hidden="true">Tema</span>
        </button>
      </div>
    </nav>
  )
}

export default BottomNavigation
