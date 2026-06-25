import { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useBracketPrediction } from '../hooks/useBracketPrediction'
import { useAuth } from '../hooks/useAuth'
import {
  BRACKET_DEADLINE,
  BRACKET_PARENTS,
  BRACKET_DESCENDANTS,
  BRACKET_SLOTS,
  R32_MATCHUPS,
  TEAMS,
  formatSlotLabel,
} from '../lib/bracketData'
import MatchInfoModal from '../components/MatchInfoModal'

const PHASE_COLUMNS = [
  { id: 'R32', label: '16 Avos', slots: Array.from({ length: 16 }, (_, i) => `R32_${String(i + 1).padStart(2, '0')}`) },
  { id: 'R16', label: 'Oitavas', slots: Array.from({ length: 8 }, (_, i) => `R16_${String(i + 1).padStart(2, '0')}`) },
  { id: 'QF', label: 'Quartas', slots: Array.from({ length: 4 }, (_, i) => `QF_${String(i + 1).padStart(2, '0')}`) },
  { id: 'SF', label: 'Semifinal', slots: ['SF_01', 'SF_02'] },
  { id: 'FINALS', label: 'Final / 3º Lugar', slots: ['FINAL', '3RD'] },
]

function getTeamFlag(teamName) {
  if (!teamName) return ''
  const team = TEAMS.find(t => t.name === teamName)
  return team ? team.flag : ''
}

