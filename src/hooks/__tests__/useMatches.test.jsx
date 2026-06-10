import { renderHook, waitFor } from '@testing-library/react'
import { useMatches } from '../useMatches'

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

const defaultMatches = [
  {
    id: 'm1',
    home_team: 'Brasil',
    away_team: 'Argentina',
    kickoff_at: '2026-06-10T12:00:00Z',
    predictions: [{ count: 3 }],
  },
  {
    id: 'm2',
    home_team: 'Alemanha',
    away_team: 'França',
    kickoff_at: '2026-06-11T12:00:00Z',
    predictions: [{ count: 1 }],
  },
]

beforeEach(() => {
  vi.clearAllMocks()
  mockState.setResolutions([
    { data: defaultMatches, error: null },
  ])
})

describe('useMatches', () => {
  it('returns { matches, predictionCounts, loading, error }', () => {
    const { result } = renderHook(() => useMatches())
    expect(result.current).toHaveProperty('matches')
    expect(result.current).toHaveProperty('predictionCounts')
    expect(result.current).toHaveProperty('loading')
    expect(result.current).toHaveProperty('error')
  })

  it('loading is true initially, then false after fetch', async () => {
    const { result } = renderHook(() => useMatches())
    expect(result.current.loading).toBe(true)
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
  })

  it('error is set when query fails', async () => {
    mockState.setResolutions([
      { data: null, error: { message: 'Query failed' } },
    ])
    const { result } = renderHook(() => useMatches())
    await waitFor(() => {
      expect(result.current.error).toBe('Query failed')
    })
  })

  it('returns matches with predictions field stripped', async () => {
    const { result } = renderHook(() => useMatches())
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.matches).toEqual([
      { id: 'm1', home_team: 'Brasil', away_team: 'Argentina', kickoff_at: '2026-06-10T12:00:00Z' },
      { id: 'm2', home_team: 'Alemanha', away_team: 'França', kickoff_at: '2026-06-11T12:00:00Z' },
    ])
  })

  it('queries matches with single request using predictions(count)', async () => {
    const { result } = renderHook(() => useMatches())
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(mockState.mockFrom).toHaveBeenCalledTimes(1)
    expect(mockState.mockFrom).toHaveBeenCalledWith('matches')
    expect(mockState.builder.select).toHaveBeenCalledWith('*, predictions(count)')
    expect(mockState.builder.order).toHaveBeenCalledWith('kickoff_at', {
      ascending: true,
    })
  })

  it('predictionCounts maps match_id to count from predictions field', async () => {
    const { result } = renderHook(() => useMatches())
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.predictionCounts).toEqual({ m1: 3, m2: 1 })
  })

  it('handles matches with zero predictions', async () => {
    const matches = [
      { id: 'm1', home_team: 'Brasil', away_team: 'Argentina', kickoff_at: '2026-06-10T12:00:00Z', predictions: [{ count: 0 }] },
    ]
    mockState.setResolutions([
      { data: matches, error: null },
    ])

    const { result } = renderHook(() => useMatches())
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.predictionCounts).toEqual({ m1: 0 })
  })

  it('handles null data without error', async () => {
    mockState.setResolutions([
      { data: null, error: null },
    ])

    const { result } = renderHook(() => useMatches())
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.predictionCounts).toEqual({})
    expect(result.current.matches).toEqual([])
    expect(result.current.error).toBeNull()
  })
})
