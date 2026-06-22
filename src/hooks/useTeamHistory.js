import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useTeamHistory(match) {
  const [homeHistory, setHomeHistory] = useState([])
  const [awayHistory, setAwayHistory] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!match) {
      setHomeHistory([])
      setAwayHistory([])
      return
    }

    async function fetchHistory(team) {
      const { data } = await supabase
        .from('matches')
        .select('id, home_team, away_team, home_flag, away_flag, home_score, away_score, kickoff_at')
        .eq('status', 'finished')
        .or(`home_team.eq.${team},away_team.eq.${team}`)
        .lt('kickoff_at', match.kickoff_at)
        .order('kickoff_at', { ascending: false })
      return data ?? []
    }

    setLoading(true)
    Promise.all([fetchHistory(match.home_team), fetchHistory(match.away_team)])
      .then(([home, away]) => {
        setHomeHistory(home)
        setAwayHistory(away)
      })
      .finally(() => setLoading(false))
  }, [match?.id])

  return { homeHistory, awayHistory, loading }
}
