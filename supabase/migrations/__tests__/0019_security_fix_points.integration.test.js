/**
 * Integration tests for migration 0019: security fix — points protection.
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
  '0019 security fix: points protection',
  () => {
    let service   // service_role client — simulates Edge Functions
    let user      // authenticated client — simulates frontend user
    let testUserId
    let scheduledMatchId  // match with kickoff > 15 min (RLS allows write)
    let finishedMatchId   // match already finished (RLS blocks write)

    const testEmail = `bolao-sec-${Date.now()}@test.invalid`
    const testPassword = 'BolaoTest@9999'

    beforeAll(async () => {
      service = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

      // Create ephemeral test user via admin API
      const { data: created, error: createErr } = await service.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
      })
      if (createErr) throw new Error(`Could not create test user: ${createErr.message}`)
      testUserId = created.user.id

      // Profile trigger was removed in 0004 — create manually
      const { error: profileErr } = await service
        .from('profiles')
        .insert({ id: testUserId, name: 'Security Test User' })
      if (profileErr) throw new Error(`Could not create test profile: ${profileErr.message}`)

      // Sign in as test user
      user = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
      const { error: signInErr } = await user.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      })
      if (signInErr) throw new Error(`Could not sign in test user: ${signInErr.message}`)

      // A scheduled match at least 30 min away (deadline not passed)
      const { data: scheduled } = await service
        .from('matches')
        .select('id')
        .eq('status', 'scheduled')
        .gt('kickoff_at', new Date(Date.now() + 30 * 60 * 1000).toISOString())
        .limit(1)
        .maybeSingle()
      scheduledMatchId = scheduled?.id

      // Any finished match (deadline passed)
      const { data: finished } = await service
        .from('matches')
        .select('id')
        .eq('status', 'finished')
        .limit(1)
        .maybeSingle()
      finishedMatchId = finished?.id
    })

    afterAll(async () => {
      if (!service || !testUserId) return
      await service.from('bonus_predictions').delete().eq('user_id', testUserId)
      await service.from('predictions').delete().eq('user_id', testUserId)
      await service.from('profiles').delete().eq('id', testUserId)
      await service.auth.admin.deleteUser(testUserId)
    })

    // =========================================================================
    // predictions.points
    // =========================================================================

    describe('predictions.points is read-only for authenticated users', () => {
      beforeEach(async () => {
        if (!scheduledMatchId) return
        await service.from('predictions').upsert(
          { user_id: testUserId, match_id: scheduledMatchId, home_score: 1, away_score: 0, points: 0 },
          { onConflict: 'user_id,match_id' }
        )
      })

      afterEach(async () => {
        if (!scheduledMatchId) return
        await service.from('predictions').delete()
          .eq('user_id', testUserId).eq('match_id', scheduledMatchId)
      })

      test('authenticated user cannot UPDATE points column', async () => {
        const { error } = await user
          .from('predictions')
          .update({ points: 999 })
          .eq('user_id', testUserId)
          .eq('match_id', scheduledMatchId)

        expect(error).not.toBeNull()
      })

      test('authenticated user cannot INSERT prediction with a custom points value', async () => {
        await service.from('predictions').delete()
          .eq('user_id', testUserId).eq('match_id', scheduledMatchId)

        const { error } = await user
          .from('predictions')
          .insert({
            user_id: testUserId,
            match_id: scheduledMatchId,
            home_score: 2,
            away_score: 1,
            points: 999,
          })

        expect(error).not.toBeNull()
      })

      test('authenticated user CAN update home_score and away_score (normal flow)', async () => {
        const { error } = await user
          .from('predictions')
          .update({ home_score: 2, away_score: 1 })
          .eq('user_id', testUserId)
          .eq('match_id', scheduledMatchId)

        expect(error).toBeNull()
      })

      test('authenticated user CAN upsert prediction with only score fields', async () => {
        await service.from('predictions').delete()
          .eq('user_id', testUserId).eq('match_id', scheduledMatchId)

        const { data, error } = await user
          .from('predictions')
          .upsert(
            { user_id: testUserId, match_id: scheduledMatchId, home_score: 3, away_score: 2 },
            { onConflict: 'user_id,match_id' }
          )
          .select('home_score, away_score, points')
          .single()

        expect(error).toBeNull()
        expect(data.home_score).toBe(3)
        expect(data.away_score).toBe(2)
        expect(data.points).toBe(0) // default, not manipulated
      })

      test('service role CAN update points — simulates sync-matches / recalculate-points', async () => {
        const { error } = await service
          .from('predictions')
          .update({ points: 10 })
          .eq('user_id', testUserId)
          .eq('match_id', scheduledMatchId)

        expect(error).toBeNull()

        const { data } = await service
          .from('predictions')
          .select('points')
          .eq('user_id', testUserId)
          .eq('match_id', scheduledMatchId)
          .single()

        expect(data.points).toBe(10)
      })
    })

    // =========================================================================
    // bonus_predictions.bonus_points
    // =========================================================================

    describe('bonus_predictions.bonus_points is read-only for authenticated users', () => {
      beforeEach(async () => {
        await service.from('bonus_predictions').upsert(
          {
            user_id: testUserId,
            first_place: 'Brasil',
            second_place: 'Argentina',
            third_place: 'França',
            fourth_place: 'Alemanha',
            bonus_points: 0,
          },
          { onConflict: 'user_id' }
        )
      })

      afterEach(async () => {
        await service.from('bonus_predictions').delete().eq('user_id', testUserId)
      })

      test('authenticated user cannot UPDATE bonus_points', async () => {
        const { error } = await user
          .from('bonus_predictions')
          .update({ bonus_points: 999 })
          .eq('user_id', testUserId)

        expect(error).not.toBeNull()
      })

      test('authenticated user cannot INSERT bonus_prediction with a custom bonus_points value', async () => {
        await service.from('bonus_predictions').delete().eq('user_id', testUserId)

        const { error } = await user
          .from('bonus_predictions')
          .insert({
            user_id: testUserId,
            first_place: 'Brasil',
            second_place: 'Argentina',
            third_place: 'França',
            fourth_place: 'Alemanha',
            bonus_points: 999,
          })

        expect(error).not.toBeNull()
      })

      test('authenticated user CAN update placement fields (normal flow)', async () => {
        const { error } = await user
          .from('bonus_predictions')
          .update({ first_place: 'Argentina', second_place: 'Brasil' })
          .eq('user_id', testUserId)

        expect(error).toBeNull()
      })

      test('service role CAN update bonus_points — simulates recalculateBonusPoints', async () => {
        const { error } = await service
          .from('bonus_predictions')
          .update({ bonus_points: 25 })
          .eq('user_id', testUserId)

        expect(error).toBeNull()

        const { data } = await service
          .from('bonus_predictions')
          .select('bonus_points')
          .eq('user_id', testUserId)
          .single()

        expect(data.bonus_points).toBe(25)
      })
    })

    // =========================================================================
    // RLS deadline enforcement (the OR-logic bug fix)
    // =========================================================================

    describe('RLS deadline: cannot write predictions after match starts', () => {
      test.skipIf(!finishedMatchId)(
        'authenticated user cannot INSERT prediction for a finished match',
        async () => {
          const { error } = await user
            .from('predictions')
            .insert({
              user_id: testUserId,
              match_id: finishedMatchId,
              home_score: 1,
              away_score: 0,
            })

          expect(error).not.toBeNull()

          // Cleanup in case it somehow slipped through
          await service.from('predictions').delete()
            .eq('user_id', testUserId).eq('match_id', finishedMatchId)
        }
      )

      test.skipIf(!finishedMatchId)(
        'authenticated user cannot UPDATE prediction for a finished match',
        async () => {
          // Seed via service role to bypass RLS
          await service.from('predictions').upsert(
            { user_id: testUserId, match_id: finishedMatchId, home_score: 1, away_score: 0, points: 7 },
            { onConflict: 'user_id,match_id' }
          )

          const { error } = await user
            .from('predictions')
            .update({ home_score: 3 })
            .eq('user_id', testUserId)
            .eq('match_id', finishedMatchId)

          expect(error).not.toBeNull()

          await service.from('predictions').delete()
            .eq('user_id', testUserId).eq('match_id', finishedMatchId)
        }
      )

      test.skipIf(!finishedMatchId)(
        'points set by service role are preserved after authenticated user attempts to update scores',
        async () => {
          await service.from('predictions').upsert(
            { user_id: testUserId, match_id: finishedMatchId, home_score: 1, away_score: 0, points: 10 },
            { onConflict: 'user_id,match_id' }
          )

          // This update is blocked by RLS (finished match), so points stay at 10
          await user
            .from('predictions')
            .update({ home_score: 3, points: 0 })
            .eq('user_id', testUserId)
            .eq('match_id', finishedMatchId)

          const { data } = await service
            .from('predictions')
            .select('points')
            .eq('user_id', testUserId)
            .eq('match_id', finishedMatchId)
            .single()

          expect(data.points).toBe(10)

          await service.from('predictions').delete()
            .eq('user_id', testUserId).eq('match_id', finishedMatchId)
        }
      )
    })
  }
)
