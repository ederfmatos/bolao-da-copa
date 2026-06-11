import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

function uint8ArrayToBase64Url(bytes) {
  const binary = String.fromCharCode(...bytes)
  const base64 = window.btoa(binary)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function useNotifications() {
  const { user } = useAuth()
  const [permission, setPermission] = useState('default')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    async function checkStatus() {
      try {
        if (!('Notification' in window)) {
          setPermission('unsupported')
          setLoading(false)
          return
        }

        setPermission(Notification.permission)

        if (Notification.permission === 'granted') {
          const registration = await navigator.serviceWorker.ready
          const existingSubscription = await registration.pushManager.getSubscription()
          setSubscribed(existingSubscription !== null)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    checkStatus()
  }, [user])

  async function requestPermission() {
    if (!('Notification' in window)) {
      setError('Notifications not supported')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const result = await Notification.requestPermission()
      setPermission(result)

      if (result !== 'granted') {
        setLoading(false)
        return
      }

      const registration = await navigator.serviceWorker.ready

      if (!registration.pushManager) {
        setError('Push messaging is not supported')
        setLoading(false)
        return
      }

      const existingSubscription = await registration.pushManager.getSubscription()
      if (existingSubscription) {
        setSubscribed(true)
        setLoading(false)
        return
      }

      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        setError('VAPID public key is not configured')
        setLoading(false)
        return
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      })

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        await subscription.unsubscribe()
        setError('User not authenticated')
        setLoading(false)
        return
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/register-subscription`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            keys: {
              p256dh: uint8ArrayToBase64Url(new Uint8Array(subscription.getKey('p256dh'))),
              auth: uint8ArrayToBase64Url(new Uint8Array(subscription.getKey('auth'))),
            },
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        await subscription.unsubscribe()
        throw new Error(errorData.error || 'Failed to register subscription')
      }

      setSubscribed(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function unsubscribe() {
    try {
      setLoading(true)
      setError(null)

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (!subscription) {
        setSubscribed(false)
        setLoading(false)
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('User not authenticated')
        setLoading(false)
        return
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/register-subscription`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to unregister subscription')
      }

      await subscription.unsubscribe()
      setSubscribed(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return { permission, subscribed, loading, error, requestPermission, unsubscribe }
}
