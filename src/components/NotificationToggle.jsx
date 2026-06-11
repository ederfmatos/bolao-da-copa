import { useNotifications } from '../hooks/useNotifications'

function NotificationToggle() {
  const { permission, subscribed, loading, error, requestPermission, unsubscribe } = useNotifications()

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
    </div>
  )
}

export default NotificationToggle
