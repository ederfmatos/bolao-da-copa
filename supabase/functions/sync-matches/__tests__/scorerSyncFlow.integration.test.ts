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
let recalculateScorerPoints: typeof import('../index').recalculateScorerPoints

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

beforeEach(async () => {
  vi.clearAllMocks()
  for (const key of Object.keys(mockEnvVars)) delete mockEnvVars[key]
  mockEnvVars['SUPABASE_URL'] = 'https://test.supabase.co'
  mockEnvVars['SUPABASE_SERVICE_ROLE_KEY'] = 'test-service-role-key'
  mockEnvVars['FOOTBALL_DATA_API_KEY'] = 'test-api-key'

  vi.resetModules()
  const mod = await import('../index')
  updateScorerGoals = mod.updateScorerGoals
  recalculateScorerPoints = mod.recalculateScorerPoints
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('scorer sync full flow integration', () => {
  test('full flow: API returns 3 scorers -> goals updated -> points awarded correctly', async () => {
    mockFetch.mockResolvedValue(buildFootballDataResponse([
      { id: 101, name: 'Top Scorer', goals: 5 },
      { id: 102, name: 'Second Best', goals: 3 },
      { id: 103, name: 'Third Best', goals: 1 },
    ]))

    const scorerPlayersDb: Array<{ id: string; football_data_id: number | null; api_sports_id: number | null; goals: number }> = [
      { id: 'p1', football_data_id: 101, api_sports_id: null, goals: 0 },
      { id: 'p2', football_data_id: 102, api_sports_id: null, goals: 0 },
      { id: 'p3', football_data_id: 103, api_sports_id: null, goals: 0 },
    ]

    const predictionsDb: Array<{ id: string; player_id: string; scorer_points: number }> = [
      { id: 'pred-a', player_id: 'p1', scorer_points: 0 },
      { id: 'pred-b', player_id: 'p2', scorer_points: 0 },
      { id: 'pred-c', player_id: 'p3', scorer_points: 0 },
      { id: 'pred-d', player_id: 'p1', scorer_points: 0 },
    ]

    let storedUpsert: Array<{ id: string; goals: number }> = []

    const mockEq = vi.fn().mockImplementation((_field: string, _value: string) => {
      return Promise.resolve({ error: null })
    })

    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })

    const mockPlayersSelect = vi.fn().mockImplementation(() => {
      return Promise.resolve({ data: scorerPlayersDb, error: null })
    })
    const mockPredictionsSelect = vi.fn().mockImplementation(() => {
      return Promise.resolve({ data: predictionsDb, error: null })
    })
    const mockUpsert = vi.fn().mockImplementation((updates: Array<{ id: string; goals: number }>) => {
      storedUpsert = updates
      for (const u of updates) {
        const player = scorerPlayersDb.find(p => p.id === u.id)
        if (player) player.goals = u.goals
      }
      return Promise.resolve({ error: null })
    })

    const mockFrom = vi.fn((table: string) => {
      if (table === 'scorer_players') {
        return { select: mockPlayersSelect, upsert: mockUpsert }
      }
      if (table === 'scorer_predictions') {
        return { select: mockPredictionsSelect, update: mockUpdate }
      }
      return { select: vi.fn(), update: vi.fn(), upsert: vi.fn() }
    })

    const supabase = { from: mockFrom }

    await updateScorerGoals(supabase as any, 'test-api-key')

    expect(storedUpsert).toHaveLength(3)
    expect(storedUpsert).toContainEqual({ id: 'p1', goals: 5 })
    expect(storedUpsert).toContainEqual({ id: 'p2', goals: 3 })
    expect(storedUpsert).toContainEqual({ id: 'p3', goals: 1 })

    expect(scorerPlayersDb[0].goals).toBe(5)
    expect(scorerPlayersDb[1].goals).toBe(3)
    expect(scorerPlayersDb[2].goals).toBe(1)

    await recalculateScorerPoints(supabase as any)

    expect(mockUpdate).toHaveBeenCalledTimes(4)
    expect(mockUpdate).toHaveBeenNthCalledWith(1, { scorer_points: 20 })
    expect(mockUpdate).toHaveBeenNthCalledWith(2, { scorer_points: 0 })
    expect(mockUpdate).toHaveBeenNthCalledWith(3, { scorer_points: 0 })
    expect(mockUpdate).toHaveBeenNthCalledWith(4, { scorer_points: 20 })

    expect(mockEq).toHaveBeenNthCalledWith(1, 'id', 'pred-a')
    expect(mockEq).toHaveBeenNthCalledWith(2, 'id', 'pred-b')
    expect(mockEq).toHaveBeenNthCalledWith(3, 'id', 'pred-c')
    expect(mockEq).toHaveBeenNthCalledWith(4, 'id', 'pred-d')
  })

  test('full flow with tie: 2 players tie at max goals, both get points', async () => {
    mockFetch.mockResolvedValue(buildFootballDataResponse([
      { id: 101, name: 'Tied A', goals: 4 },
      { id: 102, name: 'Tied B', goals: 4 },
      { id: 103, name: 'Third', goals: 2 },
    ]))

    const scorerPlayersDb = [
      { id: 'p1', football_data_id: 101, api_sports_id: null, goals: 0 },
      { id: 'p2', football_data_id: 102, api_sports_id: null, goals: 0 },
      { id: 'p3', football_data_id: 103, api_sports_id: null, goals: 0 },
    ]

    const predictionsDb = [
      { id: 'pred-a', player_id: 'p1', scorer_points: 0 },
      { id: 'pred-b', player_id: 'p2', scorer_points: 0 },
      { id: 'pred-c', player_id: 'p3', scorer_points: 0 },
    ]

    let storedUpsert: Array<{ id: string; goals: number }> = []

    const mockEq = vi.fn().mockResolvedValue({ error: null })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    const mockPlayersSelect = vi.fn().mockResolvedValue({ data: scorerPlayersDb, error: null })
    const mockPredictionsSelect = vi.fn().mockResolvedValue({ data: predictionsDb, error: null })
    const mockUpsert = vi.fn().mockImplementation((updates: Array<{ id: string; goals: number }>) => {
      storedUpsert = updates
      for (const u of updates) {
        const player = scorerPlayersDb.find(p => p.id === u.id)
        if (player) player.goals = u.goals
      }
      return Promise.resolve({ error: null })
    })

    const mockFrom = vi.fn((table: string) => {
      if (table === 'scorer_players') return { select: mockPlayersSelect, upsert: mockUpsert }
      if (table === 'scorer_predictions') return { select: mockPredictionsSelect, update: mockUpdate }
      return { select: vi.fn(), update: vi.fn(), upsert: vi.fn() }
    })

    const supabase = { from: mockFrom }

    await updateScorerGoals(supabase as any, 'test-api-key')
    expect(storedUpsert).toHaveLength(3)

    await recalculateScorerPoints(supabase as any)

    expect(mockUpdate).toHaveBeenNthCalledWith(1, { scorer_points: 20 })
    expect(mockUpdate).toHaveBeenNthCalledWith(2, { scorer_points: 20 })
    expect(mockUpdate).toHaveBeenNthCalledWith(3, { scorer_points: 0 })
  })
})
