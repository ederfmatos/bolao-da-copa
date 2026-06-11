import { useNotifications } from '../hooks/useNotifications'
import { useNotificationHistory } from '../hooks/useNotificationHistory'

function NotificationToggle({ onViewHistory }) {
  const { permission, subscribed, loading, error, requestPermission, unsubscribe } = useNotifications()
  const { unreadCount } = useNotificationHistory()

  const handleToggle = async () => {
    if (loading) return

    if (subscribed) {
      await unsubscribe()
    } else {
      await requestPermission()
    }
  }

  const isDenied = permission === 'denied'

  return (
    <div className="p-4 bg-white dark:bg-dark-card rounded-lg shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-text">
            Notificações
          </h3>
          <p className="text-xs text-gray-500 dark:text-dark-muted mt-0.5">
            {isDenied
              ? 'Permissões bloqueadas pelo navegador'
              : subscribed
                ? 'Receba atualizações em tempo real'
                : 'Ative para receber notificações'}
          </p>
        </div>

        <button
          onClick={handleToggle}
          disabled={loading || isDenied}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-dark-card ${
            subscribed
              ? 'bg-primary-500 dark:bg-primary-600'
              : 'bg-gray-200 dark:bg-gray-700'
          } ${loading || isDenied ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          role="switch"
          aria-checked={subscribed}
          aria-label="Notificações"
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              subscribed ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {isDenied && (
        <p className="mt-3 text-xs text-red-600 dark:text-red-400">
          Habilite as notificações nas configurações do navegador para ativar este recurso.
        </p>
      )}

      {loading && (
        <p className="mt-3 text-xs text-gray-500 dark:text-dark-muted">
          Processando...
        </p>
      )}

      {error && (
        <p className="mt-3 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {subscribed && onViewHistory && (
        <button
          onClick={onViewHistory}
          className="mt-3 w-full flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium text-primary-600 dark:text-primary-500 bg-primary-50 dark:bg-primary-900/20 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Ver histórico
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}
    </div>
  )
}

export default NotificationToggle
