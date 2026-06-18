import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useAllScorerPredictions() {
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchAllPredictions() {
      try {
        const { data, error } = await supabase
          .from('scorer_predictions')
          .select('*, profiles(name, avatar_url)')
          .order('profiles(name)', { ascending: true })

        if (error) throw error

        const mapped = (data || []).map(row => ({
          userId: row.user_id,
          playerId: row.player_id,
          scorerPoints: row.scorer_points,
          userName: row.profiles?.name ?? null,
          userAvatarUrl: row.profiles?.avatar_url ?? null,
        }))

        setPredictions(mapped)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchAllPredictions()
  }, [])

  return { predictions, loading, error }
}
