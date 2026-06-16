import { Link } from 'react-router-dom'
import { BONUS_DEADLINE } from '../lib/bracketData'

function Rules() {
  const scenarios = [
    {
      points: 10,
      title: 'Placar Exato',
      description: 'Acertar o placar exato da partida',
      example: 'Palpite: 2×1 | Resultado: 2×1',
    },
    {
      points: 7,
      title: 'Vencedor + Saldo de Gols',
      description: 'Acertar o vencedor e a diferença de gols',
      example: 'Palpite: 2×0 | Resultado: 3×1 (ambos +2)',
    },
    {
      points: 7,
      title: 'Empate Correto',
      description: 'Acertar que será empate (placar diferente)',
      example: 'Palpite: 1×1 | Resultado: 2×2',
    },
    {
      points: 3,
      title: 'Vencedor Correto',
      description: 'Acertar apenas o vencedor da partida',
      example: 'Palpite: 1×0 | Resultado: 3×1',
    },
    {
      points: 0,
      title: 'Resultado Errado',
      description: 'Errar o vencedor ou o empate',
      example: 'Palpite: 2×0 | Resultado: 0×1',
    },
  ]

  const scenarioStyles = [
    { border: 'border-l-green-500', text: 'text-green-500' },
    { border: 'border-l-green-400', text: 'text-green-400' },
    { border: 'border-l-green-400', text: 'text-green-400' },
    { border: 'border-l-accent-orange', text: 'text-accent-orange' },
    { border: 'border-l-accent-red', text: 'text-accent-red' },
  ]

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl mb-4 text-center text-gray-900 dark:text-dark-text">
        Regras do Bolão
      </h1>

      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg mb-6 border border-yellow-300 dark:border-yellow-700">
        <h2 className="text-base m-0 text-gray-900 dark:text-dark-text">
          ⏰ Prazo para Palpites
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-dark-muted">
          Os palpites devem ser enviados com pelo menos <strong>15 minutos de antecedência</strong> antes do início da partida. Após esse prazo, os palpites são bloqueados automaticamente.
        </p>
      </div>

      <h2 className="text-xl mb-4 text-gray-900 dark:text-dark-text">Pontuação</h2>

      {scenarios.map((scenario, idx) => (
        <div
          key={idx}
          className={`bg-white dark:bg-dark-card rounded-lg p-4 mb-4 shadow-md ${scenarioStyles[idx].border}`}
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-base m-0 text-gray-900 dark:text-dark-text">{scenario.title}</h3>
            <span className={`text-2xl font-bold ${scenarioStyles[idx].text}`}>
              {scenario.points} pts
            </span>
          </div>
          <p className="m-0 mb-2 text-sm text-gray-500 dark:text-dark-muted">
            {scenario.description}
          </p>
          <div className="text-sm bg-gray-100 dark:bg-dark-border p-2 rounded font-mono text-gray-800 dark:text-dark-text">
            {scenario.example}
          </div>
        </div>
      ))}

      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h3 className="text-base mb-2 m-0 text-gray-900 dark:text-dark-text">💡 Dica</h3>
        <p className="m-0 text-sm text-gray-600 dark:text-dark-muted">
          Quanto mais preciso for seu palpite, mais pontos você ganha! Priorize acertar o placar exato para ganhar 10 pontos.
        </p>
      </div>

      <div className="mt-8 p-4 bg-white dark:bg-dark-card rounded-lg shadow-md border-l-4 border-l-primary-500">
        <h2 className="text-lg font-bold mb-2 text-gray-900 dark:text-dark-text">🏅 Palpite Bônus</h2>
        <p className="text-sm text-gray-600 dark:text-dark-muted mb-3">
          Antes do início da Copa, escolha as 4 seleções que você acha que vão chegar às finais:
          campeão, vice-campeão, 3º e 4º lugar.
        </p>
        <p className="text-sm text-gray-600 dark:text-dark-muted mb-3">
          Prazo para enviar: <strong>{BONUS_DEADLINE.toLocaleString()}</strong>
        </p>
        <div className="bg-gray-50 dark:bg-dark-border rounded p-3 mb-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-text mb-2">Pontuação</h3>
          <ul className="text-sm text-gray-600 dark:text-dark-muted space-y-1">
            <li>50 pts por posição correta</li>
            <li>250 pts se acertar as 4 posições</li>
          </ul>
        </div>
        <Link
          to="/final-prediction"
          className="inline-block px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
        >
          Fazer Palpite Bônus
        </Link>
      </div>
    </div>
  )
}

export default Rules
