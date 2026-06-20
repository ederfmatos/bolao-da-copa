import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useMatchPredictions(matchId) {
  const [predictions, setPredictions] = useState([])
  const [allPredictionUserIds, setAllPredictionUserIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!matchId) return

    async function fetchPredictions() {
      try {
        const [viewResult, allResult] = await Promise.all([
          supabase
            .from('match_predictions')
            .select('*')
            .eq('match_id', matchId)
            .order('points', { ascending: false })
            .order('created_at', { ascending: true }),
          supabase
            .from('predictions')
            .select('user_id')
            .eq('match_id', matchId),
        ])

        if (viewResult.error) throw viewResult.error
        setPredictions(viewResult.data || [])
        setAllPredictionUserIds(allResult.data?.map((p) => p.user_id) || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchPredictions()
  }, [matchId])

  return { predictions, allPredictionUserIds, loading, error }
}
