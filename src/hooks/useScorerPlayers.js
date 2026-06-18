import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useScorerPlayers() {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchPlayers() {
      try {
        const { data, error } = await supabase
          .from('scorer_players')
          .select('*')
          .order('goals', { ascending: false })
          .order('name', { ascending: true })

        if (error) throw error

        setPlayers(data ?? [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchPlayers()
  }, [])

  return { players, loading, error }
}
