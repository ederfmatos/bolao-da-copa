import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useMatchPredictions(matchId) {
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!matchId) return

    async function fetchPredictions() {
      try {
        const { data, error } = await supabase
          .from('match_predictions')
          .select('*')
          .eq('match_id', matchId)
          .order('points', { ascending: false })
          .order('created_at', { ascending: true })

        if (error) throw error
        setPredictions(data || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchPredictions()
  }, [matchId])

  return { predictions, loading, error }
}
