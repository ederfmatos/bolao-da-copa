/**
 * Integration tests for migration 0022: scorer_predictions table, RLS, and leaderboard.
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
  '0022 scorer_predictions RLS and leaderboard',
  () => {
    let service  // service_role client — simulates Edge Functions
    let userA    // authenticated client — user A
    let userB    // authenticated client — user B
    let testUserIdA
    let testUserIdB
    let somePlayerId

    const testEmailA = `bolao-sp-a-${Date.now()}@test.invalid`
    const testEmailB = `bolao-sp-b-${Date.now()}@test.invalid`
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

      // Create profiles (profile trigger was removed in an earlier migration)
      const { error: profileErrA } = await service
        .from('profiles')
        .insert({ id: testUserIdA, name: 'Scorer Test User A' })
      if (profileErrA) throw new Error(`Could not create profile A: ${profileErrA.message}`)

      const { error: profileErrB } = await service
        .from('profiles')
        .insert({ id: testUserIdB, name: 'Scorer Test User B' })
      if (profileErrB) throw new Error(`Could not create profile B: ${profileErrB.message}`)

      // Get a scorer_player ID to use in tests
      const { data: players } = await service
        .from('scorer_players')
        .select('id')
        .limit(1)
      if (!players || players.length === 0) throw new Error('No scorer_players found — is migration 0021 applied?')
      somePlayerId = players[0].id

      // Sign in as user A
      userA = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
      const { error: signInErrA } = await userA.auth.signInWithPassword({
        email: testEmailA,
        password: testPassword,
      })
      if (signInErrA) throw new Error(`Could not sign in user A: ${signInErrA.message}`)

      // Sign in as user B
      userB = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
      const { error: signInErrB } = await userB.auth.signInWithPassword({
        email: testEmailB,
        password: testPassword,
      })
      if (signInErrB) throw new Error(`Could not sign in user B: ${signInErrB.message}`)
    })

    afterAll(async () => {
      if (!service) return

      // Clean up predictions first (FK)
      await service.from('scorer_predictions').delete().eq('user_id', testUserIdA)
      await service.from('scorer_predictions').delete().eq('user_id', testUserIdB)

      // Clean up test data for leaderboard tests
      if (testUserIdA) {
        await service.from('scorer_predictions').delete().eq('user_id', testUserIdA)
        await service.from('bonus_predictions').delete().eq('user_id', testUserIdA)
        await service.from('predictions').delete().eq('user_id', testUserIdA)
        await service.from('profiles').delete().eq('id', testUserIdA)
        await service.auth.admin.deleteUser(testUserIdA)
      }
      if (testUserIdB) {
        await service.from('scorer_predictions').delete().eq('user_id', testUserIdB)
        await service.from('bonus_predictions').delete().eq('user_id', testUserIdB)
        await service.from('predictions').delete().eq('user_id', testUserIdB)
        await service.from('profiles').delete().eq('id', testUserIdB)
        await service.auth.admin.deleteUser(testUserIdB)
      }
    })

    // =========================================================================
    // SCORER PREDICTIONS — RLS enforcement
    // =========================================================================

    describe('RLS — INSERT', () => {
      afterEach(async () => {
        await service.from('scorer_predictions').delete().eq('user_id', testUserIdA)
      })

      test('authenticated user CAN INSERT their own prediction via service role seed', async () => {
        // Service role can always insert (bypasses RLS)
        const { data, error } = await service
          .from('scorer_predictions')
          .insert({
            user_id: testUserIdA,
            player_id: somePlayerId,
          })
          .select()
          .single()

        expect(error).toBeNull()
        expect(data.user_id).toBe(testUserIdA)
        expect(data.player_id).toBe(somePlayerId)
        expect(data.scorer_points).toBe(0)
      })

      test('UNIQUE constraint on user_id — second INSERT for same user raises conflict', async () => {
        // Insert first row via service role
        await service
          .from('scorer_predictions')
          .insert({ user_id: testUserIdA, player_id: somePlayerId })

        // Second insert for same user should fail
        const { error } = await service
          .from('scorer_predictions')
          .insert({ user_id: testUserIdA, player_id: somePlayerId })

        expect(error).not.toBeNull()
      })
    })

    describe('RLS — SELECT own row', () => {
      beforeEach(async () => {
        await service
          .from('scorer_predictions')
          .upsert(
            { user_id: testUserIdA, player_id: somePlayerId },
            { onConflict: 'user_id' }
          )
      })

      afterEach(async () => {
        await service.from('scorer_predictions').delete().eq('user_id', testUserIdA)
      })

      test('authenticated user CAN SELECT their own row at any time', async () => {
        const { data, error } = await userA
          .from('scorer_predictions')
          .select('*')
          .eq('user_id', testUserIdA)
          .single()

        expect(error).toBeNull()
        expect(data).not.toBeNull()
        expect(data.user_id).toBe(testUserIdA)
      })
    })

    describe('RLS — SELECT others after deadline', () => {
      beforeEach(async () => {
        await service
          .from('scorer_predictions')
          .upsert(
            { user_id: testUserIdA, player_id: somePlayerId },
            { onConflict: 'user_id' }
          )
      })

      afterEach(async () => {
        await service.from('scorer_predictions').delete().eq('user_id', testUserIdA)
      })

      test('authenticated user CAN SELECT another user row (deadline is past)', async () => {
        // SCORER_DEADLINE is 2026-06-12 which is in the past,
        // so read_others_after_deadline policy allows this
        const { data, error } = await userB
          .from('scorer_predictions')
          .select('*')
          .eq('user_id', testUserIdA)
          .maybeSingle()

        expect(error).toBeNull()
        expect(data).not.toBeNull()
        expect(data.user_id).toBe(testUserIdA)
      })
    })

    // =========================================================================
    // LEADERBOARD VIEW
    // =========================================================================

    describe('leaderboard view with scorer_predictions', () => {
      let matchId

      beforeAll(async () => {
        // Find a finished match to create a prediction with points
        const { data: match } = await service
          .from('matches')
          .select('id')
          .eq('status', 'finished')
          .limit(1)
          .maybeSingle()
        matchId = match?.id
      })

      beforeEach(async () => {
        if (!matchId) return

        // Create a finished match prediction with points via service role
        await service.from('scorer_predictions').delete().eq('user_id', testUserIdA)
        await service.from('scorer_predictions').delete().eq('user_id', testUserIdB)
        await service.from('bonus_predictions').delete().eq('user_id', testUserIdA)
        await service.from('bonus_predictions').delete().eq('user_id', testUserIdB)
        await service.from('predictions').delete().eq('user_id', testUserIdA)
        await service.from('predictions').delete().eq('user_id', testUserIdB)

        // User A gets 10 points from a prediction
        await service.from('predictions').insert({
          user_id: testUserIdA,
          match_id: matchId,
          home_score: 1,
          away_score: 0,
          points: 10,
        })

        // User B gets 10 points from a prediction (same match, same score)
        await service.from('predictions').insert({
          user_id: testUserIdB,
          match_id: matchId,
          home_score: 1,
          away_score: 0,
          points: 10,
        })
      })

      afterEach(async () => {
        await service.from('scorer_predictions').delete().eq('user_id', testUserIdA)
        await service.from('scorer_predictions').delete().eq('user_id', testUserIdB)
        await service.from('bonus_predictions').delete().eq('user_id', testUserIdA)
        await service.from('bonus_predictions').delete().eq('user_id', testUserIdB)
        await service.from('predictions').delete().eq('user_id', testUserIdA)
        await service.from('predictions').delete().eq('user_id', testUserIdB)
      })

      test.skipIf(!matchId)(
        'leaderboard total_points for user with scorer_points = 20 equals match_points + 20',
        async () => {
          // Give user A a scorer prediction with 20 points
          await service
            .from('scorer_predictions')
            .insert({ user_id: testUserIdA, player_id: somePlayerId, scorer_points: 20 })

          const { data } = await service
            .from('leaderboard')
            .select('user_id, total_points')
            .eq('user_id', testUserIdA)
            .single()

          expect(data).not.toBeNull()
          expect(data.total_points).toBe(30) // 10 (match) + 20 (scorer)
        }
      )

      test.skipIf(!matchId)(
        'leaderboard total_points for user with no scorer_predictions row equals match_points (coalesce to 0)',
        async () => {
          // User B has no scorer_predictions row
          const { data } = await service
            .from('leaderboard')
            .select('user_id, total_points')
            .eq('user_id', testUserIdB)
            .single()

          expect(data).not.toBeNull()
          expect(data.total_points).toBe(10) // 10 (match) + 0 (no scorer)
        }
      )

      test.skipIf(!matchId)(
        'leaderboard sort order remains correct after adding scorer_points',
        async () => {
          // Give user A 20 scorer points => total = 30
          await service
            .from('scorer_predictions')
            .insert({ user_id: testUserIdA, player_id: somePlayerId, scorer_points: 20 })

          // User B has no scorer points => total = 10
          const { data } = await service
            .from('leaderboard')
            .select('user_id, total_points')
            .order('total_points', { ascending: false })
            .limit(2)

          expect(data).not.toBeNull()
          expect(data.length).toBeGreaterThanOrEqual(2)
          // User A (30 pts) should rank above user B (10 pts)
          const userARank = data.findIndex(r => r.user_id === testUserIdA)
          const userBRank = data.findIndex(r => r.user_id === testUserIdB)
          expect(userARank).toBeLessThan(userBRank)
        }
      )
    })
  }
)
