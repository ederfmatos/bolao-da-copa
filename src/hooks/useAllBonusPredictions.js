import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { BONUS_DEADLINE } from '../lib/bracketData'

export function useAllBonusPredictions() {
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const isPastDeadline = new Date() > BONUS_DEADLINE

  useEffect(() => {
    if (!isPastDeadline) {
      setPredictions([])
      setLoading(false)
      return
    }

    async function fetchAllPredictions() {
      try {
        const { data, error } = await supabase
          .from('bonus_predictions')
          .select('*, profiles(name, avatar_url)')
          .order('profiles(name)', { ascending: true })

        if (error) throw error

        const mapped = (data || []).map(row => ({
          userId: row.user_id,
          userName: row.profiles?.name ?? null,
          avatarUrl: row.profiles?.avatar_url ?? null,
          firstPlace: row.first_place,
          secondPlace: row.second_place,
          thirdPlace: row.third_place,
          fourthPlace: row.fourth_place,
          bonusPoints: row.bonus_points,
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
