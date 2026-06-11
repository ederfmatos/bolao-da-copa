import { describe, test, expect, vi, beforeEach } from 'vitest'

vi.mock('../serve', () => ({
  serve: vi.fn(),
}))

const mockGetUser = vi.fn()
const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()

const mockFrom = vi.fn()

const mockCreateClient = vi.fn()

vi.mock('../supabaseClient', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}))

const mockEnvVars: Record<string, string> = {}

const fakeDeno = {
  env: {
    get: (key: string) => mockEnvVars[key] ?? undefined,
  },
}

vi.stubGlobal('Deno', fakeDeno)

const TEST_USER_ID = 'user-123'
const TEST_SUBSCRIPTION_ID = 'sub-456'

function buildRequest(method: string, body?: unknown, headers?: Record<string, string>) {
  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  }
  if (body !== undefined) {
    init.body = JSON.stringify(body)
  }
  return new Request('https://example.com/functions/v1/register-subscription', init)
}

function setupSupabaseMocks(options: {
  getUserResult?: { data: { user: { id: string } | null }; error: null | { message: string } }
  selectResult?: { data: unknown; error: unknown }
  insertResult?: { data: unknown; error: unknown }
  updateResult?: { error: unknown }
  deleteResult?: { error: unknown }
} = {}) {
  const defaultGetUser = { data: { user: { id: TEST_USER_ID } }, error: null }
  const getUserResult = options.getUserResult ?? defaultGetUser
  mockGetUser.mockResolvedValue(getUserResult)

  const authClient = {
    auth: { getUser: mockGetUser },
  }

  mockSelect.mockReturnValue({
    eq: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: mockSingle,
      }),
      single: mockSingle,
    }),
  })

  mockInsert.mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: mockSingle,
    }),
  })

  mockUpdate.mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: options.updateResult?.error ?? null }),
  })

  mockDelete.mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: options.deleteResult?.error ?? null }),
  })

  mockFrom.mockImplementation((table: string) => {
    if (table === 'push_subscriptions') {
      return {
        select: mockSelect,
        insert: mockInsert,
        update: mockUpdate,
        delete: mockDelete,
      }
    }
    return {}
  })

  const serviceRoleClient = {
    from: mockFrom,
  }

  mockCreateClient.mockImplementation((_url: string, key: string) => {
    if (key === 'test-anon-key') return authClient
    return serviceRoleClient
  })

  if (options.selectResult) {
    mockSingle.mockResolvedValue(options.selectResult)
  } else {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'not found', code: 'PGRST116' } })
  }

  return { authClient, serviceRoleClient }
}

let handleRegisterSubscription: typeof import('../index').handleRegisterSubscription

beforeEach(async () => {
  vi.clearAllMocks()

  for (const key of Object.keys(mockEnvVars)) {
    delete mockEnvVars[key]
  }

  mockEnvVars['SUPABASE_URL'] = 'https://test.supabase.co'
  mockEnvVars['SUPABASE_ANON_KEY'] = 'test-anon-key'
  mockEnvVars['SUPABASE_SERVICE_ROLE_KEY'] = 'test-service-role-key'

  vi.resetModules()

  const mod = await import('../index')
  handleRegisterSubscription = mod.handleRegisterSubscription
})

