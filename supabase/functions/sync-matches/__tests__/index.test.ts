import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../serve', () => ({
  serve: vi.fn(),
}))

const mockFrom = vi.fn()
const mockCreateClient = vi.fn()

vi.mock('../supabaseClient', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}))

const mockFetchWithFallback = vi.fn()
const mockDefaultChain = []

vi.mock('../providers/index', () => ({
  fetchWithFallback: (...args: unknown[]) => mockFetchWithFallback(...args),
  defaultChain: mockDefaultChain,
}))

const mockCalculatePoints = vi.fn()

vi.mock('../../_shared/calculatePoints', () => ({
  calculatePoints: (...args: unknown[]) => mockCalculatePoints(...args),
}))

const mockEnvVars: Record<string, string> = {}

const fakeDeno = {
  env: {
    get: (key: string) => mockEnvVars[key] ?? undefined,
  },
}

vi.stubGlobal('Deno', fakeDeno)

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

let handleSyncMatches: typeof import('../index').handleSyncMatches

function buildProviderMatch(overrides: Partial<{
  id: string
  homeTeam: string
  awayTeam: string
  homeFlag: string
  awayFlag: string
  groupName: string
  kickoffAt: string
  status: string
  homeScore: number | null
  awayScore: number | null
}> = {}) {
  return {
    id: overrides.id ?? 'match-1',
    homeTeam: overrides.homeTeam ?? 'Brazil',
    awayTeam: overrides.awayTeam ?? 'Germany',
    homeFlag: overrides.homeFlag ?? undefined,
    awayFlag: overrides.awayFlag ?? undefined,
    groupName: overrides.groupName ?? 'Group A',
    kickoffAt: overrides.kickoffAt ?? '2026-06-15T14:00:00Z',
    status: overrides.status ?? 'scheduled',
    homeScore: overrides.homeScore ?? null,
    awayScore: overrides.awayScore ?? null,
  }
}

function buildMockSupabase() {
  const chain: Record<string, unknown> = {}

  const createChain = (table: string) => {
    const selectResult = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
        }),
      }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }

    mockFrom.mockImplementation((t: string) => {
      if (t === table) return selectResult
      return {}
    })

    return selectResult
  }

  return { createChain, mockFrom }
}

