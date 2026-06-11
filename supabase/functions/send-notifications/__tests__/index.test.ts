import { describe, test, expect, vi, beforeEach } from 'vitest'

vi.mock('../serve', () => ({
  serve: vi.fn(),
}))

const mockFrom = vi.fn()

const mockCreateClient = vi.fn()

vi.mock('../supabaseClient', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}))

const mockSendPush = vi.fn()

vi.mock('../../_shared/sendPush', () => ({
  sendPush: (...args: unknown[]) => mockSendPush(...args),
}))

const mockEnvVars: Record<string, string> = {}

const fakeDeno = {
  env: {
    get: (key: string) => mockEnvVars[key] ?? undefined,
  },
}

vi.stubGlobal('Deno', fakeDeno)

const SERVICE_ROLE_KEY = 'test-service-role-key'

function buildRequest(body?: unknown) {
  return new Request('https://example.com/functions/v1/send-notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

function buildSubscription(overrides: Partial<{ id: string; user_id: string; endpoint: string; p256dh_key: string; auth_key: string }> = {}) {
  return {
    id: overrides.id ?? 'sub-1',
    user_id: overrides.user_id ?? 'user-1',
    endpoint: overrides.endpoint ?? 'https://fcm.googleapis.com/fcm/send/abc123',
    p256dh_key: overrides.p256dh_key ?? 'test-p256dh-key',
    auth_key: overrides.auth_key ?? 'test-auth-key',
  }
}

function buildMatch(overrides: Partial<{ id: string; home_team: string; away_team: string; kickoff_at: string; status: string; home_score: number; away_score: number }> = {}) {
  return {
    id: overrides.id ?? 'match-1',
    home_team: overrides.home_team ?? 'Brazil',
    away_team: overrides.away_team ?? 'Germany',
    home_flag: null,
    away_flag: null,
    group_name: 'Group A',
    kickoff_at: overrides.kickoff_at ?? '2026-06-15T14:00:00Z',
    status: overrides.status ?? 'scheduled',
    home_score: overrides.home_score ?? null,
    away_score: overrides.away_score ?? null,
    synced_at: '2026-06-14T00:00:00Z',
    created_at: '2026-06-14T00:00:00Z',
  }
}

let handleSendNotifications: typeof import('../index').handleSendNotifications

beforeEach(async () => {
  vi.clearAllMocks()

  for (const key of Object.keys(mockEnvVars)) {
    delete mockEnvVars[key]
  }

  mockEnvVars['SUPABASE_URL'] = 'https://test.supabase.co'
  mockEnvVars['SUPABASE_SERVICE_ROLE_KEY'] = SERVICE_ROLE_KEY

  mockSendPush.mockResolvedValue({ success: true, expired: false })

  vi.resetModules()

  const mod = await import('../index')
  handleSendNotifications = mod.handleSendNotifications
})

describe('send-notifications edge function', () => {
  describe('method validation', () => {
    test('non-POST methods return 405', async () => {
      const req = new Request('https://example.com/functions/v1/send-notifications', {
        method: 'GET',
        headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
      })

      const res = await handleSendNotifications(req)
      expect(res.status).toBe(405)
      const body = await res.json()
      expect(body.error).toBe('Method not allowed')
    })
  })

  describe('service role authentication', () => {
    test('missing Authorization header returns 401', async () => {
      const req = new Request('https://example.com/functions/v1/send-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'daily-digest', data: {} }),
      })

      const res = await handleSendNotifications(req)
      expect(res.status).toBe(401)
    })

    test('user JWT (non-service-role) returns 401', async () => {
      const req = new Request('https://example.com/functions/v1/send-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer some-user-jwt-token',
        },
        body: JSON.stringify({ type: 'daily-digest', data: {} }),
      })

      const res = await handleSendNotifications(req)
      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.error).toContain('service role key required')
    })

    test('valid service role key is accepted', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                lte: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          }
        }
        return {}
      })

      mockCreateClient.mockReturnValue({ from: mockFrom })

      const req = buildRequest({ type: 'daily-digest', data: {} })
      const res = await handleSendNotifications(req)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
    })
  })

  describe('request validation', () => {
    test('missing type field returns 400', async () => {
      const req = buildRequest({ data: {} })
      const res = await handleSendNotifications(req)
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toContain('type')
    })

    test('invalid notification type returns 400', async () => {
      const req = buildRequest({ type: 'invalid-type', data: {} })
      const res = await handleSendNotifications(req)
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toContain('Invalid type')
    })

    test('invalid JSON body returns 400', async () => {
      const req = new Request('https://example.com/functions/v1/send-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        },
        body: 'not-json',
      })

      const res = await handleSendNotifications(req)
      expect(res.status).toBe(400)
    })
  })

  describe('daily-digest', () => {
    test('queries today matches and sends to all subscriptions', async () => {
      const todayMatches = [buildMatch()]

      mockFrom.mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                lte: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({ data: todayMatches, error: null }),
                }),
              }),
            }),
          }
        }
        if (table === 'push_subscriptions') {
          return {
            select: vi.fn().mockResolvedValue({ data: [buildSubscription()], error: null }),
          }
        }
        return {}
      })

      mockCreateClient.mockReturnValue({ from: mockFrom })

      const req = buildRequest({ type: 'daily-digest', data: {} })
      const res = await handleSendNotifications(req)

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.sent).toBe(1)
      expect(mockSendPush).toHaveBeenCalledTimes(1)
    })

    test('skips days with no matches', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                lte: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          }
        }
        return {}
      })

      mockCreateClient.mockReturnValue({ from: mockFrom })

      const req = buildRequest({ type: 'daily-digest', data: {} })
      const res = await handleSendNotifications(req)

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.sent).toBe(0)
      expect(mockSendPush).not.toHaveBeenCalled()
    })

    test('returns sent=0 when no active subscriptions', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                lte: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({ data: [buildMatch()], error: null }),
                }),
              }),
            }),
          }
        }
        if (table === 'push_subscriptions') {
          return {
            select: vi.fn().mockResolvedValue({ data: [], error: null }),
          }
        }
        return {}
      })

      mockCreateClient.mockReturnValue({ from: mockFrom })

      const req = buildRequest({ type: 'daily-digest', data: {} })
      const res = await handleSendNotifications(req)

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.sent).toBe(0)
    })
  })

  describe('post-match', () => {
    test('queries predictions and sends personalized notifications', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'predictions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [
                  { user_id: 'user-1', home_score: 2, away_score: 1, points: 10 },
                  { user_id: 'user-2', home_score: 1, away_score: 1, points: 3 },
                ],
                error: null,
              }),
            }),
          }
        }
        if (table === 'push_subscriptions') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [
                  buildSubscription({ id: 'sub-1', user_id: 'user-1' }),
                  buildSubscription({ id: 'sub-2', user_id: 'user-2' }),
                ],
                error: null,
              }),
            }),
          }
        }
        return {}
      })

      mockCreateClient.mockReturnValue({ from: mockFrom })

      const req = buildRequest({
        type: 'post-match',
        data: {
          matchId: 'match-1',
          match: { home_team: 'Brazil', away_team: 'Germany', home_score: 2, away_score: 1 },
        },
      })
      const res = await handleSendNotifications(req)

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.sent).toBe(2)
      expect(mockSendPush).toHaveBeenCalledTimes(2)
    })

    test('only notifies users who predicted', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'predictions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ user_id: 'user-1', home_score: 2, away_score: 1, points: 10 }],
                error: null,
              }),
            }),
          }
        }
        if (table === 'push_subscriptions') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [buildSubscription({ id: 'sub-1', user_id: 'user-1' })],
                error: null,
              }),
            }),
          }
        }
        return {}
      })

      mockCreateClient.mockReturnValue({ from: mockFrom })

      const req = buildRequest({
        type: 'post-match',
        data: {
          matchId: 'match-1',
          match: { home_team: 'Brazil', away_team: 'Germany', home_score: 2, away_score: 1 },
        },
      })
      const res = await handleSendNotifications(req)

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.sent).toBe(1)
    })

    test('returns sent=0 when no predictions exist', async () => {
      mockFrom.mockImplementation((table: string) => {
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

      const req = buildRequest({
        type: 'post-match',
        data: {
          matchId: 'match-1',
          match: { home_team: 'Brazil', away_team: 'Germany', home_score: 2, away_score: 1 },
        },
      })
      const res = await handleSendNotifications(req)

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.sent).toBe(0)
    })

    test('missing matchId returns 500', async () => {
      mockCreateClient.mockReturnValue({ from: mockFrom })

      const req = buildRequest({
        type: 'post-match',
        data: { match: { home_team: 'Brazil', away_team: 'Germany', home_score: 2, away_score: 1 } },
      })
      const res = await handleSendNotifications(req)

      expect(res.status).toBe(500)
    })
  })

  describe('deadline-reminder', () => {
    test('queries matches starting in 2h and sends reminders', async () => {
      const futureMatch = buildMatch({
        id: 'match-upcoming',
        kickoff_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  lte: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({ data: [futureMatch], error: null }),
                  }),
                }),
              }),
            }),
          }
        }
        if (table === 'push_subscriptions') {
          return {
            select: vi.fn().mockResolvedValue({
              data: [buildSubscription({ id: 'sub-1', user_id: 'user-1' })],
              error: null,
            }),
          }
        }
        if (table === 'predictions') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }
        }
        return {}
      })

      mockCreateClient.mockReturnValue({ from: mockFrom })

      const req = buildRequest({ type: 'deadline-reminder', data: {} })
      const res = await handleSendNotifications(req)

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.sent).toBe(1)
    })

    test('only notifies users without predictions', async () => {
      const futureMatch = buildMatch({
        id: 'match-upcoming',
        kickoff_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  lte: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({ data: [futureMatch], error: null }),
                  }),
                }),
              }),
            }),
          }
        }
        if (table === 'push_subscriptions') {
          return {
            select: vi.fn().mockResolvedValue({
              data: [
                buildSubscription({ id: 'sub-1', user_id: 'user-1' }),
                buildSubscription({ id: 'sub-2', user_id: 'user-2' }),
              ],
              error: null,
            }),
          }
        }
        if (table === 'predictions') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [{ user_id: 'user-1', match_id: 'match-upcoming' }],
                error: null,
              }),
            }),
          }
        }
        return {}
      })

      mockCreateClient.mockReturnValue({ from: mockFrom })

      const req = buildRequest({ type: 'deadline-reminder', data: {} })
      const res = await handleSendNotifications(req)

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.sent).toBe(1)
    })

    test('returns sent=0 when no upcoming matches', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  lte: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({ data: [], error: null }),
                  }),
                }),
              }),
            }),
          }
        }
        return {}
      })

      mockCreateClient.mockReturnValue({ from: mockFrom })

      const req = buildRequest({ type: 'deadline-reminder', data: {} })
      const res = await handleSendNotifications(req)

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.sent).toBe(0)
    })
  })

  describe('auto-cleanup of invalid subscriptions', () => {
    test('410 responses trigger subscription deletion', async () => {
      mockSendPush.mockResolvedValue({ success: false, expired: true })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                lte: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({ data: [buildMatch()], error: null }),
                }),
              }),
            }),
          }
        }
        if (table === 'push_subscriptions') {
          return {
            select: vi.fn().mockResolvedValue({ data: [buildSubscription()], error: null }),
            delete: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        return {}
      })

      mockCreateClient.mockReturnValue({ from: mockFrom })

      const req = buildRequest({ type: 'daily-digest', data: {} })
      const res = await handleSendNotifications(req)

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.cleaned).toBe(1)
      expect(body.sent).toBe(0)
      expect(body.failed).toBe(1)
    })
  })

  describe('error handling', () => {
    test('network errors are logged and counted as failures', async () => {
      mockSendPush.mockRejectedValue(new Error('Network error'))

      mockFrom.mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                lte: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({ data: [buildMatch()], error: null }),
                }),
              }),
            }),
          }
        }
        if (table === 'push_subscriptions') {
          return {
            select: vi.fn().mockResolvedValue({ data: [buildSubscription()], error: null }),
          }
        }
        return {}
      })

      mockCreateClient.mockReturnValue({ from: mockFrom })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const req = buildRequest({ type: 'daily-digest', data: {} })
      const res = await handleSendNotifications(req)

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.failed).toBe(1)
      expect(body.sent).toBe(0)

      consoleSpy.mockRestore()
    })

    test('response includes accurate sent/failed/cleaned counts', async () => {
      let callCount = 0
      mockSendPush.mockImplementation(async () => {
        callCount++
        if (callCount === 1) return { success: true, expired: false }
        if (callCount === 2) return { success: false, expired: true }
        throw new Error('Network failure')
      })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                lte: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({ data: [buildMatch()], error: null }),
                }),
              }),
            }),
          }
        }
        if (table === 'push_subscriptions') {
          return {
            select: vi.fn().mockResolvedValue({
              data: [
                buildSubscription({ id: 'sub-1' }),
                buildSubscription({ id: 'sub-2' }),
                buildSubscription({ id: 'sub-3' }),
              ],
              error: null,
            }),
            delete: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        return {}
      })

      mockCreateClient.mockReturnValue({ from: mockFrom })

      vi.spyOn(console, 'error').mockImplementation(() => {})

      const req = buildRequest({ type: 'daily-digest', data: {} })
      const res = await handleSendNotifications(req)

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.sent).toBe(1)
      expect(body.failed).toBe(2)
      expect(body.cleaned).toBe(1)

      vi.restoreAllMocks()
    })
  })

  describe('logging', () => {
    test('logs notification_start event', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                lte: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          }
        }
        return {}
      })

      mockCreateClient.mockReturnValue({ from: mockFrom })

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const req = buildRequest({ type: 'daily-digest', data: {} })
      await handleSendNotifications(req)

      const startLog = consoleSpy.mock.calls.find((call) => {
        try {
          const parsed = JSON.parse(call[0] as string)
          return parsed.event === 'notification_start'
        } catch {
          return false
        }
      })

      expect(startLog).toBeDefined()
      consoleSpy.mockRestore()
    })

    test('logs notification_complete event with summary', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'matches') {
          return {
            select: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                lte: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          }
        }
        return {}
      })

      mockCreateClient.mockReturnValue({ from: mockFrom })

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const req = buildRequest({ type: 'daily-digest', data: {} })
      await handleSendNotifications(req)

      const completeLog = consoleSpy.mock.calls.find((call) => {
        try {
          const parsed = JSON.parse(call[0] as string)
          return parsed.event === 'notification_complete'
        } catch {
          return false
        }
      })

      expect(completeLog).toBeDefined()
      const parsed = JSON.parse(completeLog![0] as string)
      expect(parsed).toHaveProperty('sent')
      expect(parsed).toHaveProperty('failed')
      expect(parsed).toHaveProperty('cleaned')
      consoleSpy.mockRestore()
    })
  })
})
