import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useUserPredictions(userId) {
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!userId) return

    async function fetchPredictions() {
      try {
        const { data, error } = await supabase
          .from('user_predictions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (error) throw error
        setPredictions(data || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchPredictions()
  }, [userId])

  return { predictions, loading, error }
}
