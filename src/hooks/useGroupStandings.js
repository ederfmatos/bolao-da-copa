import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useGroupStandings() {
  const [standings, setStandings] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetch() {
      const { data, error } = await supabase
        .from('group_standings')
        .select('group_name, team, flag, played, won, drawn, lost, goals_for, goals_against, goal_diff, points, position')
        .order('group_name')
        .order('points', { ascending: false })

      if (error) {
        setError(error.message)
      } else {
        const grouped = (data || []).reduce((acc, row) => {
          if (!acc[row.group_name]) acc[row.group_name] = []
          acc[row.group_name].push(row)
          return acc
        }, {})
        setStandings(grouped)
      }
      setLoading(false)
    }

    fetch()
  }, [])

  return { standings, loading, error }
}
