import { serve } from './serve.ts'
import { createClient } from './supabaseClient.ts'
import { sendPush } from '../_shared/sendPush.ts'
import type { NotificationPayload, PushSubscriptionData } from '../_shared/sendPush.ts'

type NotificationType = 'daily-digest' | 'post-match' | 'deadline-reminder'

interface SendNotificationsRequest {
  type: NotificationType
  data: {
    matchId?: string
    match?: { home_team: string; away_team: string; home_score: number; away_score: number }
    matches?: Array<{ home_team: string; away_team: string; kickoff_at: string }>
    points?: number
    prediction?: { home_score: number; away_score: number }
  }
}

interface SubscriptionRow {
  id: string
  user_id: string
  endpoint: string
  p256dh_key: string
  auth_key: string
}

interface SendResult {
  sent: number
  failed: number
  expiredIds: string[]
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

function getBrasiliaToday(): string {
  const now = new Date()
  const brasilia = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  return brasilia.toISOString().split('T')[0]
}

function formatKickoffTime(kickoffAt: string): string {
  const date = new Date(kickoffAt)
  const brasilia = new Date(date.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  const hours = String(brasilia.getHours()).padStart(2, '0')
  const minutes = String(brasilia.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

async function sendToSubscriptions(
  subscriptions: SubscriptionRow[],
  payloadFn: (sub: SubscriptionRow) => NotificationPayload | null,
): Promise<SendResult> {
  let sent = 0
  let failed = 0
  const expiredIds: string[] = []

  for (const sub of subscriptions) {
    const payload = payloadFn(sub)
    if (!payload) continue

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
          event: 'send_error',
          subscription_id: sub.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        }),
      )
      failed++
    }
  }

  return { sent, failed, expiredIds }
}

async function handleDailyDigest(
  supabase: ReturnType<typeof createClient>,
  data: SendNotificationsRequest['data'],
): Promise<SendResult> {
  const today = getBrasiliaToday()
  const startOfDay = `${today}T00:00:00-03:00`
  const endOfDay = `${today}T23:59:59-03:00`

  const { data: matches, error } = await supabase
    .from('matches')
    .select('*')
    .gte('kickoff_at', startOfDay)
    .lte('kickoff_at', endOfDay)
    .order('kickoff_at')

  if (error) {
    console.error(JSON.stringify({ event: 'daily_digest_query_error', error: error.message, timestamp: new Date().toISOString() }))
    throw new Error(`Failed to query matches: ${error.message}`)
  }

  if (!matches || matches.length === 0) {
    console.log(JSON.stringify({ event: 'daily_digest_no_matches', date: today, timestamp: new Date().toISOString() }))
    return { sent: 0, failed: 0, expiredIds: [] }
  }

  const { data: subscriptions, error: subError } = await supabase
    .from('push_subscriptions')
    .select('*')

  if (subError) {
    console.error(JSON.stringify({ event: 'daily_digest_subscriptions_error', error: subError.message, timestamp: new Date().toISOString() }))
    throw new Error(`Failed to query subscriptions: ${subError.message}`)
  }

  if (!subscriptions || subscriptions.length === 0) {
    return { sent: 0, failed: 0, expiredIds: [] }
  }

  const matchLines = matches.map(
    (m) => `${m.home_team} vs ${m.away_team} - ${formatKickoffTime(m.kickoff_at)}`,
  )

  return sendToSubscriptions(subscriptions, () => ({
    title: 'Jogos de hoje!',
    body: `${matches.length} jogo(s) hoje: \n${matchLines.join('\n')}`,
    data: { url: '/', type: 'daily-digest' },
  }))
}

async function handlePostMatch(
  supabase: ReturnType<typeof createClient>,
  data: SendNotificationsRequest['data'],
): Promise<SendResult> {
  if (!data.matchId || !data.match) {
    throw new Error('post-match requires matchId and match data')
  }

  const { data: predictions, error: predError } = await supabase
    .from('predictions')
    .select('user_id, home_score, away_score, points')
    .eq('match_id', data.matchId)

  if (predError) {
    console.error(JSON.stringify({ event: 'post_match_predictions_error', error: predError.message, timestamp: new Date().toISOString() }))
    throw new Error(`Failed to query predictions: ${predError.message}`)
  }

  if (!predictions || predictions.length === 0) {
    return { sent: 0, failed: 0, expiredIds: [] }
  }

  const userIds = [...new Set(predictions.map((p) => p.user_id))]
  const { data: subscriptions, error: subError } = await supabase
    .from('push_subscriptions')
    .select('*')
    .in('user_id', userIds)

  if (subError) {
    console.error(JSON.stringify({ event: 'post_match_subscriptions_error', error: subError.message, timestamp: new Date().toISOString() }))
    throw new Error(`Failed to query subscriptions: ${subError.message}`)
  }

  if (!subscriptions || subscriptions.length === 0) {
    return { sent: 0, failed: 0, expiredIds: [] }
  }

  const predictionsByUser = new Map(
    predictions.map((p) => [p.user_id, p]),
  )

  const matchInfo = data.match
  const matchResult = `${matchInfo.home_team} ${matchInfo.home_score} x ${matchInfo.away_score} ${matchInfo.away_team}`

  return sendToSubscriptions(subscriptions, (sub) => {
    const prediction = predictionsByUser.get(sub.user_id)
    if (!prediction) return null

    const points = prediction.points ?? 0

    return {
      title: 'Resultado do jogo!',
      body: `${matchResult} - Você fez ${points} ponto(s)`,
      data: { url: `/match/${data.matchId}`, type: 'post-match', matchId: data.matchId },
    }
  })
}

