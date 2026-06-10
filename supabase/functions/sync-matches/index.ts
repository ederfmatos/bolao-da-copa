import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { fetchWithFallback, defaultChain } from './providers/index.ts'

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

serve(async (req) => {
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

    return new Response(
      JSON.stringify({
        success: true,
        matchesUpserted: matches.length,
        newlyFinished: newlyFinished.length,
        newlyFinishedIds: newlyFinished,
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
})
