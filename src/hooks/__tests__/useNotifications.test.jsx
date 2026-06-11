import { renderHook, waitFor, act } from '@testing-library/react'
import { useNotifications } from '../useNotifications'

const mockState = vi.hoisted(() => {
  const mockSubscription = {
    endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
    getKey: vi.fn((key) => {
      if (key === 'p256dh') return new Uint8Array([1, 2, 3, 4])
      if (key === 'auth') return new Uint8Array([5, 6, 7, 8])
      return null
    }),
    unsubscribe: vi.fn().mockResolvedValue(true),
    toJSON: vi.fn().mockReturnValue({
      endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
      keys: { p256dh: 'AQIDBA', auth: 'BQYHCA' },
    }),
  }

  const pushManager = {
    getSubscription: vi.fn().mockResolvedValue(null),
    subscribe: vi.fn().mockResolvedValue(mockSubscription),
  }

  const registration = {
    pushManager,
  }

  const mockUser = { id: 'u1' }

  return {
    mockSubscription,
    pushManager,
    registration,
    getSession: vi.fn(),
    fetchMock: vi.fn(),
    mockUser,
  }
})

vi.mock('../useAuth', () => ({
  useAuth: vi.fn(() => ({ user: mockState.mockUser })),
}))

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: mockState.getSession,
    },
  },
}))

const VAPID_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkPs-VPkBfClZB0X_nWxSyC8pkXM3cVVMxs78oL1gU'

function setupNotificationApi(permission = 'default') {
  Object.defineProperty(window, 'Notification', {
    writable: true,
    configurable: true,
    value: {
      permission,
      requestPermission: vi.fn().mockResolvedValue('granted'),
    },
  })
}

function setupServiceWorker(subscription = null) {
  mockState.pushManager.getSubscription.mockResolvedValue(subscription)
  Object.defineProperty(navigator, 'serviceWorker', {
    writable: true,
    configurable: true,
    value: {
      ready: Promise.resolve(mockState.registration),
    },
  })
}

function setupEnv() {
  vi.stubEnv('VITE_VAPID_PUBLIC_KEY', VAPID_KEY)
  vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
}

beforeEach(() => {
  vi.clearAllMocks()
  setupNotificationApi()
  setupServiceWorker()
  setupEnv()
  mockState.getSession.mockResolvedValue({
    data: { session: { access_token: 'test-token' } },
  })
  mockState.fetchMock.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ success: true, subscription_id: 'sub-1' }),
  })
  globalThis.fetch = mockState.fetchMock
})

afterEach(() => {
  vi.unstubAllEnvs()
  delete window.Notification
})

