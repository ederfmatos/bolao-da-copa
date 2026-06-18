import { renderHook, waitFor } from '@testing-library/react'
import { useScorerPlayers } from '../useScorerPlayers'

const mockState = vi.hoisted(() => {
  const resolveQueue = []
  const builder = {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    then: (onFulfilled) => {
      const value = resolveQueue.shift()
      return Promise.resolve(value).then(onFulfilled)
    },
  }
  return {
    builder,
    mockFrom: vi.fn(() => builder),
    resolveQueue,
    setResolutions(resolutions) {
      resolveQueue.length = 0
      resolveQueue.push(...resolutions)
    },
  }
})

vi.mock('../../lib/supabase', () => ({
  supabase: { from: mockState.mockFrom },
}))

const defaultPlayers = [
  {
    id: 'p1',
    name: 'Kylian Mbappé',
    nationality: 'France',
    flag: '🇫🇷',
    position: 'Forward',
    goals: 8,
    football_data_id: 1,
    api_sports_id: 100,
  },
  {
    id: 'p2',
    name: 'Lionel Messi',
    nationality: 'Argentina',
    flag: '🇦🇷',
    position: 'Forward',
    goals: 7,
    football_data_id: 2,
    api_sports_id: 101,
  },
]

beforeEach(() => {
  vi.clearAllMocks()
  mockState.setResolutions([
    { data: defaultPlayers, error: null },
  ])
})

describe('useScorerPlayers', () => {
  it('returns { players, loading, error }', () => {
    const { result } = renderHook(() => useScorerPlayers())
    expect(result.current).toHaveProperty('players')
    expect(result.current).toHaveProperty('loading')
    expect(result.current).toHaveProperty('error')
  })

  it('loading is true initially, then false after fetch', async () => {
    const { result } = renderHook(() => useScorerPlayers())
    expect(result.current.loading).toBe(true)
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
  })

  it('returns players ordered by goals descending on success', async () => {
    const players = [
      { id: 'p2', name: 'Player B', goals: 10 },
      { id: 'p1', name: 'Player A', goals: 5 },
      { id: 'p3', name: 'Player C', goals: 3 },
    ]
    mockState.setResolutions([
      { data: players, error: null },
    ])

    const { result } = renderHook(() => useScorerPlayers())
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.players).toEqual(players)
    expect(result.current.players[0].goals).toBe(10)
    expect(result.current.players[1].goals).toBe(5)
  })

  it('returns error string when Supabase query fails', async () => {
    mockState.setResolutions([
      { data: null, error: { message: 'Database error' } },
    ])

    const { result } = renderHook(() => useScorerPlayers())
    await waitFor(() => {
      expect(result.current.error).toBe('Database error')
    })
  })

  it('returns empty players array when table has no rows', async () => {
    mockState.setResolutions([
      { data: [], error: null },
    ])

    const { result } = renderHook(() => useScorerPlayers())
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.players).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('queries scorer_players with correct ordering', async () => {
    const { result } = renderHook(() => useScorerPlayers())
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(mockState.mockFrom).toHaveBeenCalledTimes(1)
    expect(mockState.mockFrom).toHaveBeenCalledWith('scorer_players')
    expect(mockState.builder.select).toHaveBeenCalledWith('*')
    expect(mockState.builder.order).toHaveBeenCalledWith('goals', {
      ascending: false,
    })
    expect(mockState.builder.order).toHaveBeenCalledWith('name', {
      ascending: true,
    })
  })

  it('handles null data without error', async () => {
    mockState.setResolutions([
      { data: null, error: null },
    ])

    const { result } = renderHook(() => useScorerPlayers())
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.players).toEqual([])
    expect(result.current.error).toBeNull()
  })
})
