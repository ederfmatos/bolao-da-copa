import { precacheAndRoute } from 'workbox-precaching'
import { clientsClaim, skipWaiting } from 'workbox-core'

precacheAndRoute(self.__WB_MANIFEST)

skipWaiting()
clientsClaim()

self.addEventListener('push', (event) => {
  if (!event.data) return

  try {
    const data = event.data.json()

    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        data: data.data,
      })
    )
  } catch (error) {
    console.error('Failed to parse push notification data:', error)
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url
  if (!url) return

  event.waitUntil(clients.openWindow(url))
})