beforeEach(async () => {
  vi.clearAllMocks()

  for (const key of Object.keys(mockEnvVars)) {
    delete mockEnvVars[key]
  }

  mockEnvVars['SUPABASE_URL'] = 'https://test.supabase.co'
  mockEnvVars['SUPABASE_SERVICE_ROLE_KEY'] = 'test-service-role-key'

  mockFetchWithFallback.mockResolvedValue([])
  mockCalculatePoints.mockReturnValue(3)
  mockFetch.mockResolvedValue({ ok: true, text: vi.fn().mockResolvedValue('') })

  vi.resetModules()

  const mod = await import('../index')
  handleSyncMatches = mod.handleSyncMatches
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('sync-matches edge function', () => {
  describe('method validation', () => {
    test('non-POST methods return 405', async () => {
      const req = new Request('https://example.com/functions/v1/sync-matches', {
        method: 'GET',
      })

      const res = await handleSyncMatches(req)
      expect(res.status).toBe(405)
    })
  })

  describe('existing sync functionality', () => {
    test('fetches matches from providers and upserts them', async () => {
      const providerMatches = [buildProviderMatch()]

      mockFetchWithFallback.mockResolvedValue(providerMatches)

      mockFrom.mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
              }),
            }),
            upsert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        return {}
      })

      mockCreateClient.mockReturnValue({ from: mockFrom })

      const req = new Request('https://example.com/functions/v1/sync-matches', {
        method: 'POST',
      })
      const res = await handleSyncMatches(req)

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.matchesUpserted).toBe(1)
    })

    test('detects newly finished matches', async () => {
      const providerMatches = [
        buildProviderMatch({ id: 'match-1', status: 'finished', homeScore: 2, awayScore: 1 }),
      ]

      mockFetchWithFallback.mockResolvedValue(providerMatches)

      mockFrom.mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { status: 'live' }, error: null }),
              }),
            }),
            upsert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        if (table === 'predictions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }
        }
        return {}
      })

      mockCreateClient.mockReturnValue({ from: mockFrom })

      const req = new Request('https://example.com/functions/v1/sync-matches', {
        method: 'POST',
      })
      const res = await handleSyncMatches(req)

      const body = await res.json()
      expect(body.newlyFinished).toBe(1)
      expect(body.newlyFinishedIds).toContain('match-1')
    })

    test('calculates points for predictions on newly finished matches', async () => {
      const providerMatches = [
        buildProviderMatch({ id: 'match-1', status: 'finished', homeScore: 2, awayScore: 1 }),
      ]

      mockFetchWithFallback.mockResolvedValue(providerMatches)

      mockFrom.mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { status: 'live' }, error: null }),
              }),
            }),
            upsert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        if (table === 'predictions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [
                  { id: 'pred-1', user_id: 'user-1', home_score: 2, away_score: 1 },
                  { id: 'pred-2', user_id: 'user-2', home_score: 1, away_score: 0 },
                ],
                error: null,
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        return {}
      })

      mockCreateClient.mockReturnValue({ from: mockFrom })

      const req = new Request('https://example.com/functions/v1/sync-matches', {
        method: 'POST',
      })
      const res = await handleSyncMatches(req)

      const body = await res.json()
      expect(body.predictionsUpdated).toBe(2)
      expect(mockCalculatePoints).toHaveBeenCalledTimes(2)
    })

    test('already finished matches are not treated as newly finished', async () => {
      const providerMatches = [
        buildProviderMatch({ id: 'match-1', status: 'finished', homeScore: 2, awayScore: 1 }),
      ]

      mockFetchWithFallback.mockResolvedValue(providerMatches)

      mockFrom.mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { status: 'finished' }, error: null }),
              }),
            }),
            upsert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        return {}
      })

      mockCreateClient.mockReturnValue({ from: mockFrom })

      const req = new Request('https://example.com/functions/v1/sync-matches', {
        method: 'POST',
      })
      const res = await handleSyncMatches(req)

      const body = await res.json()
      expect(body.newlyFinished).toBe(0)
    })
  })

  describe('post-match notification trigger', () => {
    test('newly finished match triggers notification call', async () => {
      const providerMatches = [
        buildProviderMatch({ id: 'match-1', status: 'finished', homeScore: 2, awayScore: 1 }),
      ]

      mockFetchWithFallback.mockResolvedValue(providerMatches)

      mockFrom.mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { status: 'live' }, error: null }),
              }),
            }),
            upsert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        if (table === 'predictions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: 'pred-1', user_id: 'user-1', home_score: 2, away_score: 1 }],
                error: null,
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        return {}
      })

      mockCreateClient.mockReturnValue({ from: mockFrom })

      const req = new Request('https://example.com/functions/v1/sync-matches', {
        method: 'POST',
      })
      await handleSyncMatches(req)

      await vi.waitFor(() => {
        expect(mockFetch).toHaveBeenCalled()
      })
    })

    test('notification call includes correct match data', async () => {
      const providerMatches = [
        buildProviderMatch({
          id: 'match-42',
          homeTeam: 'Argentina',
          awayTeam: 'France',
          status: 'finished',
          homeScore: 3,
          awayScore: 2,
        }),
      ]

      mockFetchWithFallback.mockResolvedValue(providerMatches)

      mockFrom.mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { status: 'live' }, error: null }),
              }),
            }),
            upsert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        if (table === 'predictions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: 'pred-1', user_id: 'user-1', home_score: 2, away_score: 1 }],
                error: null,
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        return {}
      })

      mockCreateClient.mockReturnValue({ from: mockFrom })

      const req = new Request('https://example.com/functions/v1/sync-matches', {
        method: 'POST',
      })
      await handleSyncMatches(req)

      await vi.waitFor(() => {
        expect(mockFetch).toHaveBeenCalled()
      })

      const fetchCall = mockFetch.mock.calls[0]
      expect(fetchCall[0]).toBe('https://test.supabase.co/functions/v1/send-notifications')

      const fetchOptions = fetchCall[1]
      expect(fetchOptions.method).toBe('POST')

      const body = JSON.parse(fetchOptions.body)
      expect(body.type).toBe('post-match')
      expect(body.data.matchId).toBe('match-42')
      expect(body.data.match).toEqual({
        home_team: 'Argentina',
        away_team: 'France',
        home_score: 3,
        away_score: 2,
      })
    })

    test('notification call uses type post-match', async () => {
      const providerMatches = [
        buildProviderMatch({ id: 'match-1', status: 'finished', homeScore: 1, awayScore: 0 }),
      ]

      mockFetchWithFallback.mockResolvedValue(providerMatches)

      mockFrom.mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { status: 'live' }, error: null }),
              }),
            }),
            upsert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        if (table === 'predictions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: 'pred-1', user_id: 'user-1', home_score: 1, away_score: 0 }],
                error: null,
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        return {}
      })

      mockCreateClient.mockReturnValue({ from: mockFrom })

      const req = new Request('https://example.com/functions/v1/sync-matches', {
        method: 'POST',
      })
      await handleSyncMatches(req)

      await vi.waitFor(() => {
        expect(mockFetch).toHaveBeenCalled()
      })

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.type).toBe('post-match')
    })

    test('notification call uses service role key', async () => {
      const providerMatches = [
        buildProviderMatch({ id: 'match-1', status: 'finished', homeScore: 1, awayScore: 0 }),
      ]

      mockFetchWithFallback.mockResolvedValue(providerMatches)

      mockFrom.mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { status: 'live' }, error: null }),
              }),
            }),
            upsert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        if (table === 'predictions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: 'pred-1', user_id: 'user-1', home_score: 1, away_score: 0 }],
                error: null,
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        return {}
      })

      mockCreateClient.mockReturnValue({ from: mockFrom })

      const req = new Request('https://example.com/functions/v1/sync-matches', {
        method: 'POST',
      })
      await handleSyncMatches(req)

      await vi.waitFor(() => {
        expect(mockFetch).toHaveBeenCalled()
      })

      const fetchOptions = mockFetch.mock.calls[0][1]
      expect(fetchOptions.headers['Authorization']).toBe('Bearer test-service-role-key')
    })

    test('notification failure is logged but does not fail sync', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const providerMatches = [
        buildProviderMatch({ id: 'match-1', status: 'finished', homeScore: 1, awayScore: 0 }),
      ]

      mockFetchWithFallback.mockResolvedValue(providerMatches)

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      mockFrom.mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { status: 'live' }, error: null }),
              }),
            }),
            upsert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        if (table === 'predictions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: 'pred-1', user_id: 'user-1', home_score: 1, away_score: 0 }],
                error: null,
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        return {}
      })

      mockCreateClient.mockReturnValue({ from: mockFrom })

      const req = new Request('https://example.com/functions/v1/sync-matches', {
        method: 'POST',
      })
      const res = await handleSyncMatches(req)

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)

      await vi.waitFor(() => {
        const errorCalls = consoleSpy.mock.calls.filter((call) => {
          try {
            const parsed = JSON.parse(call[0] as string)
            return parsed.event === 'post_match_notification_error'
          } catch {
            return false
          }
        })
        expect(errorCalls.length).toBeGreaterThan(0)
      })

      consoleSpy.mockRestore()
    })

    test('multiple newly finished matches trigger multiple notifications', async () => {
      const providerMatches = [
        buildProviderMatch({ id: 'match-1', status: 'finished', homeScore: 2, awayScore: 1 }),
        buildProviderMatch({ id: 'match-2', status: 'finished', homeScore: 0, awayScore: 0 }),
        buildProviderMatch({ id: 'match-3', status: 'finished', homeScore: 3, awayScore: 3 }),
      ]

      mockFetchWithFallback.mockResolvedValue(providerMatches)

      mockFrom.mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { status: 'live' }, error: null }),
              }),
            }),
            upsert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        if (table === 'predictions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: 'pred-1', user_id: 'user-1', home_score: 1, away_score: 0 }],
                error: null,
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        return {}
      })

      mockCreateClient.mockReturnValue({ from: mockFrom })

      const req = new Request('https://example.com/functions/v1/sync-matches', {
        method: 'POST',
      })
      await handleSyncMatches(req)

      await vi.waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(3)
      })
    })

    test('no newly finished matches means no notification calls', async () => {
      const providerMatches = [
        buildProviderMatch({ id: 'match-1', status: 'scheduled' }),
        buildProviderMatch({ id: 'match-2', status: 'live' }),
      ]

      mockFetchWithFallback.mockResolvedValue(providerMatches)

      mockFrom.mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { status: 'scheduled' }, error: null }),
              }),
            }),
            upsert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        return {}
      })

      mockCreateClient.mockReturnValue({ from: mockFrom })

      const req = new Request('https://example.com/functions/v1/sync-matches', {
        method: 'POST',
      })
      const res = await handleSyncMatches(req)

      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(mockFetch).not.toHaveBeenCalled()

      const body = await res.json()
      expect(body.newlyFinished).toBe(0)
    })

    test('non-200 response from send-notifications is logged as failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue('Internal Server Error'),
      })

      const providerMatches = [
        buildProviderMatch({ id: 'match-1', status: 'finished', homeScore: 1, awayScore: 0 }),
      ]

      mockFetchWithFallback.mockResolvedValue(providerMatches)

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      mockFrom.mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { status: 'live' }, error: null }),
              }),
            }),
            upsert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        if (table === 'predictions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: 'pred-1', user_id: 'user-1', home_score: 1, away_score: 0 }],
                error: null,
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        return {}
      })

      mockCreateClient.mockReturnValue({ from: mockFrom })

      const req = new Request('https://example.com/functions/v1/sync-matches', {
        method: 'POST',
      })
      const res = await handleSyncMatches(req)

      expect(res.status).toBe(200)

      await vi.waitFor(() => {
        const errorCalls = consoleSpy.mock.calls.filter((call) => {
          try {
            const parsed = JSON.parse(call[0] as string)
            return parsed.event === 'post_match_notification_failed'
          } catch {
            return false
          }
        })
        expect(errorCalls.length).toBeGreaterThan(0)
      })

      consoleSpy.mockRestore()
    })
  })

  describe('logging', () => {
    test('logs trigger_post_match_notification event', async () => {
      const providerMatches = [
        buildProviderMatch({ id: 'match-1', status: 'finished', homeScore: 1, awayScore: 0 }),
      ]

      mockFetchWithFallback.mockResolvedValue(providerMatches)

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      mockFrom.mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { status: 'live' }, error: null }),
              }),
            }),
            upsert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        if (table === 'predictions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: 'pred-1', user_id: 'user-1', home_score: 1, away_score: 0 }],
                error: null,
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        return {}
      })

      mockCreateClient.mockReturnValue({ from: mockFrom })

      const req = new Request('https://example.com/functions/v1/sync-matches', {
        method: 'POST',
      })
      await handleSyncMatches(req)

      await vi.waitFor(() => {
        const triggerLogs = consoleSpy.mock.calls.filter((call) => {
          try {
            const parsed = JSON.parse(call[0] as string)
            return parsed.event === 'trigger_post_match_notification'
          } catch {
            return false
          }
        })
        expect(triggerLogs.length).toBeGreaterThan(0)
      })

      consoleSpy.mockRestore()
    })
  })

  describe('error handling', () => {
    test('sync returns 500 when provider fetch fails', async () => {
      mockFetchWithFallback.mockRejectedValue(new Error('All providers failed'))

      const req = new Request('https://example.com/functions/v1/sync-matches', {
        method: 'POST',
      })
      const res = await handleSyncMatches(req)

      expect(res.status).toBe(500)
      const body = await res.json()
      expect(body.success).toBe(false)
    })
  })
})
