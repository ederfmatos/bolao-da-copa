import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../serve', () => ({ serve: vi.fn() }))
vi.mock('../supabaseClient', () => ({ createClient: vi.fn() }))
vi.mock('../../_shared/calculatePoints', () => ({ calculatePoints: vi.fn() }))
vi.mock('../../_shared/calculateBonusPoints', () => ({
  calculateBonusPoints: vi.fn(),
}))

const mockEnvVars: Record<string, string> = {}
const fakeDeno = { env: { get: (key: string) => mockEnvVars[key] ?? undefined } }
vi.stubGlobal('Deno', fakeDeno)

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

let recalculateScorerPoints: typeof import('../index').recalculateScorerPoints

function createMockSupabase(config: {
  players?: any[]
  playersError?: any
  predictions?: any[]
  predictionsError?: any
  updateError?: any
}) {
  const mockEq = vi.fn().mockResolvedValue({ error: config.updateError ?? null })
  const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })

  const mockPlayersSelect = vi.fn().mockResolvedValue({
    data: config.players ?? [],
    error: config.playersError ?? null,
  })

  const mockPredictionsSelect = vi.fn().mockResolvedValue({
    data: config.predictions ?? [],
    error: config.predictionsError ?? null,
  })

  const mockFrom = vi.fn((table: string) => {
    if (table === 'scorer_players') {
      return { select: mockPlayersSelect }
    }
    if (table === 'scorer_predictions') {
      return { select: mockPredictionsSelect, update: mockUpdate }
    }
    return { select: vi.fn(), update: vi.fn() }
  })

  return {
    from: mockFrom,
    _mocks: { mockEq, mockUpdate, mockPlayersSelect, mockPredictionsSelect, mockFrom },
  }
}

function buildScorerPlayer(overrides: Partial<{ id: string; name: string; goals: number }> = {}) {
  return {
    id: overrides.id ?? 'player-uuid-1',
    name: overrides.name ?? 'Player 1',
    goals: overrides.goals ?? 0,
  }
}

function buildPrediction(overrides: Partial<{ id: string; player_id: string }> = {}) {
  return {
    id: overrides.id ?? 'pred-uuid-1',
    player_id: overrides.player_id ?? 'player-uuid-1',
  }
}

