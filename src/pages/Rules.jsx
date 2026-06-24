import { Link } from 'react-router-dom'
import { BONUS_DEADLINE, SCORER_DEADLINE, BRACKET_DEADLINE } from '../lib/bracketData'

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
      title: 'Vencedor Quase Exato',
      description: 'Acertar o vencedor, errar o gols do vencedor por 1 e o perdedor exato',
      example: 'Palpite: 4×0 | Resultado: 5×0 · Palpite: 6×0 | Resultado: 5×0',
    },
    {
      points: 6,
      title: 'Vencedor + Saldo de Gols',
      description: 'Acertar o vencedor e a diferença de gols (placar diferente)',
      example: 'Palpite: 2×0 | Resultado: 3×1',
    },
    {
      points: 5,
      title: 'Resultado Correto',
      description: 'Acertar o vencedor ou o empate (diferença de gols diferente)',
      example: 'Palpite: 1×0 | Resultado: 3×1 · Palpite: 1×1 | Resultado: 2×2',
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
    { border: 'border-l-teal-500', text: 'text-teal-500' },
    { border: 'border-l-blue-500', text: 'text-blue-500' },
    { border: 'border-l-orange-500', text: 'text-orange-500' },
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

      <div className="mt-8 p-4 bg-white dark:bg-dark-card rounded-lg shadow-md border-l-4 border-l-yellow-500">
        <h2 className="text-lg font-bold mb-2 text-gray-900 dark:text-dark-text">🏆 Palpites do Mata-Mata</h2>
        <p className="text-sm text-gray-600 dark:text-dark-muted mb-3">
          Antes do início dos 16 avos de final, palpite em quem vai passar em cada fase do chaveamento —
          do primeiro jogo até a grande final. Você pode palpitar independentemente de como a seleção se classificar
          (nos 90min, prorrogação ou pênaltis).
        </p>
        <p className="text-sm text-gray-600 dark:text-dark-muted mb-3">
          Prazo para enviar: <strong>{BRACKET_DEADLINE.toLocaleString()}</strong>
        </p>
        <div className="bg-gray-50 dark:bg-dark-border rounded p-3 mb-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-text mb-2">Pontuação por fase</h3>
          <table className="w-full text-sm text-gray-600 dark:text-dark-muted">
            <thead>
              <tr className="text-xs text-gray-400 dark:text-dark-muted border-b border-gray-200 dark:border-gray-700">
                <th className="text-left pb-1 font-medium">Fase</th>
                <th className="text-center pb-1 font-medium">Acertou tudo</th>
                <th className="text-center pb-1 font-medium">Acertou o classificado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              <tr>
                <td className="py-1.5">16 Avos</td>
                <td className="text-center font-semibold text-gray-800 dark:text-dark-text">5</td>
                <td className="text-center text-gray-400">—</td>
              </tr>
              <tr>
                <td className="py-1.5">Oitavas</td>
                <td className="text-center font-semibold text-gray-800 dark:text-dark-text">7</td>
                <td className="text-center text-gray-500 dark:text-dark-muted">5</td>
              </tr>
              <tr>
                <td className="py-1.5">Quartas</td>
                <td className="text-center font-semibold text-gray-800 dark:text-dark-text">9</td>
                <td className="text-center text-gray-500 dark:text-dark-muted">7</td>
              </tr>
              <tr>
                <td className="py-1.5">Semifinal</td>
                <td className="text-center font-semibold text-gray-800 dark:text-dark-text">11</td>
                <td className="text-center text-gray-500 dark:text-dark-muted">9</td>
              </tr>
              <tr>
                <td className="py-1.5">Final / 3º Lugar</td>
                <td className="text-center font-semibold text-gray-800 dark:text-dark-text">15</td>
                <td className="text-center text-gray-500 dark:text-dark-muted">11</td>
              </tr>
            </tbody>
          </table>
          <p className="text-xs text-gray-400 dark:text-dark-muted mt-2">
            "Acertou o classificado" = acertou quem passa mas errou o adversário. Nos 16 Avos não há crédito parcial.
          </p>
        </div>
        <p className="text-xs text-gray-500 dark:text-dark-muted mb-3">
          São 32 jogos no total. Quanto mais avançada a fase, mais pontos valem — porque é mais difícil acertar.
        </p>
        <Link
          to="/bracket-prediction"
          className="inline-block px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
        >
          Fazer Palpites do Mata-Mata
        </Link>
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
          to="/bracket-prediction"
          className="inline-block px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
        >
          Fazer Palpite Bônus
        </Link>
      </div>
      <div className="mt-8 p-4 bg-white dark:bg-dark-card rounded-lg shadow-md border-l-4 border-l-primary-500">
        <h2 className="text-lg font-bold mb-2 text-gray-900 dark:text-dark-text">🥅 Artilheiro da Copa</h2>
        <p className="text-sm text-gray-600 dark:text-dark-muted mb-3">
          Escolha o jogador que você acha que vai marcar mais gols na Copa.
          Em caso de empate entre jogadores, todos que escolheram um dos líderes ganham os pontos.
        </p>
        <p className="text-sm text-gray-600 dark:text-dark-muted mb-3">
          Prazo para enviar: <strong>{SCORER_DEADLINE.toLocaleString()}</strong>
        </p>
        <div className="bg-gray-50 dark:bg-dark-border rounded p-3 mb-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-text mb-2">Pontuação</h3>
          <ul className="text-sm text-gray-600 dark:text-dark-muted space-y-1">
            <li>20 pts se acertar o artilheiro</li>
          </ul>
        </div>
        <Link
          to="/artilheiro"
          className="inline-block px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
        >
          Fazer Palpite Artilheiro
        </Link>
      </div>
    </div>
  )
}

export default Rules
