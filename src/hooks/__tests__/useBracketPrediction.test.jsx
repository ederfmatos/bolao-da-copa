import { renderHook, waitFor, act } from '@testing-library/react'
import { useBracketPrediction } from '../useBracketPrediction'

const mockState = vi.hoisted(() => {
  const resolveRef = { current: null }

  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    upsert: vi.fn(() => builder),
    then: (onFulfilled) => Promise.resolve(resolveRef.current).then(onFulfilled),
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

const BRACKET_DEADLINE = new Date('2026-06-28T12:45:00Z')

const existingPicks = [
  { bracket_slot: 'R16_01', predicted_winner: 'Brasil' },
  { bracket_slot: 'R16_02', predicted_winner: 'Argentina' },
]

describe('useBracketPrediction', () => {
  beforeEach(() => {
    mockState.resolveRef.current = { data: null, error: null }
    mockState.setMockUser({ id: 'test-user-id' })
    mockState.mockFrom.mockClear()
    mockState.builder.select.mockClear()
    mockState.builder.eq.mockClear()
    mockState.builder.upsert.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns { bracketPicks, setBracketPick, isPastDeadline, loading, error, isSaving }', () => {
    const { result } = renderHook(() => useBracketPrediction())
    expect(result.current).toHaveProperty('bracketPicks')
    expect(result.current).toHaveProperty('setBracketPick')
    expect(result.current).toHaveProperty('isPastDeadline')
    expect(result.current).toHaveProperty('loading')
    expect(result.current).toHaveProperty('error')
    expect(result.current).toHaveProperty('isSaving')
  })

  it('loading is true initially, then false after fetch', async () => {
    const { result } = renderHook(() => useBracketPrediction())
    expect(result.current.loading).toBe(true)
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
  })

  it('bracketPicks is empty object when user is null', () => {
    mockState.setMockUser(null)
    const { result } = renderHook(() => useBracketPrediction())
    expect(result.current.bracketPicks).toEqual({})
    expect(result.current.loading).toBe(false)
  })

  it('does not fetch when user is null', () => {
    mockState.setMockUser(null)
    renderHook(() => useBracketPrediction())
    expect(mockState.mockFrom).not.toHaveBeenCalled()
  })

  it('queries bracket_predictions with correct filter', async () => {
    mockState.resolveRef.current = { data: null, error: null }
    renderHook(() => useBracketPrediction())
    await waitFor(() => {
      expect(mockState.mockFrom).toHaveBeenCalledWith('bracket_predictions')
    })
    expect(mockState.builder.select).toHaveBeenCalledWith('bracket_slot, predicted_winner')
    expect(mockState.builder.eq).toHaveBeenCalledWith('user_id', 'test-user-id')
  })

  it('bracketPicks is empty when no rows exist', async () => {
    mockState.resolveRef.current = { data: [], error: null }
    const { result } = renderHook(() => useBracketPrediction())
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.bracketPicks).toEqual({})
    expect(result.current.error).toBeNull()
  })

  it('bracketPicks has entries when rows exist', async () => {
    mockState.resolveRef.current = { data: existingPicks, error: null }
    const { result } = renderHook(() => useBracketPrediction())
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.bracketPicks).toEqual({
      R16_01: 'Brasil',
      R16_02: 'Argentina',
    })
  })

  it('error is set when query fails', async () => {
    mockState.resolveRef.current = { data: null, error: { message: 'Query failed' } }
    const { result } = renderHook(() => useBracketPrediction())
    await waitFor(() => {
      expect(result.current.error).toBe('Query failed')
    })
    expect(result.current.loading).toBe(false)
  })

  describe('setBracketPick', () => {
    it('updates bracketPicks before deadline', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      vi.setSystemTime(new Date(BRACKET_DEADLINE.getTime() - 3600000))

      mockState.resolveRef.current = { data: [], error: null }
      const { result } = renderHook(() => useBracketPrediction())
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.setBracketPick('R16_01', 'Brasil')
      })

      expect(result.current.bracketPicks).toEqual({ R16_01: 'Brasil' })
    })

    it('does not update bracketPicks after deadline', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      vi.setSystemTime(new Date(BRACKET_DEADLINE.getTime() + 3600000))

      mockState.resolveRef.current = { data: [], error: null }
      const { result } = renderHook(() => useBracketPrediction())
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.setBracketPick('R16_01', 'Brasil')
      })

      expect(result.current.bracketPicks).toEqual({})
    })

    it('isPastDeadline is true when current time is past deadline', () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      vi.setSystemTime(new Date(BRACKET_DEADLINE.getTime() + 3600000))

      mockState.setMockUser(null)
      const { result } = renderHook(() => useBracketPrediction())

      expect(result.current.isPastDeadline).toBe(true)
    })

    it('isPastDeadline is false when current time is before deadline', () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      vi.setSystemTime(new Date(BRACKET_DEADLINE.getTime() - 3600000))

      mockState.setMockUser(null)
      const { result } = renderHook(() => useBracketPrediction())

      expect(result.current.isPastDeadline).toBe(false)
    })

    it('collapses two quick setBracketPick calls into one upsert', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      vi.setSystemTime(new Date(BRACKET_DEADLINE.getTime() - 3600000))

      mockState.resolveRef.current = { data: [], error: null }
      const { result } = renderHook(() => useBracketPrediction())
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.setBracketPick('R16_01', 'Brasil')
      })

      act(() => {
        result.current.setBracketPick('R16_02', 'Argentina')
      })

      mockState.resolveRef.current = { error: null }

      await vi.advanceTimersByTimeAsync(1500)

      expect(mockState.builder.upsert).toHaveBeenCalledTimes(1)
      expect(mockState.builder.upsert).toHaveBeenCalledWith(
        [
          { user_id: 'test-user-id', bracket_slot: 'R16_01', predicted_winner: 'Brasil' },
          { user_id: 'test-user-id', bracket_slot: 'R16_02', predicted_winner: 'Argentina' },
        ],
        { onConflict: 'user_id,bracket_slot' }
      )
    })

    it('dispatches two upserts when calls are spaced more than 1.5s apart', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      vi.setSystemTime(new Date(BRACKET_DEADLINE.getTime() - 3600000))

      mockState.resolveRef.current = { data: [], error: null }
      const { result } = renderHook(() => useBracketPrediction())
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.setBracketPick('R16_01', 'Brasil')
      })

      mockState.resolveRef.current = { error: null }

      await vi.advanceTimersByTimeAsync(2000)

      expect(mockState.builder.upsert).toHaveBeenCalledTimes(1)

      act(() => {
        result.current.setBracketPick('R16_01', 'Argentina')
      })

      await vi.advanceTimersByTimeAsync(2000)

      expect(mockState.builder.upsert).toHaveBeenCalledTimes(2)
    })

    it('isSaving is true during upsert and false after', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      vi.setSystemTime(new Date(BRACKET_DEADLINE.getTime() - 3600000))

      let resolveUpsert
      const upsertPromise = new Promise((resolve) => {
        resolveUpsert = resolve
      })

      const delayedThenable = {
        then: (onFulfilled) => upsertPromise.then(onFulfilled),
      }

      mockState.resolveRef.current = { data: [], error: null }
      mockState.builder.upsert.mockReturnValueOnce(delayedThenable)

      const { result } = renderHook(() => useBracketPrediction())
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.setBracketPick('R16_01', 'Brasil')
      })

      // Use sync advanceTimersByTime inside act so setIsSaving(true) is flushed
      act(() => {
        vi.advanceTimersByTime(1500)
      })

      expect(result.current.isSaving).toBe(true)

      resolveUpsert({ error: null })

      // Flush microtasks so the async doSave continuation completes
      await act(async () => {})

      expect(result.current.isSaving).toBe(false)
    })

    it('clears debounce timer on unmount', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      vi.setSystemTime(new Date(BRACKET_DEADLINE.getTime() - 3600000))

      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')

      mockState.resolveRef.current = { data: [], error: null }
      const { result, unmount } = renderHook(() => useBracketPrediction())
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.setBracketPick('R16_01', 'Brasil')
      })

      unmount()

      expect(clearTimeoutSpy).toHaveBeenCalled()
      clearTimeoutSpy.mockRestore()
    })

    it('does not call upsert when deadline has passed', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      vi.setSystemTime(new Date(BRACKET_DEADLINE.getTime() + 3600000))

      mockState.resolveRef.current = { data: [], error: null }
      const { result } = renderHook(() => useBracketPrediction())
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.setBracketPick('R16_01', 'Brasil')
      })

      expect(result.current.bracketPicks).toEqual({})
      expect(mockState.builder.upsert).not.toHaveBeenCalled()
    })
  })
})
