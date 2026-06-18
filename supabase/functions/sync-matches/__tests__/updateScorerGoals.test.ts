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

let updateScorerGoals: typeof import('../index').updateScorerGoals

function createMockSupabase(config: {
  scorerPlayers?: any[]
  fetchError?: any
  upsertError?: any
}) {
  const mockUpsert = vi.fn().mockResolvedValue({ error: config.upsertError ?? null })
  const mockSelect = vi.fn().mockResolvedValue({
    data: config.scorerPlayers ?? [],
    error: config.fetchError ?? null,
  })
  const mockFrom = vi.fn((table: string) => {
    if (table === 'scorer_players') {
      return { select: mockSelect, upsert: mockUpsert }
    }
    return { select: vi.fn(), upsert: vi.fn() }
  })

  return {
    from: mockFrom,
    _mocks: { mockUpsert, mockSelect, mockFrom },
  }
}

function buildFootballDataResponse(scorers: Array<{ id: number; name: string; goals: number }>) {
  return {
    ok: true,
    json: async () => ({
      scorers: scorers.map(s => ({
        player: { id: s.id, name: s.name },
        goals: s.goals,
      })),
    }),
  }
}

function buildApiSportsResponse(players: Array<{ id: number; name: string; goals: number }>) {
  return {
    ok: true,
    json: async () => ({
      response: players.map(p => ({
        player: { id: p.id, name: p.name },
        statistics: [{ goals: { total: p.goals } }],
      })),
    }),
  }
}

function buildScorerPlayer(overrides: Partial<{
  id: string
  name: string
  football_data_id: number | null
  api_sports_id: number | null
  goals: number
}> = {}) {
  return {
    id: overrides.id ?? 'player-uuid-1',
    name: overrides.name ?? 'Player 1',
    football_data_id: overrides.football_data_id ?? null,
    api_sports_id: overrides.api_sports_id ?? null,
    goals: overrides.goals ?? 0,
  }
}

