import { renderHook, waitFor } from '@testing-library/react'
import { useAllScorerPredictions } from '../useAllScorerPredictions'

const mockState = vi.hoisted(() => {
  const resolveRef = { current: null }
  const builder = {
    select: vi.fn().mockReturnThis(),
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

const mockPredictions = [
  {
    user_id: 'u1',
    player_id: 'p1',
    scorer_points: 0,
    profiles: { name: 'Alice', avatar_url: null },
  },
  {
    user_id: 'u2',
    player_id: 'p2',
    scorer_points: 0,
    profiles: { name: 'Bob', avatar_url: 'https://example.com/avatar.png' },
  },
]

const mappedPrediction0 = {
  userId: 'u1',
  playerId: 'p1',
  scorerPoints: 0,
  userName: 'Alice',
  userAvatarUrl: null,
}

const mappedPrediction1 = {
  userId: 'u2',
  playerId: 'p2',
  scorerPoints: 0,
  userName: 'Bob',
  userAvatarUrl: 'https://example.com/avatar.png',
}

describe('useAllScorerPredictions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockState.resolveRef.current = { data: mockPredictions, error: null }
  })

  it('returns { predictions, loading, error }', () => {
    const { result } = renderHook(() => useAllScorerPredictions())
    expect(result.current).toHaveProperty('predictions')
    expect(result.current).toHaveProperty('loading')
    expect(result.current).toHaveProperty('error')
  })

  it('loading is true initially, then false after fetch', async () => {
    const { result } = renderHook(() => useAllScorerPredictions())
    expect(result.current.loading).toBe(true)
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
  })

  it('fetches from scorer_predictions with profiles join', async () => {
    renderHook(() => useAllScorerPredictions())
    await waitFor(() => {
      expect(mockState.mockFrom).toHaveBeenCalledWith('scorer_predictions')
    })
    expect(mockState.builder.select).toHaveBeenCalledWith('*, profiles(name, avatar_url)')
    expect(mockState.builder.order).toHaveBeenCalledWith('profiles(name)', { ascending: true })
  })

  it('fetches and returns mapped predictions', async () => {
    const { result } = renderHook(() => useAllScorerPredictions())
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.predictions).toHaveLength(2)
    expect(result.current.predictions[0]).toEqual(mappedPrediction0)
    expect(result.current.predictions[1]).toEqual(mappedPrediction1)
  })

  it('includes userName and userAvatarUrl from profiles JOIN', async () => {
    const { result } = renderHook(() => useAllScorerPredictions())
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    const p0 = result.current.predictions[0]
    const p1 = result.current.predictions[1]
    expect(p0.userName).toBe('Alice')
    expect(p0.userAvatarUrl).toBeNull()
    expect(p1.userName).toBe('Bob')
    expect(p1.userAvatarUrl).toBe('https://example.com/avatar.png')
  })

  it('returns empty array when no rows exist', async () => {
    mockState.resolveRef.current = { data: [], error: null }
    const { result } = renderHook(() => useAllScorerPredictions())
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.predictions).toEqual([])
  })

  it('returns empty array when data is null', async () => {
    mockState.resolveRef.current = { data: null, error: null }
    const { result } = renderHook(() => useAllScorerPredictions())
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.predictions).toEqual([])
  })

  it('returns empty array when RLS blocks all rows (simulated pre-deadline)', async () => {
    mockState.resolveRef.current = { data: [], error: null }
    const { result } = renderHook(() => useAllScorerPredictions())
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.predictions).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('sets error when query fails', async () => {
    mockState.resolveRef.current = { data: null, error: { message: 'Query failed' } }
    const { result } = renderHook(() => useAllScorerPredictions())
    await waitFor(() => {
      expect(result.current.error).toBe('Query failed')
    })
    expect(result.current.predictions).toEqual([])
  })
})
