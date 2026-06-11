import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    // Buscar jogos finalizados que ainda não foram notificados
    const { data: matches, error } = await supabase
      .from('matches')
      .select('id, home_team, away_team, home_score, away_score')
      .eq('status', 'finished')
      .is('post_match_notified_at', null)
      .not('home_score', 'is', null)
      .not('away_score', 'is', null)

    if (error) {
      console.error('Error fetching matches:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!matches || matches.length === 0) {
      console.log('No finished matches to notify')
      return new Response(JSON.stringify({ 
        success: true, 
        notified: 0,
        message: 'No finished matches to notify'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Found ${matches.length} finished matches to notify`)

    let notified = 0
    let failed = 0

    for (const match of matches) {
      try {
        // Enviar notificação
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
          console.error(`Failed to notify match ${match.id}:`, errorBody)
          failed++
          continue
        }

        // Marcar como notificado
        const { error: updateError } = await supabase
          .from('matches')
          .update({ post_match_notified_at: new Date().toISOString() })
          .eq('id', match.id)

        if (updateError) {
          console.error(`Failed to update match ${match.id}:`, updateError)
          failed++
        } else {
          console.log(`Notified match ${match.id}: ${match.home_team} ${match.home_score} x ${match.away_score} ${match.away_team}`)
          notified++
        }
      } catch (err) {
        console.error(`Error processing match ${match.id}:`, err)
        failed++
      }
    }

    return new Response(JSON.stringify({
      success: true,
      notified,
      failed,
      total: matches.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('check-finished-matches error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
