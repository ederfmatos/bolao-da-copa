/**
 * Integration tests for migration 0038: leaderboard view with bracket_points.
 *
 * Requires a real Supabase instance. Set these env vars before running:
 *
 *   VITE_SUPABASE_URL         — already in your .env
 *   VITE_SUPABASE_ANON_KEY    — already in your .env
 *   SUPABASE_SERVICE_ROLE_KEY — add to .env.test.local (never commit this)
 *
 * Run:
 *   npx vitest run --config vitest.integration.config.js
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const hasCredentials = !!(SUPABASE_URL && SUPABASE_ANON_KEY && SERVICE_ROLE_KEY)

describe.skipIf(!hasCredentials)(
  '0038 leaderboard_bracket integration',
  () => {
    let service
    let userA
    let testUserIdA
    let testUserIdB

    const testEmailA = `bolao-lb-a-${Date.now()}@test.invalid`
    const testEmailB = `bolao-lb-b-${Date.now()}@test.invalid`
    const testPassword = 'BolaoTest@9999'

    beforeAll(async () => {
      service = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

      // Create two ephemeral test users via admin API
      const { data: userAData, error: createErrA } = await service.auth.admin.createUser({
        email: testEmailA,
        password: testPassword,
        email_confirm: true,
      })
      if (createErrA) throw new Error(`Could not create user A: ${createErrA.message}`)
      testUserIdA = userAData.user.id

      const { data: userBData, error: createErrB } = await service.auth.admin.createUser({
        email: testEmailB,
        password: testPassword,
        email_confirm: true,
      })
      if (createErrB) throw new Error(`Could not create user B: ${createErrB.message}`)
      testUserIdB = userBData.user.id

      // Create profiles
      const { error: profileErrA } = await service
        .from('profiles')
        .insert({ id: testUserIdA, name: 'Leaderboard Test User A' })
      if (profileErrA) throw new Error(`Could not create profile A: ${profileErrA.message}`)

      const { error: profileErrB } = await service
        .from('profiles')
        .insert({ id: testUserIdB, name: 'Leaderboard Test User B' })
      if (profileErrB) throw new Error(`Could not create profile B: ${profileErrB.message}`)

      // Sign in as user A
      userA = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
      const { error: signInErrA } = await userA.auth.signInWithPassword({
        email: testEmailA,
        password: testPassword,
      })
      if (signInErrA) throw new Error(`Could not sign in user A: ${signInErrA.message}`)
    })

    afterAll(async () => {
      if (!service) return

      // Clean up in reverse FK order
      await service.from('bracket_predictions').delete().eq('user_id', testUserIdA)
      await service.from('bracket_predictions').delete().eq('user_id', testUserIdB)
      await service.from('scorer_predictions').delete().eq('user_id', testUserIdA)
      await service.from('scorer_predictions').delete().eq('user_id', testUserIdB)
      await service.from('predictions').delete().eq('user_id', testUserIdA)
      await service.from('predictions').delete().eq('user_id', testUserIdB)
      await service.from('profiles').delete().eq('id', testUserIdA)
      await service.from('profiles').delete().eq('id', testUserIdB)
      try { await service.auth.admin.deleteUser(testUserIdA) } catch { /* ignore */ }
      try { await service.auth.admin.deleteUser(testUserIdB) } catch { /* ignore */ }
    })

    // =========================================================================
    // LEADERBOARD VIEW — bracket_points and group_points columns
    // =========================================================================

    describe('leaderboard view exposes new columns', () => {
      let matchId

      beforeAll(async () => {
        const { data: match } = await service
          .from('matches')
          .select('id')
          .eq('status', 'finished')
          .limit(1)
          .maybeSingle()
        matchId = match?.id
      })

      beforeEach(async () => {
        // Clean all test data
        for (const uid of [testUserIdA, testUserIdB]) {
          await service.from('bracket_predictions').delete().eq('user_id', uid)
          await service.from('scorer_predictions').delete().eq('user_id', uid)
          await service.from('predictions').delete().eq('user_id', uid)
        }
      })

      test('leaderboard returns group_points = 0 and bracket_points = 0 for user without any data', async () => {
        const { data } = await service
          .from('leaderboard')
          .select('user_id, group_points, bracket_points, scorer_points, total_points')
          .eq('user_id', testUserIdA)
          .maybeSingle()

        expect(data).not.toBeNull()
        expect(data.group_points).toBe(0)
        expect(data.bracket_points).toBe(0)
        expect(data.scorer_points).toBe(0)
        expect(data.total_points).toBe(0)
      })

      test('leaderboard returns group_points correctly as SUM of predictions.points', async () => {
        if (!matchId) return

        await service.from('predictions').insert([
          { user_id: testUserIdA, match_id: matchId, home_score: 1, away_score: 0, points: 10 },
        ])

        const { data } = await service
          .from('leaderboard')
          .select('user_id, group_points, total_points')
          .eq('user_id', testUserIdA)
          .maybeSingle()

        expect(data).not.toBeNull()
        expect(data.group_points).toBe(10)
        expect(data.total_points).toBe(10) // no bracket or scorer points
      })

      test('leaderboard returns bracket_points correctly as SUM of bracket_predictions.bracket_points', async () => {
        // Insert bracket predictions with bracket_points
        await service.from('bracket_predictions').insert([
          { user_id: testUserIdA, bracket_slot: 'R16_01', predicted_winner: 'Team A', bracket_points: 5 },
          { user_id: testUserIdA, bracket_slot: 'R16_02', predicted_winner: 'Team B', bracket_points: 5 },
        ])

        const { data } = await service
          .from('leaderboard')
          .select('user_id, bracket_points, total_points')
          .eq('user_id', testUserIdA)
          .maybeSingle()

        expect(data).not.toBeNull()
        expect(data.bracket_points).toBe(10)
        expect(data.total_points).toBe(10) // no group or scorer points
      })

      test('total_points = group_points + bracket_points + scorer_points', async () => {
        if (!matchId) return

        // Get a scorer_player ID
        const { data: players } = await service
          .from('scorer_players')
          .select('id')
          .limit(1)
        const playerId = players?.[0]?.id

        // Seed all three sources
        await service.from('predictions').insert([
          { user_id: testUserIdA, match_id: matchId, home_score: 1, away_score: 0, points: 10 },
        ])
        await service.from('bracket_predictions').insert([
          { user_id: testUserIdA, bracket_slot: 'R16_01', predicted_winner: 'Team A', bracket_points: 5 },
        ])
        if (playerId) {
          await service.from('scorer_predictions').insert([
            { user_id: testUserIdA, player_id: playerId, scorer_points: 20 },
          ])
        }

        const { data } = await service
          .from('leaderboard')
          .select('user_id, group_points, bracket_points, scorer_points, total_points')
          .eq('user_id', testUserIdA)
          .maybeSingle()

        expect(data).not.toBeNull()
        const expectedScorer = playerId ? 20 : 0
        expect(data.group_points).toBe(10)
        expect(data.bracket_points).toBe(5)
        expect(data.scorer_points).toBe(expectedScorer)
        expect(data.total_points).toBe(10 + 5 + expectedScorer)
      })

      test('bonus_predictions.bonus_points does NOT appear in total_points', async () => {
        if (!matchId) return

        // Insert a bonus prediction with bonus_points
        await service.from('bonus_predictions').upsert(
          { user_id: testUserIdA, first_place: 'Team A', second_place: 'Team B', third_place: 'Team C', fourth_place: 'Team D', bonus_points: 50 },
          { onConflict: 'user_id' }
        )

        // Also give user A some group_points
        await service.from('predictions').insert([
          { user_id: testUserIdA, match_id: matchId, home_score: 1, away_score: 0, points: 10 },
        ])

        const { data } = await service
          .from('leaderboard')
          .select('user_id, total_points, group_points')
          .eq('user_id', testUserIdA)
          .maybeSingle()

        expect(data).not.toBeNull()
        // total_points should ONLY include group_points (10), NOT bonus_points (50)
        expect(data.total_points).toBe(10)
      })

      test('leaderboard maintains correct ranking order', async () => {
        if (!matchId) return

        // User A: 15 points from predictions
        await service.from('predictions').insert([
          { user_id: testUserIdA, match_id: matchId, home_score: 1, away_score: 0, points: 15 },
        ])

        // User B: 10 points from predictions
        await service.from('predictions').insert([
          { user_id: testUserIdB, match_id: matchId, home_score: 2, away_score: 1, points: 10 },
        ])

        const { data } = await service
          .from('leaderboard')
          .select('user_id, total_points')
          .order('total_points', { ascending: false })
          .limit(2)

        expect(data).not.toBeNull()
        expect(data.length).toBe(2)
        expect(data[0].user_id).toBe(testUserIdA)
        expect(data[0].total_points).toBe(15)
        expect(data[1].user_id).toBe(testUserIdB)
        expect(data[1].total_points).toBe(10)
      })

      test('leaderboard preserves tiebreaker columns', async () => {
        if (!matchId) return

        await service.from('predictions').insert([
          { user_id: testUserIdA, match_id: matchId, home_score: 1, away_score: 0, points: 10 },
        ])

        const { data } = await service
          .from('leaderboard')
          .select('total_predictions, exact_score_count, winner_with_diff_count, winner_correct_count')
          .eq('user_id', testUserIdA)
          .maybeSingle()

        expect(data).not.toBeNull()
        expect(data).toHaveProperty('total_predictions')
        expect(data).toHaveProperty('exact_score_count')
        expect(data).toHaveProperty('winner_with_diff_count')
        expect(data).toHaveProperty('winner_correct_count')
      })
    })
  }
)