describe('register-subscription edge function', () => {
  describe('method validation', () => {
    test('non-POST/DELETE methods return 405', async () => {
      const req = buildRequest('GET')
      const res = await handleRegisterSubscription(req)

      expect(res.status).toBe(405)
      const body = await res.json()
      expect(body.error).toBe('Method not allowed')
    })

    test('PUT method returns 405', async () => {
      const req = buildRequest('PUT', {})
      const res = await handleRegisterSubscription(req)

      expect(res.status).toBe(405)
    })
  })

  describe('authentication', () => {
    test('POST without auth token returns 401', async () => {
      const req = buildRequest('POST', { endpoint: 'https://push.example.com/sub/1', keys: { p256dh: 'key', auth: 'auth' } })
      const res = await handleRegisterSubscription(req)

      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.success).toBe(false)
    })

    test('POST with invalid JWT returns 401', async () => {
      setupSupabaseMocks({
        getUserResult: { data: { user: null }, error: { message: 'Invalid token' } },
      })

      const req = buildRequest(
        'POST',
        { endpoint: 'https://push.example.com/sub/1', keys: { p256dh: 'key', auth: 'auth' } },
        { Authorization: 'Bearer invalid-token' },
      )
      const res = await handleRegisterSubscription(req)

      expect(res.status).toBe(401)
    })

    test('DELETE without auth token returns 401', async () => {
      const req = buildRequest('DELETE', { endpoint: 'https://push.example.com/sub/1' })
      const res = await handleRegisterSubscription(req)

      expect(res.status).toBe(401)
    })
  })

  describe('POST - subscription registration', () => {
    test('POST with valid subscription returns 201 with subscription_id', async () => {
      setupSupabaseMocks({
        selectResult: { data: null, error: { message: 'not found', code: 'PGRST116' } },
      })

      mockSingle
        .mockResolvedValueOnce({ data: null, error: { message: 'not found', code: 'PGRST116' } })
        .mockResolvedValueOnce({ data: { id: TEST_SUBSCRIPTION_ID }, error: null })

      const req = buildRequest(
        'POST',
        {
          endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
          keys: { p256dh: 'test-p256dh-key', auth: 'test-auth-key' },
        },
        { Authorization: 'Bearer valid-token' },
      )

      const res = await handleRegisterSubscription(req)

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.subscription_id).toBe(TEST_SUBSCRIPTION_ID)
    })

    test('POST with duplicate endpoint upserts and returns 200', async () => {
      mockSingle.mockResolvedValueOnce({ data: { id: TEST_SUBSCRIPTION_ID }, error: null })

      const req = buildRequest(
        'POST',
        {
          endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
          keys: { p256dh: 'updated-p256dh-key', auth: 'updated-auth-key' },
        },
        { Authorization: 'Bearer valid-token' },
      )

      const res = await handleRegisterSubscription(req)

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.subscription_id).toBe(TEST_SUBSCRIPTION_ID)
      expect(body.updated).toBe(true)
    })

    test('POST with missing endpoint returns 400', async () => {
      const req = buildRequest(
        'POST',
        { keys: { p256dh: 'key', auth: 'auth' } },
        { Authorization: 'Bearer valid-token' },
      )

      const res = await handleRegisterSubscription(req)

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.success).toBe(false)
      expect(body.error).toContain('endpoint')
    })

    test('POST with missing keys returns 400', async () => {
      const req = buildRequest(
        'POST',
        { endpoint: 'https://push.example.com/sub/1' },
        { Authorization: 'Bearer valid-token' },
      )

      const res = await handleRegisterSubscription(req)

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.success).toBe(false)
      expect(body.error).toContain('keys')
    })

    test('POST with missing p256dh returns 400', async () => {
      const req = buildRequest(
        'POST',
        { endpoint: 'https://push.example.com/sub/1', keys: { auth: 'auth' } },
        { Authorization: 'Bearer valid-token' },
      )

      const res = await handleRegisterSubscription(req)

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.success).toBe(false)
      expect(body.error).toContain('p256dh')
    })

    test('POST with missing auth returns 400', async () => {
      const req = buildRequest(
        'POST',
        { endpoint: 'https://push.example.com/sub/1', keys: { p256dh: 'key' } },
        { Authorization: 'Bearer valid-token' },
      )

      const res = await handleRegisterSubscription(req)

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.success).toBe(false)
      expect(body.error).toContain('auth')
    })

    test('database insert error returns 500', async () => {
      mockSingle
        .mockResolvedValueOnce({ data: null, error: { message: 'not found', code: 'PGRST116' } })
        .mockResolvedValueOnce({ data: null, error: { message: 'DB connection failed' } })

      const req = buildRequest(
        'POST',
        {
          endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
          keys: { p256dh: 'key', auth: 'auth' },
        },
        { Authorization: 'Bearer valid-token' },
      )

      const res = await handleRegisterSubscription(req)

      expect(res.status).toBe(500)
      const body = await res.json()
      expect(body.success).toBe(false)
    })
  })

  describe('DELETE - unregistration', () => {
    test('DELETE with valid endpoint returns 200', async () => {
      mockSingle.mockResolvedValueOnce({ data: { id: TEST_SUBSCRIPTION_ID }, error: null })

      const req = buildRequest(
        'DELETE',
        { endpoint: 'https://fcm.googleapis.com/fcm/send/abc123' },
        { Authorization: 'Bearer valid-token' },
      )

      const res = await handleRegisterSubscription(req)

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
    })

    test('DELETE with non-existent endpoint returns 404', async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'not found' } })

      const req = buildRequest(
        'DELETE',
        { endpoint: 'https://fcm.googleapis.com/fcm/send/nonexistent' },
        { Authorization: 'Bearer valid-token' },
      )

      const res = await handleRegisterSubscription(req)

      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.success).toBe(false)
      expect(body.error).toContain('not found')
    })

    test('DELETE with missing endpoint returns 400', async () => {
      const req = buildRequest(
        'DELETE',
        {},
        { Authorization: 'Bearer valid-token' },
      )

      const res = await handleRegisterSubscription(req)

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.success).toBe(false)
    })

    test('database delete error returns 500', async () => {
      mockSingle.mockResolvedValueOnce({ data: { id: TEST_SUBSCRIPTION_ID }, error: null })
      mockDelete.mockReturnValueOnce({
        eq: vi.fn().mockResolvedValue({ error: { message: 'DB connection failed' } }),
      })

      const req = buildRequest(
        'DELETE',
        { endpoint: 'https://fcm.googleapis.com/fcm/send/abc123' },
        { Authorization: 'Bearer valid-token' },
      )

      const res = await handleRegisterSubscription(req)

      expect(res.status).toBe(500)
      const body = await res.json()
      expect(body.success).toBe(false)
    })
  })

  describe('error handling', () => {
    test('malformed JSON body returns 500', async () => {
      const req = new Request('https://example.com/functions/v1/register-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
        },
        body: 'not-json',
      })

      const res = await handleRegisterSubscription(req)

      expect(res.status).toBe(500)
    })

    test('unexpected error returns 500 with error message', async () => {
      mockGetUser.mockRejectedValueOnce(new Error('Unexpected failure'))

      const req = buildRequest(
        'POST',
        {
          endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
          keys: { p256dh: 'key', auth: 'auth' },
        },
        { Authorization: 'Bearer valid-token' },
      )

      const res = await handleRegisterSubscription(req)

      expect(res.status).toBe(500)
    })
  })

  describe('logging', () => {
    test('logs auth failure event', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const req = buildRequest('POST', { endpoint: 'https://push.example.com/sub/1', keys: { p256dh: 'key', auth: 'auth' } })
      await handleRegisterSubscription(req)

      const logCall = consoleSpy.mock.calls.find((call) => {
        try {
          const parsed = JSON.parse(call[0] as string)
          return parsed.event === 'auth_failed'
        } catch {
          return false
        }
      })

      expect(logCall).toBeDefined()
      consoleSpy.mockRestore()
    })

    test('logs subscription registered event on success', async () => {
      setupSupabaseMocks()

      mockSingle
        .mockResolvedValueOnce({ data: null, error: { message: 'not found', code: 'PGRST116' } })
        .mockResolvedValueOnce({ data: { id: TEST_SUBSCRIPTION_ID }, error: null })

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const req = buildRequest(
        'POST',
        {
          endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
          keys: { p256dh: 'key', auth: 'auth' },
        },
        { Authorization: 'Bearer valid-token' },
      )

      await handleRegisterSubscription(req)

      const logCall = consoleSpy.mock.calls.find((call) => {
        try {
          const parsed = JSON.parse(call[0] as string)
          return parsed.event === 'subscription_registered'
        } catch {
          return false
        }
      })

      expect(logCall).toBeDefined()
      consoleSpy.mockRestore()
    })
  })
})
