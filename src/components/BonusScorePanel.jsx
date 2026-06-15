import { useState } from 'react'

function BonusScorePanel() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="bg-white dark:bg-dark-card rounded-lg shadow">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-gray-900 dark:text-dark-text font-medium"
      >
        <span>Ver pontuação bônus</span>
        <span>{isOpen ? '▴' : '▾'}</span>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 text-gray-600 dark:text-dark-muted text-sm space-y-2">
          <p>Cada posição correta: <strong>+50 pts</strong></p>
          <p>Acertar as 4 posições: <strong>+250 pts total</strong></p>
          <div className="mt-3 space-y-1">
            <p className="font-medium text-gray-900 dark:text-dark-text">Exemplos:</p>
            <p>• Acertei só o campeão: +50 pts</p>
            <p>• Acertei campeão + 4º lugar: +100 pts</p>
            <p>• Acertei os 4: +250 pts</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default BonusScorePanel
