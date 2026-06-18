import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { SCORER_DEADLINE } from '../lib/bracketData'

export function useScorerPrediction() {
  const { user } = useAuth()
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const isPastDeadline = new Date() > SCORER_DEADLINE

  useEffect(() => {
    if (!user) {
      setPrediction(null)
      setLoading(false)
      return
    }

    async function fetchPrediction() {
      try {
        const { data, error } = await supabase
          .from('scorer_predictions')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        if (error) throw error

        setPrediction(data || null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchPrediction()
  }, [user])

  const savePrediction = async (playerId) => {
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('scorer_predictions')
      .upsert(
        {
          user_id: user.id,
          player_id: playerId,
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single()

    if (error) throw error

    setPrediction(data)

    return data
  }

  return { prediction, isPastDeadline, savePrediction, loading, error }
}
