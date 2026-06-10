function MatchFilters({ 
  filters, 
  availableTeams, 
  availableDates, 
  onTeamChange, 
  onDateChange, 
  onClearFilters 
}) {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T12:00:00')
    return date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit'
    })
  }

  const hasActiveFilters = filters.team || filters.date

  return (
    <div className="mb-6 p-4 bg-gray-50 dark:bg-dark-card rounded-lg border border-gray-200 dark:border-dark-border">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label 
            htmlFor="team-filter" 
            className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-2"
          >
            Filtrar por seleção
          </label>
          <select
            id="team-filter"
            value={filters.team || ''}
            onChange={(e) => onTeamChange(e.target.value || null)}
            className="w-full px-3 py-2 bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
          >
            <option value="">Todas as seleções</option>
            {availableTeams.map(team => (
              <option key={team} value={team}>{team}</option>
            ))}
          </select>
        </div>

        <div>
          <label 
            htmlFor="date-filter" 
            className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-2"
          >
            Filtrar por data
          </label>
          <select
            id="date-filter"
            value={filters.date || ''}
            onChange={(e) => onDateChange(e.target.value || null)}
            className="w-full px-3 py-2 bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
          >
            <option value="">Todas as datas</option>
            {availableDates.map(date => (
              <option key={date} value={date}>{formatDate(date)}</option>
            ))}
          </select>
        </div>
      </div>

      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-dark-text bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"
        >
          Limpar filtros
        </button>
      )}
    </div>
  )
}

export default MatchFilters