function BracketSkeleton() {
  const columns = [16, 8, 4, 2, 2]
  return (
    <div className="p-4 max-w-6xl mx-auto space-y-4">
      <div className="h-10 rounded-lg bg-gray-100 dark:bg-dark-border animate-pulse" />
      <div className="flex justify-between">
        <div className="h-6 w-48 rounded bg-gray-200 dark:bg-dark-border animate-pulse" />
        <div className="h-6 w-24 rounded bg-gray-100 dark:bg-dark-border animate-pulse" />
      </div>
      <div className="overflow-x-auto pb-4 -mx-4 px-4">
        <div className="flex gap-4 min-w-[650px]">
          {columns.map((count, ci) => (
            <div key={ci} className="flex-1 min-w-[140px] flex flex-col">
              <div className="h-5 w-16 rounded bg-gray-200 dark:bg-dark-border animate-pulse mb-1" />
              {Array.from({ length: count }).map((_, si) => (
                <div key={si} className="flex-1 flex items-center py-1">
                  <div className="w-full rounded-lg overflow-hidden border border-gray-200 dark:border-dark-border">
                    <div className="h-6 bg-gray-100 dark:bg-dark-border animate-pulse" />
                    <div className="h-8 border-t border-gray-100 dark:border-dark-border bg-white dark:bg-dark-card animate-pulse" />
                    <div className="h-8 border-t border-gray-100 dark:border-dark-border bg-white dark:bg-dark-card animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function BracketPrediction() {
  const { user } = useAuth()
  const { bracketPicks, setBracketPick, isPastDeadline, loading: bpLoading, error: bpError, isSaving } = useBracketPrediction()
  const [r32Matches, setR32Matches] = useState([])
  const [matchesLoading, setMatchesLoading] = useState(true)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    if (!user) {
      setMatchesLoading(false)
      return
    }

    let cancelled = false
    async function fetchMatches() {
      const { data, error } = await supabase
        .from('matches')
        .select('id, home_team, away_team, kickoff_at, bracket_slot, status, home_score, away_score')
        .not('bracket_slot', 'is', null)
        .order('kickoff_at')

      if (!cancelled) {
        if (!error && data) {
          setR32Matches(data)
        }
        setMatchesLoading(false)
      }
    }
    fetchMatches()
    return () => { cancelled = true }
  }, [user])


  const matchTeams = useMemo(() => {
    const map = {}
    r32Matches.forEach(match => {
      if (match.bracket_slot) {
        map[match.bracket_slot] = {
          home_team: match.home_team,
          away_team: match.away_team,
        }
      }
    })
    return map
  }, [r32Matches])

  const matchInfo = useMemo(() => {
    const map = {}
    r32Matches.forEach(match => {
      if (match.bracket_slot) {
        map[match.bracket_slot] = match
      }
    })
    return map
  }, [r32Matches])

  const totalSlots = BRACKET_SLOTS.length

  const filledCount = useMemo(
    () => BRACKET_SLOTS.filter(s => bracketPicks[s]).length,
    [bracketPicks]
  )

  const isPreview = !matchesLoading && r32Matches.length === 0

  const getPreviewParticipants = useCallback(
    (slot) => {
      const matchupIndex = R32_MATCHUPS.findIndex(m => m.slot === slot)
      if (matchupIndex !== -1) {
        const m = R32_MATCHUPS[matchupIndex]
        return [
          { name: m.homeSlotLabel, winner: false, isLabel: true },
          { name: m.awaySlotLabel, winner: false, isLabel: true },
        ]
      }
      const parents = BRACKET_PARENTS[slot]
      if (parents) {
        return parents.map(p => ({
          name: p.replace('_', ' '),
          winner: false,
          isLabel: true,
        }))
      }
      return [{ name: null, winner: false }, { name: null, winner: false }]
    },
    []
  )

  const getParticipants = useCallback(
    (slot) => {
      const parents = BRACKET_PARENTS[slot]
      if (!parents) {
        const matchup = matchTeams[slot]
        if (!matchup) {
          const m = R32_MATCHUPS.find(r => r.slot === slot)
          if (!m) return []
          return [
            { name: m.homeSlotLabel, winner: false, isLabel: true },
            { name: m.awaySlotLabel, winner: false, isLabel: true },
          ]
        }
        return [
          { name: matchup.home_team, winner: bracketPicks[slot] === matchup.home_team },
          { name: matchup.away_team, winner: bracketPicks[slot] === matchup.away_team },
        ]
      }
      return parents.map(parent => ({
        name: bracketPicks[parent] || null,
        winner: bracketPicks[slot] === bracketPicks[parent],
      }))
    },
    [matchTeams, bracketPicks]
  )

  const handleTeamClick = useCallback(
    (slot, teamName) => {
      if (isPastDeadline || !teamName) return

      const descendants = BRACKET_DESCENDANTS[slot] || []
      descendants.forEach(desc => {
        setBracketPick(desc, null)
      })
      setBracketPick(slot, teamName)
    },
    [isPastDeadline, setBracketPick]
  )

  const [modalSlot, setModalSlot] = useState(null)

  const bracketRef = useRef(null)
  const [connectorLines, setConnectorLines] = useState([])
  const [thirdPlaceTop, setThirdPlaceTop] = useState(null)

  useLayoutEffect(() => {
    const container = bracketRef.current
    if (!container) return

    function measure() {
      const rect = container.getBoundingClientRect()
      const lines = []
      Object.entries(BRACKET_PARENTS).forEach(([child, parents]) => {
        if (!parents) return
        if (child === '3RD') return
        const childEl = container.querySelector(`[data-testid="slot-${child}"]`)
        if (!childEl) return
        const cr = childEl.getBoundingClientRect()
        const cx = cr.left - rect.left
        const cy = (cr.top + cr.bottom) / 2 - rect.top
        parents.forEach(parent => {
          const parentEl = container.querySelector(`[data-testid="slot-${parent}"]`)
          if (!parentEl) return
          const pr = parentEl.getBoundingClientRect()
          const px = pr.right - rect.left
          const py = (pr.top + pr.bottom) / 2 - rect.top
          const mx = (px + cx) / 2
          lines.push({ x1: px, y1: py, x2: cx, y2: cy, mx })
        })
      })
      setConnectorLines(lines)

      const finalsColEl = container.querySelector('[data-column-id="FINALS"]')
      const finalEl = container.querySelector('[data-testid="slot-FINAL"]')
      if (finalsColEl && finalEl) {
        const colRect = finalsColEl.getBoundingClientRect()
        const finalRect = finalEl.getBoundingClientRect()
        setThirdPlaceTop(finalRect.bottom - colRect.top + 4)
      }
    }

    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    return () => observer.disconnect()
  }, [r32Matches, bracketPicks])

  const isUrgent = !isPastDeadline && (BRACKET_DEADLINE - new Date()) < 3600000

  const deadlineFormatted = BRACKET_DEADLINE.toLocaleString('pt-BR', {
    weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })

  if (bpLoading || matchesLoading) return <BracketSkeleton />

  if (bpError) {
    return (
      <div className="p-8 text-center text-red-500">
        {bpError}
      </div>
    )
  }

  function renderSlotCard(slot) {
    const participants = isPreview ? getPreviewParticipants(slot) : getParticipants(slot)
    const predicted = isPreview ? null : bracketPicks[slot]

    return (
      <div
        className="w-full bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg overflow-hidden"
        data-testid={`slot-${slot}`}
      >
        <button
          className="w-full text-left text-xs text-gray-500 dark:text-dark-muted px-2 py-1 bg-gray-50 dark:bg-dark-border font-mono hover:bg-gray-100 dark:hover:bg-dark-border/80 transition-colors cursor-pointer"
          onClick={() => setModalSlot(slot)}
          type="button"
          aria-label={`Ver informações do confronto ${formatSlotLabel(slot)}`}
        >
          {formatSlotLabel(slot)}
        </button>
        {participants.map((team, idx) => (
          <button
            key={team.name || `${slot}-empty-${idx}`}
            onClick={() => handleTeamClick(slot, team.name)}
            disabled={isPreview || isPastDeadline || !team.name}
            className={`w-full text-left px-2 py-1.5 text-sm border-t border-gray-100 dark:border-dark-border flex items-center gap-1.5 transition-colors disabled:cursor-not-allowed ${team.isLabel
                ? 'text-gray-400 dark:text-dark-muted italic opacity-80'
                : team.winner
                  ? 'bg-primary-50 dark:bg-primary-900/30 font-semibold text-primary-700 dark:text-primary-300'
                  : 'hover:bg-gray-50 dark:hover:bg-dark-border text-gray-700 dark:text-dark-text disabled:opacity-50'
              }`}
            data-testid={team.name && !team.isLabel ? `pick-btn-${slot}-${team.name}` : undefined}
          >
            {!team.isLabel && (
              <span className="text-base w-5 text-center flex-shrink-0">
                {getTeamFlag(team.name)}
              </span>
            )}
            <span className={`truncate flex-1 min-w-0 ${team.isLabel ? 'text-xs font-mono' : ''}`}>
              {team.name || '—'}
            </span>
            {team.winner && (
              <span className="text-primary-500 flex-shrink-0">✓</span>
            )}
          </button>
        ))}
        {participants.length === 0 && (
          <div className="px-2 py-1.5 text-xs text-gray-400 dark:text-dark-muted border-t border-gray-100 dark:border-dark-border">
            Aguardando...
          </div>
        )}
        {participants.length === 1 && participants[0].name && !participants[1]?.name && (
          <div className="px-2 py-1.5 text-xs text-gray-400 dark:text-dark-muted border-t border-gray-100 dark:border-dark-border">
            Aguarda oponente...
          </div>
        )}
        {predicted && (
          <div className="px-2 py-0.5 text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-900/20 border-t border-gray-100 dark:border-dark-border">
            {getTeamFlag(predicted)} {predicted}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-4">
      {!isPastDeadline && (
        <div
          className={`rounded-lg p-3 ${isUrgent
              ? 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700'
              : 'bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700'
            }`}
          data-testid="countdown"
        >
          <p
            className={`text-sm font-medium ${isUrgent
                ? 'text-red-900 dark:text-red-100'
                : 'text-amber-900 dark:text-amber-100'
              }`}
          >
            ⏰ Prazo para palpites:{' '}
            <strong data-testid="countdown-value">{deadlineFormatted}</strong>
          </p>
        </div>
      )}

      {isPastDeadline && (
        <div className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
            🛑 Palpites encerrados — modo somente leitura
          </p>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-bold text-gray-900 dark:text-dark-text">
          Palpites do Mata-Mata
        </h1>
        <span
          className="text-sm text-gray-500 dark:text-dark-muted"
          data-testid="progress-indicator"
        >
          {filledCount}/{totalSlots} palpites feitos
        </span>
      </div>

      {isSaving && (
        <div
          className="text-sm text-primary-600 dark:text-primary-400 animate-pulse"
          data-testid="saving-indicator"
        >
          Salvando...
        </div>
      )}

      {isPreview && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-3 text-sm text-blue-800 dark:text-blue-200">
          📋 Prévia do chaveamento — os confrontos reais serão confirmados após a fase de grupos.
        </div>
      )}

      <div className="overflow-x-auto pb-4 -mx-4 px-4">
        <div className="relative flex gap-4 min-w-[650px]" data-testid="bracket-columns" ref={bracketRef}>
          <svg
            className="absolute inset-0 pointer-events-none overflow-visible"
            style={{ width: '100%', height: '100%' }}
            aria-hidden="true"
          >
            {connectorLines.map(({ x1, y1, x2, y2, mx }, i) => (
              <path
                key={i}
                d={`M${x1},${y1} H${mx} V${y2} H${x2}`}
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                className="text-gray-200 dark:text-gray-700"
              />
            ))}
          </svg>
          {PHASE_COLUMNS.map(col => (
            <div
              key={col.id}
              data-column-id={col.id}
              className="flex-1 min-w-[140px] flex flex-col relative"
            >
              <h2 className="text-sm font-semibold text-gray-700 dark:text-dark-text px-1 py-1 flex-none">
                {col.label}
              </h2>
              {col.id === 'FINALS' ? (
                <div className="flex-1 flex flex-col">
                  <div className="flex-1 flex items-center py-1">
                    {renderSlotCard('FINAL')}
                  </div>
                  {thirdPlaceTop !== null && (
                    <div className="absolute left-0 right-0 py-1" style={{ top: thirdPlaceTop }}>
                      {renderSlotCard('3RD')}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                  {col.slots.map(slot => (
                    <div key={slot} className="flex-1 flex items-center py-1">
                      {renderSlotCard(slot)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {modalSlot && (
        <MatchInfoModal
          slot={modalSlot}
          participants={isPreview ? getPreviewParticipants(modalSlot) : getParticipants(modalSlot)}
          match={matchInfo[modalSlot] ?? null}
          onClose={() => setModalSlot(null)}
        />
      )}
    </div>
  )
}

export default BracketPrediction
