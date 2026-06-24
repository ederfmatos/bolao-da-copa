import { serve } from './serve.ts'
import { createClient } from './supabaseClient.ts'

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function formatKickoffTime(kickoffAt: string): string {
  const date = new Date(kickoffAt)
  const brasilia = new Date(date.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  const hours = String(brasilia.getHours()).padStart(2, '0')
  const minutes = String(brasilia.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

export async function handleWhatsappMatchReminder(req: Request): Promise<Response> {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL')
  const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY')
  const whatsappInstance = Deno.env.get('WHATSAPP_INSTANCE') ?? 'bolao'
  const whatsappGroupId = Deno.env.get('WHATSAPP_GROUP_ID')

  if (!evolutionApiUrl || !evolutionApiKey || !whatsappGroupId) {
    console.error(JSON.stringify({ event: 'missing_env_vars', timestamp: new Date().toISOString() }))
    return jsonResponse({ error: 'Missing required environment variables' }, 500)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

  const now = new Date()
  const windowStart = new Date(now.getTime() + 28 * 60 * 1000)
  const windowEnd = new Date(now.getTime() + 32 * 60 * 1000)

  const { data: matches, error } = await supabase
    .from('matches')
    .select('id, home_team, away_team, kickoff_at')
    .eq('status', 'scheduled')
    .eq('notified_whatsapp_30min', false)
    .gte('kickoff_at', windowStart.toISOString())
    .lte('kickoff_at', windowEnd.toISOString())

  if (error) {
    console.error(JSON.stringify({ event: 'query_error', error: error.message, timestamp: new Date().toISOString() }))
    return jsonResponse({ error: error.message }, 500)
  }

  if (!matches || matches.length === 0) {
    return jsonResponse({ sent: 0 }, 200)
  }

  let sent = 0

  for (const match of matches) {
    const kickoffTime = formatKickoffTime(match.kickoff_at)
    const text = `⚽ *${match.home_team} x ${match.away_team}* começa em 30 minutos! (${kickoffTime}h)\n\nCorre lá pra dar seu palpite! 🏆`

    try {
      const response = await fetch(`${evolutionApiUrl}/message/sendText/${whatsappInstance}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionApiKey,
        },
        body: JSON.stringify({
          number: whatsappGroupId,
          textMessage: { text },
        }),
      })

      if (response.ok) {
        await supabase
          .from('matches')
          .update({ notified_whatsapp_30min: true })
          .eq('id', match.id)

        sent++
        console.log(JSON.stringify({
          event: 'whatsapp_sent',
          match_id: match.id,
          match: `${match.home_team} x ${match.away_team}`,
          timestamp: new Date().toISOString(),
        }))
      } else {
        const body = await response.text()
        console.error(JSON.stringify({
          event: 'whatsapp_error',
          match_id: match.id,
          status: response.status,
          body,
          timestamp: new Date().toISOString(),
        }))
      }
    } catch (err) {
      console.error(JSON.stringify({
        event: 'whatsapp_fetch_error',
        match_id: match.id,
        error: err instanceof Error ? err.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }))
    }
  }

  return jsonResponse({ sent, total: matches.length }, 200)
}

serve(handleWhatsappMatchReminder)
