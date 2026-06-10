import { renderHook, waitFor } from '@testing-library/react'
import { useMatchPredictions } from '../useMatchPredictions'

const mockState = vi.hoisted(() => {
  const resolveRef = { current: null }
  const builder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    then: (onFulfilled) => Promise.resolve(resolveRef.current).then(onFulfilled),
  }
  return {
    builder,
    mockFrom: vi.fn(() => builder),
    resolveRef,
  }
})

vi.mock('../../lib/supabase', () => ({
  supabase: { from: mockState.mockFrom },
}))

const defaultPredictions = [
  {
    prediction_id: '3',
    match_id: 'm1',
    user_id: 'u3',
    home_score: 1,
    away_score: 1,
    points: 5,
    created_at: '2026-06-01T12:00:00Z',
    user_name: 'Charlie',
    user_avatar_url: null,
  },
  {
    prediction_id: '1',
    match_id: 'm1',
    user_id: 'u1',
    home_score: 2,
    away_score: 1,
    points: 10,
    created_at: '2026-06-01T10:00:00Z',
    user_name: 'Alice',
    user_avatar_url: 'https://example.com/alice.jpg',
  },
  {
    prediction_id: '2',
    match_id: 'm1',
    user_id: 'u2',
    home_score: 0,
    away_score: 0,
    points: 3,
    created_at: '2026-06-01T11:00:00Z',
    user_name: 'Bob',
    user_avatar_url: null,
  },
]

beforeEach(() => {
  vi.clearAllMocks()
  mockState.resolveRef.current = { data: defaultPredictions, error: null }
})

describe('useMatchPredictions', () => {
  it('returns { predictions, loading, error }', () => {
    const { result } = renderHook(() => useMatchPredictions('m1'))
    expect(result.current).toHaveProperty('predictions')
    expect(result.current).toHaveProperty('loading')
    expect(result.current).toHaveProperty('error')
  })

  it('loading is true initially, then false after fetch', async () => {
    const { result } = renderHook(() => useMatchPredictions('m1'))
    expect(result.current.loading).toBe(true)
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
  })

  it('error is set when query fails', async () => {
    mockState.resolveRef.current = {
      data: null,
      error: { message: 'Query failed' },
    }
    const { result } = renderHook(() => useMatchPredictions('m1'))
    await waitFor(() => {
      expect(result.current.error).toBe('Query failed')
    })
  })

  it('handles null matchId without error', () => {
    const { result } = renderHook(() => useMatchPredictions(null))
    expect(result.current.predictions).toEqual([])
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('handles undefined matchId without error', () => {
    const { result } = renderHook(() => useMatchPredictions(undefined))
    expect(result.current.predictions).toEqual([])
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('re-fetches when matchId changes', async () => {
    const { result, rerender } = renderHook(
      ({ matchId }) => useMatchPredictions(matchId),
      { initialProps: { matchId: 'm1' } },
    )
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    rerender({ matchId: 'm2' })
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(mockState.mockFrom).toHaveBeenCalledTimes(2)
    expect(mockState.mockFrom).toHaveBeenNthCalledWith(1, 'match_predictions')
    expect(mockState.mockFrom).toHaveBeenNthCalledWith(2, 'match_predictions')
  })

  it('queries with correct sorting', async () => {
    const { result } = renderHook(() => useMatchPredictions('m1'))
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(mockState.builder.order).toHaveBeenNthCalledWith(1, 'points', {
      ascending: false,
    })
    expect(mockState.builder.order).toHaveBeenNthCalledWith(
      2,
      'created_at',
      { ascending: true },
    )
  })

  it('returns predictions with user profile data', async () => {
    const { result } = renderHook(() => useMatchPredictions('m1'))
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    result.current.predictions.forEach((p) => {
      expect(p).toHaveProperty('user_name')
      expect(p).toHaveProperty('user_avatar_url')
    })

    const alice = result.current.predictions.find(
      (p) => p.user_id === 'u1',
    )
    expect(alice).toBeDefined()
    expect(alice.user_name).toBe('Alice')
    expect(alice.user_avatar_url).toBe(
      'https://example.com/alice.jpg',
    )
  })

  it('returns empty array for empty result set', async () => {
    mockState.resolveRef.current = { data: [], error: null }
    const { result } = renderHook(() => useMatchPredictions('m1'))
    await waitFor(() => {
      expect(result.current.predictions).toEqual([])
    })
  })

  it('returns empty array when data is null', async () => {
    mockState.resolveRef.current = { data: null, error: null }
    const { result } = renderHook(() => useMatchPredictions('m1'))
    await waitFor(() => {
      expect(result.current.predictions).toEqual([])
    })
  })
})
