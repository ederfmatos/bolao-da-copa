import { useNavigate } from 'react-router-dom'
import { useNotificationHistory } from '../hooks/useNotificationHistory'

function formatTime(timestamp) {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Agora'
  if (diffMins < 60) return `${diffMins}min`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}d`
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function getTypeLabel(type) {
  const labels = {
    'daily-digest': 'Resumo diário',
    'deadline-reminder': 'Lembrete',
    'post-match': 'Resultado',
    'general': 'Notificação'
  }
  return labels[type] || labels.general
}

function getTypeColor(type) {
  const colors = {
    'daily-digest': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'deadline-reminder': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    'post-match': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'general': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
  }
  return colors[type] || colors.general
}

export function NotificationDrawer({ isOpen, onClose }) {
  const navigate = useNavigate()
  const { notifications, loading, markAsRead, markAllAsRead, clearAll } = useNotificationHistory()

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
    onClose()
    if (notification.url) {
      navigate(notification.url)
    }
  }

  const handleMarkAllRead = (e) => {
    e.stopPropagation()
    markAllAsRead()
  }

  const handleClearAll = (e) => {
    e.stopPropagation()
    clearAll()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-white dark:bg-dark-card shadow-xl flex flex-col h-full animate-slide-in">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-border">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text">
            Notificações
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"
            aria-label="Fechar"
          >
            <svg className="w-5 h-5 text-gray-500 dark:text-dark-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {notifications.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-dark-border">
            <button
              onClick={handleMarkAllRead}
              className="text-sm text-primary-600 dark:text-primary-500 hover:underline"
            >
              Marcar todas como lidas
            </button>
            <button
              onClick={handleClearAll}
              className="text-sm text-red-600 dark:text-red-400 hover:underline"
            >
              Limpar tudo
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500 dark:text-dark-muted">
              Carregando...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <svg
                className="w-16 h-16 mx-auto text-gray-300 dark:text-dark-muted mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <p className="text-gray-500 dark:text-dark-muted">
                Nenhuma notificação ainda
              </p>
              <p className="text-sm text-gray-400 dark:text-dark-muted mt-1">
                Ative as notificações para receber atualizações
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-dark-border">
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-border transition-colors ${
                    !notification.read ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {!notification.read && (
                        <span className="block w-2 h-2 bg-primary-500 rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeColor(notification.type)}`}>
                          {getTypeLabel(notification.type)}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-dark-muted">
                          {formatTime(notification.timestamp)}
                        </span>
                      </div>
                      <h3 className={`text-sm font-medium ${
                        !notification.read
                          ? 'text-gray-900 dark:text-dark-text'
                          : 'text-gray-600 dark:text-dark-muted'
                      }`}>
                        {notification.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-dark-muted mt-0.5 line-clamp-2">
                        {notification.body}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

