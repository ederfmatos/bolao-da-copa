import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { calculatePoints } from '../_shared/calculatePoints.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Buscar todas as partidas finalizadas
    const { data: finishedMatches, error: matchesError } = await supabase
      .from('matches')
      .select('id, home_team, away_team, home_score, away_score, status')
      .eq('status', 'finished')
      .not('home_score', 'is', null)
      .not('away_score', 'is', null)

    if (matchesError) {
      console.error('Error fetching finished matches:', matchesError)
      return new Response(JSON.stringify({ error: matchesError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!finishedMatches || finishedMatches.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No finished matches found',
        matchesProcessed: 0,
        predictionsUpdated: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Found ${finishedMatches.length} finished matches`)

    let totalMatchesProcessed = 0
    let totalPredictionsUpdated = 0

    for (const match of finishedMatches) {
      console.log(`Processing match ${match.id}: ${match.home_team} ${match.home_score} x ${match.away_score} ${match.away_team}`)

      // Buscar todos os palpites para esta partida
      const { data: predictions, error: predictionsError } = await supabase
        .from('predictions')
        .select('id, user_id, home_score, away_score, points')
        .eq('match_id', match.id)

      if (predictionsError) {
        console.error(`Error fetching predictions for match ${match.id}:`, predictionsError)
        continue
      }

      if (!predictions || predictions.length === 0) {
        console.log(`No predictions for match ${match.id}`)
        continue
      }

      console.log(`Found ${predictions.length} predictions for match ${match.id}`)

      let matchPredictionsUpdated = 0

      for (const prediction of predictions) {
        // Calcular pontos corretos
        const correctPoints = calculatePoints(
          { home: prediction.home_score, away: prediction.away_score },
          { home: match.home_score!, away: match.away_score! }
        )

        // Verificar se precisa atualizar
        if (prediction.points !== correctPoints) {
          console.log(`Updating prediction ${prediction.id}: ${prediction.points} -> ${correctPoints} points`)

          const { error: updateError } = await supabase
            .from('predictions')
            .update({ points: correctPoints })
            .eq('id', prediction.id)

          if (updateError) {
            console.error(`Error updating prediction ${prediction.id}:`, updateError)
          } else {
            matchPredictionsUpdated++
            totalPredictionsUpdated++
          }
        }
      }

      console.log(`Updated ${matchPredictionsUpdated} predictions for match ${match.id}`)
      totalMatchesProcessed++
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Points recalculated successfully',
      matchesProcessed: totalMatchesProcessed,
      predictionsUpdated: totalPredictionsUpdated
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('recalculate-points error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
