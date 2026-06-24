import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async () => {
  const fdKey = Deno.env.get('FOOTBALL_DATA_API_KEY')!
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceKey)

  // 1. Fetch API
  const fdRes = await fetch('https://api.football-data.org/v4/competitions/WC/scorers', {
    headers: { 'X-Auth-Token': fdKey }
  })
  const fdData = await fdRes.json()
  const apiPlayers = (fdData.scorers ?? []).map((s: any) => ({
    id: s.player.id,
    name: s.player.name,
    goals: s.goals ?? 0,
  }))

  // 2. Fetch DB players
  const { data: dbPlayers, error: dbError } = await supabase
    .from('scorer_players')
    .select('id, name, football_data_id, api_sports_id, goals')

  // 3. Build updates
  const apiMap = new Map(apiPlayers.map((p: any) => [p.id, p]))
  const normalize = (n: string) => n.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
  const nameMap = new Map(apiPlayers.map((p: any) => [normalize(p.name), p]))

  const updates: any[] = []
  const noMatch: string[] = []

  for (const sp of dbPlayers ?? []) {
    let apiPlayer = apiMap.get(sp.football_data_id) ?? apiMap.get(sp.api_sports_id)
    if (!apiPlayer && sp.football_data_id == null && sp.api_sports_id == null) {
      apiPlayer = nameMap.get(normalize(sp.name))
    }
    if (apiPlayer) {
      updates.push({ id: sp.id, name: sp.name, goals: apiPlayer.goals, football_data_id: apiPlayer.id })
    } else {
      noMatch.push(sp.name)
    }
  }

  // 4. Run upsert
  let upsertResult = null
  if (updates.length > 0) {
    const { error } = await supabase.from('scorer_players').upsert(updates)
    upsertResult = error ? { error: error.message, details: error.details } : { success: true, count: updates.length }
  }

  // 5. Verify DB after upsert
  const { data: afterUpdate } = await supabase
    .from('scorer_players')
    .select('name, goals, football_data_id')
    .order('goals', { ascending: false })
    .limit(15)

  return new Response(JSON.stringify({
    apiPlayerCount: apiPlayers.length,
    apiPlayers,
    dbPlayerCount: dbPlayers?.length,
    updatesBuilt: updates.length,
    updates,
    noMatch,
    upsertResult,
    dbError: dbError?.message,
    afterUpdate,
  }, null, 2), { headers: { 'Content-Type': 'application/json' } })
})
