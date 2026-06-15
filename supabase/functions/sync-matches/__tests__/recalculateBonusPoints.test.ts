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

let recalculateBonusPoints: typeof import('../index').recalculateBonusPoints

function createMockSupabase(config: {
  keyMatches?: any[]
  matchError?: any
  bonusPredictions?: any[]
  fetchError?: any
}) {
  const mockIn = vi.fn().mockResolvedValue({
    data: config.keyMatches ?? [],
    error: config.matchError ?? null,
  })
  const mockSelectKeyMatches = vi.fn().mockReturnValue({ in: mockIn })
  const mockSelectPredictions = vi.fn().mockResolvedValue({
    data: config.bonusPredictions ?? [],
    error: config.fetchError ?? null,
  })
  const mockEq = vi.fn().mockResolvedValue({ error: null })
  const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })

  const mockFrom = vi.fn((table: string) => {
    if (table === 'matches') {
      return { select: mockSelectKeyMatches }
    }
    if (table === 'bonus_predictions') {
      return { select: mockSelectPredictions, update: mockUpdate }
    }
    return { select: vi.fn(), update: vi.fn() }
  })

  return {
    from: mockFrom,
    _mocks: { mockIn, mockSelectKeyMatches, mockSelectPredictions, mockEq, mockUpdate, mockFrom },
  }
}

function buildFinalMatch(overrides: Partial<any> = {}) {
  return {
    group_name: 'Final',
    home_team: 'Brasil',
    away_team: 'Argentina',
    home_score: 2,
    away_score: 1,
    status: 'finished',
    ...overrides,
  }
}

function buildThirdMatch(overrides: Partial<any> = {}) {
  return {
    group_name: 'Terceiro Lugar',
    home_team: 'França',
    away_team: 'Alemanha',
    home_score: 3,
    away_score: 0,
    status: 'finished',
    ...overrides,
  }
}

