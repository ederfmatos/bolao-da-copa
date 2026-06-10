import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useMatches() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchMatches() {
      try {
        const { data, error } = await supabase
          .from('matches')
          .select('*')
          .order('kickoff_at', { ascending: true })

        if (error) throw error

        setMatches(data || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchMatches()
  }, [])

  return { matches, loading, error }
}
