import { useEffect } from 'react'
import { useTeamStats } from '../hooks/useTeamStats'
import { TEAMS, formatSlotLabel } from '../lib/bracketData'

function getTeamFlag(teamName) {
  if (!teamName) return ''
  const team = TEAMS.find(t => t.name === teamName)
  return team ? team.flag : ''
}

function getResultIcon(match, teamName) {
  const isHome = match.home_team === teamName
  const teamScore = isHome ? match.home_score : match.away_score
  const oppScore = isHome ? match.away_score : match.home_score
  if (teamScore > oppScore) return { icon: 'V', cls: 'text-green-600 dark:text-green-400 font-bold' }
  if (teamScore < oppScore) return { icon: 'D', cls: 'text-red-500 dark:text-red-400 font-bold' }
  return { icon: 'E', cls: 'text-gray-500 dark:text-dark-muted font-bold' }
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function TeamPanel({ teamName }) {
  const teamFlag = getTeamFlag(teamName)
  const { groupInfo, goalsScoredTotal, recentMatches, loading } = useTeamStats(teamName)

  if (!teamName) return null

  return (
    <div className="flex-1 min-w-0 p-3 border border-gray-100 dark:border-dark-border rounded-lg bg-gray-50 dark:bg-dark-border/30">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{teamFlag}</span>
        <span className="font-semibold text-gray-900 dark:text-dark-text text-sm leading-tight">{teamName}</span>
      </div>

      {loading ? (
        <p className="text-xs text-gray-400 dark:text-dark-muted">Carregando...</p>
      ) : (
        <>
          {groupInfo && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 dark:text-dark-muted mb-0.5">Fase de grupos</p>
              <p className="text-sm font-medium text-gray-800 dark:text-dark-text">
                {groupInfo.position}º no {groupInfo.group_name}
              </p>
              <p className="text-xs text-gray-500 dark:text-dark-muted">
                {groupInfo.played}J {groupInfo.won}V {groupInfo.drawn}E {groupInfo.lost}D · {groupInfo.points}pts
              </p>
            </div>
          )}

          <div className="mb-3">
            <p className="text-xs text-gray-500 dark:text-dark-muted mb-0.5">Gols no torneio</p>
            <p className="text-lg font-bold text-primary-600 dark:text-primary-400">{goalsScoredTotal}</p>
          </div>

          {recentMatches.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 dark:text-dark-muted mb-1">Últimos jogos</p>
              <ul className="space-y-1">
                {recentMatches.map(m => {
                  const isHome = m.home_team === teamName
                  const opponent = isHome ? m.away_team : m.home_team
                  const oppFlag = isHome ? m.away_flag : m.home_flag
                  const score = isHome
                    ? `${m.home_score}–${m.away_score}`
                    : `${m.away_score}–${m.home_score}`
                  const { icon, cls } = getResultIcon(m, teamName)
                  return (
                    <li key={m.id} className="flex items-center gap-1.5 text-xs">
                      <span className={`w-4 text-center ${cls}`}>{icon}</span>
                      <span className="font-mono text-gray-700 dark:text-dark-text w-8">{score}</span>
                      <span>{oppFlag}</span>
                      <span className="text-gray-600 dark:text-dark-muted truncate">{opponent}</span>
                      <span className="text-gray-400 dark:text-dark-muted ml-auto flex-shrink-0">{formatDate(m.kickoff_at)}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {recentMatches.length === 0 && !loading && (
            <p className="text-xs text-gray-400 dark:text-dark-muted">Sem jogos encerrados ainda</p>
          )}
        </>
      )}
    </div>
  )
}

function formatKickoff(iso) {
  const d = new Date(iso)
  const opts = { timeZone: 'America/Sao_Paulo' }
  const weekday = d.toLocaleDateString('pt-BR', { ...opts, weekday: 'long' })
  const date = d.toLocaleDateString('pt-BR', { ...opts, day: '2-digit', month: '2-digit', year: 'numeric' })
  const time = d.toLocaleTimeString('pt-BR', { ...opts, hour: '2-digit', minute: '2-digit' })
  const weekdayCap = weekday.charAt(0).toUpperCase() + weekday.slice(1)
  return `${weekdayCap}, ${date} às ${time}`
}

function MatchInfoModal({ slot, participants, match, onClose }) {
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const realTeams = participants.filter(p => p && !p.isLabel && p.name)
  const hasTeams = realTeams.length > 0

  const slotLabel = formatSlotLabel(slot)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-dark-card rounded-lg shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-gray-200 dark:border-dark-border">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-dark-text font-mono">{slotLabel}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-dark-text transition-colors text-lg leading-none"
              aria-label="Fechar"
            >
              ×
            </button>
          </div>
          {match && (
            <div className="mt-1 flex items-center gap-3 flex-wrap">
              <span className="text-xs text-gray-500 dark:text-dark-muted">
                {formatKickoff(match.kickoff_at)}
              </span>
              {match.status === 'live' && (
                <span className="text-xs font-bold text-red-500 dark:text-red-400 animate-pulse">AO VIVO</span>
              )}
              {match.status === 'finished' && match.home_score != null && (
                <span className="text-sm font-bold text-gray-800 dark:text-dark-text">
                  {match.home_score} × {match.away_score}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="overflow-y-auto flex-1 p-4">
          {!hasTeams ? (
            <p className="text-center text-gray-500 dark:text-dark-muted text-sm py-6">
              Confronto a definir
            </p>
          ) : (
            <div className="flex gap-3 flex-col sm:flex-row">
              {participants.map((team, idx) => {
                if (!team || team.isLabel || !team.name) return (
                  <div key={idx} className="flex-1 min-w-0 p-3 border border-dashed border-gray-200 dark:border-dark-border rounded-lg flex items-center justify-center">
                    <span className="text-xs text-gray-400 dark:text-dark-muted italic">Aguardando...</span>
                  </div>
                )
                return <TeamPanel key={idx} teamName={team.name} />
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MatchInfoModal
