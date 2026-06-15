import { renderHook, waitFor } from '@testing-library/react'
import { useAllBonusPredictions } from '../useAllBonusPredictions'

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

vi.mock('../../lib/bracketData', () => ({
  BONUS_DEADLINE: new Date('2026-06-18T16:00:00Z'),
}))

const mockPredictions = [
  {
    user_id: 'u1',
    first_place: 'Brasil',
    second_place: 'Argentina',
    third_place: 'França',
    fourth_place: 'Alemanha',
    bonus_points: 0,
    profiles: { name: 'Alice', avatar_url: null },
  },
  {
    user_id: 'u2',
    first_place: 'Alemanha',
    second_place: 'Brasil',
    third_place: 'Argentina',
    fourth_place: 'França',
    bonus_points: 0,
    profiles: { name: 'Bob', avatar_url: 'https://example.com/avatar.png' },
  },
]

const mappedPrediction0 = {
  userId: 'u1',
  userName: 'Alice',
  avatarUrl: null,
  firstPlace: 'Brasil',
  secondPlace: 'Argentina',
  thirdPlace: 'França',
  fourthPlace: 'Alemanha',
  bonusPoints: 0,
}

const mappedPrediction1 = {
  userId: 'u2',
  userName: 'Bob',
  avatarUrl: 'https://example.com/avatar.png',
  firstPlace: 'Alemanha',
  secondPlace: 'Brasil',
  thirdPlace: 'Argentina',
  fourthPlace: 'França',
  bonusPoints: 0,
}

describe('useAllBonusPredictions', () => {
  beforeEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
    mockState.resolveRef.current = { data: mockPredictions, error: null }
  })

  it('returns { predictions, loading, error }', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-19T12:00:00Z'))
    const { result } = renderHook(() => useAllBonusPredictions())
    expect(result.current).toHaveProperty('predictions')
    expect(result.current).toHaveProperty('loading')
    expect(result.current).toHaveProperty('error')
  })

  it('loading is true initially, then false after fetch', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date('2026-06-19T12:00:00Z'))
    const { result } = renderHook(() => useAllBonusPredictions())
    expect(result.current.loading).toBe(true)
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    vi.useRealTimers()
  })

  it('does not fetch when isPastDeadline is false, returns empty predictions', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-17T12:00:00Z'))
    const { result } = renderHook(() => useAllBonusPredictions())
    expect(mockState.mockFrom).not.toHaveBeenCalled()
    expect(result.current.predictions).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('fetches and returns mapped predictions when isPastDeadline is true', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date('2026-06-19T12:00:00Z'))
    const { result } = renderHook(() => useAllBonusPredictions())
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(mockState.mockFrom).toHaveBeenCalledWith('bonus_predictions')
    expect(mockState.builder.select).toHaveBeenCalledWith('*, profiles(name, avatar_url)')
    expect(mockState.builder.order).toHaveBeenCalledWith('profiles(name)', { ascending: true })
    expect(result.current.predictions).toHaveLength(2)
    expect(result.current.predictions[0]).toEqual(mappedPrediction0)
    expect(result.current.predictions[1]).toEqual(mappedPrediction1)
    vi.useRealTimers()
  })

  it('includes userName and avatarUrl from profiles JOIN', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date('2026-06-19T12:00:00Z'))
    const { result } = renderHook(() => useAllBonusPredictions())
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    const p0 = result.current.predictions[0]
    const p1 = result.current.predictions[1]
    expect(p0.userName).toBe('Alice')
    expect(p0.avatarUrl).toBeNull()
    expect(p1.userName).toBe('Bob')
    expect(p1.avatarUrl).toBe('https://example.com/avatar.png')
    vi.useRealTimers()
  })

  it('returns empty array when no rows exist', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date('2026-06-19T12:00:00Z'))
    mockState.resolveRef.current = { data: [], error: null }
    const { result } = renderHook(() => useAllBonusPredictions())
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.predictions).toEqual([])
    vi.useRealTimers()
  })

  it('returns empty array when data is null', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date('2026-06-19T12:00:00Z'))
    mockState.resolveRef.current = { data: null, error: null }
    const { result } = renderHook(() => useAllBonusPredictions())
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.predictions).toEqual([])
    vi.useRealTimers()
  })

  it('sets error when query fails', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date('2026-06-19T12:00:00Z'))
    mockState.resolveRef.current = { data: null, error: { message: 'Query failed' } }
    const { result } = renderHook(() => useAllBonusPredictions())
    await waitFor(() => {
      expect(result.current.error).toBe('Query failed')
    })
    expect(result.current.predictions).toEqual([])
    vi.useRealTimers()
  })
})
