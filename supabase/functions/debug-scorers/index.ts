import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const updates: Array<{ slot: string; home: string; away: string }> = [
    { slot: 'R32_04', home: 'Países Baixos', away: 'Marrocos' },
    { slot: 'R32_09', home: 'Brasil', away: 'Japão' },
    { slot: 'R32_10', home: 'Costa do Marfim', away: 'TBD' },
  ]

  const results: Record<string, unknown> = {}

  for (const u of updates) {
    const { error } = await supabase
      .from('matches')
      .update({ home_team: u.home, away_team: u.away })
      .eq('bracket_slot', u.slot)
    results[u.slot] = error ?? 'ok'
  }

  const { data: check } = await supabase
    .from('matches')
    .select('bracket_slot, home_team, away_team')
    .like('bracket_slot', 'R32_%')
    .order('bracket_slot')

  return new Response(JSON.stringify({ results, check }, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  })
})
