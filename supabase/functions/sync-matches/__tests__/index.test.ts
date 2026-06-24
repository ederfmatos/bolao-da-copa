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

const mockCalculateBonusPoints = vi.fn()

vi.mock('../../_shared/calculateBonusPoints', () => ({
  calculateBonusPoints: (...args: unknown[]) => mockCalculateBonusPoints(...args),
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
  mockEnvVars['FOOTBALL_DATA_API_KEY'] = 'test-api-key'

  mockFetchWithFallback.mockResolvedValue([])
  mockCalculatePoints.mockReturnValue(3)
  mockFetch.mockResolvedValue({ ok: true, json: async () => ({ matches: [] }) })

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
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          matches: [{
            utcDate: '2026-06-15T14:00:00Z',
            status: 'TIMED',
            homeTeam: { name: 'Brazil', shortName: 'Brazil' },
            awayTeam: { name: 'Germany', shortName: 'Germany' },
            score: { fullTime: { home: null, away: null } },
          }],
        }),
      })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: vi.fn((columns: string) => {
              if (!columns || columns === '*') {
                return Promise.resolve({
                  data: [{ id: 'match-1', home_team: 'Brasil', away_team: 'Alemanha', kickoff_at: '2026-06-15T14:00:00Z', status: 'scheduled', home_score: null, away_score: null }],
                  error: null,
                })
              }
              return {
                eq: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
                })),
              }
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
      expect(body.matchesUpdated).toBe(1)
    })

    test('detects newly finished matches', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          matches: [{
            utcDate: '2026-06-15T14:00:00Z',
            status: 'FINISHED',
            homeTeam: { name: 'Brazil', shortName: 'Brazil' },
            awayTeam: { name: 'Germany', shortName: 'Germany' },
            score: { fullTime: { home: 2, away: 1 } },
          }],
        }),
      })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: vi.fn((columns: string) => {
              if (!columns || columns === '*') {
                return Promise.resolve({
                  data: [{ id: 'match-1', home_team: 'Brasil', away_team: 'Alemanha', kickoff_at: '2026-06-15T14:00:00Z', status: 'live', home_score: null, away_score: null }],
                  error: null,
                })
              }
              return {
                eq: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({ data: { home_score: 2, away_score: 1 }, error: null }),
                })),
              }
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
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
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          matches: [{
            utcDate: '2026-06-15T14:00:00Z',
            status: 'FINISHED',
            homeTeam: { name: 'Brazil', shortName: 'Brazil' },
            awayTeam: { name: 'Germany', shortName: 'Germany' },
            score: { fullTime: { home: 2, away: 1 } },
          }],
        }),
      })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: vi.fn((columns: string) => {
              if (!columns || columns === '*') {
                return Promise.resolve({
                  data: [{ id: 'match-1', home_team: 'Brasil', away_team: 'Alemanha', kickoff_at: '2026-06-15T14:00:00Z', status: 'live', home_score: null, away_score: null }],
                  error: null,
                })
              }
              return {
                eq: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({ data: { home_score: 2, away_score: 1 }, error: null }),
                })),
              }
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
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
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          matches: [{
            utcDate: '2026-06-15T14:00:00Z',
            status: 'FINISHED',
            homeTeam: { name: 'Brazil', shortName: 'Brazil' },
            awayTeam: { name: 'Germany', shortName: 'Germany' },
            score: { fullTime: { home: 2, away: 1 } },
          }],
        }),
      })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: vi.fn((columns: string) => {
              if (!columns || columns === '*') {
                return Promise.resolve({
                  data: [{ id: 'match-1', home_team: 'Brasil', away_team: 'Alemanha', kickoff_at: '2026-06-15T14:00:00Z', status: 'finished', home_score: 2, away_score: 1 }],
                  error: null,
                })
              }
              return {
                eq: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({ data: { home_score: 2, away_score: 1 }, error: null }),
                })),
              }
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
      // API call returns a FINISHED match; second call is the notification endpoint
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          matches: [{
            utcDate: '2026-06-15T14:00:00Z',
            status: 'FINISHED',
            homeTeam: { name: 'Argentina', shortName: 'Argentina' },
            awayTeam: { name: 'Germany', shortName: 'Germany' },
            score: { fullTime: { home: 3, away: 2 } },
          }],
        }),
      })
      mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: vi.fn((columns?: string) => {
              if (!columns || columns === '*') {
                return Promise.resolve({
                  data: [{ id: 'match-42', home_team: 'Argentina', away_team: 'Alemanha', kickoff_at: '2026-06-15T14:00:00Z', status: 'live', home_score: null, away_score: null }],
                  error: null,
                })
              }
              return { eq: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: { home_score: 3, away_score: 2 }, error: null }) })) }
            }),
            update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
          }
        }
        if (table === 'predictions') {
          return {
            select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [{ id: 'pred-1', user_id: 'user-1', home_score: 2, away_score: 1 }], error: null }) }),
            update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
          }
        }
        return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [], error: null }) }) }
      })

      mockCreateClient.mockReturnValue({ from: mockFrom })

      const req = new Request('https://example.com/functions/v1/sync-matches', { method: 'POST' })
      await handleSyncMatches(req)

      await vi.waitFor(() => {
        const notifCall = mockFetch.mock.calls.find(
          (c: unknown[]) => typeof c[0] === 'string' && (c[0] as string).includes('send-notifications')
        )
        expect(notifCall).toBeDefined()
      })

      const notifCall = mockFetch.mock.calls.find(
        (c: unknown[]) => typeof c[0] === 'string' && (c[0] as string).includes('send-notifications')
      )!
      expect(notifCall[0]).toBe('https://test.supabase.co/functions/v1/send-notifications')

      const fetchOptions = notifCall[1] as RequestInit
      expect(fetchOptions.method).toBe('POST')

      const body = JSON.parse(fetchOptions.body as string)
      expect(body.type).toBe('post-match')
      expect(body.data.matchId).toBe('match-42')
      expect(body.data.match.home_team).toBe('Argentina')
      expect(body.data.match.home_score).toBe(3)
      expect(body.data.match.away_score).toBe(2)
    })

    test('notification call uses type post-match', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          matches: [{
            utcDate: '2026-06-15T14:00:00Z',
            status: 'FINISHED',
            homeTeam: { name: 'Brazil', shortName: 'Brazil' },
            awayTeam: { name: 'Germany', shortName: 'Germany' },
            score: { fullTime: { home: 1, away: 0 } },
          }],
        }),
      })
      mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: vi.fn((columns?: string) => {
              if (!columns || columns === '*') {
                return Promise.resolve({
                  data: [{ id: 'match-1', home_team: 'Brasil', away_team: 'Alemanha', kickoff_at: '2026-06-15T14:00:00Z', status: 'live', home_score: null, away_score: null }],
                  error: null,
                })
              }
              return { eq: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: { home_score: 1, away_score: 0 }, error: null }) })) }
            }),
            update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
          }
        }
        if (table === 'predictions') {
          return {
            select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [{ id: 'pred-1', user_id: 'user-1', home_score: 1, away_score: 0 }], error: null }) }),
            update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
          }
        }
        return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [], error: null }) }) }
      })

      mockCreateClient.mockReturnValue({ from: mockFrom })

      const req = new Request('https://example.com/functions/v1/sync-matches', { method: 'POST' })
      await handleSyncMatches(req)

      await vi.waitFor(() => {
        const notifCall = mockFetch.mock.calls.find(
          (c: unknown[]) => typeof c[0] === 'string' && (c[0] as string).includes('send-notifications')
        )
        expect(notifCall).toBeDefined()
      })

      const notifCall = mockFetch.mock.calls.find(
        (c: unknown[]) => typeof c[0] === 'string' && (c[0] as string).includes('send-notifications')
      )!
      const body = JSON.parse((notifCall[1] as RequestInit).body as string)
      expect(body.type).toBe('post-match')
    })

    test('notification call uses service role key', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          matches: [{
            utcDate: '2026-06-15T14:00:00Z',
            status: 'FINISHED',
            homeTeam: { name: 'Brazil', shortName: 'Brazil' },
            awayTeam: { name: 'Germany', shortName: 'Germany' },
            score: { fullTime: { home: 1, away: 0 } },
          }],
        }),
      })
      mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: vi.fn((columns?: string) => {
              if (!columns || columns === '*') {
                return Promise.resolve({
                  data: [{ id: 'match-1', home_team: 'Brasil', away_team: 'Alemanha', kickoff_at: '2026-06-15T14:00:00Z', status: 'live', home_score: null, away_score: null }],
                  error: null,
                })
              }
              return { eq: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: { home_score: 1, away_score: 0 }, error: null }) })) }
            }),
            update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
          }
        }
        if (table === 'predictions') {
          return {
            select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [{ id: 'pred-1', user_id: 'user-1', home_score: 1, away_score: 0 }], error: null }) }),
            update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
          }
        }
        return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [], error: null }) }) }
      })

      mockCreateClient.mockReturnValue({ from: mockFrom })

      const req = new Request('https://example.com/functions/v1/sync-matches', { method: 'POST' })
      await handleSyncMatches(req)

      await vi.waitFor(() => {
        const notifCall = mockFetch.mock.calls.find(
          (c: unknown[]) => typeof c[0] === 'string' && (c[0] as string).includes('send-notifications')
        )
        expect(notifCall).toBeDefined()
      })

      const notifCall = mockFetch.mock.calls.find(
        (c: unknown[]) => typeof c[0] === 'string' && (c[0] as string).includes('send-notifications')
      )!
      const fetchOptions = notifCall[1] as RequestInit & { headers: Record<string, string> }
      expect(fetchOptions.headers['Authorization']).toBe('Bearer test-service-role-key')
    })

    test('notification failure is logged but does not fail sync', async () => {
      // API call succeeds; notification call fails
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          matches: [{
            utcDate: '2026-06-15T14:00:00Z',
            status: 'FINISHED',
            homeTeam: { name: 'Brazil', shortName: 'Brazil' },
            awayTeam: { name: 'Germany', shortName: 'Germany' },
            score: { fullTime: { home: 1, away: 0 } },
          }],
        }),
      })
      mockFetch.mockRejectedValue(new Error('Network error'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      mockFrom.mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: vi.fn((columns?: string) => {
              if (!columns || columns === '*') {
                return Promise.resolve({
                  data: [{ id: 'match-1', home_team: 'Brasil', away_team: 'Alemanha', kickoff_at: '2026-06-15T14:00:00Z', status: 'live', home_score: null, away_score: null }],
                  error: null,
                })
              }
              return { eq: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: { home_score: 1, away_score: 0 }, error: null }) })) }
            }),
            update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
          }
        }
        if (table === 'predictions') {
          return {
            select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [{ id: 'pred-1', user_id: 'user-1', home_score: 1, away_score: 0 }], error: null }) }),
            update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
          }
        }
        return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [], error: null }) }) }
      })

      mockCreateClient.mockReturnValue({ from: mockFrom })

      const req = new Request('https://example.com/functions/v1/sync-matches', { method: 'POST' })
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
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          matches: [
            { utcDate: '2026-06-15T14:00:00Z', status: 'FINISHED', homeTeam: { name: 'Brazil', shortName: 'Brazil' }, awayTeam: { name: 'Germany', shortName: 'Germany' }, score: { fullTime: { home: 2, away: 1 } } },
            { utcDate: '2026-06-15T17:00:00Z', status: 'FINISHED', homeTeam: { name: 'Argentina', shortName: 'Argentina' }, awayTeam: { name: 'France', shortName: 'France' }, score: { fullTime: { home: 0, away: 0 } } },
            { utcDate: '2026-06-15T20:00:00Z', status: 'FINISHED', homeTeam: { name: 'Spain', shortName: 'Spain' }, awayTeam: { name: 'Portugal', shortName: 'Portugal' }, score: { fullTime: { home: 3, away: 3 } } },
          ],
        }),
      })
      mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: vi.fn((columns?: string) => {
              if (!columns || columns === '*') {
                return Promise.resolve({
                  data: [
                    { id: 'match-1', home_team: 'Brasil', away_team: 'Alemanha', kickoff_at: '2026-06-15T14:00:00Z', status: 'live', home_score: null, away_score: null },
                    { id: 'match-2', home_team: 'Argentina', away_team: 'França', kickoff_at: '2026-06-15T17:00:00Z', status: 'live', home_score: null, away_score: null },
                    { id: 'match-3', home_team: 'Espanha', away_team: 'Portugal', kickoff_at: '2026-06-15T20:00:00Z', status: 'live', home_score: null, away_score: null },
                  ],
                  error: null,
                })
              }
              return { eq: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: { home_score: 1, away_score: 0 }, error: null }) })) }
            }),
            update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
          }
        }
        if (table === 'predictions') {
          return {
            select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [{ id: 'pred-1', user_id: 'user-1', home_score: 1, away_score: 0 }], error: null }) }),
            update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
          }
        }
        return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [], error: null }) }) }
      })

      mockCreateClient.mockReturnValue({ from: mockFrom })

      const req = new Request('https://example.com/functions/v1/sync-matches', { method: 'POST' })
      await handleSyncMatches(req)

      await vi.waitFor(() => {
        const notifCalls = mockFetch.mock.calls.filter(
          (c: unknown[]) => typeof c[0] === 'string' && (c[0] as string).includes('send-notifications')
        )
        expect(notifCalls.length).toBe(3)
      })
    })

    test('no newly finished matches means no notification calls', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          matches: [
            { utcDate: '2026-06-15T14:00:00Z', status: 'TIMED', homeTeam: { name: 'Brazil', shortName: 'Brazil' }, awayTeam: { name: 'Germany', shortName: 'Germany' }, score: { fullTime: { home: null, away: null } } },
            { utcDate: '2026-06-15T17:00:00Z', status: 'IN_PLAY', homeTeam: { name: 'Argentina', shortName: 'Argentina' }, awayTeam: { name: 'France', shortName: 'France' }, score: { fullTime: { home: null, away: null } } },
          ],
        }),
      })
      mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: vi.fn((columns?: string) => {
              if (!columns || columns === '*') {
                return Promise.resolve({
                  data: [
                    { id: 'match-1', home_team: 'Brasil', away_team: 'Alemanha', kickoff_at: '2026-06-15T14:00:00Z', status: 'scheduled', home_score: null, away_score: null },
                    { id: 'match-2', home_team: 'Argentina', away_team: 'França', kickoff_at: '2026-06-15T17:00:00Z', status: 'live', home_score: null, away_score: null },
                  ],
                  error: null,
                })
              }
              return { eq: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: { home_score: 1, away_score: 0 }, error: null }) })) }
            }),
            update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
          }
        }
        return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [], error: null }) }) }
      })

      mockCreateClient.mockReturnValue({ from: mockFrom })

      const req = new Request('https://example.com/functions/v1/sync-matches', { method: 'POST' })
      const res = await handleSyncMatches(req)

      await new Promise((resolve) => setTimeout(resolve, 100))

      const notifCalls = mockFetch.mock.calls.filter(
        (c: unknown[]) => typeof c[0] === 'string' && (c[0] as string).includes('send-notifications')
      )
      expect(notifCalls.length).toBe(0)

      const body = await res.json()
      expect(body.newlyFinished).toBe(0)
    })

    test('non-200 response from send-notifications is logged as failure', async () => {
      // API call succeeds; notification returns non-200
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          matches: [{
            utcDate: '2026-06-15T14:00:00Z',
            status: 'FINISHED',
            homeTeam: { name: 'Brazil', shortName: 'Brazil' },
            awayTeam: { name: 'Germany', shortName: 'Germany' },
            score: { fullTime: { home: 1, away: 0 } },
          }],
        }),
      })
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue('Internal Server Error'),
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      mockFrom.mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: vi.fn((columns?: string) => {
              if (!columns || columns === '*') {
                return Promise.resolve({
                  data: [{ id: 'match-1', home_team: 'Brasil', away_team: 'Alemanha', kickoff_at: '2026-06-15T14:00:00Z', status: 'live', home_score: null, away_score: null }],
                  error: null,
                })
              }
              return { eq: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: { home_score: 1, away_score: 0 }, error: null }) })) }
            }),
            update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
          }
        }
        if (table === 'predictions') {
          return {
            select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [{ id: 'pred-1', user_id: 'user-1', home_score: 1, away_score: 0 }], error: null }) }),
            update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
          }
        }
        return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [], error: null }) }) }
      })

      mockCreateClient.mockReturnValue({ from: mockFrom })

      const req = new Request('https://example.com/functions/v1/sync-matches', { method: 'POST' })
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
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          matches: [{
            utcDate: '2026-06-15T14:00:00Z',
            status: 'FINISHED',
            homeTeam: { name: 'Brazil', shortName: 'Brazil' },
            awayTeam: { name: 'Germany', shortName: 'Germany' },
            score: { fullTime: { home: 1, away: 0 } },
          }],
        }),
      })
      mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) })

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      mockFrom.mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: vi.fn((columns?: string) => {
              if (!columns || columns === '*') {
                return Promise.resolve({
                  data: [{ id: 'match-1', home_team: 'Brasil', away_team: 'Alemanha', kickoff_at: '2026-06-15T14:00:00Z', status: 'live', home_score: null, away_score: null }],
                  error: null,
                })
              }
              return { eq: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: { home_score: 1, away_score: 0 }, error: null }) })) }
            }),
            update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
          }
        }
        if (table === 'predictions') {
          return {
            select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [{ id: 'pred-1', user_id: 'user-1', home_score: 1, away_score: 0 }], error: null }) }),
            update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
          }
        }
        return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [], error: null }) }) }
      })

      mockCreateClient.mockReturnValue({ from: mockFrom })

      const req = new Request('https://example.com/functions/v1/sync-matches', { method: 'POST' })
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

  describe('bonus points trigger', () => {
    function setupSeedMatches(seedMatches: any[]) {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          matches: [{
            utcDate: '2026-07-19T16:00:00Z',
            status: 'FINISHED',
            homeTeam: { name: 'Brazil', shortName: 'Brazil' },
            awayTeam: { name: 'Argentina', shortName: 'Argentina' },
            score: { fullTime: { home: 2, away: 1 } },
          }],
        }),
      })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: vi.fn((columns: string) => {
              if (!columns || columns === '*') {
                return Promise.resolve({ data: seedMatches, error: null })
              }
              return {
                eq: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({
                    data: { home_score: 2, away_score: 1 },
                    error: null,
                  }),
                })),
                in: vi.fn().mockResolvedValue({ data: [], error: null }),
              }
            }),
            upsert: vi.fn().mockResolvedValue({ error: null }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        if (table === 'predictions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        if (table === 'bonus_predictions') {
          return {
            select: vi.fn().mockResolvedValue({
              data: [{ id: 'bp-1', first_place: 'Brasil', second_place: 'Argentina', third_place: 'França', fourth_place: 'Alemanha' }],
              error: null,
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        return {}
      })

      mockCreateClient.mockReturnValue({ from: mockFrom })
    }

    test('trigger when Final match is newly finished', async () => {
      setupSeedMatches([
        { id: 'seed-final', home_team: 'Brasil', away_team: 'Argentina', group_name: 'Final', kickoff_at: '2026-07-19T16:00:00Z', status: 'live', home_score: null, away_score: null },
      ])

      const req = new Request('https://example.com/functions/v1/sync-matches', { method: 'POST' })
      const res = await handleSyncMatches(req)

      expect(res.status).toBe(200)
      expect(mockCalculateBonusPoints).toHaveBeenCalled()
    })

    test('trigger when Terceiro Lugar match is newly finished', async () => {
      setupSeedMatches([
        { id: 'seed-third', home_team: 'França', away_team: 'Alemanha', group_name: 'Terceiro Lugar', kickoff_at: '2026-07-19T16:00:00Z', status: 'live', home_score: null, away_score: null },
      ])

      const req = new Request('https://example.com/functions/v1/sync-matches', { method: 'POST' })
      const res = await handleSyncMatches(req)

      expect(res.status).toBe(200)
      expect(mockCalculateBonusPoints).toHaveBeenCalled()
    })

    test('NOT triggered when only group stage matches finish', async () => {
      setupSeedMatches([
        { id: 'seed-group', home_team: 'Brasil', away_team: 'Argentina', group_name: 'Group A', kickoff_at: '2026-07-19T16:00:00Z', status: 'live', home_score: null, away_score: null },
      ])

      const req = new Request('https://example.com/functions/v1/sync-matches', { method: 'POST' })
      const res = await handleSyncMatches(req)

      expect(res.status).toBe(200)
      expect(mockCalculateBonusPoints).not.toHaveBeenCalled()
    })

    test('NOT triggered when no matches finish', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          matches: [{
            utcDate: '2026-07-19T16:00:00Z',
            status: 'TIMED',
            homeTeam: { name: 'Brazil', shortName: 'Brazil' },
            awayTeam: { name: 'Argentina', shortName: 'Argentina' },
            score: { fullTime: { home: null, away: null } },
          }],
        }),
      })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: vi.fn((columns: string) => {
              if (!columns || columns === '*') {
                return Promise.resolve({
                  data: [{ id: 'seed-final', home_team: 'Brasil', away_team: 'Argentina', group_name: 'Final', kickoff_at: '2026-07-19T16:00:00Z', status: 'live', home_score: null, away_score: null }],
                  error: null,
                })
              }
              return { eq: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }) })), in: vi.fn().mockResolvedValue({ data: [], error: null }) }
            }),
            upsert: vi.fn().mockResolvedValue({ error: null }),
            update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
          }
        }
        return {}
      })
      mockCreateClient.mockReturnValue({ from: mockFrom })

      const req = new Request('https://example.com/functions/v1/sync-matches', { method: 'POST' })
      const res = await handleSyncMatches(req)

      expect(res.status).toBe(200)
      expect(mockCalculateBonusPoints).not.toHaveBeenCalled()
    })

    test('trigger with scoreUpdated for Final match', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          matches: [{
            utcDate: '2026-07-19T16:00:00Z',
            status: 'FINISHED',
            homeTeam: { name: 'Brazil', shortName: 'Brazil' },
            awayTeam: { name: 'Argentina', shortName: 'Argentina' },
            score: { fullTime: { home: 3, away: 2 } },
          }],
        }),
      })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: vi.fn((columns: string) => {
              if (!columns || columns === '*') {
                return Promise.resolve({
                  data: [{ id: 'seed-final', home_team: 'Brasil', away_team: 'Argentina', group_name: 'Final', kickoff_at: '2026-07-19T16:00:00Z', status: 'finished', home_score: 2, away_score: 1 }],
                  error: null,
                })
              }
              return {
                eq: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({
                    data: { home_score: 3, away_score: 2 },
                    error: null,
                  }),
                })),
                in: vi.fn().mockResolvedValue({ data: [], error: null }),
              }
            }),
            upsert: vi.fn().mockResolvedValue({ error: null }),
            update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
          }
        }
        if (table === 'predictions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [{ id: 'pred-1', user_id: 'user-1', home_score: 3, away_score: 2 }], error: null }),
            }),
            update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
          }
        }
        if (table === 'bonus_predictions') {
          return {
            select: vi.fn().mockResolvedValue({ data: [{ id: 'bp-1', first_place: 'Brasil', second_place: 'Argentina', third_place: 'França', fourth_place: 'Alemanha' }], error: null }),
            update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
          }
        }
        return {}
      })
      mockCreateClient.mockReturnValue({ from: mockFrom })

      const req = new Request('https://example.com/functions/v1/sync-matches', { method: 'POST' })
      const res = await handleSyncMatches(req)

      expect(res.status).toBe(200)
      expect(mockCalculateBonusPoints).toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    test('sync returns 500 when provider fetch fails', async () => {
      mockFetch.mockRejectedValue(new Error('All providers failed'))

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
