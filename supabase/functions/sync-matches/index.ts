import { serve } from './serve.ts'
import { createClient } from './supabaseClient.ts'
import { calculatePoints } from '../_shared/calculatePoints.ts'
import { mapTeamName } from './teamMapping.ts'

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

    // Buscar todas as partidas do seed de uma vez
    const { data: seedMatches, error: seedError } = await supabase
      .from('matches')
      .select('*')

    if (seedError) {
      throw new Error(`Failed to fetch seed matches: ${seedError.message}`)
    }

    console.log(`Found ${seedMatches.length} seed matches`)

    // Criar um map para busca rápida por kickoff_at normalizado
    const seedMatchesByKickoff = new Map<string, any[]>()
    for (const seed of seedMatches) {
      // Normalizar formato de data para comparação
      const key = new Date(seed.kickoff_at).toISOString()
      if (!seedMatchesByKickoff.has(key)) {
        seedMatchesByKickoff.set(key, [])
      }
      seedMatchesByKickoff.get(key)!.push(seed)
    }

    const newlyFinished: string[] = []
    let updatedCount = 0
    let notFoundCount = 0

    for (const apiMatch of apiMatches) {
      const homeTeamPt = mapTeamName(apiMatch.homeTeam?.shortName || apiMatch.homeTeam?.name || 'TBD')
      const awayTeamPt = mapTeamName(apiMatch.awayTeam?.shortName || apiMatch.awayTeam?.name || 'TBD')
      const kickoffAt = apiMatch.utcDate
      const status = mapStatus(apiMatch.status)
      const homeScore = apiMatch.score?.fullTime?.home ?? null
      const awayScore = apiMatch.score?.fullTime?.away ?? null

      // Buscar partida correspondente no seed
      const normalizedKickoff = new Date(kickoffAt).toISOString()
      const candidates = seedMatchesByKickoff.get(normalizedKickoff) || []
      
      let seedMatch = null
      
      // Tentar match exato por nomes
      for (const candidate of candidates) {
        if (candidate.home_team === homeTeamPt && candidate.away_team === awayTeamPt) {
          seedMatch = candidate
          break
        }
      }

      // Se não encontrou, tentar match parcial (para partidas com nomes ligeiramente diferentes)
      if (!seedMatch && candidates.length > 0) {
        seedMatch = candidates[0]
      }

      if (!seedMatch) {
        console.warn(`Could not find seed match for: ${homeTeamPt} vs ${awayTeamPt} at ${kickoffAt}`)
        notFoundCount++
        continue
      }

      const wasFinished = seedMatch.status === 'finished'
      const isNowFinished = status === 'finished'

      if (!wasFinished && isNowFinished) {
        newlyFinished.push(seedMatch.id)
      }

      // Atualizar a partida
      const { error: updateError } = await supabase
        .from('matches')
        .update({
          status: status,
          home_score: homeScore,
          away_score: awayScore,
        })
        .eq('id', seedMatch.id)

      if (updateError) {
        console.error(`Error updating match ${seedMatch.id}:`, updateError)
      } else {
        updatedCount++
      }
    }

    console.log(`Updated ${updatedCount} matches, ${notFoundCount} not found`)
    console.log(`Newly finished: ${newlyFinished.length}`)

    let totalPredictionsUpdated = 0

    for (const matchId of newlyFinished) {
      const apiMatch = apiMatches.find(m => {
        const homeTeamPt = mapTeamName(m.homeTeam?.shortName || m.homeTeam?.name || 'TBD')
        const awayTeamPt = mapTeamName(m.awayTeam?.shortName || m.awayTeam?.name || 'TBD')
        const seedMatch = seedMatches.find(s => s.id === matchId)
        return seedMatch && 
               seedMatch.home_team === homeTeamPt && 
               seedMatch.away_team === awayTeamPt &&
               seedMatch.kickoff_at === m.utcDate
      })

      if (!apiMatch || apiMatch.score?.fullTime?.home === null || apiMatch.score?.fullTime?.away === null) continue

      const seedMatch = seedMatches.find(s => s.id === matchId)
      if (!seedMatch) continue

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
          { home: apiMatch.score.fullTime.home, away: apiMatch.score.fullTime.away }
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

      triggerPostMatchNotification(supabaseUrl, supabaseServiceRoleKey, {
        id: matchId,
        home_team: seedMatch.home_team,
        away_team: seedMatch.away_team,
        home_score: apiMatch.score.fullTime.home,
        away_score: apiMatch.score.fullTime.away,
      })
    }

    console.log(`Total predictions updated: ${totalPredictionsUpdated}`)

    return new Response(
      JSON.stringify({
        success: true,
        matchesUpdated: updatedCount,
        matchesNotFound: notFoundCount,
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
