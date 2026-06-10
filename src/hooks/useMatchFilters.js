import { useSearchParams } from 'react-router-dom'
import { useMemo } from 'react'

export function useMatchFilters(matches) {
  const [searchParams, setSearchParams] = useSearchParams()

  const team = searchParams.get('team') || null
  const date = searchParams.get('date') || null
  const group = searchParams.get('group') || null

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

  const availableGroups = useMemo(() => {
    const groups = new Set()
    matches.forEach(match => {
      if (match.group_name) {
        groups.add(match.group_name)
      }
    })
    return Array.from(groups).sort()
  }, [matches])

  const filteredMatches = useMemo(() => {
    return matches.filter(match => {
      const matchTeamFilter = !team || 
        match.home_team === team || 
        match.away_team === team

      const matchDateFilter = !date || 
        new Date(match.kickoff_at).toISOString().split('T')[0] === date

      const matchGroupFilter = !group || match.group_name === group

      return matchTeamFilter && matchDateFilter && matchGroupFilter
    })
  }, [matches, team, date, group])

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

  const setGroup = (newGroup) => {
    const params = new URLSearchParams(searchParams)
    if (newGroup) {
      params.set('group', newGroup)
    } else {
      params.delete('group')
    }
    setSearchParams(params)
  }

  const clearFilters = () => {
    setSearchParams({})
  }

  return {
    filters: { team, date, group },
    availableTeams,
    availableDates,
    availableGroups,
    filteredMatches,
    setTeam,
    setDate,
    setGroup,
    clearFilters
  }
}
