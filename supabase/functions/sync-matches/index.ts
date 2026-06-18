import { serve } from './serve.ts'
import { createClient } from './supabaseClient.ts'
import { calculatePoints } from '../_shared/calculatePoints.ts'
import { calculateBonusPoints } from '../_shared/calculateBonusPoints.ts'
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

export async function recalculateBonusPoints(
  supabase: ReturnType<typeof createClient>
): Promise<void> {
  const { data: keyMatches, error: matchError } = await supabase
    .from('matches')
    .select('group_name, home_team, away_team, home_score, away_score, status')
    .in('group_name', ['Final', 'Terceiro Lugar'])

  if (matchError) {
    console.error(JSON.stringify({
      event: 'bonus_points_recalculation_failed',
      error: matchError.message,
    }))
    return
  }

  const standings: { first?: string; second?: string; third?: string; fourth?: string } = {}

  const finalMatch = keyMatches?.find((m: any) => m.group_name === 'Final')
  if (finalMatch?.status === 'finished' && finalMatch.home_score != null && finalMatch.away_score != null) {
    if (finalMatch.home_score > finalMatch.away_score) {
      standings.first = finalMatch.home_team
      standings.second = finalMatch.away_team
    } else {
      standings.first = finalMatch.away_team
      standings.second = finalMatch.home_team
    }
  }

  const thirdMatch = keyMatches?.find((m: any) => m.group_name === 'Terceiro Lugar')
  if (thirdMatch?.status === 'finished' && thirdMatch.home_score != null && thirdMatch.away_score != null) {
    if (thirdMatch.home_score > thirdMatch.away_score) {
      standings.third = thirdMatch.home_team
      standings.fourth = thirdMatch.away_team
    } else {
      standings.third = thirdMatch.away_team
      standings.fourth = thirdMatch.home_team
    }
  }

  const { data: bonusPredictions, error: fetchError } = await supabase
    .from('bonus_predictions')
    .select('id, first_place, second_place, third_place, fourth_place')

  if (fetchError) {
    console.error(JSON.stringify({
      event: 'bonus_points_fetch_failed',
      error: fetchError.message,
    }))
    return
  }

  let updatedCount = 0

  for (const row of bonusPredictions || []) {
    const bonusPoints = calculateBonusPoints(
      {
        first_place: row.first_place,
        second_place: row.second_place,
        third_place: row.third_place,
        fourth_place: row.fourth_place,
      },
      standings,
    )

    const { error: updateError } = await supabase
      .from('bonus_predictions')
      .update({ bonus_points: bonusPoints })
      .eq('id', row.id)

    if (updateError) {
      console.error(`Error updating bonus_prediction ${row.id}:`, updateError)
    } else {
      updatedCount++
    }
  }

  console.log(JSON.stringify({
    event: 'bonus_points_recalculated',
    updated_count: updatedCount,
    standings,
  }))
}

const SCORER_POINTS = 20

