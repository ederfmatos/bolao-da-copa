import { useState, useEffect, useRef } from 'react'

function TeamPicker({ teams, onSelect, onClose }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [focusedIndex, setFocusedIndex] = useState(0)
  const inputRef = useRef(null)

  const filteredTeams = searchQuery
    ? teams.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : teams

  useEffect(() => {
    setFocusedIndex(0)
  }, [searchQuery])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusedIndex(prev => Math.min(prev + 1, filteredTeams.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && filteredTeams[focusedIndex]) {
      onSelect(filteredTeams[focusedIndex].name)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className="bg-white dark:bg-dark-card rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 dark:border-dark-border">
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar time..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text placeholder-gray-400 dark:placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="overflow-y-auto flex-1">
          {filteredTeams.length === 0 ? (
            <p className="p-4 text-center text-gray-500 dark:text-dark-muted">
              Nenhum time encontrado
            </p>
          ) : (
            filteredTeams.map((team, index) => (
              <button
                key={team.name}
                onClick={() => onSelect(team.name)}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                  index === focusedIndex
                    ? 'bg-primary-100 dark:bg-primary-900/30'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                } text-gray-900 dark:text-dark-text`}
              >
                <span className="text-xl">{team.flag}</span>
                <span className="font-medium">{team.name}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default TeamPicker
