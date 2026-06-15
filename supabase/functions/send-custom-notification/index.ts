import { serve } from './serve.ts'
import { createClient } from './supabaseClient.ts'
import { sendPush } from '../_shared/sendPush.ts'
import type { NotificationPayload, PushSubscriptionData } from '../_shared/sendPush.ts'

interface SendCustomNotificationRequest {
  title: string
  body: string
  url?: string
  type?: string
  data?: Record<string, unknown>
}

interface SubscriptionRow {
  id: string
  user_id: string
  endpoint: string
  p256dh_key: string
  auth_key: string
}

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function authenticateServiceRole(req: Request): { valid: boolean; error?: string } {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return { valid: false, error: 'Missing Authorization header' }
  }

  const token = authHeader.replace('Bearer ', '')
  if (!token || token === authHeader) {
    return { valid: false, error: 'Invalid Authorization header format' }
  }

  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!serviceRoleKey) {
    return { valid: false, error: 'Service role key not configured' }
  }

  if (token === serviceRoleKey) {
    return { valid: true }
  }

  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return { valid: false, error: 'Unauthorized: service role key required' }
    }
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    if (payload.role === 'service_role') {
      return { valid: true }
    }
  } catch {
    // ignore
  }

  return { valid: false, error: 'Unauthorized: service role key required' }
}

export async function handleSendCustomNotification(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405)
  }

  try {
    const auth = authenticateServiceRole(req)
    if (!auth.valid) {
      return jsonResponse({ success: false, error: auth.error }, 401)
    }

    let body: SendCustomNotificationRequest
    try {
      body = await req.json()
    } catch {
      return jsonResponse({ success: false, error: 'Invalid JSON body' }, 400)
    }

    if (!body.title || typeof body.title !== 'string') {
      return jsonResponse({ success: false, error: 'title is required and must be a string' }, 400)
    }

    if (!body.body || typeof body.body !== 'string') {
      return jsonResponse({ success: false, error: 'body is required and must be a string' }, 400)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')

    if (subError) {
      throw new Error(`Failed to query subscriptions: ${subError.message}`)
    }

    if (!subscriptions || subscriptions.length === 0) {
      return jsonResponse({ success: true, sent: 0, failed: 0, cleaned: 0 }, 200)
    }

    const payload: NotificationPayload = {
      title: body.title,
      body: body.body,
      data: {
        url: body.url || '/',
        type: body.type || 'general',
        ...(body.data || {}),
      },
    }

    let sent = 0
    let failed = 0
    const expiredIds: string[] = []

    for (const sub of subscriptions) {
      const subscriptionData: PushSubscriptionData = {
        endpoint: sub.endpoint,
        p256dh_key: sub.p256dh_key,
        auth_key: sub.auth_key,
      }

      try {
        const result = await sendPush(subscriptionData, payload)

        if (result.success) {
          sent++
        } else if (result.expired) {
          expiredIds.push(sub.id)
          failed++
        } else {
          failed++
        }
      } catch (error) {
        console.error(
          JSON.stringify({
            event: 'send_custom_error',
            subscription_id: sub.id,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
          }),
        )
        failed++
      }
    }

    if (expiredIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('push_subscriptions')
        .delete()
        .in('id', expiredIds)

      if (deleteError) {
        console.error(JSON.stringify({
          event: 'cleanup_error',
          error: deleteError.message,
          count: expiredIds.length,
          timestamp: new Date().toISOString(),
        }))
      }
    }

    return jsonResponse({
      success: true,
      sent,
      failed,
      cleaned: expiredIds.length,
    }, 200)
  } catch (error) {
    console.error(JSON.stringify({
      event: 'send_custom_notification_error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }))
    return jsonResponse(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      500,
    )
  }
}

serve(handleSendCustomNotification)