beforeEach(async () => {
  vi.clearAllMocks()
  for (const key of Object.keys(mockEnvVars)) delete mockEnvVars[key]
  mockEnvVars['SUPABASE_URL'] = 'https://test.supabase.co'
  mockEnvVars['SUPABASE_SERVICE_ROLE_KEY'] = 'test-service-role-key'

  vi.resetModules()
  const mod = await import('../index')
  recalculateScorerPoints = mod.recalculateScorerPoints
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('recalculateScorerPoints', () => {
  test('awards SCORER_POINTS to all predictions matching the single top scorer', async () => {
    const supabase = createMockSupabase({
      players: [
        buildScorerPlayer({ id: 'p1', name: 'Top Scorer', goals: 5 }),
        buildScorerPlayer({ id: 'p2', name: 'Second Player', goals: 2 }),
      ],
      predictions: [
        buildPrediction({ id: 'pred-1', player_id: 'p1' }),
        buildPrediction({ id: 'pred-2', player_id: 'p2' }),
      ],
    })

    await recalculateScorerPoints(supabase as any)

    expect(supabase._mocks.mockEq).toHaveBeenCalledTimes(2)
    expect(supabase._mocks.mockUpdate).toHaveBeenNthCalledWith(1, { scorer_points: 20 })
    expect(supabase._mocks.mockUpdate).toHaveBeenNthCalledWith(2, { scorer_points: 0 })
  })

  test('awards SCORER_POINTS to all predictions matching any tied top scorer', async () => {
    const supabase = createMockSupabase({
      players: [
        buildScorerPlayer({ id: 'p1', name: 'Tied Scorer A', goals: 4 }),
        buildScorerPlayer({ id: 'p2', name: 'Tied Scorer B', goals: 4 }),
        buildScorerPlayer({ id: 'p3', name: 'Third Scorer', goals: 1 }),
      ],
      predictions: [
        buildPrediction({ id: 'pred-a', player_id: 'p1' }),
        buildPrediction({ id: 'pred-b', player_id: 'p2' }),
        buildPrediction({ id: 'pred-c', player_id: 'p3' }),
      ],
    })

    await recalculateScorerPoints(supabase as any)

    expect(supabase._mocks.mockUpdate).toHaveBeenNthCalledWith(1, { scorer_points: 20 })
    expect(supabase._mocks.mockUpdate).toHaveBeenNthCalledWith(2, { scorer_points: 20 })
    expect(supabase._mocks.mockUpdate).toHaveBeenNthCalledWith(3, { scorer_points: 0 })
  })

  test('sets scorer_points = 0 for predictions not matching top scorer(s)', async () => {
    const supabase = createMockSupabase({
      players: [
        buildScorerPlayer({ id: 'p1', name: 'Top Scorer', goals: 5 }),
      ],
      predictions: [
        buildPrediction({ id: 'pred-other', player_id: 'p2' }),
      ],
    })

    await recalculateScorerPoints(supabase as any)

    expect(supabase._mocks.mockUpdate).toHaveBeenCalledWith({ scorer_points: 0 })
    expect(supabase._mocks.mockEq).toHaveBeenCalledWith('id', 'pred-other')
  })

  test('logs scorer_points_recalculated with winner names and user count', async () => {
    const supabase = createMockSupabase({
      players: [
        buildScorerPlayer({ id: 'p1', name: 'Winner', goals: 6 }),
      ],
      predictions: [
        buildPrediction({ id: 'pred-1', player_id: 'p1' }),
        buildPrediction({ id: 'pred-2', player_id: 'p1' }),
      ],
    })

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    await recalculateScorerPoints(supabase as any)

    const logCalls = consoleSpy.mock.calls.map((c: any) => JSON.parse(c[0]))
    const eventLog = logCalls.find((l: any) => l.event === 'scorer_points_recalculated')
    expect(eventLog).toBeDefined()
    expect(eventLog.winner_players).toEqual(['Winner'])
    expect(eventLog.winner_goals).toBe(6)
    expect(eventLog.user_count).toBe(2)

    consoleSpy.mockRestore()
  })

  test('does nothing and logs warning if no scorer_players have goals > 0', async () => {
    const supabase = createMockSupabase({
      players: [
        buildScorerPlayer({ id: 'p1', name: 'Player', goals: 0 }),
        buildScorerPlayer({ id: 'p2', name: 'Player 2', goals: 0 }),
      ],
      predictions: [],
    })

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    await recalculateScorerPoints(supabase as any)

    const logCalls = consoleSpy.mock.calls.map((c: any) => JSON.parse(c[0]))
    const eventLog = logCalls.find((l: any) => l.event === 'scorer_points_recalculated')
    expect(eventLog).toBeDefined()
    expect(eventLog.warning).toContain('No scorer_players have goals > 0')
    expect(eventLog.user_count).toBe(0)

    expect(supabase._mocks.mockUpdate).not.toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  test('logs warning when no scorer_players exist', async () => {
    const supabase = createMockSupabase({
      players: [],
      predictions: [],
    })

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    await recalculateScorerPoints(supabase as any)

    const logCalls = consoleSpy.mock.calls.map((c: any) => JSON.parse(c[0]))
    const eventLog = logCalls.find((l: any) => l.event === 'scorer_points_recalculated')
    expect(eventLog).toBeDefined()
    expect(eventLog.warning).toContain('No scorer_players found')

    consoleSpy.mockRestore()
  })

  test('handles players fetch error gracefully', async () => {
    const supabase = createMockSupabase({
      playersError: { message: 'Connection refused' },
    })

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await recalculateScorerPoints(supabase as any)

    const errorCalls = consoleSpy.mock.calls.map((c: any) => JSON.parse(c[0]))
    const errorLog = errorCalls.find((l: any) => l.event === 'scorer_points_recalculation_failed')
    expect(errorLog).toBeDefined()
    expect(errorLog.error).toBe('Connection refused')

    consoleSpy.mockRestore()
  })

  test('handles predictions fetch error gracefully', async () => {
    const supabase = createMockSupabase({
      players: [
        buildScorerPlayer({ id: 'p1', name: 'Top', goals: 3 }),
      ],
      predictionsError: { message: 'Permission denied' },
    })

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await recalculateScorerPoints(supabase as any)

    const errorCalls = consoleSpy.mock.calls.map((c: any) => JSON.parse(c[0]))
    const errorLog = errorCalls.find((l: any) => l.event === 'scorer_points_recalculation_failed')
    expect(errorLog).toBeDefined()
    expect(errorLog.error).toBe('Permission denied')

    consoleSpy.mockRestore()
  })

  test('handles update error for individual prediction without failing others', async () => {
    const supabase = createMockSupabase({
      players: [
        buildScorerPlayer({ id: 'p1', name: 'Top', goals: 3 }),
      ],
      predictions: [
        buildPrediction({ id: 'pred-1', player_id: 'p1' }),
        buildPrediction({ id: 'pred-2', player_id: 'p1' }),
      ],
    })

    supabase._mocks.mockEq
      .mockResolvedValueOnce({ error: { message: 'Update failed' } })
      .mockResolvedValueOnce({ error: null })

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await recalculateScorerPoints(supabase as any)

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error updating scorer_prediction pred-1'),
      expect.anything(),
    )

    consoleSpy.mockRestore()
  })
})
