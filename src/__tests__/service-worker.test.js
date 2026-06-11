import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Service Worker', () => {
  let mockPrecacheAndRoute
  let mockSkipWaiting
  let mockClientsClaim
  let showNotificationMock
  let openWindowMock
  let waitUntilMock
  let addEventListenerSpy

  beforeEach(() => {
    vi.resetModules()

    showNotificationMock = vi.fn().mockResolvedValue(undefined)
    openWindowMock = vi.fn().mockResolvedValue({})
    waitUntilMock = vi.fn()
    addEventListenerSpy = vi.fn()

    mockPrecacheAndRoute = vi.fn()
    mockSkipWaiting = vi.fn()
    mockClientsClaim = vi.fn()

    vi.doMock('workbox-precaching', () => ({
      precacheAndRoute: mockPrecacheAndRoute,
    }))

    vi.doMock('workbox-core', () => ({
      skipWaiting: mockSkipWaiting,
      clientsClaim: mockClientsClaim,
    }))

    globalThis.self = {
      __WB_MANIFEST: [{ url: '/index.html', revision: 'abc123' }],
      registration: {
        showNotification: showNotificationMock,
      },
      addEventListener: addEventListenerSpy,
    }

    globalThis.clients = {
      openWindow: openWindowMock,
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete globalThis.self
    delete globalThis.clients
  })

  it('exists at src/service-worker.js', () => {
    const swPath = path.resolve(__dirname, '../service-worker.js')
    expect(fs.existsSync(swPath)).toBe(true)
  })

  it('imports and calls precacheAndRoute with self.__WB_MANIFEST', async () => {
    await import('../service-worker.js')
    expect(mockPrecacheAndRoute).toHaveBeenCalledWith(globalThis.self.__WB_MANIFEST)
  })

  it('calls skipWaiting() for immediate activation', async () => {
    await import('../service-worker.js')
    expect(mockSkipWaiting).toHaveBeenCalled()
  })

  it('calls clientsClaim() for immediate activation', async () => {
    await import('../service-worker.js')
    expect(mockClientsClaim).toHaveBeenCalled()
  })

  it('registers push event listener', async () => {
    await import('../service-worker.js')
    const pushCall = addEventListenerSpy.mock.calls.find(call => call[0] === 'push')
    expect(pushCall).toBeDefined()
    expect(typeof pushCall[1]).toBe('function')
  })

  it('push handler calls showNotification with correct parameters', async () => {
    await import('../service-worker.js')
    const pushCall = addEventListenerSpy.mock.calls.find(call => call[0] === 'push')
    const pushHandler = pushCall[1]

    const mockPayload = {
      title: 'Test Notification',
      body: 'Test body content',
      data: { url: '/matches', matchId: '123' },
    }

    const mockEvent = {
      data: {
        json: () => mockPayload,
      },
      waitUntil: waitUntilMock,
    }

    pushHandler(mockEvent)

    expect(waitUntilMock).toHaveBeenCalled()
    expect(showNotificationMock).toHaveBeenCalledWith('Test Notification', {
      body: 'Test body content',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: { url: '/matches', matchId: '123' },
    })
  })

  it('push handler does nothing when event.data is null', async () => {
    await import('../service-worker.js')
    const pushCall = addEventListenerSpy.mock.calls.find(call => call[0] === 'push')
    const pushHandler = pushCall[1]

    const mockEvent = {
      data: null,
      waitUntil: waitUntilMock,
    }

    pushHandler(mockEvent)

    expect(showNotificationMock).not.toHaveBeenCalled()
    expect(waitUntilMock).not.toHaveBeenCalled()
  })

  it('registers notificationclick event listener', async () => {
    await import('../service-worker.js')
    const clickCall = addEventListenerSpy.mock.calls.find(call => call[0] === 'notificationclick')
    expect(clickCall).toBeDefined()
    expect(typeof clickCall[1]).toBe('function')
  })

  it('notificationclick handler closes the notification', async () => {
    await import('../service-worker.js')
    const clickCall = addEventListenerSpy.mock.calls.find(call => call[0] === 'notificationclick')
    const clickHandler = clickCall[1]

    const closeMock = vi.fn()
    const mockEvent = {
      notification: {
        close: closeMock,
        data: { url: '/matches' },
      },
      waitUntil: waitUntilMock,
    }

    clickHandler(mockEvent)

    expect(closeMock).toHaveBeenCalled()
  })

  it('notificationclick handler opens the URL from notification data', async () => {
    await import('../service-worker.js')
    const clickCall = addEventListenerSpy.mock.calls.find(call => call[0] === 'notificationclick')
    const clickHandler = clickCall[1]

    const closeMock = vi.fn()
    const mockEvent = {
      notification: {
        close: closeMock,
        data: { url: '/matches/123' },
      },
      waitUntil: waitUntilMock,
    }

    clickHandler(mockEvent)

    expect(waitUntilMock).toHaveBeenCalled()
    expect(openWindowMock).toHaveBeenCalledWith('/matches/123')
  })

  it('notificationclick handler does nothing when URL is missing', async () => {
    await import('../service-worker.js')
    const clickCall = addEventListenerSpy.mock.calls.find(call => call[0] === 'notificationclick')
    const clickHandler = clickCall[1]

    const closeMock = vi.fn()
    const mockEvent = {
      notification: {
        close: closeMock,
        data: null,
      },
      waitUntil: waitUntilMock,
    }

    clickHandler(mockEvent)

    expect(closeMock).toHaveBeenCalled()
    expect(openWindowMock).not.toHaveBeenCalled()
    expect(waitUntilMock).not.toHaveBeenCalled()
  })
})
