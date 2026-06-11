import { renderHook, waitFor } from '@testing-library/react'
import { useLeaderboard } from '../useLeaderboard'

const mockState = vi.hoisted(() => {
  const resolveRef = { current: null }
  const builder = {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    then: (onFulfilled) => Promise.resolve(resolveRef.current).then(onFulfilled),
  }
  const channel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
  }
  return {
    builder,
    channel,
    mockFrom: vi.fn(() => builder),
    mockChannel: vi.fn(() => channel),
    mockRemoveChannel: vi.fn(),
    resolveRef,
  }
})

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: mockState.mockFrom,
    channel: mockState.mockChannel,
    removeChannel: mockState.mockRemoveChannel,
  },
}))

const defaultLeaderboard = [
  {
    user_id: 'u1',
    name: 'Alice',
    avatar_url: null,
    total_points: 30,
    total_predictions: 10,
    exact_score_count: 2,
    winner_with_diff_count: 1,
    winner_correct_count: 3,
  },
  {
    user_id: 'u2',
    name: 'Bob',
    avatar_url: null,
    total_points: 30,
    total_predictions: 10,
    exact_score_count: 1,
    winner_with_diff_count: 2,
    winner_correct_count: 2,
  },
  {
    user_id: 'u3',
    name: 'Charlie',
    avatar_url: null,
    total_points: 25,
    total_predictions: 8,
    exact_score_count: 0,
    winner_with_diff_count: 3,
    winner_correct_count: 1,
  },
]

beforeEach(() => {
  vi.clearAllMocks()
  mockState.resolveRef.current = { data: defaultLeaderboard, error: null }
})

describe('useLeaderboard', () => {
  it('returns { leaderboard, loading, error }', () => {
    const { result } = renderHook(() => useLeaderboard())
    expect(result.current).toHaveProperty('leaderboard')
    expect(result.current).toHaveProperty('loading')
    expect(result.current).toHaveProperty('error')
  })

  it('loading is true initially, then false after fetch', async () => {
    const { result } = renderHook(() => useLeaderboard())
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
    const { result } = renderHook(() => useLeaderboard())
    await waitFor(() => {
      expect(result.current.error).toBe('Query failed')
    })
  })

  it('queries leaderboard view without client-side ordering', async () => {
    const { result } = renderHook(() => useLeaderboard())
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(mockState.mockFrom).toHaveBeenCalledWith('leaderboard')
    expect(mockState.builder.select).toHaveBeenCalledWith('*')
    expect(mockState.builder.order).not.toHaveBeenCalled()
  })

  it('returns leaderboard data with tiebreaker columns', async () => {
    const { result } = renderHook(() => useLeaderboard())
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.leaderboard).toEqual(defaultLeaderboard)
    result.current.leaderboard.forEach((entry) => {
      expect(entry).toHaveProperty('exact_score_count')
      expect(entry).toHaveProperty('winner_with_diff_count')
      expect(entry).toHaveProperty('winner_correct_count')
    })
  })

  it('returns empty array for empty result set', async () => {
    mockState.resolveRef.current = { data: [], error: null }
    const { result } = renderHook(() => useLeaderboard())
    await waitFor(() => {
      expect(result.current.leaderboard).toEqual([])
    })
  })

  it('returns empty array when data is null', async () => {
    mockState.resolveRef.current = { data: null, error: null }
    const { result } = renderHook(() => useLeaderboard())
    await waitFor(() => {
      expect(result.current.leaderboard).toEqual([])
    })
  })

  it('subscribes to realtime updates', async () => {
    renderHook(() => useLeaderboard())
    await waitFor(() => {
      expect(mockState.mockChannel).toHaveBeenCalledWith('leaderboard-updates')
    })
    expect(mockState.channel.on).toHaveBeenCalled()
    expect(mockState.channel.subscribe).toHaveBeenCalled()
  })

  it('cleans up channel on unmount', async () => {
    const { unmount } = renderHook(() => useLeaderboard())
    await waitFor(() => {
      expect(mockState.mockChannel).toHaveBeenCalledWith('leaderboard-updates')
    })
    unmount()
    expect(mockState.mockRemoveChannel).toHaveBeenCalled()
  })
})
