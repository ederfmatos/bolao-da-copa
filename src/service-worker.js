import { precacheAndRoute } from 'workbox-precaching'
import { clientsClaim, skipWaiting } from 'workbox-core'

precacheAndRoute(self.__WB_MANIFEST)

skipWaiting()
clientsClaim()

const DB_NAME = 'bolao-notifications'
const DB_VERSION = 1
const STORE_NAME = 'notifications'
const MAX_NOTIFICATIONS = 50

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }
  })
}

async function saveNotification(notificationData) {
  try {
    const db = await openDB()
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    const notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: notificationData.title,
      body: notificationData.body,
      type: notificationData.data?.type || 'general',
      url: notificationData.data?.url || '/',
      matchId: notificationData.data?.matchId || null,
      timestamp: Date.now(),
      read: false
    }

    store.add(notification)

    await new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })

    db.close()

    const countRequest = indexedDB.open(DB_NAME, DB_VERSION)
    countRequest.onsuccess = () => {
      const countDb = countRequest.result
      const countTx = countDb.transaction(STORE_NAME, 'readwrite')
      const countStore = countTx.objectStore(STORE_NAME)
      const getAllRequest = countStore.getAll()

      getAllRequest.onsuccess = () => {
        const allNotifications = getAllRequest.result
        if (allNotifications.length > MAX_NOTIFICATIONS) {
          const sorted = allNotifications.sort((a, b) => a.timestamp - b.timestamp)
          const toDelete = sorted.slice(0, allNotifications.length - MAX_NOTIFICATIONS)
          toDelete.forEach(n => countStore.delete(n.id))
        }
        countDb.close()
      }
    }

    return notification
  } catch (error) {
    console.error('Error saving notification:', error)
    return null
  }
}

self.addEventListener('push', (event) => {
  if (!event.data) return

  try {
    const data = event.data.json()

    event.waitUntil(
      (async () => {
        await saveNotification(data)

        const clients = await self.clients.matchAll({ includeUncontrolled: true })
        clients.forEach(client => {
          client.postMessage({ type: 'NEW_NOTIFICATION' })
        })

        return self.registration.showNotification(data.title, {
          body: data.body,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          data: data.data,
        })
      })()
    )
  } catch (error) {
    console.error('Failed to process push notification:', error)
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url
  if (!url) return

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})
