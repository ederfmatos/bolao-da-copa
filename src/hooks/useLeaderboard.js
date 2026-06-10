import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const { data, error } = await supabase
          .from('leaderboard')
          .select('*')
          .order('total_points', { ascending: false })

        if (error) throw error

        setLeaderboard(data || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()

    const channel = supabase
      .channel('leaderboard-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'predictions' },
        () => {
          fetchLeaderboard()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { leaderboard, loading, error }
}