export async function updateScorerGoals(
  supabase: ReturnType<typeof createClient>,
  apiKey: string,
  fallbackApiKey?: string,
): Promise<void> {
  try {
    let players: Array<{ id: number; goals: number }> = []

    const response = await fetch('https://api.football-data.org/v4/competitions/WC/scorers', {
      headers: { 'X-Auth-Token': apiKey },
    })

    if (response.ok) {
      const data = await response.json()
      if (data.scorers?.length > 0) {
        players = data.scorers.map((s: any) => ({
          id: s.player.id,
          goals: s.goals ?? 0,
        }))
      }
    }

    if (players.length === 0 && fallbackApiKey) {
      const fallbackResponse = await fetch(
        'https://v3.football.api-sports.io/players/topscorers?league=1&season=2026',
        { headers: { 'x-apisports-key': fallbackApiKey } },
      )

      if (fallbackResponse.ok) {
        const data = await fallbackResponse.json()
        if (data.response?.length > 0) {
          players = data.response.map((s: any) => ({
            id: s.player.id,
            goals: s.statistics?.[0]?.goals?.total ?? 0,
          }))
        }
      }
    }

    if (players.length === 0) {
      console.error(JSON.stringify({
        event: 'scorer_goals_update_failed',
        error: 'Both APIs returned empty or failed',
        timestamp: new Date().toISOString(),
      }))
      return
    }

    const { data: scorerPlayers, error: fetchError } = await supabase
      .from('scorer_players')
      .select('id, football_data_id, api_sports_id')

    if (fetchError) {
      console.error(JSON.stringify({
        event: 'scorer_goals_update_failed',
        error: fetchError.message,
        timestamp: new Date().toISOString(),
      }))
      return
    }

    const apiPlayerMap = new Map<number, number>()
    for (const p of players) {
      apiPlayerMap.set(p.id, p.goals)
    }

    const updates: Array<{ id: string; goals: number }> = []
    for (const sp of scorerPlayers || []) {
      const goals = apiPlayerMap.get(sp.football_data_id) ?? apiPlayerMap.get(sp.api_sports_id)
      if (goals !== undefined) {
        updates.push({ id: sp.id, goals })
      }
    }

    if (updates.length > 0) {
      const { error: upsertError } = await supabase
        .from('scorer_players')
        .upsert(updates)

      if (upsertError) {
        console.error(JSON.stringify({
          event: 'scorer_goals_update_failed',
          error: upsertError.message,
          timestamp: new Date().toISOString(),
        }))
        return
      }
    }

    console.log(JSON.stringify({
      event: 'scorer_goals_updated',
      player_count: updates.length,
      timestamp: new Date().toISOString(),
    }))
  } catch (error) {
    console.error(JSON.stringify({
      event: 'scorer_goals_update_failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }))
  }
}

export async function recalculateScorerPoints(
  supabase: ReturnType<typeof createClient>,
): Promise<void> {
  try {
    const { data: players, error: playersError } = await supabase
      .from('scorer_players')
      .select('id, name, goals')

    if (playersError) {
      console.error(JSON.stringify({
        event: 'scorer_points_recalculation_failed',
        error: playersError.message,
      }))
      return
    }

    if (!players || players.length === 0) {
      console.log(JSON.stringify({
        event: 'scorer_points_recalculated',
        warning: 'No scorer_players found',
        user_count: 0,
      }))
      return
    }

    const allZero = players.every((p: any) => !p.goals || p.goals === 0)
    if (allZero) {
      console.log(JSON.stringify({
        event: 'scorer_points_recalculated',
        warning: 'No scorer_players have goals > 0',
        user_count: 0,
      }))
      return
    }

    const maxGoals = Math.max(...players.map((p: any) => p.goals || 0))
    const topScorers = players.filter((p: any) => (p.goals || 0) === maxGoals)
    const topScorerIds = topScorers.map((p: any) => p.id)

    const { data: predictions, error: predictionsError } = await supabase
      .from('scorer_predictions')
      .select('id, player_id')

    if (predictionsError) {
      console.error(JSON.stringify({
        event: 'scorer_points_recalculation_failed',
        error: predictionsError.message,
      }))
      return
    }

    let awardedCount = 0
    for (const pred of predictions || []) {
      const points = topScorerIds.includes(pred.player_id) ? SCORER_POINTS : 0
      const { error: updateError } = await supabase
        .from('scorer_predictions')
        .update({ scorer_points: points })
        .eq('id', pred.id)

      if (updateError) {
        console.error(`Error updating scorer_prediction ${pred.id}:`, updateError)
      } else if (points > 0) {
        awardedCount++
      }
    }

    console.log(JSON.stringify({
      event: 'scorer_points_recalculated',
      winner_players: topScorers.map((p: any) => p.name),
      winner_goals: maxGoals,
      user_count: awardedCount,
    }))
  } catch (error) {
    console.error(JSON.stringify({
      event: 'scorer_points_recalculation_failed',
      error: error instanceof Error ? error.message : 'Unknown error',
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

      // Atualizar a partida — só sobrescrever placar se API retornou valor válido
      const { error: updateError } = await supabase
        .from('matches')
        .update({
          status: status,
          ...(homeScore !== null && { home_score: homeScore }),
          ...(awayScore !== null && { away_score: awayScore }),
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

    const triggerMatchIds = [...newlyFinished, ...scoreUpdated]
    const bonusTriggered = (seedMatches || []).some(
      (m: any) => triggerMatchIds.includes(m.id) &&
        (m.group_name === 'Final' || m.group_name === 'Terceiro Lugar'),
    )

    if (bonusTriggered) {
      await recalculateBonusPoints(supabase)
    }

    await updateScorerGoals(supabase, apiKey, fallbackApiKey)

    if (bonusTriggered) {
      await recalculateScorerPoints(supabase)
    }

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