beforeEach(async () => {
  vi.clearAllMocks()
  for (const key of Object.keys(mockEnvVars)) delete mockEnvVars[key]
  mockEnvVars['SUPABASE_URL'] = 'https://test.supabase.co'
  mockEnvVars['SUPABASE_SERVICE_ROLE_KEY'] = 'test-service-role-key'
  mockEnvVars['FOOTBALL_DATA_API_KEY'] = 'test-api-key'
  mockFetch.mockResolvedValue({ ok: true, json: async () => ({ matches: [] }) })

  vi.resetModules()
  const mod = await import('../index')
  recalculateBonusPoints = mod.recalculateBonusPoints
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('recalculateBonusPoints', () => {
  test('full standings: derives first/second from Final, third/fourth from Terceiro Lugar', async () => {
    const supabase = createMockSupabase({
      keyMatches: [
        buildFinalMatch(),
        buildThirdMatch(),
      ],
      bonusPredictions: [
        { id: 'bp-1', first_place: 'Brasil', second_place: 'Argentina', third_place: 'França', fourth_place: 'Alemanha' },
      ],
    })

    const calculateBonusPointsMock = (await import('../../_shared/calculateBonusPoints')).calculateBonusPoints as any
    calculateBonusPointsMock.mockReturnValue(250)

    await recalculateBonusPoints(supabase as any)

    expect(calculateBonusPointsMock).toHaveBeenCalledWith(
      { first_place: 'Brasil', second_place: 'Argentina', third_place: 'França', fourth_place: 'Alemanha' },
      { first: 'Brasil', second: 'Argentina', third: 'França', fourth: 'Alemanha' },
    )

    expect(supabase._mocks.mockEq).toHaveBeenCalledWith('id', 'bp-1')
  })

  test('Final home_score > away_score → first = home_team, second = away_team', async () => {
    const supabase = createMockSupabase({
      keyMatches: [buildFinalMatch({ home_score: 3, away_score: 1 })],
      bonusPredictions: [
        { id: 'bp-1', first_place: 'Brasil', second_place: 'Argentina', third_place: 'França', fourth_place: 'Alemanha' },
      ],
    })

    const calculateBonusPointsMock = (await import('../../_shared/calculateBonusPoints')).calculateBonusPoints as any
    await recalculateBonusPoints(supabase as any)

    expect(calculateBonusPointsMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ first: 'Brasil', second: 'Argentina' }),
    )
  })

  test('Final away_score > home_score → first = away_team, second = home_team', async () => {
    const supabase = createMockSupabase({
      keyMatches: [buildFinalMatch({ home_score: 1, away_score: 3 })],
      bonusPredictions: [
        { id: 'bp-1', first_place: 'Argentina', second_place: 'Brasil', third_place: 'França', fourth_place: 'Alemanha' },
      ],
    })

    const calculateBonusPointsMock = (await import('../../_shared/calculateBonusPoints')).calculateBonusPoints as any
    await recalculateBonusPoints(supabase as any)

    expect(calculateBonusPointsMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ first: 'Argentina', second: 'Brasil' }),
    )
  })

  test('Terceiro Lugar away_score > home_score → third = away_team, fourth = home_team', async () => {
    const supabase = createMockSupabase({
      keyMatches: [
        buildFinalMatch(),
        buildThirdMatch({ home_score: 1, away_score: 2 }),
      ],
      bonusPredictions: [
        { id: 'bp-1', first_place: 'Brasil', second_place: 'Argentina', third_place: 'Alemanha', fourth_place: 'França' },
      ],
    })

    const calculateBonusPointsMock = (await import('../../_shared/calculateBonusPoints')).calculateBonusPoints as any
    await recalculateBonusPoints(supabase as any)

    expect(calculateBonusPointsMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ third: 'Alemanha', fourth: 'França' }),
    )
  })

  test('partial standings: apenas Final finished, third/fourth undefined', async () => {
    const supabase = createMockSupabase({
      keyMatches: [
        buildFinalMatch(),
        buildThirdMatch({ status: 'scheduled', home_score: null, away_score: null }),
      ],
      bonusPredictions: [
        { id: 'bp-1', first_place: 'Brasil', second_place: 'Argentina', third_place: 'França', fourth_place: 'Alemanha' },
      ],
    })

    const calculateBonusPointsMock = (await import('../../_shared/calculateBonusPoints')).calculateBonusPoints as any
    await recalculateBonusPoints(supabase as any)

    expect(calculateBonusPointsMock).toHaveBeenCalledWith(
      expect.anything(),
      { first: 'Brasil', second: 'Argentina' },
    )
  })

  test('empty bonus_predictions: executa sem erros, updated_count = 0', async () => {
    const supabase = createMockSupabase({
      keyMatches: [buildFinalMatch()],
      bonusPredictions: [],
    })

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    await recalculateBonusPoints(supabase as any)

    const logCalls = consoleSpy.mock.calls.map((c: any) => JSON.parse(c[0]))
    const bonusLog = logCalls.find((l: any) => l.event === 'bonus_points_recalculated')
    expect(bonusLog).toBeDefined()
    expect(bonusLog.updated_count).toBe(0)

    consoleSpy.mockRestore()
  })

  test('idempotency: segunda chamada produz mesmo resultado', async () => {
    const supabase = createMockSupabase({
      keyMatches: [
        buildFinalMatch(),
        buildThirdMatch(),
      ],
      bonusPredictions: [
        { id: 'bp-1', first_place: 'Brasil', second_place: 'Argentina', third_place: 'França', fourth_place: 'Alemanha' },
        { id: 'bp-2', first_place: 'Brasil', second_place: 'Alemanha', third_place: 'França', fourth_place: 'Argentina' },
      ],
    })

    const calculateBonusPointsMock = (await import('../../_shared/calculateBonusPoints')).calculateBonusPoints as any
    calculateBonusPointsMock.mockReturnValue(250)

    await recalculateBonusPoints(supabase as any)
    const firstCallArgs = calculateBonusPointsMock.mock.calls.map((c: any) => c[1])

    calculateBonusPointsMock.mockClear()
    supabase._mocks.mockEq.mockClear()
    supabase._mocks.mockUpdate.mockClear()

    await recalculateBonusPoints(supabase as any)
    const secondCallArgs = calculateBonusPointsMock.mock.calls.map((c: any) => c[1])

    expect(firstCallArgs).toEqual(secondCallArgs)
  })

  test('structured log contains event, updated_count, and standings', async () => {
    const supabase = createMockSupabase({
      keyMatches: [
        buildFinalMatch(),
        buildThirdMatch(),
      ],
      bonusPredictions: [
        { id: 'bp-1', first_place: 'Brasil', second_place: 'Argentina', third_place: 'França', fourth_place: 'Alemanha' },
      ],
    })

    const calculateBonusPointsMock = (await import('../../_shared/calculateBonusPoints')).calculateBonusPoints as any
    calculateBonusPointsMock.mockReturnValue(250)

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    await recalculateBonusPoints(supabase as any)

    const logCalls = consoleSpy.mock.calls.map((c: any) => JSON.parse(c[0]))
    const bonusLog = logCalls.find((l: any) => l.event === 'bonus_points_recalculated')
    expect(bonusLog).toBeDefined()
    expect(bonusLog.updated_count).toBe(1)
    expect(bonusLog.standings).toEqual({ first: 'Brasil', second: 'Argentina', third: 'França', fourth: 'Alemanha' })

    consoleSpy.mockRestore()
  })

  test('match error logs bonus_points_recalculation_failed', async () => {
    const supabase = createMockSupabase({
      matchError: { message: 'DB connection failed' },
      bonusPredictions: [],
    })

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await recalculateBonusPoints(supabase as any)

    const errorCalls = consoleSpy.mock.calls.map((c: any) => JSON.parse(c[0]))
    const errorLog = errorCalls.find((l: any) => l.event === 'bonus_points_recalculation_failed')
    expect(errorLog).toBeDefined()
    expect(errorLog.error).toBe('DB connection failed')

    consoleSpy.mockRestore()
  })

  test('fetch error logs bonus_points_fetch_failed', async () => {
    const supabase = createMockSupabase({
      keyMatches: [buildFinalMatch()],
      fetchError: { message: 'Permission denied' },
    })

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await recalculateBonusPoints(supabase as any)

    const errorCalls = consoleSpy.mock.calls.map((c: any) => JSON.parse(c[0]))
    const errorLog = errorCalls.find((l: any) => l.event === 'bonus_points_fetch_failed')
    expect(errorLog).toBeDefined()
    expect(errorLog.error).toBe('Permission denied')

    consoleSpy.mockRestore()
  })
})
