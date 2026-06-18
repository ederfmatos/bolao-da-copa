/**
 * Integration tests for migration 0021: scorer_players table and RLS.
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
  '0021 scorer_players RLS',
  () => {
    let service // service_role client — simulates Edge Functions
    let anon   // anonymous client — simulates unauthenticated visitor
    let user   // authenticated client — simulates frontend user
    let testUserId

    const testEmail = `bolao-scorer-${Date.now()}@test.invalid`
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

      // Create profile (profile trigger was removed in an earlier migration)
      const { error: profileErr } = await service
        .from('profiles')
        .insert({ id: testUserId, name: 'Scorer Test User' })
      if (profileErr) throw new Error(`Could not create test profile: ${profileErr.message}`)

      // Anonymous client (no auth)
      anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

      // Sign in as test user
      user = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
      const { error: signInErr } = await user.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      })
      if (signInErr) throw new Error(`Could not sign in test user: ${signInErr.message}`)
    })

    afterAll(async () => {
      if (!service || !testUserId) return
      await service.from('scorer_players').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await service.from('profiles').delete().eq('id', testUserId)
      await service.auth.admin.deleteUser(testUserId)
    })

    // =========================================================================
    // READ — public SELECT policy
    // =========================================================================

    describe('public SELECT policy', () => {
      test('anonymous client can SELECT all rows', async () => {
        const { data, error } = await anon
          .from('scorer_players')
          .select('*')

        expect(error).toBeNull()
        expect(data.length).toBe(30)
      })

      test('authenticated user can SELECT all rows', async () => {
        const { data, error } = await user
          .from('scorer_players')
          .select('*')

        expect(error).toBeNull()
        expect(data.length).toBe(30)
      })

      test('each row has non-null name, nationality, flag, position', async () => {
        const { data } = await user
          .from('scorer_players')
          .select('name, nationality, flag, position')

        data.forEach((row, i) => {
          expect(row.name, `Row ${i}: name should not be null`).not.toBeNull()
          expect(row.nationality, `Row ${i}: nationality should not be null`).not.toBeNull()
          expect(row.flag, `Row ${i}: flag should not be null`).not.toBeNull()
          expect(row.position, `Row ${i}: position should not be null`).not.toBeNull()
        })
      })

      test('all goals values are 0 after migration', async () => {
        const { data } = await user
          .from('scorer_players')
          .select('goals')

        data.forEach((row, i) => {
          expect(row.goals, `Row ${i}: goals should be 0`).toBe(0)
        })
      })

      test('position values are restricted to Forward, Midfielder, Defender', async () => {
        const { data } = await user
          .from('scorer_players')
          .select('position')

        const validPositions = ['Forward', 'Midfielder', 'Defender']
        data.forEach((row, i) => {
          expect(validPositions, `Row ${i}: invalid position "${row.position}"`).toContain(row.position)
        })
      })
    })

    // =========================================================================
    // WRITE — RLS blocks INSERT/UPDATE/DELETE from authenticated users
    // =========================================================================

    describe('RLS blocks authenticated user writes', () => {
      test('authenticated user cannot INSERT a new row', async () => {
        const { error } = await user
          .from('scorer_players')
          .insert({
            name: 'Test Player',
            nationality: 'Testland',
            flag: '🏴‍☠️',
            position: 'Forward',
          })

        expect(error).not.toBeNull()
      })

      test('authenticated user cannot UPDATE goals', async () => {
        const { data: firstRow } = await user
          .from('scorer_players')
          .select('id')
          .limit(1)
          .single()

        if (!firstRow) return

        const { error } = await user
          .from('scorer_players')
          .update({ goals: 99 })
          .eq('id', firstRow.id)

        expect(error).not.toBeNull()
      })

      test('authenticated user cannot UPDATE name or other columns', async () => {
        const { data: firstRow } = await user
          .from('scorer_players')
          .select('id')
          .limit(1)
          .single()

        if (!firstRow) return

        const { error } = await user
          .from('scorer_players')
          .update({ name: 'Hacked Name' })
          .eq('id', firstRow.id)

        expect(error).not.toBeNull()
      })

      test('authenticated user cannot DELETE any row', async () => {
        const { data: firstRow } = await user
          .from('scorer_players')
          .select('id')
          .limit(1)
          .single()

        if (!firstRow) return

        const { error } = await user
          .from('scorer_players')
          .delete()
          .eq('id', firstRow.id)

        expect(error).not.toBeNull()
      })
    })

    // =========================================================================
    // SERVICE ROLE — can perform all operations
    // =========================================================================

    describe('service role can write', () => {
      test('service role CAN update goals', async () => {
        const { data: firstRow } = await user
          .from('scorer_players')
          .select('id, goals')
          .limit(1)
          .single()

        if (!firstRow) return

        const { error } = await service
          .from('scorer_players')
          .update({ goals: 5 })
          .eq('id', firstRow.id)

        expect(error).toBeNull()

        // Restore
        await service
          .from('scorer_players')
          .update({ goals: 0 })
          .eq('id', firstRow.id)
      })

      test('service role CAN insert and delete rows', async () => {
        const { data: inserted, error: insertErr } = await service
          .from('scorer_players')
          .insert({
            name: 'Temp Player',
            nationality: 'Templand',
            flag: '🏴‍☠️',
            position: 'Midfielder',
          })
          .select('id')
          .single()

        expect(insertErr).toBeNull()

        const { error: deleteErr } = await service
          .from('scorer_players')
          .delete()
          .eq('id', inserted.id)

        expect(deleteErr).toBeNull()
      })
    })
  }
)
