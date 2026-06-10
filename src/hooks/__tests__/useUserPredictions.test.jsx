import { renderHook, waitFor } from '@testing-library/react'
import { useUserPredictions } from '../useUserPredictions'

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
    prediction_id: 'p1',
    user_id: 'u1',
    match_id: 'm1',
    predicted_home: 2,
    predicted_away: 1,
    points: 10,
    created_at: '2026-06-10T12:00:00Z',
    home_team: 'Brasil',
    away_team: 'Argentina',
    home_flag: 'br.svg',
    away_flag: 'ar.svg',
    group_name: 'Group A',
    kickoff_at: '2026-06-10T10:00:00Z',
    match_status: 'finished',
    actual_home: 2,
    actual_away: 1,
  },
  {
    prediction_id: 'p2',
    user_id: 'u1',
    match_id: 'm2',
    predicted_home: 1,
    predicted_away: 1,
    points: 5,
    created_at: '2026-06-11T12:00:00Z',
    home_team: 'Alemanha',
    away_team: 'França',
    home_flag: 'de.svg',
    away_flag: 'fr.svg',
    group_name: 'Group B',
    kickoff_at: '2026-06-11T10:00:00Z',
    match_status: 'finished',
    actual_home: 1,
    actual_away: 0,
  },
  {
    prediction_id: 'p3',
    user_id: 'u1',
    match_id: 'm3',
    predicted_home: 0,
    predicted_away: 2,
    points: 0,
    created_at: '2026-06-12T12:00:00Z',
    home_team: 'Espanha',
    away_team: 'Itália',
    home_flag: 'es.svg',
    away_flag: 'it.svg',
    group_name: 'Group C',
    kickoff_at: '2026-06-12T10:00:00Z',
    match_status: 'scheduled',
    actual_home: null,
    actual_away: null,
  },
]

beforeEach(() => {
  vi.clearAllMocks()
  mockState.resolveRef.current = { data: defaultPredictions, error: null }
})

describe('useUserPredictions', () => {
  it('returns { predictions, loading, error }', () => {
    const { result } = renderHook(() => useUserPredictions('u1'))
    expect(result.current).toHaveProperty('predictions')
    expect(result.current).toHaveProperty('loading')
    expect(result.current).toHaveProperty('error')
  })

  it('loading is true initially, then false after fetch', async () => {
    const { result } = renderHook(() => useUserPredictions('u1'))
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
    const { result } = renderHook(() => useUserPredictions('u1'))
    await waitFor(() => {
      expect(result.current.error).toBe('Query failed')
    })
  })

  it('handles null userId without error', () => {
    const { result } = renderHook(() => useUserPredictions(null))
    expect(result.current.predictions).toEqual([])
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('handles undefined userId without error', () => {
    const { result } = renderHook(() => useUserPredictions(undefined))
    expect(result.current.predictions).toEqual([])
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('re-fetches when userId changes', async () => {
    const { result, rerender } = renderHook(
      ({ userId }) => useUserPredictions(userId),
      { initialProps: { userId: 'u1' } },
    )
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    rerender({ userId: 'u2' })
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(mockState.mockFrom).toHaveBeenCalledTimes(2)
    expect(mockState.mockFrom).toHaveBeenNthCalledWith(1, 'user_predictions')
    expect(mockState.mockFrom).toHaveBeenNthCalledWith(2, 'user_predictions')
  })

  it('queries user_predictions view with correct table and filter', async () => {
    const { result } = renderHook(() => useUserPredictions('u1'))
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(mockState.mockFrom).toHaveBeenCalledWith('user_predictions')
    expect(mockState.builder.select).toHaveBeenCalledWith('*')
    expect(mockState.builder.eq).toHaveBeenCalledWith('user_id', 'u1')
    expect(mockState.builder.order).toHaveBeenCalledWith('created_at', {
      ascending: false,
    })
  })

  it('returns predictions with all view fields', async () => {
    const { result } = renderHook(() => useUserPredictions('u1'))
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    result.current.predictions.forEach((p) => {
      expect(p).toHaveProperty('prediction_id')
      expect(p).toHaveProperty('user_id')
      expect(p).toHaveProperty('match_id')
      expect(p).toHaveProperty('predicted_home')
      expect(p).toHaveProperty('predicted_away')
      expect(p).toHaveProperty('points')
      expect(p).toHaveProperty('created_at')
      expect(p).toHaveProperty('home_team')
      expect(p).toHaveProperty('away_team')
      expect(p).toHaveProperty('home_flag')
      expect(p).toHaveProperty('away_flag')
      expect(p).toHaveProperty('group_name')
      expect(p).toHaveProperty('kickoff_at')
      expect(p).toHaveProperty('match_status')
    })

    const first = result.current.predictions[0]
    expect(first.predicted_home).toBe(2)
    expect(first.predicted_away).toBe(1)
    expect(first.points).toBe(10)
    expect(first.home_team).toBe('Brasil')
    expect(first.away_team).toBe('Argentina')
  })

  it('sets order with descending created_at', async () => {
    const { result } = renderHook(() => useUserPredictions('u1'))
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(mockState.builder.order).toHaveBeenCalledWith('created_at', {
      ascending: false,
    })
  })

  it('returns empty array for empty result set', async () => {
    mockState.resolveRef.current = { data: [], error: null }
    const { result } = renderHook(() => useUserPredictions('u1'))
    await waitFor(() => {
      expect(result.current.predictions).toEqual([])
    })
  })

  it('returns empty array when data is null', async () => {
    mockState.resolveRef.current = { data: null, error: null }
    const { result } = renderHook(() => useUserPredictions('u1'))
    await waitFor(() => {
      expect(result.current.predictions).toEqual([])
    })
  })
})
