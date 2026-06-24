/**
 * Integration tests for migration 0037: matches.bracket_slot column.
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

describe.skipIf(!hasCredentials)('0037 matches.bracket_slot column', () => {
  let service // service_role client
  const testMatchIds = [] // track test matches for cleanup

  beforeAll(async () => {
    service = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
  })

  afterAll(async () => {
    if (!service) return
    // Clean up test matches
    if (testMatchIds.length > 0) {
      await service.from('matches').delete().in('id', testMatchIds)
    }
  })

  describe('column schema', () => {
    test('bracket_slot column exists on matches table', async () => {
      const { data, error } = await service
        .from('matches')
        .select('bracket_slot')
        .limit(1)

      // Should not error — column exists
      expect(error).toBeNull()
    })

    test('bracket_slot is nullable (allows NULL)', async () => {
      const matchId = `test-bracket-slot-${Date.now()}`
      testMatchIds.push(matchId)

      const { error } = await service.from('matches').insert({
        id: matchId,
        home_team: 'Team A',
        away_team: 'Team B',
        group_name: 'Grupos',
        kickoff_at: new Date().toISOString(),
        status: 'scheduled',
      })

      expect(error).toBeNull()

      // Verify inserted row has bracket_slot = NULL
      const { data } = await service
        .from('matches')
        .select('bracket_slot')
        .eq('id', matchId)
        .single()

      expect(data.bracket_slot).toBeNull()
    })
  })

  describe('INSERT operations', () => {
    test('INSERT match without bracket_slot (NULL implicit)', async () => {
      const matchId = `test-no-bracket-${Date.now()}`
      testMatchIds.push(matchId)

      const { data, error } = await service
        .from('matches')
        .insert({
          id: matchId,
          home_team: 'Spain',
          away_team: 'France',
          group_name: 'Grupos',
          kickoff_at: new Date().toISOString(),
          status: 'scheduled',
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data.bracket_slot).toBeNull()
    })

    test('INSERT match with bracket_slot = R16_01', async () => {
      const matchId = `test-r16-01-${Date.now()}`
      testMatchIds.push(matchId)

      const { data, error } = await service
        .from('matches')
        .insert({
          id: matchId,
          home_team: 'Team X',
          away_team: 'Team Y',
          group_name: '16 Avos',
          kickoff_at: new Date().toISOString(),
          status: 'scheduled',
          bracket_slot: 'R16_01',
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data.bracket_slot).toBe('R16_01')
    })

    test('INSERT match with different bracket slot values', async () => {
      const testSlots = ['QF_02', 'SF_01', 'FINAL', '3RD']
      const insertedIds = []

      for (const slot of testSlots) {
        const matchId = `test-${slot}-${Date.now()}`
        insertedIds.push(matchId)
        testMatchIds.push(matchId)

        const { data, error } = await service
          .from('matches')
          .insert({
            id: matchId,
            home_team: `Team-${slot}-A`,
            away_team: `Team-${slot}-B`,
            group_name: 'Mata-mata',
            kickoff_at: new Date().toISOString(),
            status: 'scheduled',
            bracket_slot: slot,
          })
          .select()
          .single()

        expect(error).toBeNull()
        expect(data.bracket_slot).toBe(slot)
      }
    })
  })

  describe('UPDATE operations', () => {
    test('UPDATE bracket_slot from NULL to value', async () => {
      const matchId = `test-update-null-${Date.now()}`
      testMatchIds.push(matchId)

      // Create with NULL
      await service.from('matches').insert({
        id: matchId,
        home_team: 'Team A',
        away_team: 'Team B',
        group_name: 'Grupos',
        kickoff_at: new Date().toISOString(),
        status: 'scheduled',
      })

      // Update to QF_01
      const { error } = await service
        .from('matches')
        .update({ bracket_slot: 'QF_01' })
        .eq('id', matchId)

      expect(error).toBeNull()

      // Verify
      const { data } = await service
        .from('matches')
        .select('bracket_slot')
        .eq('id', matchId)
        .single()

      expect(data.bracket_slot).toBe('QF_01')
    })

    test('UPDATE bracket_slot from value to different value', async () => {
      const matchId = `test-update-value-${Date.now()}`
      testMatchIds.push(matchId)

      // Create with R16_01
      await service.from('matches').insert({
        id: matchId,
        home_team: 'Italy',
        away_team: 'Germany',
        group_name: '16 Avos',
        kickoff_at: new Date().toISOString(),
        status: 'scheduled',
        bracket_slot: 'R16_01',
      })

      // Update to R16_02
      const { error } = await service
        .from('matches')
        .update({ bracket_slot: 'R16_02' })
        .eq('id', matchId)

      expect(error).toBeNull()

      // Verify
      const { data } = await service
        .from('matches')
        .select('bracket_slot')
        .eq('id', matchId)
        .single()

      expect(data.bracket_slot).toBe('R16_02')
    })

    test('UPDATE bracket_slot from value to NULL', async () => {
      const matchId = `test-update-to-null-${Date.now()}`
      testMatchIds.push(matchId)

      // Create with value
      await service.from('matches').insert({
        id: matchId,
        home_team: 'Portugal',
        away_team: 'Netherlands',
        group_name: '16 Avos',
        kickoff_at: new Date().toISOString(),
        status: 'scheduled',
        bracket_slot: 'SF_01',
      })

      // Update to NULL
      const { error } = await service
        .from('matches')
        .update({ bracket_slot: null })
        .eq('id', matchId)

      expect(error).toBeNull()

      // Verify
      const { data } = await service
        .from('matches')
        .select('bracket_slot')
        .eq('id', matchId)
        .single()

      expect(data.bracket_slot).toBeNull()
    })
  })

  describe('SELECT operations', () => {
    beforeAll(async () => {
      // Create test data for SELECT operations
      const testData = [
        {
          id: `test-select-null-${Date.now()}`,
          group_name: 'Grupos',
          bracket_slot: null,
        },
        {
          id: `test-select-qf-${Date.now()}`,
          group_name: 'Quartas',
          bracket_slot: 'QF_01',
        },
        {
          id: `test-select-sf-${Date.now()}`,
          group_name: 'Semifinal',
          bracket_slot: 'SF_01',
        },
      ]

      for (const item of testData) {
        testMatchIds.push(item.id)
        await service.from('matches').insert({
          id: item.id,
          home_team: 'Home',
          away_team: 'Away',
          group_name: item.group_name,
          kickoff_at: new Date().toISOString(),
          status: 'scheduled',
          bracket_slot: item.bracket_slot,
        })
      }
    })

    test('SELECT matches WHERE bracket_slot IS NOT NULL', async () => {
      const { data, error } = await service
        .from('matches')
        .select('id, bracket_slot')
        .not('bracket_slot', 'is', null)
        .limit(10)

      expect(error).toBeNull()
      expect(data.length).toBeGreaterThan(0)

      // All results should have bracket_slot NOT NULL
      data.forEach(row => {
        expect(row.bracket_slot).not.toBeNull()
      })
    })

    test('SELECT matches WHERE bracket_slot = specific value', async () => {
      const { data, error } = await service
        .from('matches')
        .select('id, bracket_slot')
        .eq('bracket_slot', 'QF_01')
        .limit(10)

      expect(error).toBeNull()

      // All results should have bracket_slot = QF_01
      if (data.length > 0) {
        data.forEach(row => {
          expect(row.bracket_slot).toBe('QF_01')
        })
      }
    })

    test('SELECT matches WHERE bracket_slot IS NULL', async () => {
      const { data, error } = await service
        .from('matches')
        .select('id, bracket_slot')
        .is('bracket_slot', null)
        .limit(10)

      expect(error).toBeNull()

      // All results should have bracket_slot = NULL
      data.forEach(row => {
        expect(row.bracket_slot).toBeNull()
      })
    })
  })

  describe('backward compatibility', () => {
    test('existing group-stage matches have bracket_slot = NULL', async () => {
      const { data, error } = await service
        .from('matches')
        .select('id, bracket_slot, group_name')
        .eq('group_name', 'Grupos')
        .limit(5)

      expect(error).toBeNull()

      // Group stage matches should have NULL bracket_slot
      if (data.length > 0) {
        data.forEach(row => {
          expect(row.bracket_slot).toBeNull()
        })
      }
    })

    test('existing columns are unchanged', async () => {
      const { data, error } = await service
        .from('matches')
        .select('id, home_team, away_team, group_name, kickoff_at, status, home_score, away_score')
        .limit(1)

      // Should successfully read existing columns
      expect(error).toBeNull()
      expect(data.length).toBeGreaterThan(0)

      const match = data[0]
      expect(match.id).toBeTruthy()
      expect(match.home_team).toBeTruthy()
      expect(match.away_team).toBeTruthy()
      expect(match.group_name).toBeTruthy()
      expect(match.kickoff_at).toBeTruthy()
      expect(match.status).toBeTruthy()
    })
  })

  describe('partial index', () => {
    test('index allows efficient querying of knockout matches', async () => {
      const matchId = `test-index-perf-${Date.now()}`
      testMatchIds.push(matchId)

      // Create a knockout match
      const { error: insertErr } = await service.from('matches').insert({
        id: matchId,
        home_team: 'IndexTest A',
        away_team: 'IndexTest B',
        group_name: 'Finals',
        kickoff_at: new Date().toISOString(),
        status: 'scheduled',
        bracket_slot: 'FINAL',
      })

      expect(insertErr).toBeNull()

      // Query using the indexed column
      const { data, error } = await service
        .from('matches')
        .select('id, bracket_slot')
        .eq('bracket_slot', 'FINAL')
        .limit(1)

      expect(error).toBeNull()
      expect(data.length).toBeGreaterThan(0)
    })
  })
})
