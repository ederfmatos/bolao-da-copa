import { useState, useEffect, useCallback } from 'react'

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

export function useNotificationHistory() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const loadNotifications = useCallback(async () => {
    try {
      const db = await openDB()
      const transaction = db.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index('timestamp')
      const request = index.openCursor(null, 'prev')

      const results = []
      await new Promise((resolve, reject) => {
        request.onsuccess = (event) => {
          const cursor = event.target.result
          if (cursor && results.length < MAX_NOTIFICATIONS) {
            results.push(cursor.value)
            cursor.continue()
          } else {
            resolve()
          }
        }
        request.onerror = () => reject(request.error)
      })

      setNotifications(results)
      setUnreadCount(results.filter(n => !n.read).length)
      db.close()
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const markAsRead = useCallback(async (id) => {
    try {
      const db = await openDB()
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(id)

      await new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const notification = request.result
          if (notification) {
            notification.read = true
            store.put(notification)
          }
          resolve()
        }
        request.onerror = () => reject(request.error)
      })

      db.close()
      await loadNotifications()
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }, [loadNotifications])

  const markAllAsRead = useCallback(async () => {
    try {
      const db = await openDB()
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.openCursor()

      await new Promise((resolve, reject) => {
        request.onsuccess = (event) => {
          const cursor = event.target.result
          if (cursor) {
            const notification = cursor.value
            if (!notification.read) {
              notification.read = true
              cursor.update(notification)
            }
            cursor.continue()
          } else {
            resolve()
          }
        }
        request.onerror = () => reject(request.error)
      })

      db.close()
      await loadNotifications()
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }, [loadNotifications])

  const clearAll = useCallback(async () => {
    try {
      const db = await openDB()
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.clear()

      await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })

      db.close()
      setNotifications([])
      setUnreadCount(0)
    } catch (error) {
      console.error('Error clearing notifications:', error)
    }
  }, [])

  useEffect(() => {
    loadNotifications()

    const handleMessage = (event) => {
      if (event.data?.type === 'NEW_NOTIFICATION') {
        loadNotifications()
      }
    }

    navigator.serviceWorker?.addEventListener('message', handleMessage)

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage)
    }
  }, [loadNotifications])

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    clearAll,
    refresh: loadNotifications
  }
}