describe('useNotifications', () => {
  describe('return shape', () => {
    it('returns { permission, subscribed, loading, error, requestPermission, unsubscribe }', () => {
      const { result } = renderHook(() => useNotifications())
      expect(result.current).toHaveProperty('permission')
      expect(result.current).toHaveProperty('subscribed')
      expect(result.current).toHaveProperty('loading')
      expect(result.current).toHaveProperty('error')
      expect(result.current).toHaveProperty('requestPermission')
      expect(result.current).toHaveProperty('unsubscribe')
      expect(typeof result.current.requestPermission).toBe('function')
      expect(typeof result.current.unsubscribe).toBe('function')
    })
  })

  describe('mount behavior', () => {
    it('checks Notification.permission on mount', async () => {
      setupNotificationApi('granted')
      const { result } = renderHook(() => useNotifications())
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      expect(result.current.permission).toBe('granted')
    })

    it('detects existing subscription on mount when permission is granted', async () => {
      setupNotificationApi('granted')
      setupServiceWorker(mockState.mockSubscription)
      const { result } = renderHook(() => useNotifications())
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      expect(result.current.subscribed).toBe(true)
    })

    it('does not detect subscription when permission is default', async () => {
      setupNotificationApi('default')
      const { result } = renderHook(() => useNotifications())
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      expect(result.current.subscribed).toBe(false)
      expect(result.current.permission).toBe('default')
    })

    it('sets loading to false when user is not authenticated', async () => {
      const { useAuth } = await import('../useAuth')
      useAuth.mockReturnValueOnce({ user: null })
      const { result } = renderHook(() => useNotifications())
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      expect(result.current.permission).toBe('default')
      expect(result.current.subscribed).toBe(false)
    })
  })

  describe('requestPermission', () => {
    it('calls Notification.requestPermission()', async () => {
      const { result } = renderHook(() => useNotifications())
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.requestPermission()
      })

      expect(window.Notification.requestPermission).toHaveBeenCalled()
    })

    it('updates permission state to granted', async () => {
      window.Notification.requestPermission.mockResolvedValue('granted')
      const { result } = renderHook(() => useNotifications())
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.requestPermission()
      })

      await waitFor(() => {
        expect(result.current.permission).toBe('granted')
      })
    })

    it('updates permission state to denied', async () => {
      window.Notification.requestPermission.mockResolvedValue('denied')
      const { result } = renderHook(() => useNotifications())
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.requestPermission()
      })

      await waitFor(() => {
        expect(result.current.permission).toBe('denied')
      })
      expect(result.current.subscribed).toBe(false)
    })

    it('subscribes via PushManager when permission is granted', async () => {
      window.Notification.requestPermission.mockResolvedValue('granted')
      const { result } = renderHook(() => useNotifications())
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.requestPermission()
      })

      expect(mockState.pushManager.subscribe).toHaveBeenCalledWith({
        userVisibleOnly: true,
        applicationServerKey: expect.any(Uint8Array),
      })
    })

    it('calls register-subscription endpoint after subscribing', async () => {
      window.Notification.requestPermission.mockResolvedValue('granted')
      const { result } = renderHook(() => useNotifications())
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.requestPermission()
      })

      expect(mockState.fetchMock).toHaveBeenCalledWith(
        'https://test.supabase.co/functions/v1/register-subscription',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
        })
      )
    })

    it('sets subscribed to true on successful subscription', async () => {
      window.Notification.requestPermission.mockResolvedValue('granted')
      const { result } = renderHook(() => useNotifications())
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.requestPermission()
      })

      expect(result.current.subscribed).toBe(true)
    })

    it('sets error state when subscription fails', async () => {
      window.Notification.requestPermission.mockResolvedValue('granted')
      mockState.pushManager.subscribe.mockRejectedValueOnce(new Error('Subscription failed'))
      const { result } = renderHook(() => useNotifications())
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.requestPermission()
      })

      expect(result.current.error).toBe('Subscription failed')
      expect(result.current.subscribed).toBe(false)
    })

    it('sets error when backend registration fails', async () => {
      window.Notification.requestPermission.mockResolvedValue('granted')
      mockState.fetchMock.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Server error' }),
      })
      const { result } = renderHook(() => useNotifications())
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.requestPermission()
      })

      expect(result.current.error).toBe('Server error')
      expect(result.current.subscribed).toBe(false)
      expect(mockState.mockSubscription.unsubscribe).toHaveBeenCalled()
    })

    it('sets error when no session is available', async () => {
      window.Notification.requestPermission.mockResolvedValue('granted')
      mockState.getSession.mockResolvedValueOnce({
        data: { session: null },
      })
      const { result } = renderHook(() => useNotifications())
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.requestPermission()
      })

      expect(result.current.error).toBe('User not authenticated')
      expect(mockState.mockSubscription.unsubscribe).toHaveBeenCalled()
    })

    it('skips subscribe if existing subscription is found', async () => {
      window.Notification.requestPermission.mockResolvedValue('granted')
      setupServiceWorker(mockState.mockSubscription)
      const { result } = renderHook(() => useNotifications())
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.requestPermission()
      })

      expect(mockState.pushManager.subscribe).not.toHaveBeenCalled()
      expect(result.current.subscribed).toBe(true)
    })

    it('sets error when VAPID key is missing', async () => {
      vi.stubEnv('VITE_VAPID_PUBLIC_KEY', '')
      window.Notification.requestPermission.mockResolvedValue('granted')
      const { result } = renderHook(() => useNotifications())
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.requestPermission()
      })

      expect(result.current.error).toBe('VAPID public key is not configured')
    })

    it('sets error when pushManager is not available', async () => {
      window.Notification.requestPermission.mockResolvedValue('granted')
      Object.defineProperty(navigator, 'serviceWorker', {
        writable: true,
        configurable: true,
        value: {
          ready: Promise.resolve({ pushManager: null }),
        },
      })

      const { result } = renderHook(() => useNotifications())
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.requestPermission()
      })

      expect(result.current.error).toBe('Push messaging is not supported')
    })

    it('sets error when Notification API is missing', async () => {
      delete window.Notification
      const { result } = renderHook(() => useNotifications())
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.requestPermission()
      })

      expect(result.current.error).toBe('Notifications not supported')
    })

    it('loading state is true during async operations', async () => {
      let resolvePermission
      window.Notification.requestPermission.mockReturnValue(
        new Promise((resolve) => { resolvePermission = resolve })
      )

      const { result } = renderHook(() => useNotifications())
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const promise = result.current.requestPermission()

      await waitFor(() => {
        expect(result.current.loading).toBe(true)
      })

      resolvePermission('granted')
      await act(async () => {
        await promise
      })

      expect(result.current.loading).toBe(false)
    })
  })

  describe('unsubscribe', () => {
    it('calls register-subscription DELETE endpoint', async () => {
      setupNotificationApi('granted')
      setupServiceWorker(mockState.mockSubscription)
      const { result } = renderHook(() => useNotifications())
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.unsubscribe()
      })

      expect(mockState.fetchMock).toHaveBeenCalledWith(
        'https://test.supabase.co/functions/v1/register-subscription',
        expect.objectContaining({
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
        })
      )
    })

    it('sets subscribed to false after successful unsubscribe', async () => {
      setupNotificationApi('granted')
      setupServiceWorker(mockState.mockSubscription)
      const { result } = renderHook(() => useNotifications())
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      expect(result.current.subscribed).toBe(true)

      await act(async () => {
        await result.current.unsubscribe()
      })

      await waitFor(() => {
        expect(result.current.subscribed).toBe(false)
      })
      expect(mockState.mockSubscription.unsubscribe).toHaveBeenCalled()
    })

    it('sets error when DELETE request fails', async () => {
      setupNotificationApi('granted')
      setupServiceWorker(mockState.mockSubscription)
      mockState.fetchMock.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Delete failed' }),
      })
      const { result } = renderHook(() => useNotifications())
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.unsubscribe()
      })

      expect(result.current.error).toBe('Delete failed')
    })

    it('sets error when no session is available', async () => {
      setupNotificationApi('granted')
      setupServiceWorker(mockState.mockSubscription)
      mockState.getSession.mockResolvedValueOnce({
        data: { session: null },
      })
      const { result } = renderHook(() => useNotifications())
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.unsubscribe()
      })

      expect(result.current.error).toBe('User not authenticated')
    })

    it('handles no existing subscription gracefully', async () => {
      setupNotificationApi('granted')
      setupServiceWorker(null)
      const { result } = renderHook(() => useNotifications())
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.unsubscribe()
      })

      expect(result.current.subscribed).toBe(false)
      expect(mockState.fetchMock).not.toHaveBeenCalled()
    })

    it('loading state is true during unsubscribe', async () => {
      setupNotificationApi('granted')
      setupServiceWorker(mockState.mockSubscription)

      let resolveFetch
      mockState.fetchMock.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveFetch = () =>
            resolve({
              ok: true,
              json: () => Promise.resolve({ success: true }),
            })
        })
      )

      const { result } = renderHook(() => useNotifications())
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let promise
      act(() => {
        promise = result.current.unsubscribe()
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(true)
      })

      await act(async () => {
        resolveFetch()
        await promise
      })

      expect(result.current.loading).toBe(false)
    })
  })

  describe('unsupported browser', () => {
    it('handles missing Notification API on mount', async () => {
      delete window.Notification
      const { result } = renderHook(() => useNotifications())
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      expect(result.current.permission).toBe('unsupported')
    })
  })

  describe('VAPID key', () => {
    it('reads VAPID public key from environment variable', async () => {
      window.Notification.requestPermission.mockResolvedValue('granted')
      const { result } = renderHook(() => useNotifications())
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.requestPermission()
      })

      expect(mockState.pushManager.subscribe).toHaveBeenCalledWith(
        expect.objectContaining({
          applicationServerKey: expect.any(Uint8Array),
        })
      )
    })
  })

  describe('integration: full opt-in flow', () => {
    it('request permission -> subscribe -> register', async () => {
      window.Notification.requestPermission.mockResolvedValue('granted')
      const { result } = renderHook(() => useNotifications())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      expect(result.current.permission).toBe('default')
      expect(result.current.subscribed).toBe(false)

      await act(async () => {
        await result.current.requestPermission()
      })

      await waitFor(() => {
        expect(result.current.permission).toBe('granted')
        expect(result.current.subscribed).toBe(true)
        expect(result.current.error).toBeNull()
      })
      expect(mockState.pushManager.subscribe).toHaveBeenCalled()
      expect(mockState.fetchMock).toHaveBeenCalledWith(
        'https://test.supabase.co/functions/v1/register-subscription',
        expect.objectContaining({ method: 'POST' })
      )
    })
  })

  describe('integration: full opt-out flow', () => {
    it('unsubscribe -> remove from backend', async () => {
      setupNotificationApi('granted')
      setupServiceWorker(mockState.mockSubscription)
      const { result } = renderHook(() => useNotifications())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      expect(result.current.subscribed).toBe(true)

      await act(async () => {
        await result.current.unsubscribe()
      })

      await waitFor(() => {
        expect(result.current.subscribed).toBe(false)
        expect(result.current.error).toBeNull()
      })
      expect(mockState.fetchMock).toHaveBeenCalledWith(
        'https://test.supabase.co/functions/v1/register-subscription',
        expect.objectContaining({ method: 'DELETE' })
      )
      expect(mockState.mockSubscription.unsubscribe).toHaveBeenCalled()
    })
  })
})
