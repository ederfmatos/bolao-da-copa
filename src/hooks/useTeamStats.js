import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useTeamStats(teamName) {
  const [groupInfo, setGroupInfo] = useState(null)
  const [goalsScoredTotal, setGoalsScoredTotal] = useState(0)
  const [recentMatches, setRecentMatches] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!teamName) {
      setGroupInfo(null)
      setGoalsScoredTotal(0)
      setRecentMatches([])
      return
    }

    let cancelled = false
    setLoading(true)

    async function fetchStats() {
      const [matchesResult, groupResult] = await Promise.all([
        supabase
          .from('matches')
          .select('id, home_team, away_team, home_flag, away_flag, home_score, away_score, kickoff_at, group_name')
          .eq('status', 'finished')
          .or(`home_team.eq.${teamName},away_team.eq.${teamName}`)
          .order('kickoff_at', { ascending: false })
          .limit(5),
        supabase
          .from('group_standings')
          .select('group_name, position, goals_for, played, won, drawn, lost, points')
          .eq('team', teamName)
          .maybeSingle(),
      ])

      if (cancelled) return

      const matches = matchesResult.data ?? []
      setRecentMatches(matches)

      const totalGoals = matches.reduce((sum, m) => {
        const goals = m.home_team === teamName ? (m.home_score ?? 0) : (m.away_score ?? 0)
        return sum + goals
      }, 0)
      setGoalsScoredTotal(totalGoals)
      setGroupInfo(groupResult.data ?? null)
      setLoading(false)
    }

    fetchStats()
    return () => { cancelled = true }
  }, [teamName])

  return { groupInfo, goalsScoredTotal, recentMatches, loading }
}