beforeEach(async () => {
  vi.clearAllMocks()
  for (const key of Object.keys(mockEnvVars)) delete mockEnvVars[key]
  mockEnvVars['SUPABASE_URL'] = 'https://test.supabase.co'
  mockEnvVars['SUPABASE_SERVICE_ROLE_KEY'] = 'test-service-role-key'
  mockEnvVars['FOOTBALL_DATA_API_KEY'] = 'test-api-key'

  vi.resetModules()
  const mod = await import('../index')
  updateScorerGoals = mod.updateScorerGoals
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('updateScorerGoals', () => {
  test('calls football-data.org endpoint with correct auth header', async () => {
    mockFetch.mockResolvedValue(buildFootballDataResponse([
      { id: 101, name: 'Player A', goals: 3 },
    ]))

    const supabase = createMockSupabase({
      scorerPlayers: [buildScorerPlayer({ football_data_id: 101 })],
    })

    await updateScorerGoals(supabase as any, 'test-api-key')

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.football-data.org/v4/competitions/WC/scorers',
      expect.objectContaining({
        headers: { 'X-Auth-Token': 'test-api-key' },
      }),
    )
  })

  test('updates goals for each matched player using football_data_id', async () => {
    mockFetch.mockResolvedValue(buildFootballDataResponse([
      { id: 101, name: 'Player A', goals: 3 },
      { id: 102, name: 'Player B', goals: 5 },
    ]))

    const supabase = createMockSupabase({
      scorerPlayers: [
        buildScorerPlayer({ id: 'uuid-1', football_data_id: 101 }),
        buildScorerPlayer({ id: 'uuid-2', football_data_id: 102 }),
        buildScorerPlayer({ id: 'uuid-3', football_data_id: 103 }),
      ],
    })

    await updateScorerGoals(supabase as any, 'test-api-key')

    expect(supabase._mocks.mockUpsert).toHaveBeenCalledWith([
      { id: 'uuid-1', goals: 3 },
      { id: 'uuid-2', goals: 5 },
    ])
  })

  test('falls back to api-sports.io when football-data.org returns non-OK response', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 403, json: async () => ({}) })
      .mockResolvedValueOnce(buildApiSportsResponse([
        { id: 201, name: 'Player A', goals: 4 },
      ]))

    const supabase = createMockSupabase({
      scorerPlayers: [buildScorerPlayer({ api_sports_id: 201 })],
    })

    await updateScorerGoals(supabase as any, 'test-api-key', 'fallback-key')

    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      'https://v3.football.api-sports.io/players/topscorers?league=1&season=2026',
      expect.objectContaining({
        headers: { 'x-apisports-key': 'fallback-key' },
      }),
    )

    expect(supabase._mocks.mockUpsert).toHaveBeenCalledWith([
      { id: 'player-uuid-1', goals: 4 },
    ])
  })

  test('updates goals using api_sports_id when fallback is used', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) })
      .mockResolvedValueOnce(buildApiSportsResponse([
        { id: 201, name: 'Player X', goals: 2 },
        { id: 202, name: 'Player Y', goals: 7 },
      ]))

    const supabase = createMockSupabase({
      scorerPlayers: [
        buildScorerPlayer({ id: 'uuid-x', api_sports_id: 201 }),
        buildScorerPlayer({ id: 'uuid-y', api_sports_id: 202 }),
      ],
    })

    await updateScorerGoals(supabase as any, 'test-api-key', 'fallback-key')

    expect(supabase._mocks.mockUpsert).toHaveBeenCalledWith([
      { id: 'uuid-x', goals: 2 },
      { id: 'uuid-y', goals: 7 },
    ])
  })

  test('logs scorer_goals_updated event with player count and timestamp', async () => {
    mockFetch.mockResolvedValue(buildFootballDataResponse([
      { id: 101, name: 'Player A', goals: 3 },
    ]))

    const supabase = createMockSupabase({
      scorerPlayers: [buildScorerPlayer({ football_data_id: 101 })],
    })

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    await updateScorerGoals(supabase as any, 'test-api-key')

    const logCalls = consoleSpy.mock.calls.map((c: any) => JSON.parse(c[0]))
    const eventLog = logCalls.find((l: any) => l.event === 'scorer_goals_updated')
    expect(eventLog).toBeDefined()
    expect(eventLog.player_count).toBe(1)
    expect(eventLog.timestamp).toBeDefined()

    consoleSpy.mockRestore()
  })

  test('logs scorer_goals_update_failed when both APIs fail', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 403, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) })

    const supabase = createMockSupabase({ scorerPlayers: [] })

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await updateScorerGoals(supabase as any, 'test-api-key', 'fallback-key')

    const errorCalls = consoleSpy.mock.calls.map((c: any) => JSON.parse(c[0]))
    const errorLog = errorCalls.find((l: any) => l.event === 'scorer_goals_update_failed')
    expect(errorLog).toBeDefined()
    expect(errorLog.error).toContain('Both APIs returned empty or failed')

    consoleSpy.mockRestore()
  })

  test('players with no matching ID are skipped without error', async () => {
    mockFetch.mockResolvedValue(buildFootballDataResponse([
      { id: 101, name: 'Player A', goals: 3 },
      { id: 999, name: 'Unknown Player', goals: 1 },
    ]))

    const supabase = createMockSupabase({
      scorerPlayers: [buildScorerPlayer({ id: 'uuid-1', football_data_id: 101 })],
    })

    await updateScorerGoals(supabase as any, 'test-api-key')

    expect(supabase._mocks.mockUpsert).toHaveBeenCalledWith([
      { id: 'uuid-1', goals: 3 },
    ])
  })

  test('logs error when fetch of scorer_players fails', async () => {
    mockFetch.mockResolvedValue(buildFootballDataResponse([
      { id: 101, name: 'Player A', goals: 3 },
    ]))

    const supabase = createMockSupabase({
      fetchError: { message: 'Database error' },
    })

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await updateScorerGoals(supabase as any, 'test-api-key')

    const errorCalls = consoleSpy.mock.calls.map((c: any) => JSON.parse(c[0]))
    const errorLog = errorCalls.find((l: any) => l.event === 'scorer_goals_update_failed')
    expect(errorLog).toBeDefined()
    expect(errorLog.error).toBe('Database error')

    consoleSpy.mockRestore()
  })

  test('logs error when upsert fails', async () => {
    mockFetch.mockResolvedValue(buildFootballDataResponse([
      { id: 101, name: 'Player A', goals: 3 },
    ]))

    const supabase = createMockSupabase({
      scorerPlayers: [buildScorerPlayer({ football_data_id: 101 })],
      upsertError: { message: 'Upsert failed' },
    })

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await updateScorerGoals(supabase as any, 'test-api-key')

    const errorCalls = consoleSpy.mock.calls.map((c: any) => JSON.parse(c[0]))
    const errorLog = errorCalls.find((l: any) => l.event === 'scorer_goals_update_failed')
    expect(errorLog).toBeDefined()
    expect(errorLog.error).toBe('Upsert failed')

    consoleSpy.mockRestore()
  })

  test('handles errors thrown in fetch gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('Network failure'))

    const supabase = createMockSupabase({ scorerPlayers: [] })

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await updateScorerGoals(supabase as any, 'test-api-key')

    const errorCalls = consoleSpy.mock.calls.map((c: any) => JSON.parse(c[0]))
    const errorLog = errorCalls.find((l: any) => l.event === 'scorer_goals_update_failed')
    expect(errorLog).toBeDefined()
    expect(errorLog.error).toBe('Network failure')

    consoleSpy.mockRestore()
  })
})
