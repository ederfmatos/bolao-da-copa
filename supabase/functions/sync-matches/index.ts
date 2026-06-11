import { serve } from './serve.ts'
import { createClient } from './supabaseClient.ts'
import { fetchWithFallback, defaultChain } from './providers/index.ts'
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

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    console.log('Fetching matches from providers...')
    const matches = await fetchWithFallback(defaultChain)
    console.log(`Fetched ${matches.length} matches`)

    const newlyFinished: string[] = []

    for (const match of matches) {
      const matchData: Match = {
        id: match.id,
        home_team: match.homeTeam,
        away_team: match.awayTeam,
        home_flag: match.homeFlag || null,
        away_flag: match.awayFlag || null,
        group_name: match.groupName,
        kickoff_at: match.kickoffAt,
        status: match.status,
        home_score: match.homeScore,
        away_score: match.awayScore,
      }

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
        .upsert(matchData, { onConflict: 'id' })

      if (upsertError) {
        console.error(`Error upserting match ${match.id}:`, upsertError)
      }
    }

    console.log(`Upserted ${matches.length} matches`)
    console.log(`Newly finished: ${newlyFinished.length}`)

    let totalPredictionsUpdated = 0

    for (const matchId of newlyFinished) {
      const match = matches.find((m) => m.id === matchId)
      if (!match || match.homeScore === null || match.awayScore === null) continue

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
          { home: match.homeScore, away: match.awayScore }
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

      if (match.homeScore !== null && match.awayScore !== null) {
        triggerPostMatchNotification(supabaseUrl, supabaseServiceRoleKey, {
          id: match.id,
          home_team: match.homeTeam,
          away_team: match.awayTeam,
          home_score: match.homeScore,
          away_score: match.awayScore,
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
