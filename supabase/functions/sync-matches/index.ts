import { serve } from './serve.ts'
import { createClient } from './supabaseClient.ts'
import { calculatePoints } from '../_shared/calculatePoints.ts'

interface Match {
  id: string
  home_team: string
  away_team: string
  home_flag: string | null
  away_flag: string | null
  group_name: string
  kickoff_at: string
  status: string
  home_score: number | null
  away_score: number | null
}

function mapStatus(status: string): string {
  const statusMap: Record<string, string> = {
    SCHEDULED: 'scheduled',
    TIMED: 'scheduled',
    IN_PLAY: 'live',
    LIVE: 'live',
    PAUSED: 'live',
    FINISHED: 'finished',
    POSTPONED: 'scheduled',
    CANCELLED: 'scheduled',
  }
  return statusMap[status] || 'scheduled'
}

async function fetchMatchesFromApi(apiKey: string): Promise<any[]> {
  const response = await fetch('https://api.football-data.org/v4/competitions/WC/matches', {
    headers: { 'X-Auth-Token': apiKey }
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data.matches || []
}

function mapMatch(match: any): Match {
  return {
    id: match.id.toString(),
    home_team: match.homeTeam?.shortName || match.homeTeam?.name || 'TBD',
    away_team: match.awayTeam?.shortName || match.awayTeam?.name || 'TBD',
    home_flag: null,
    away_flag: null,
    group_name: match.group || match.stage || 'Group Stage',
    kickoff_at: match.utcDate,
    status: mapStatus(match.status),
    home_score: match.score?.fullTime?.home ?? null,
    away_score: match.score?.fullTime?.away ?? null,
  }
}

async function triggerPostMatchNotification(
  supabaseUrl: string,
  serviceRoleKey: string,
  match: { id: string; home_team: string; away_team: string; home_score: number; away_score: number },
) {
  try {
    console.log(JSON.stringify({
      event: 'trigger_post_match_notification',
      match_id: match.id,
      timestamp: new Date().toISOString(),
    }))

    const response = await fetch(`${supabaseUrl}/functions/v1/send-notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        type: 'post-match',
        data: {
          matchId: match.id,
          match: {
            home_team: match.home_team,
            away_team: match.away_team,
            home_score: match.home_score,
            away_score: match.away_score,
          },
        },
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error(JSON.stringify({
        event: 'post_match_notification_failed',
        match_id: match.id,
        status: response.status,
        error: errorBody,
        timestamp: new Date().toISOString(),
      }))
    } else {
      console.log(JSON.stringify({
        event: 'post_match_notification_sent',
        match_id: match.id,
        timestamp: new Date().toISOString(),
      }))
    }
  } catch (error) {
    console.error(JSON.stringify({
      event: 'post_match_notification_error',
      match_id: match.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }))
  }
}

export async function handleSyncMatches(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const apiKey = Deno.env.get('FOOTBALL_DATA_API_KEY')

    if (!apiKey) {
      throw new Error('FOOTBALL_DATA_API_KEY environment variable is required')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    console.log('Fetching matches from API...')
    const apiMatches = await fetchMatchesFromApi(apiKey)
    console.log(`Fetched ${apiMatches.length} matches from API`)

    const matches = apiMatches.map(mapMatch)
    const newlyFinished: string[] = []

    for (const match of matches) {
      const { data: existing, error: fetchError } = await supabase
        .from('matches')
        .select('status')
        .eq('id', match.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error(`Error fetching match ${match.id}:`, fetchError)
        continue
      }

      const wasFinished = existing?.status === 'finished'
      const isNowFinished = match.status === 'finished'

      if (!wasFinished && isNowFinished) {
        newlyFinished.push(match.id)
      }

      const { error: upsertError } = await supabase
        .from('matches')
        .upsert(match, { onConflict: 'id' })

      if (upsertError) {
        console.error(`Error upserting match ${match.id}:`, upsertError)
      }
    }

    console.log(`Upserted ${matches.length} matches`)
    console.log(`Newly finished: ${newlyFinished.length}`)

    let totalPredictionsUpdated = 0

    for (const matchId of newlyFinished) {
      const match = matches.find((m) => m.id === matchId)
      if (!match || match.home_score === null || match.away_score === null) continue

      const { data: predictions, error: fetchError } = await supabase
        .from('predictions')
        .select('*')
        .eq('match_id', matchId)

      if (fetchError) {
        console.error(`Error fetching predictions for match ${matchId}:`, fetchError)
        continue
      }

      if (!predictions || predictions.length === 0) {
        console.log(`No predictions for match ${matchId}, skipping`)
        continue
      }

      for (const prediction of predictions) {
        const points = calculatePoints(
          { home: prediction.home_score, away: prediction.away_score },
          { home: match.home_score, away: match.away_score }
        )

        const { error: updateError } = await supabase
          .from('predictions')
          .update({ points })
          .eq('id', prediction.id)

        if (updateError) {
          console.error(`Error updating prediction ${prediction.id}:`, updateError)
        } else {
          totalPredictionsUpdated++
        }
      }

      console.log(`Updated ${predictions.length} predictions for match ${matchId}`)

      if (match.home_score !== null && match.away_score !== null) {
        triggerPostMatchNotification(supabaseUrl, supabaseServiceRoleKey, {
          id: match.id,
          home_team: match.home_team,
          away_team: match.away_team,
          home_score: match.home_score,
          away_score: match.away_score,
        })
      }
    }

    console.log(`Total predictions updated: ${totalPredictionsUpdated}`)

    return new Response(
      JSON.stringify({
        success: true,
        matchesUpserted: matches.length,
        newlyFinished: newlyFinished.length,
        newlyFinishedIds: newlyFinished,
        predictionsUpdated: totalPredictionsUpdated,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('sync-matches error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
}

serve(handleSyncMatches)
