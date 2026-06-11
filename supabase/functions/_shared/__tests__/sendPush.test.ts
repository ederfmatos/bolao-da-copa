import { describe, test, expect, vi, beforeEach } from 'vitest'

class MockPushMessageError extends Error {
  response: Response
  constructor(response: Response) {
    super('pushing message failed')
    this.response = response
  }
  isGone() {
    return this.response.status === 410
  }
}

const mockPushTextMessage = vi.fn()
const mockSubscribe = vi.fn()
const mockApplicationServerNew = vi.fn()
const mockImportVapidKeys = vi.fn()

vi.mock('../webPushLib', () => ({
  ApplicationServer: {
    new: mockApplicationServerNew,
  },
  importVapidKeys: mockImportVapidKeys,
  PushMessageError: MockPushMessageError,
}))

const mockEnvVars: Record<string, string> = {}

const fakeDeno = {
  env: {
    get: (key: string) => mockEnvVars[key] ?? undefined,
  },
}

vi.stubGlobal('Deno', fakeDeno)

const validSubscription = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
  p256dh_key: 'BPM8KZ_xYR5zO_LJ6qV3rG_xYR5zO_LJ6qV3rG_xYR5zO_LJ6qV3rG_xYR5zO_LJ6qV3rG_xYR4',
  auth_key: 'BPM8KZ_xYR5zO_LJ6qV3rA',
}

function generateValidVapidKeys() {
  const publicKeyBytes = new Uint8Array(65)
  publicKeyBytes[0] = 0x04
  for (let i = 1; i < 65; i++) {
    publicKeyBytes[i] = i
  }

  const privateKeyBytes = new Uint8Array(32)
  for (let i = 0; i < 32; i++) {
    privateKeyBytes[i] = i + 100
  }

  function toBase64Url(bytes: Uint8Array): string {
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  }

  return {
    publicKey: toBase64Url(publicKeyBytes),
    privateKey: toBase64Url(privateKeyBytes),
  }
}

let sendPush: typeof import('../sendPush').sendPush
let resetServerCache: typeof import('../sendPush').resetServerCache

beforeEach(async () => {
  vi.clearAllMocks()

  for (const key of Object.keys(mockEnvVars)) {
    delete mockEnvVars[key]
  }

  vi.resetModules()

  mockPushTextMessage.mockResolvedValue(undefined)
  mockSubscribe.mockReturnValue({
    pushTextMessage: mockPushTextMessage,
  })
  mockApplicationServerNew.mockResolvedValue({
    subscribe: mockSubscribe,
  })
  mockImportVapidKeys.mockResolvedValue({
    publicKey: {},
    privateKey: {},
  })

  const keys = generateValidVapidKeys()
  mockEnvVars['VAPID_PUBLIC_KEY'] = keys.publicKey
  mockEnvVars['VAPID_PRIVATE_KEY'] = keys.privateKey
  mockEnvVars['VAPID_SUBJECT'] = 'mailto:admin@bolao.com'

  const mod = await import('../sendPush')
  sendPush = mod.sendPush
  resetServerCache = mod.resetServerCache
})

