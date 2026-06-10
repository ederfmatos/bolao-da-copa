import { useSearchParams } from 'react-router-dom'
import { useMemo } from 'react'

export function useMatchFilters(matches) {
  const [searchParams, setSearchParams] = useSearchParams()

  const team = searchParams.get('team') || null
  const date = searchParams.get('date') || null

  const availableTeams = useMemo(() => {
    const teams = new Set()
    matches.forEach(match => {
      teams.add(match.home_team)
      teams.add(match.away_team)
    })
    return Array.from(teams).sort()
  }, [matches])

  const availableDates = useMemo(() => {
    const dates = new Set()
    matches.forEach(match => {
      const kickoffDate = new Date(match.kickoff_at)
      const dateStr = kickoffDate.toISOString().split('T')[0]
      dates.add(dateStr)
    })
    return Array.from(dates).sort()
  }, [matches])

  const filteredMatches = useMemo(() => {
    return matches.filter(match => {
      const matchTeamFilter = !team || 
        match.home_team === team || 
        match.away_team === team

      const matchDateFilter = !date || 
        new Date(match.kickoff_at).toISOString().split('T')[0] === date

      return matchTeamFilter && matchDateFilter
    })
  }, [matches, team, date])

  const setTeam = (newTeam) => {
    const params = new URLSearchParams(searchParams)
    if (newTeam) {
      params.set('team', newTeam)
    } else {
      params.delete('team')
    }
    setSearchParams(params)
  }

  const setDate = (newDate) => {
    const params = new URLSearchParams(searchParams)
    if (newDate) {
      params.set('date', newDate)
    } else {
      params.delete('date')
    }
    setSearchParams(params)
  }

  const clearFilters = () => {
    setSearchParams({})
  }

  return {
    filters: { team, date },
    availableTeams,
    availableDates,
    filteredMatches,
    setTeam,
    setDate,
    clearFilters
  }
}
