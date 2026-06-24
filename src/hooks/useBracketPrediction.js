import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { BRACKET_DEADLINE } from '../lib/bracketData'

export function useBracketPrediction() {
  const { user } = useAuth()
  const [bracketPicks, setBracketPicks] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isPastDeadline, setIsPastDeadline] = useState(
    new Date() > BRACKET_DEADLINE
  )

  const debounceTimer = useRef(null)
  const pendingSlots = useRef(new Set())
  const latestPicks = useRef(bracketPicks)
  latestPicks.current = bracketPicks

  useEffect(() => {
    const checkDeadline = () => {
      setIsPastDeadline(new Date() > BRACKET_DEADLINE)
    }

    checkDeadline()
    const interval = setInterval(checkDeadline, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!user) {
      setBracketPicks({})
      setLoading(false)
      return
    }

    async function fetchPicks() {
      try {
        const { data, error } = await supabase
          .from('bracket_predictions')
          .select('bracket_slot, predicted_winner')
          .eq('user_id', user.id)

        if (error) throw error

        const picks = {}
        if (data) {
          data.forEach(row => {
            picks[row.bracket_slot] = row.predicted_winner
          })
        }
        setBracketPicks(picks)
        latestPicks.current = picks
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchPicks()
  }, [user])

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [])

  const doSave = useCallback(async () => {
    if (!user) return

    const slotsToSave = [...pendingSlots.current]
    if (slotsToSave.length === 0) return
    pendingSlots.current.clear()

    setIsSaving(true)

    try {
      const rows = slotsToSave.map(slot => ({
        user_id: user.id,
        bracket_slot: slot,
        predicted_winner: latestPicks.current[slot] || '',
      }))

      const { error } = await supabase
        .from('bracket_predictions')
        .upsert(rows, { onConflict: 'user_id,bracket_slot' })

      if (error) throw error
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }, [user])

  const setBracketPick = useCallback((slot, teamName) => {
    if (isPastDeadline) return

    setBracketPicks(prev => ({ ...prev, [slot]: teamName }))
    pendingSlots.current.add(slot)

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(doSave, 1500)
  }, [isPastDeadline, doSave])

  return { bracketPicks, setBracketPick, isPastDeadline, loading, error, isSaving }
}