describe('sendPush', () => {
  describe('input validation', () => {
    test('throws error when endpoint is missing', async () => {
      await expect(
        sendPush(
          { endpoint: '', p256dh_key: 'key', auth_key: 'auth' },
          { title: 'Test', body: 'Body', data: {} },
        ),
      ).rejects.toThrow('Invalid subscription')
    })

    test('throws error when p256dh_key is missing', async () => {
      await expect(
        sendPush(
          { endpoint: 'https://example.com', p256dh_key: '', auth_key: 'auth' },
          { title: 'Test', body: 'Body', data: {} },
        ),
      ).rejects.toThrow('Invalid subscription')
    })

    test('throws error when auth_key is missing', async () => {
      await expect(
        sendPush(
          { endpoint: 'https://example.com', p256dh_key: 'key', auth_key: '' },
          { title: 'Test', body: 'Body', data: {} },
        ),
      ).rejects.toThrow('Invalid subscription')
    })
  })

  describe('VAPID key handling', () => {
    test('throws descriptive error when VAPID_PUBLIC_KEY is missing', async () => {
      delete mockEnvVars['VAPID_PUBLIC_KEY']
      resetServerCache()

      await expect(
        sendPush(validSubscription, { title: 'Test', body: 'Body', data: {} }),
      ).rejects.toThrow('VAPID_PUBLIC_KEY environment variable is not set')
    })

    test('throws descriptive error when VAPID_PRIVATE_KEY is missing', async () => {
      delete mockEnvVars['VAPID_PRIVATE_KEY']
      resetServerCache()

      await expect(
        sendPush(validSubscription, { title: 'Test', body: 'Body', data: {} }),
      ).rejects.toThrow('VAPID_PRIVATE_KEY environment variable is not set')
    })

    test('throws descriptive error when VAPID_SUBJECT is missing', async () => {
      delete mockEnvVars['VAPID_SUBJECT']
      resetServerCache()

      await expect(
        sendPush(validSubscription, { title: 'Test', body: 'Body', data: {} }),
      ).rejects.toThrow('VAPID_SUBJECT environment variable is not set')
    })

    test('reads VAPID keys from environment variables', async () => {
      const result = await sendPush(validSubscription, {
        title: 'Test',
        body: 'Body',
        data: {},
      })

      expect(result.success).toBe(true)
      expect(mockImportVapidKeys).toHaveBeenCalled()
    })
  })

  describe('successful send', () => {
    test('returns { success: true, expired: false } on successful send', async () => {
      const result = await sendPush(validSubscription, {
        title: 'Test',
        body: 'Body',
        data: { url: '/match/1' },
      })

      expect(result).toEqual({ success: true, expired: false })
    })

    test('calls subscribe with correct subscription data', async () => {
      await sendPush(validSubscription, {
        title: 'Test',
        body: 'Body',
        data: {},
      })

      expect(mockSubscribe).toHaveBeenCalledWith({
        endpoint: validSubscription.endpoint,
        keys: {
          p256dh: validSubscription.p256dh_key,
          auth: validSubscription.auth_key,
        },
      })
    })

    test('sends JSON-stringified payload', async () => {
      const payload = { title: 'Goal!', body: 'Brazil scored', data: { url: '/match/1' } }

      await sendPush(validSubscription, payload)

      expect(mockPushTextMessage).toHaveBeenCalledWith(
        JSON.stringify(payload),
        {},
      )
    })
  })

  describe('error handling', () => {
    test('returns { success: false, expired: true } on 410 Gone response', async () => {
      const goneResponse = new Response(null, { status: 410, statusText: 'Gone' })
      mockPushTextMessage.mockRejectedValue(new MockPushMessageError(goneResponse))

      const result = await sendPush(validSubscription, {
        title: 'Test',
        body: 'Body',
        data: {},
      })

      expect(result).toEqual({ success: false, expired: true })
    })

    test('returns { success: false, expired: false } on network error', async () => {
      mockPushTextMessage.mockRejectedValue(new TypeError('Network error'))

      const result = await sendPush(validSubscription, {
        title: 'Test',
        body: 'Body',
        data: {},
      })

      expect(result).toEqual({
        success: false,
        expired: false,
        error: 'Network error',
      })
    })

    test('returns error message on generic failure', async () => {
      mockPushTextMessage.mockRejectedValue(new Error('Server error 500'))

      const result = await sendPush(validSubscription, {
        title: 'Test',
        body: 'Body',
        data: {},
      })

      expect(result.success).toBe(false)
      expect(result.expired).toBe(false)
      expect(result.error).toBe('Server error 500')
    })

    test('handles non-Error thrown values', async () => {
      mockPushTextMessage.mockRejectedValue('string error')

      const result = await sendPush(validSubscription, {
        title: 'Test',
        body: 'Body',
        data: {},
      })

      expect(result.success).toBe(false)
      expect(result.expired).toBe(false)
      expect(result.error).toBe('Unknown error')
    })
  })

  describe('logging', () => {
    test('logs success event on successful send', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await sendPush(validSubscription, { title: 'Test', body: 'Body', data: {} })

      const logCall = consoleSpy.mock.calls.find((call) => {
        try {
          const parsed = JSON.parse(call[0])
          return parsed.event === 'push_sent'
        } catch {
          return false
        }
      })

      expect(logCall).toBeDefined()
      consoleSpy.mockRestore()
    })

    test('logs expiration event on 410 response', async () => {
      const goneResponse = new Response(null, { status: 410, statusText: 'Gone' })
      mockPushTextMessage.mockRejectedValue(new MockPushMessageError(goneResponse))

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await sendPush(validSubscription, { title: 'Test', body: 'Body', data: {} })

      const logCall = consoleSpy.mock.calls.find((call) => {
        try {
          const parsed = JSON.parse(call[0])
          return parsed.event === 'push_subscription_expired'
        } catch {
          return false
        }
      })

      expect(logCall).toBeDefined()
      consoleSpy.mockRestore()
    })

    test('logs error event on failure', async () => {
      mockPushTextMessage.mockRejectedValue(new Error('fail'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await sendPush(validSubscription, { title: 'Test', body: 'Body', data: {} })

      const errorCall = consoleSpy.mock.calls.find((call) => {
        try {
          const parsed = JSON.parse(call[0])
          return parsed.event === 'push_failed'
        } catch {
          return false
        }
      })

      expect(errorCall).toBeDefined()
      consoleSpy.mockRestore()
    })
  })

  describe('caching', () => {
    test('reuses ApplicationServer across calls', async () => {
      await sendPush(validSubscription, { title: 'Test', body: 'Body', data: {} })
      await sendPush(validSubscription, { title: 'Test 2', body: 'Body 2', data: {} })

      expect(mockApplicationServerNew).toHaveBeenCalledTimes(1)
    })
  })
})

describe('TypeScript exports', () => {
  test('exports sendPush function', async () => {
    const mod = await import('../sendPush')
    expect(typeof mod.sendPush).toBe('function')
  })

  test('exports resetServerCache function', async () => {
    const mod = await import('../sendPush')
    expect(typeof mod.resetServerCache).toBe('function')
  })
})
