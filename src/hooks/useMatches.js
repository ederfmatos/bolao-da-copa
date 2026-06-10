import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useMatches() {
  const [matches, setMatches] = useState([])
  const [predictionCounts, setPredictionCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const { data, error } = await supabase
          .from('matches')
          .select('*, predictions(count)')
          .order('kickoff_at', { ascending: true })

        if (error) throw error

        if (data) {
          const counts = {}
          const cleanMatches = data.map(({ predictions, ...match }) => {
            counts[match.id] = predictions?.[0]?.count ?? 0
            return match
          })
          setPredictionCounts(counts)
          setMatches(cleanMatches)
        } else {
          setMatches([])
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { matches, predictionCounts, loading, error }
}
