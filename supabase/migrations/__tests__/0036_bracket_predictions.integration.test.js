/**
 * Integration tests for migration 0036: bracket_predictions table, RLS, and deadline enforcement.
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
  '0036 bracket_predictions RLS and deadline enforcement',
  () => {
    let service        // service_role client — simulates Edge Functions
    let userA          // authenticated client — user A
    let userB          // authenticated client — user B
    let testUserIdA
    let testUserIdB
    let testR16MatchId // match with group_name = '16 Avos' for deadline calculation

    const testEmailA = `bolao-bp-a-${Date.now()}@test.invalid`
    const testEmailB = `bolao-bp-b-${Date.now()}@test.invalid`
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
        .insert({ id: testUserIdA, name: 'Bracket Test User A' })
      if (profileErrA) throw new Error(`Could not create profile A: ${profileErrA.message}`)

      const { error: profileErrB } = await service
        .from('profiles')
        .insert({ id: testUserIdB, name: 'Bracket Test User B' })
      if (profileErrB) throw new Error(`Could not create profile B: ${profileErrB.message}`)

      // Find or create a '16 Avos' match for deadline testing
      // If it doesn't exist, we'll create one with a future kickoff time
      const { data: existingR16 } = await service
        .from('matches')
        .select('id')
        .eq('group_name', '16 Avos')
        .limit(1)

      if (existingR16 && existingR16.length > 0) {
        testR16MatchId = existingR16[0].id
      } else {
        // Create a test R16 match with a future kickoff time (90 minutes from now)
        const futureKickoff = new Date(Date.now() + 90 * 60 * 1000).toISOString()
        const { data: created } = await service
          .from('matches')
          .insert({
            id: `test-r16-${Date.now()}`,
            home_team: 'Team A',
            away_team: 'Team B',
            group_name: '16 Avos',
            kickoff_at: futureKickoff,
            status: 'scheduled',
          })
          .select('id')
          .single()
        testR16MatchId = created?.id
      }

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

      // Clean up bracket_predictions
      await service.from('bracket_predictions').delete().eq('user_id', testUserIdA)
      await service.from('bracket_predictions').delete().eq('user_id', testUserIdB)

      // Clean up test data
      if (testUserIdA) {
        await service.from('profiles').delete().eq('id', testUserIdA)
        await service.auth.admin.deleteUser(testUserIdA)
      }
      if (testUserIdB) {
        await service.from('profiles').delete().eq('id', testUserIdB)
        await service.auth.admin.deleteUser(testUserIdB)
      }

      // Clean up test match if we created it
      if (testR16MatchId && testR16MatchId.includes('test-r16-')) {
        await service.from('matches').delete().eq('id', testR16MatchId)
      }
    })

    // =========================================================================
    // RLS — INSERT (before deadline)
    // =========================================================================

    describe('RLS — INSERT before deadline', () => {
      afterEach(async () => {
        await service.from('bracket_predictions').delete().eq('user_id', testUserIdA)
      })

      test('authenticated user CAN INSERT their own bracket prediction before deadline', async () => {
        const { data, error } = await userA
          .from('bracket_predictions')
          .insert({
            user_id: testUserIdA,
            bracket_slot: 'R16_01',
            predicted_winner: 'France',
          })
          .select()
          .single()

        expect(error).toBeNull()
        expect(data.user_id).toBe(testUserIdA)
        expect(data.bracket_slot).toBe('R16_01')
        expect(data.predicted_winner).toBe('France')
        expect(data.bracket_points).toBe(0)
      })

      test('authenticated user CANNOT INSERT for another user', async () => {
        const { error } = await userA
          .from('bracket_predictions')
          .insert({
            user_id: testUserIdB, // trying to insert for user B as user A
            bracket_slot: 'R16_01',
            predicted_winner: 'France',
          })

        expect(error).not.toBeNull()
      })
    })

    // =========================================================================
    // RLS — UPDATE (before deadline)
    // =========================================================================

    describe('RLS — UPDATE before deadline', () => {
      beforeEach(async () => {
        await service
          .from('bracket_predictions')
          .insert({
            user_id: testUserIdA,
            bracket_slot: 'R16_01',
            predicted_winner: 'France',
          })
      })

      afterEach(async () => {
        await service.from('bracket_predictions').delete().eq('user_id', testUserIdA)
      })

      test('authenticated user CAN UPDATE their own prediction before deadline', async () => {
        const { error } = await userA
          .from('bracket_predictions')
          .update({ predicted_winner: 'Spain' })
          .eq('user_id', testUserIdA)
          .eq('bracket_slot', 'R16_01')

        expect(error).toBeNull()

        // Verify the update
        const { data } = await userA
          .from('bracket_predictions')
          .select('predicted_winner')
          .eq('user_id', testUserIdA)
          .eq('bracket_slot', 'R16_01')
          .single()

        expect(data.predicted_winner).toBe('Spain')
      })

      test('authenticated user CANNOT UPDATE another user row', async () => {
        // Create prediction for user A
        await service
          .from('bracket_predictions')
          .insert({
            user_id: testUserIdB,
            bracket_slot: 'R16_02',
            predicted_winner: 'Germany',
          })

        // Try to update user B's row as user A
        const { error } = await userA
          .from('bracket_predictions')
          .update({ predicted_winner: 'Belgium' })
          .eq('user_id', testUserIdB)
          .eq('bracket_slot', 'R16_02')

        expect(error).not.toBeNull()

        // Clean up user B's row
        await service.from('bracket_predictions').delete().eq('user_id', testUserIdB)
      })
    })

    // =========================================================================
    // RLS — SELECT (own always, others after deadline)
    // =========================================================================

    describe('RLS — SELECT own row (always readable)', () => {
      beforeEach(async () => {
        await service
          .from('bracket_predictions')
          .insert({
            user_id: testUserIdA,
            bracket_slot: 'R16_01',
            predicted_winner: 'France',
          })
      })

      afterEach(async () => {
        await service.from('bracket_predictions').delete().eq('user_id', testUserIdA)
      })

      test('authenticated user CAN SELECT their own row before deadline', async () => {
        const { data, error } = await userA
          .from('bracket_predictions')
          .select('*')
          .eq('user_id', testUserIdA)
          .eq('bracket_slot', 'R16_01')
          .single()

        expect(error).toBeNull()
        expect(data).not.toBeNull()
        expect(data.user_id).toBe(testUserIdA)
        expect(data.predicted_winner).toBe('France')
      })
    })

    describe('RLS — SELECT others before deadline (blocked)', () => {
      beforeEach(async () => {
        await service
          .from('bracket_predictions')
          .insert({
            user_id: testUserIdA,
            bracket_slot: 'R16_03',
            predicted_winner: 'Argentina',
          })
      })

      afterEach(async () => {
        await service.from('bracket_predictions').delete().eq('user_id', testUserIdA)
      })

      test('authenticated user CANNOT SELECT another user row before deadline', async () => {
        const { data, error } = await userB
          .from('bracket_predictions')
          .select('*')
          .eq('user_id', testUserIdA)
          .eq('bracket_slot', 'R16_03')
          .maybeSingle()

        // RLS should prevent access, returning null or error
        expect(data).toBeNull()
      })
    })

    // =========================================================================
    // UNIQUE CONSTRAINT
    // =========================================================================

    describe('UNIQUE constraint on (user_id, bracket_slot)', () => {
      afterEach(async () => {
        await service.from('bracket_predictions').delete().eq('user_id', testUserIdA)
      })

      test('UNIQUE constraint prevents duplicate (user_id, bracket_slot) INSERT', async () => {
        // First insert succeeds
        const { error: err1 } = await service
          .from('bracket_predictions')
          .insert({
            user_id: testUserIdA,
            bracket_slot: 'R16_04',
            predicted_winner: 'Brazil',
          })
        expect(err1).toBeNull()

        // Second insert with same user_id and bracket_slot fails
        const { error: err2 } = await service
          .from('bracket_predictions')
          .insert({
            user_id: testUserIdA,
            bracket_slot: 'R16_04',
            predicted_winner: 'Uruguay',
          })
        expect(err2).not.toBeNull()
      })

      test('UPSERT on (user_id, bracket_slot) replaces existing row', async () => {
        // First upsert
        const { error: err1 } = await service
          .from('bracket_predictions')
          .upsert(
            {
              user_id: testUserIdA,
              bracket_slot: 'R16_05',
              predicted_winner: 'Portugal',
            },
            { onConflict: 'user_id,bracket_slot' }
          )
        expect(err1).toBeNull()

        // Second upsert with same constraint key
        const { error: err2 } = await service
          .from('bracket_predictions')
          .upsert(
            {
              user_id: testUserIdA,
              bracket_slot: 'R16_05',
              predicted_winner: 'England',
            },
            { onConflict: 'user_id,bracket_slot' }
          )
        expect(err2).toBeNull()

        // Verify the final row has the updated value
        const { data } = await service
          .from('bracket_predictions')
          .select('predicted_winner')
          .eq('user_id', testUserIdA)
          .eq('bracket_slot', 'R16_05')
          .single()

        expect(data.predicted_winner).toBe('England')
      })
    })

    // =========================================================================
    // UPDATED_AT TRIGGER
    // =========================================================================

    describe('updated_at trigger', () => {
      beforeEach(async () => {
        await service
          .from('bracket_predictions')
          .insert({
            user_id: testUserIdA,
            bracket_slot: 'R16_06',
            predicted_winner: 'Italy',
          })
      })

      afterEach(async () => {
        await service.from('bracket_predictions').delete().eq('user_id', testUserIdA)
      })

      test('updated_at is automatically set on INSERT', async () => {
        const { data } = await service
          .from('bracket_predictions')
          .select('updated_at')
          .eq('user_id', testUserIdA)
          .eq('bracket_slot', 'R16_06')
          .single()

        expect(data.updated_at).not.toBeNull()
        expect(new Date(data.updated_at)).toBeInstanceOf(Date)
      })

      test('updated_at is automatically updated on UPDATE', async () => {
        // Get initial updated_at
        const { data: before } = await service
          .from('bracket_predictions')
          .select('updated_at')
          .eq('user_id', testUserIdA)
          .eq('bracket_slot', 'R16_06')
          .single()

        const initialUpdatedAt = before.updated_at

        // Wait a bit and then update
        await new Promise(resolve => setTimeout(resolve, 100))

        await service
          .from('bracket_predictions')
          .update({ predicted_winner: 'Greece' })
          .eq('user_id', testUserIdA)
          .eq('bracket_slot', 'R16_06')

        // Get updated_at after update
        const { data: after } = await service
          .from('bracket_predictions')
          .select('updated_at')
          .eq('user_id', testUserIdA)
          .eq('bracket_slot', 'R16_06')
          .single()

        const updatedUpdatedAt = after.updated_at

        // updated_at should have changed
        expect(updatedUpdatedAt).not.toBe(initialUpdatedAt)
        expect(new Date(updatedUpdatedAt) > new Date(initialUpdatedAt)).toBe(true)
      })
    })
  }
)
