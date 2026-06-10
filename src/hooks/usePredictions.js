import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function usePredictions() {
  const { user } = useAuth()
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) {
      setPredictions([])
      setLoading(false)
      return
    }

    async function fetchPredictions() {
      try {
        const { data, error } = await supabase
          .from('predictions')
          .select('*')
          .eq('user_id', user.id)

        if (error) throw error

        setPredictions(data || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchPredictions()
  }, [user])

  const savePrediction = async (matchId, homeScore, awayScore) => {
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('predictions')
      .upsert(
        {
          user_id: user.id,
          match_id: matchId,
          home_score: homeScore,
          away_score: awayScore,
        },
        { onConflict: 'user_id, match_id' }
      )
      .select()
      .single()

    if (error) throw error

    setPredictions((prev) => {
      const existing = prev.find((p) => p.match_id === matchId)
      if (existing) {
        return prev.map((p) => (p.match_id === matchId ? data : p))
      }
      return [...prev, data]
    })

    return data
  }

  return { predictions, savePrediction, loading, error }
}