async function handleDeadlineReminder(
  supabase: ReturnType<typeof createClient>,
): Promise<SendResult> {
  const now = new Date()
  const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000)

  const { data: matches, error } = await supabase
    .from('matches')
    .select('*')
    .eq('status', 'scheduled')
    .gte('kickoff_at', now.toISOString())
    .lte('kickoff_at', twoHoursLater.toISOString())
    .order('kickoff_at')

  if (error) {
    console.error(JSON.stringify({ event: 'deadline_reminder_query_error', error: error.message, timestamp: new Date().toISOString() }))
    throw new Error(`Failed to query matches: ${error.message}`)
  }

  if (!matches || matches.length === 0) {
    return { sent: 0, failed: 0, expiredIds: [] }
  }

  const matchIds = matches.map((m) => m.id)

  const { data: allSubscriptions, error: subError } = await supabase
    .from('push_subscriptions')
    .select('*')

  if (subError) {
    console.error(JSON.stringify({ event: 'deadline_reminder_subscriptions_error', error: subError.message, timestamp: new Date().toISOString() }))
    throw new Error(`Failed to query subscriptions: ${subError.message}`)
  }

  if (!allSubscriptions || allSubscriptions.length === 0) {
    return { sent: 0, failed: 0, expiredIds: [] }
  }

  const { data: existingPredictions, error: predError } = await supabase
    .from('predictions')
    .select('user_id, match_id')
    .in('match_id', matchIds)

  if (predError) {
    console.error(JSON.stringify({ event: 'deadline_reminder_predictions_error', error: predError.message, timestamp: new Date().toISOString() }))
    throw new Error(`Failed to query predictions: ${predError.message}`)
  }

  const predictionsByMatch = new Map<string, Set<string>>()
  for (const pred of existingPredictions || []) {
    if (!predictionsByMatch.has(pred.match_id)) {
      predictionsByMatch.set(pred.match_id, new Set())
    }
    predictionsByMatch.get(pred.match_id)!.add(pred.user_id)
  }

  const reminders: Array<{ sub: SubscriptionRow; match: typeof matches[0] }> = []
  for (const match of matches) {
    const usersWithPredictions = predictionsByMatch.get(match.id) || new Set()
    for (const sub of allSubscriptions) {
      if (!usersWithPredictions.has(sub.user_id)) {
        reminders.push({ sub, match })
      }
    }
  }

  if (reminders.length === 0) {
    return { sent: 0, failed: 0, expiredIds: [] }
  }

  let sent = 0
  let failed = 0
  const expiredIds: string[] = []

  for (const { sub, match } of reminders) {
    const payload: NotificationPayload = {
      title: 'Não esqueça de palpitar!',
      body: `${match.home_team} vs ${match.away_team} começa às ${formatKickoffTime(match.kickoff_at)}`,
      data: { url: `/match/${match.id}`, type: 'deadline-reminder', matchId: match.id },
    }

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
          event: 'deadline_reminder_send_error',
          subscription_id: sub.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        }),
      )
      failed++
    }
  }

  return { sent, failed, expiredIds }
}

export async function handleSendNotifications(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405)
  }

  try {
    const auth = authenticateServiceRole(req)
    if (!auth.valid) {
      console.log(JSON.stringify({ event: 'auth_failed', error: auth.error, timestamp: new Date().toISOString() }))
      return jsonResponse({ success: false, error: auth.error }, 401)
    }

    let body: SendNotificationsRequest
    try {
      body = await req.json()
    } catch {
      return jsonResponse({ success: false, error: 'Invalid JSON body' }, 400)
    }

    if (!body.type) {
      return jsonResponse({ success: false, error: 'type is required' }, 400)
    }

    const validTypes: NotificationType[] = ['daily-digest', 'post-match', 'deadline-reminder']
    if (!validTypes.includes(body.type)) {
      return jsonResponse({ success: false, error: `Invalid type: ${body.type}. Must be one of: ${validTypes.join(', ')}` }, 400)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    console.log(JSON.stringify({ event: 'notification_start', type: body.type, timestamp: new Date().toISOString() }))

    let result: SendResult

    switch (body.type) {
      case 'daily-digest':
        result = await handleDailyDigest(supabase, body.data || {})
        break
      case 'post-match':
        result = await handlePostMatch(supabase, body.data || {})
        break
      case 'deadline-reminder':
        result = await handleDeadlineReminder(supabase)
        break
    }

    if (result.expiredIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('push_subscriptions')
        .delete()
        .in('id', result.expiredIds)

      if (deleteError) {
        console.error(JSON.stringify({ event: 'cleanup_error', error: deleteError.message, count: result.expiredIds.length, timestamp: new Date().toISOString() }))
      } else {
        console.log(JSON.stringify({ event: 'cleanup_complete', count: result.expiredIds.length, timestamp: new Date().toISOString() }))
      }
    }

    const summary = {
      success: true,
      sent: result.sent,
      failed: result.failed,
      cleaned: result.expiredIds.length,
    }

    console.log(JSON.stringify({ event: 'notification_complete', type: body.type, ...summary, timestamp: new Date().toISOString() }))

    return jsonResponse(summary, 200)
  } catch (error) {
    console.error(JSON.stringify({ event: 'send_notifications_error', error: error instanceof Error ? error.message : 'Unknown error', timestamp: new Date().toISOString() }))
    return jsonResponse(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      500,
    )
  }
}

serve(handleSendNotifications)
