import { serve } from './serve.ts'
import { createClient } from './supabaseClient.ts'
import { calculatePoints } from '../_shared/calculatePoints.ts'
import { calculateBonusPoints } from '../_shared/calculateBonusPoints.ts'
import { mapTeamName } from './teamMapping.ts'
import { PHASE_MAP } from '../_shared/phaseMapping.ts'
import { calculateBracketPoints } from '../_shared/calculateBracketPoints.ts'
import { BRACKET_SLOTS, BRACKET_PARENTS, BracketSlot } from '../_shared/bracketSlots.ts'

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

function getKnockoutBracketSlot(stage: string, matchNumber: number): BracketSlot | null {
  // Map API stage/stage names to bracket slot
  // matchNumber is 1-indexed (1, 2, 3, ...)

  switch (stage) {
    case 'LAST_32':
      // Round of 32 (16 Avos): 16 matches
      if (matchNumber >= 1 && matchNumber <= 16) {
        return (`R32_${matchNumber.toString().padStart(2, '0')}` as BracketSlot)
      }
      break
    case 'LAST_16':
      // Round of 16 (Oitavas): 8 matches
      if (matchNumber >= 1 && matchNumber <= 8) {
        return (`R16_${matchNumber.toString().padStart(2, '0')}` as BracketSlot)
      }
      break
    case 'QUARTER_FINALS':
      // Quarter-finals (Quartas): 4 matches
      if (matchNumber >= 1 && matchNumber <= 4) {
        return (`QF_${matchNumber.toString().padStart(2, '0')}` as BracketSlot)
      }
      break
    case 'SEMI_FINALS':
      // Semi-finals (Semifinais): 2 matches
      if (matchNumber >= 1 && matchNumber <= 2) {
        return (`SF_${matchNumber.toString().padStart(2, '0')}` as BracketSlot)
      }
      break
    case 'THIRD_PLACE':
      // Third place: 1 match
      if (matchNumber === 1) {
        return '3RD'
      }
      break
    case 'FINAL':
      // Final: 1 match
      if (matchNumber === 1) {
        return 'FINAL'
      }
      break
  }

  return null
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

export async function recalculateBracketPoints(
  supabase: ReturnType<typeof createClient>,
  bracketSlot: BracketSlot,
  actualWinner: string,
  actualOpponent: string,
): Promise<void> {
  try {
    // Fetch all bracket_predictions for this slot
    const { data: predictions, error: fetchError } = await supabase
      .from('bracket_predictions')
      .select('id, user_id, predicted_winner')
      .eq('bracket_slot', bracketSlot)

    if (fetchError) {
      console.error(JSON.stringify({
        event: 'bracket_points_recalculation_failed',
        bracket_slot: bracketSlot,
        error: fetchError.message,
      }))
      return
    }

    if (!predictions || predictions.length === 0) {
      console.log(JSON.stringify({
        event: 'bracket_points_recalculated',
        bracket_slot: bracketSlot,
        users_updated: 0,
      }))
      return
    }

    // Determine parent slots to get opponent predictions
    const parents = BRACKET_PARENTS[bracketSlot]
    // Map: user_id -> { parent1Winner, parent2Winner }
    const userParentPredictions: Record<string, { parent1: string; parent2: string }> = {}

    if (parents) {
      // Fetch all predictions for parent slots for all users who predicted this slot
      const { data: parentPredictions, error: parentError } = await supabase
        .from('bracket_predictions')
        .select('user_id, bracket_slot, predicted_winner')
        .in('bracket_slot', parents)
        .in('user_id', predictions.map(p => p.user_id))

      if (parentError) {
        console.error(JSON.stringify({
          event: 'bracket_points_recalculation_failed',
          bracket_slot: bracketSlot,
          error: parentError.message,
        }))
        return
      }

      // Build map of user_id -> { parent1Winner, parent2Winner }
      for (const parentPred of parentPredictions || []) {
        const key = `${parentPred.user_id}`
        if (!userParentPredictions[key]) {
          userParentPredictions[key] = { parent1: '', parent2: '' }
        }
        if (parentPred.bracket_slot === parents[0]) {
          userParentPredictions[key].parent1 = parentPred.predicted_winner
        } else if (parentPred.bracket_slot === parents[1]) {
          userParentPredictions[key].parent2 = parentPred.predicted_winner
        }
      }
    }

    let updatedCount = 0

    for (const pred of predictions) {
      const parentPreds = userParentPredictions[pred.user_id]
      let userPredictedOpponent = ''

      if (parentPreds && bracketSlot === '3RD') {
        // For 3RD place: participants are the LOSERS of the semi-finals
        // The user's predicted opponent in 3RD is the team they predicted would
        // lose the OTHER semi-final (the one whose winner they didn't pick for 3RD)
        // Since both SF losers go to 3RD, the opponent is whichever parent winner
        // is NOT the user's predicted winner for this slot
        if (pred.predicted_winner === parentPreds.parent1) {
          userPredictedOpponent = parentPreds.parent2
        } else if (pred.predicted_winner === parentPreds.parent2) {
          userPredictedOpponent = parentPreds.parent1
        } else {
          // User predicted a team that didn't come from either parent
          // (shouldn't happen in valid bracket, but handle gracefully)
          userPredictedOpponent = parentPreds.parent1 || parentPreds.parent2 || ''
        }
      } else if (parentPreds) {
        // For normal slots: the opponent is whichever parent winner
        // is NOT the user's predicted winner for this slot
        if (pred.predicted_winner === parentPreds.parent1) {
          userPredictedOpponent = parentPreds.parent2
        } else if (pred.predicted_winner === parentPreds.parent2) {
          userPredictedOpponent = parentPreds.parent1
        } else {
          // User predicted a team that didn't come from either parent
          // (invalid bracket state, but handle gracefully)
          userPredictedOpponent = parentPreds.parent1 || parentPreds.parent2 || ''
        }
      }

      const points = calculateBracketPoints({
        slot: bracketSlot,
        actualWinner,
        actualOpponent,
        userPredictedWinner: pred.predicted_winner,
        userPredictedOpponent,
      })

      const { error: updateError } = await supabase
        .from('bracket_predictions')
        .update({ bracket_points: points })
        .eq('id', pred.id)

      if (updateError) {
        console.error(JSON.stringify({
          event: 'bracket_points_update_failed',
          prediction_id: pred.id,
          error: updateError.message,
        }))
      } else {
        updatedCount++
      }
    }

    console.log(JSON.stringify({
      event: 'bracket_points_recalculated',
      bracket_slot: bracketSlot,
      actual_winner: actualWinner,
      actual_opponent: actualOpponent,
      users_updated: updatedCount,
    }))
  } catch (error) {
    console.error(JSON.stringify({
      event: 'bracket_points_recalculation_failed',
      bracket_slot: bracketSlot,
      error: error instanceof Error ? error.message : 'Unknown error',
    }))
  }
}

const SCORER_POINTS = 20

function normalizePlayerName(name: string): string {
  return name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

export async function updateScorerGoals(
  supabase: ReturnType<typeof createClient>,
  apiKey: string,
  fallbackApiKey?: string,
): Promise<void> {
  try {
    let players: Array<{ id: number; name: string; goals: number }> = []
    let apiSource: 'football_data' | 'api_sports' = 'football_data'

    const response = await fetch('https://api.football-data.org/v4/competitions/WC/scorers', {
      headers: { 'X-Auth-Token': apiKey },
    })

    if (response.ok) {
      const data = await response.json()
      if (data.scorers?.length > 0) {
        players = data.scorers.map((s: any) => ({
          id: s.player.id,
          name: s.player.name ?? '',
          goals: s.goals ?? 0,
        }))
        apiSource = 'football_data'
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
            name: s.player.name ?? '',
            goals: s.statistics?.[0]?.goals?.total ?? 0,
          }))
          apiSource = 'api_sports'
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
      .select('id, name, football_data_id, api_sports_id')

    if (fetchError) {
      console.error(JSON.stringify({
        event: 'scorer_goals_update_failed',
        error: fetchError.message,
        timestamp: new Date().toISOString(),
      }))
      return
    }

    // Mapa por ID (comportamento original)
    const apiPlayerMap = new Map<number, number>()
    for (const p of players) {
      apiPlayerMap.set(p.id, p.goals)
    }

    // Mapa por nome normalizado para fallback quando IDs estão NULL
    const apiPlayerNameMap = new Map<string, { apiId: number; goals: number }>()
    for (const p of players) {
      apiPlayerNameMap.set(normalizePlayerName(p.name), { apiId: p.id, goals: p.goals })
    }

    type PlayerUpdate = { id: string; goals: number; football_data_id?: number; api_sports_id?: number }
    const updates: PlayerUpdate[] = []

    for (const sp of scorerPlayers || []) {
      let goals = apiPlayerMap.get(sp.football_data_id) ?? apiPlayerMap.get(sp.api_sports_id)
      let discoveredId: Partial<PlayerUpdate> = {}

      // Fallback por nome quando ambos os IDs estão ausentes
      if (goals === undefined && sp.football_data_id == null && sp.api_sports_id == null) {
        const match = apiPlayerNameMap.get(normalizePlayerName(sp.name))
        if (match !== undefined) {
          goals = match.goals
          // Persiste o ID descoberto para execuções futuras
          if (apiSource === 'football_data') discoveredId = { football_data_id: match.apiId }
          else discoveredId = { api_sports_id: match.apiId }
        }
      }

      if (goals !== undefined) {
        updates.push({ id: sp.id, goals, ...discoveredId })
      }
    }

    for (const update of updates) {
      const patch: Record<string, any> = { goals: update.goals }
      if (update.football_data_id != null) patch.football_data_id = update.football_data_id
      if (update.api_sports_id != null) patch.api_sports_id = update.api_sports_id
      const { error: updateError } = await supabase
        .from('scorer_players')
        .update(patch)
        .eq('id', update.id)
      if (updateError) {
        console.error(JSON.stringify({
          event: 'scorer_goals_update_failed',
          error: updateError.message,
          player_id: update.id,
          timestamp: new Date().toISOString(),
        }))
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
    const knockoutMatchesBySlot: Map<BracketSlot, { match_id: string; home_team: string; away_team: string; home_score: number | null; away_score: number | null; winner_team: string | null }> = new Map()
    let updatedCount = 0
    let notFoundCount = 0
    const fallbackApiKey = Deno.env.get('API_FOOTBALL_KEY')

    // Track match number per stage for bracket slot assignment
    const stageMatchCounts: Record<string, number> = {}

    for (const apiMatch of apiMatches) {
      const homeTeamPt = mapTeamName(apiMatch.homeTeam?.shortName || apiMatch.homeTeam?.name || 'TBD')
      const awayTeamPt = mapTeamName(apiMatch.awayTeam?.shortName || apiMatch.awayTeam?.name || 'TBD')
      const kickoffAt = apiMatch.utcDate
      const status = mapStatus(apiMatch.status)
      const duration = apiMatch.score?.duration
      let homeScore: number | null
      let awayScore: number | null
      if (duration === 'PENALTY_SHOOTOUT' || duration === 'EXTRA_TIME') {
        homeScore = apiMatch.score?.extraTime?.home ?? apiMatch.score?.fullTime?.home ?? null
        awayScore = apiMatch.score?.extraTime?.away ?? apiMatch.score?.fullTime?.away ?? null
      } else {
        homeScore = apiMatch.score?.fullTime?.home ?? null
        awayScore = apiMatch.score?.fullTime?.away ?? null
      }
      let winnerTeam: string | null = null
      if (duration === 'PENALTY_SHOOTOUT' && apiMatch.score?.winner) {
        winnerTeam = apiMatch.score.winner === 'HOME_TEAM' ? homeTeamPt : awayTeamPt
      }

      // Extract stage and determine group_name + bracket_slot
      const apiStage = apiMatch.stage || apiMatch.round
      let groupName = null
      let bracketSlot: BracketSlot | null = null

      if (apiStage && PHASE_MAP[apiStage]) {
        groupName = PHASE_MAP[apiStage]
        // Increment match counter for this stage to determine match number
        stageMatchCounts[apiStage] = (stageMatchCounts[apiStage] || 0) + 1
        const matchNumber = stageMatchCounts[apiStage]
        bracketSlot = getKnockoutBracketSlot(apiStage, matchNumber)
      }

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
        // Para partidas de mata-mata com bracket_slot, inserir no banco se ainda não existir
        if (bracketSlot) {
          const { data: existing } = await supabase
            .from('matches')
            .select('id')
            .eq('bracket_slot', bracketSlot)
            .maybeSingle()

          if (!existing) {
            const insertData: Record<string, any> = {
              id: String(apiMatch.id),
              home_team: homeTeamPt,
              away_team: awayTeamPt,
              kickoff_at: kickoffAt,
              status,
              group_name: groupName,
              bracket_slot: bracketSlot,
              ...(homeScore !== null && { home_score: homeScore }),
              ...(awayScore !== null && { away_score: awayScore }),
            }
            const { error: insertError } = await supabase.from('matches').insert(insertData)
            if (insertError) {
              console.error(`Error inserting knockout match ${bracketSlot}:`, insertError)
            } else {
              updatedCount++
              console.log(JSON.stringify({ event: 'knockout_match_created', bracket_slot: bracketSlot, home_team: homeTeamPt, away_team: awayTeamPt }))
            }
          }
        } else {
          console.warn(`Could not find seed match for: ${homeTeamPt} vs ${awayTeamPt} at ${kickoffAt}`)
          notFoundCount++
        }
        continue
      }

      const wasFinished = seedMatch.status === 'finished'
      const isNowFinished = status === 'finished'
      const scoreChanged = seedMatch.home_score !== homeScore || seedMatch.away_score !== awayScore

      if (!wasFinished && isNowFinished) {
        newlyFinished.push(seedMatch.id)
        // Track bracket matches for recalculation
        if (bracketSlot) {
          knockoutMatchesBySlot.set(bracketSlot, {
            match_id: seedMatch.id,
            home_team: homeTeamPt,
            away_team: awayTeamPt,
            home_score: homeScore,
            away_score: awayScore,
            winner_team: winnerTeam,
          })
        }
      } else if (wasFinished && isNowFinished && scoreChanged && homeScore !== null && awayScore !== null) {
        // Partida já estava finalizada mas o placar foi atualizado
        scoreUpdated.push(seedMatch.id)
        if (bracketSlot) {
          knockoutMatchesBySlot.set(bracketSlot, {
            match_id: seedMatch.id,
            home_team: homeTeamPt,
            away_team: awayTeamPt,
            home_score: homeScore,
            away_score: awayScore,
            winner_team: winnerTeam,
          })
        }
      }

      // Atualizar a partida — só sobrescrever placar se API retornou valor válido
      const updateData: Record<string, any> = {
        status: status,
        ...(homeScore !== null && { home_score: homeScore }),
        ...(awayScore !== null && { away_score: awayScore }),
        ...(winnerTeam !== null && { winner_team: winnerTeam }),
      }

      // Add group_name and bracket_slot if knockout match
      if (groupName) {
        updateData.group_name = groupName
      }
      if (bracketSlot && !seedMatch.bracket_slot) {
        updateData.bracket_slot = bracketSlot
      }

      const { error: updateError } = await supabase
        .from('matches')
        .update(updateData)
        .eq('id', seedMatch.id)

      if (updateError) {
        console.error(`Error updating match ${seedMatch.id}:`, updateError)
      } else {
        updatedCount++
        // Log knockout match sync
        if (bracketSlot) {
          console.log(JSON.stringify({
            event: 'knockout_match_synced',
            match_id: seedMatch.id,
            bracket_slot: bracketSlot,
            group_name: groupName,
          }))
        }
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
        await triggerPostMatchNotification(supabaseUrl, supabaseServiceRoleKey, {
          id: matchId,
          home_team: seedMatch.home_team,
          away_team: seedMatch.away_team,
          home_score: updatedMatch.home_score,
          away_score: updatedMatch.away_score,
        })
        // Marcar como notificado para evitar reenvio pelo check-finished-matches
        await supabase
          .from('matches')
          .update({ post_match_notified_at: new Date().toISOString() })
          .eq('id', matchId)
      }
    }

    console.log(`Total predictions updated: ${totalPredictionsUpdated}`)

    // Process bracket points for knockout matches that just finished or had scores updated
    for (const [bracketSlot, matchInfo] of knockoutMatchesBySlot.entries()) {
      if (matchInfo.home_score === null || matchInfo.away_score === null) continue
      let actualWinner: string
      let actualOpponent: string
      if (matchInfo.winner_team) {
        actualWinner = matchInfo.winner_team
        actualOpponent = matchInfo.winner_team === matchInfo.home_team ? matchInfo.away_team : matchInfo.home_team
      } else if (matchInfo.home_score > matchInfo.away_score) {
        actualWinner = matchInfo.home_team
        actualOpponent = matchInfo.away_team
      } else {
        actualWinner = matchInfo.away_team
        actualOpponent = matchInfo.home_team
      }
      await recalculateBracketPoints(supabase, bracketSlot, actualWinner, actualOpponent)
    }

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
