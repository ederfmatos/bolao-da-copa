import { useState } from 'react'
import { useNotifications } from '../hooks/useNotifications'

function NotificationPrompt() {
  const { permission, subscribed, loading, requestPermission } = useNotifications()
  const [dismissed, setDismissed] = useState(false)
  const [success, setSuccess] = useState(false)

  if (permission !== 'default' || subscribed || dismissed) {
    return null
  }

  const handleEnable = async () => {
    await requestPermission()
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <div className="mx-4 mt-4 p-4 bg-blue-50 dark:bg-dark-card border border-blue-200 dark:border-dark-border rounded-lg shadow">
      {success ? (
        <div className="flex items-center justify-between">
          <p className="text-sm text-green-700 dark:text-green-400 font-medium">
            Notificações ativadas com sucesso!
          </p>
          <button
            onClick={() => setDismissed(true)}
            className="ml-3 text-green-700 dark:text-green-400 hover:text-green-900 dark:hover:text-green-200"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Ative as notificações
            </h3>
            <button
              onClick={() => setDismissed(true)}
              className="ml-3 text-gray-400 dark:text-dark-muted hover:text-gray-600 dark:hover:text-gray-200"
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-dark-muted mb-3">
            Receba resumos diários dos jogos, resultados em tempo real e lembretes de prazo para palpites.
          </p>
          <button
            onClick={handleEnable}
            disabled={loading}
            className="w-full py-2 px-4 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Ativando...' : 'Ativar notificações'}
          </button>
        </>
      )}
    </div>
  )
}

export default NotificationPrompt
