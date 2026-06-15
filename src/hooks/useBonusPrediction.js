import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { BONUS_DEADLINE } from '../lib/bracketData'

export function useBonusPrediction() {
  const { user } = useAuth()
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const isPastDeadline = new Date() > BONUS_DEADLINE

  useEffect(() => {
    if (!user) {
      setPrediction(null)
      setLoading(false)
      return
    }

    async function fetchPrediction() {
      try {
        const { data, error } = await supabase
          .from('bonus_predictions')
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

  const savePrediction = async ({ firstPlace, secondPlace, thirdPlace, fourthPlace }) => {
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('bonus_predictions')
      .upsert(
        {
          user_id: user.id,
          first_place: firstPlace,
          second_place: secondPlace,
          third_place: thirdPlace,
          fourth_place: fourthPlace,
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
