import { serve } from './serve.ts'
import { createClient } from './supabaseClient.ts'

interface SubscriptionBody {
  endpoint?: string
  keys?: {
    p256dh?: string
    auth?: string
  }
}

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

async function authenticateUser(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return { user: null, error: 'Missing Authorization header' }
  }

  const token = authHeader.replace('Bearer ', '')
  if (!token || token === authHeader) {
    return { user: null, error: 'Invalid Authorization header format' }
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return { user: null, error: error?.message || 'Invalid token' }
  }

  return { user, error: null }
}

function validateSubscription(body: SubscriptionBody) {
  if (!body.endpoint || typeof body.endpoint !== 'string') {
    return 'endpoint is required'
  }
  if (!body.keys || typeof body.keys !== 'object') {
    return 'keys object is required'
  }
  if (!body.keys.p256dh || typeof body.keys.p256dh !== 'string') {
    return 'keys.p256dh is required'
  }
  if (!body.keys.auth || typeof body.keys.auth !== 'string') {
    return 'keys.auth is required'
  }
  return null
}

export async function handleRegisterSubscription(req: Request): Promise<Response> {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405)
  }

  try {
    const { user, error: authError } = await authenticateUser(req)
    if (authError || !user) {
      console.log(JSON.stringify({ event: 'auth_failed', error: authError, timestamp: new Date().toISOString() }))
      return jsonResponse({ success: false, error: authError || 'Unauthorized' }, 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    if (req.method === 'POST') {
      const body: SubscriptionBody = await req.json()

      const validationError = validateSubscription(body)
      if (validationError) {
        return jsonResponse({ success: false, error: validationError }, 400)
      }

      const { data: existing } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('endpoint', body.endpoint!)
        .eq('user_id', user.id)
        .single()

      if (existing) {
        const { error: updateError } = await supabase
          .from('push_subscriptions')
          .update({
            p256dh_key: body.keys!.p256dh!,
            auth_key: body.keys!.auth!,
          })
          .eq('id', existing.id)

        if (updateError) {
          console.error(JSON.stringify({ event: 'upsert_error', error: updateError.message, timestamp: new Date().toISOString() }))
          return jsonResponse({ success: false, error: updateError.message }, 500)
        }

        console.log(JSON.stringify({ event: 'subscription_updated', user_id: user.id, endpoint: body.endpoint!.substring(0, 50) + '...', timestamp: new Date().toISOString() }))
        return jsonResponse({ success: true, subscription_id: existing.id, updated: true }, 200)
      }

      const { data: inserted, error: insertError } = await supabase
        .from('push_subscriptions')
        .insert({
          user_id: user.id,
          endpoint: body.endpoint!,
          p256dh_key: body.keys!.p256dh!,
          auth_key: body.keys!.auth!,
        })
        .select('id')
        .single()

      if (insertError || !inserted) {
        console.error(JSON.stringify({ event: 'insert_error', error: insertError?.message, timestamp: new Date().toISOString() }))
        return jsonResponse({ success: false, error: insertError?.message || 'Failed to insert subscription' }, 500)
      }

      console.log(JSON.stringify({ event: 'subscription_registered', user_id: user.id, subscription_id: inserted.id, timestamp: new Date().toISOString() }))
      return jsonResponse({ success: true, subscription_id: inserted.id }, 201)
    }

    if (req.method === 'DELETE') {
      const body: { endpoint?: string } = await req.json()

      if (!body.endpoint) {
        return jsonResponse({ success: false, error: 'endpoint is required' }, 400)
      }

      const { data: existing, error: lookupError } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('endpoint', body.endpoint)
        .eq('user_id', user.id)
        .single()

      if (lookupError || !existing) {
        return jsonResponse({ success: false, error: lookupError?.message || 'Subscription not found' }, 404)
      }

      const { error: deleteError } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('id', existing.id)

      if (deleteError) {
        console.error(JSON.stringify({ event: 'delete_error', error: deleteError.message, timestamp: new Date().toISOString() }))
        return jsonResponse({ success: false, error: deleteError.message }, 500)
      }

      console.log(JSON.stringify({ event: 'subscription_unregistered', user_id: user.id, endpoint: body.endpoint.substring(0, 50) + '...', timestamp: new Date().toISOString() }))
      return jsonResponse({ success: true }, 200)
    }

    return jsonResponse({ success: false, error: 'Method not allowed' }, 405)
  } catch (error) {
    console.error(JSON.stringify({ event: 'register_subscription_error', error: error instanceof Error ? error.message : 'Unknown error', timestamp: new Date().toISOString() }))
    return jsonResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
}

serve(handleRegisterSubscription)
