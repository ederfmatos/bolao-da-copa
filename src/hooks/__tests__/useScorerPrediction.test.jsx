import { renderHook, waitFor } from '@testing-library/react'
import { useScorerPrediction } from '../useScorerPrediction'

const mockState = vi.hoisted(() => {
  const resolveRef = { current: null }

  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    maybeSingle: vi.fn(() => ({
      then: (onFulfilled) => Promise.resolve(resolveRef.current).then(onFulfilled),
    })),
    upsert: vi.fn(() => builder),
    single: vi.fn(() => ({
      then: (onFulfilled) => Promise.resolve(resolveRef.current).then(onFulfilled),
    })),
  }

  const mockFrom = vi.fn(() => builder)
  let mockUserValue = { id: 'test-user-id' }

  const mockUseAuth = vi.fn(() => ({ user: mockUserValue }))
  const setMockUser = (val) => { mockUserValue = val }

  return {
    builder,
    mockFrom,
    mockUseAuth,
    setMockUser,
    resolveRef,
  }
})

vi.mock('../../lib/supabase', () => ({
  supabase: { from: mockState.mockFrom },
}))

vi.mock('../useAuth', () => ({
  useAuth: mockState.mockUseAuth,
}))

vi.mock('../../lib/bracketData', () => ({
  SCORER_DEADLINE: new Date('2026-06-12T00:00:00Z'),
}))

const existingPrediction = {
  id: 'sp-1',
  user_id: 'test-user-id',
  player_id: 'p1',
  scorer_points: 0,
  created_at: '2026-06-11T12:00:00Z',
}

describe('useScorerPrediction', () => {
  beforeEach(() => {
    mockState.resolveRef.current = { data: null, error: null }
    mockState.setMockUser({ id: 'test-user-id' })
    mockState.mockFrom.mockClear()
    mockState.builder.select.mockClear()
    mockState.builder.eq.mockClear()
    mockState.builder.maybeSingle.mockClear()
    mockState.builder.upsert.mockClear()
    mockState.builder.single.mockClear()
  })

  it('returns { prediction, isPastDeadline, savePrediction, loading, error }', () => {
    const { result } = renderHook(() => useScorerPrediction())
    expect(result.current).toHaveProperty('prediction')
    expect(result.current).toHaveProperty('isPastDeadline')
    expect(result.current).toHaveProperty('savePrediction')
    expect(result.current).toHaveProperty('loading')
    expect(result.current).toHaveProperty('error')
  })

  it('loading is true initially, then false after fetch', async () => {
    const { result } = renderHook(() => useScorerPrediction())
    expect(result.current.loading).toBe(true)
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
  })

  it('returns loading false and prediction null when user is not authenticated', () => {
    mockState.setMockUser(null)
    const { result } = renderHook(() => useScorerPrediction())
    expect(result.current.prediction).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('savePrediction throws when user is null', async () => {
    mockState.setMockUser(null)
    const { result } = renderHook(() => useScorerPrediction())
    await expect(
      result.current.savePrediction('p1')
    ).rejects.toThrow('User not authenticated')
  })

  it('prediction is null when no row exists in scorer_predictions', async () => {
    mockState.resolveRef.current = { data: null, error: null }
    const { result } = renderHook(() => useScorerPrediction())
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.prediction).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('fetches and returns existing prediction when user is authenticated', async () => {
    mockState.resolveRef.current = { data: existingPrediction, error: null }
    const { result } = renderHook(() => useScorerPrediction())
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.prediction).toEqual(existingPrediction)
  })

  it('error is set when query fails', async () => {
    mockState.resolveRef.current = { data: null, error: { message: 'Query failed' } }
    const { result } = renderHook(() => useScorerPrediction())
    await waitFor(() => {
      expect(result.current.error).toBe('Query failed')
    })
  })

  it('queries scorer_predictions with correct filter', async () => {
    mockState.resolveRef.current = { data: null, error: null }
    renderHook(() => useScorerPrediction())
    await waitFor(() => {
      expect(mockState.mockFrom).toHaveBeenCalledWith('scorer_predictions')
    })
    expect(mockState.builder.select).toHaveBeenCalledWith('*')
    expect(mockState.builder.eq).toHaveBeenCalledWith('user_id', 'test-user-id')
    expect(mockState.builder.maybeSingle).toHaveBeenCalled()
  })

  it('does not fetch when user is null', () => {
    mockState.setMockUser(null)
    renderHook(() => useScorerPrediction())
    expect(mockState.mockFrom).not.toHaveBeenCalled()
  })

  describe('savePrediction', () => {
    const upsertPayload = {
      user_id: 'test-user-id',
      player_id: 'p1',
    }

    it('calls upsert with correct fields', async () => {
      mockState.resolveRef.current = { data: existingPrediction, error: null }

      const { result } = renderHook(() => useScorerPrediction())
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await result.current.savePrediction('p1')

      expect(mockState.mockFrom).toHaveBeenCalledWith('scorer_predictions')
      expect(mockState.builder.upsert).toHaveBeenCalledWith(upsertPayload, {
        onConflict: 'user_id',
      })
      expect(mockState.builder.select).toHaveBeenCalled()
      expect(mockState.builder.single).toHaveBeenCalled()
    })

    it('updates local state with returned data without re-fetch', async () => {
      mockState.resolveRef.current = { data: null, error: null }
      const { result } = renderHook(() => useScorerPrediction())
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const savedData = {
        ...existingPrediction,
        player_id: 'p2',
      }

      mockState.resolveRef.current = { data: savedData, error: null }

      await result.current.savePrediction('p2')

      await waitFor(() => {
        expect(result.current.prediction).toEqual(savedData)
      })
    })

    it('throws when upsert fails', async () => {
      mockState.resolveRef.current = { data: null, error: null }
      const { result } = renderHook(() => useScorerPrediction())
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      mockState.resolveRef.current = { data: null, error: { message: 'Upsert failed' } }

      await expect(
        result.current.savePrediction('p1')
      ).rejects.toThrow('Upsert failed')
    })
  })

  describe('isPastDeadline', () => {
    afterEach(() => {
      vi.useRealTimers()
    })

    it('returns true when current date is past SCORER_DEADLINE', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-06-13T00:00:00Z'))
      mockState.setMockUser(null)
      const { result } = renderHook(() => useScorerPrediction())
      expect(result.current.isPastDeadline).toBe(true)
    })

    it('returns false when current date is before SCORER_DEADLINE', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-06-11T00:00:00Z'))
      mockState.setMockUser(null)
      const { result } = renderHook(() => useScorerPrediction())
      expect(result.current.isPastDeadline).toBe(false)
    })
  })
})
