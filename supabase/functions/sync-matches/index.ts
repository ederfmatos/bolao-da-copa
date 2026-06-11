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

async function fetchScoreFromFallbackApi(
  apiKey: string,
  date: string,
  homeTeam: string,
  awayTeam: string
): Promise<{ home: number | null; away: number | null } | null> {
  try {
    const response = await fetch(`https://v3.football.api-sports.io/fixtures?date=${date}`, {
      headers: { 'x-apisports-key': apiKey }
    })

    if (!response.ok) {
      console.warn(`API-Football error: ${response.status} ${response.statusText}`)
      return null
    }

    const data = await response.json()
    const match = data.response?.find((m: any) => {
      const home = m.teams.home.name.toLowerCase()
      const away = m.teams.away.name.toLowerCase()
      return (
        (home.includes(homeTeam.toLowerCase()) || homeTeam.toLowerCase().includes(home)) &&
        (away.includes(awayTeam.toLowerCase()) || awayTeam.toLowerCase().includes(away))
      )
    })

    if (match && match.goals) {
      return {
        home: match.goals.home,
        away: match.goals.away
      }
    }

    return null
  } catch (error) {
    console.warn('API-Football fallback failed:', error)
    return null
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
    const scoreUpdated: string[] = []
    let updatedCount = 0
    let notFoundCount = 0
    const fallbackApiKey = Deno.env.get('API_FOOTBALL_KEY')

    for (const apiMatch of apiMatches) {
      const homeTeamPt = mapTeamName(apiMatch.homeTeam?.shortName || apiMatch.homeTeam?.name || 'TBD')
      const awayTeamPt = mapTeamName(apiMatch.awayTeam?.shortName || apiMatch.awayTeam?.name || 'TBD')
      const kickoffAt = apiMatch.utcDate
      const status = mapStatus(apiMatch.status)
      let homeScore = apiMatch.score?.fullTime?.home ?? null
      let awayScore = apiMatch.score?.fullTime?.away ?? null

      // Fallback: se status é FINISHED mas placar está null, tentar API-Football
      if (status === 'finished' && (homeScore === null || awayScore === null) && fallbackApiKey) {
        console.log(`Score missing for ${homeTeamPt} vs ${awayTeamPt}, trying fallback API...`)
        const matchDate = kickoffAt.split('T')[0]
        const fallbackScore = await fetchScoreFromFallbackApi(
          fallbackApiKey,
          matchDate,
          apiMatch.homeTeam?.name || homeTeamPt,
          apiMatch.awayTeam?.name || awayTeamPt
        )
        if (fallbackScore) {
          homeScore = fallbackScore.home
          awayScore = fallbackScore.away
          console.log(`Fallback score found: ${homeScore} x ${awayScore}`)
        }
      }

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
      const scoreChanged = seedMatch.home_score !== homeScore || seedMatch.away_score !== awayScore

      if (!wasFinished && isNowFinished) {
        newlyFinished.push(seedMatch.id)
      } else if (wasFinished && isNowFinished && scoreChanged && homeScore !== null && awayScore !== null) {
        // Partida já estava finalizada mas o placar foi atualizado
        scoreUpdated.push(seedMatch.id)
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
    console.log(`Score updated: ${scoreUpdated.length}`)

    // Combinar partidas recém-finalizadas com partidas que tiveram placar atualizado
    const matchesToProcess = [...newlyFinished, ...scoreUpdated]

    let totalPredictionsUpdated = 0

    for (const matchId of matchesToProcess) {
      const seedMatch = seedMatches.find(s => s.id === matchId)
      if (!seedMatch) continue

      // Buscar placar atualizado do banco (pode ter sido atualizado pelo fallback)
      const { data: updatedMatch, error: matchError } = await supabase
        .from('matches')
        .select('home_score, away_score')
        .eq('id', matchId)
        .single()

      if (matchError || !updatedMatch || updatedMatch.home_score === null || updatedMatch.away_score === null) {
        console.log(`No score available for match ${matchId}, skipping predictions`)
        continue
      }

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
          { home: updatedMatch.home_score, away: updatedMatch.away_score }
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

      // Só enviar notificação para partidas recém-finalizadas (não para placar atualizado)
      if (newlyFinished.includes(matchId)) {
        triggerPostMatchNotification(supabaseUrl, supabaseServiceRoleKey, {
          id: matchId,
          home_team: seedMatch.home_team,
          away_team: seedMatch.away_team,
          home_score: updatedMatch.home_score,
          away_score: updatedMatch.away_score,
        })
      }
    }

    console.log(`Total predictions updated: ${totalPredictionsUpdated}`)

    return new Response(
      JSON.stringify({
        success: true,
        matchesUpdated: updatedCount,
        matchesNotFound: notFoundCount,
        newlyFinished: newlyFinished.length,
        newlyFinishedIds: newlyFinished,
        scoreUpdated: scoreUpdated.length,
        scoreUpdatedIds: scoreUpdated,
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
