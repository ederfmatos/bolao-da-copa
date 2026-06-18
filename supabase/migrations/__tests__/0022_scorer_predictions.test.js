import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const migrationPath = resolve(import.meta.dirname, '..', '0022_scorer_predictions.sql')
let sql = ''

beforeAll(() => {
  sql = readFileSync(migrationPath, 'utf-8')
})

describe('Migration 0022: scorer_predictions', () => {
  test('migration file exists at correct path', () => {
    expect(existsSync(migrationPath)).toBe(true)
  })

  describe('table schema', () => {
    test('creates scorer_predictions table with IF NOT EXISTS', () => {
      expect(sql).toMatch(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+scorer_predictions/i)
    })

    test('has id column as UUID PRIMARY KEY with gen_random_uuid()', () => {
      expect(sql).toMatch(/id\s+UUID\s+PRIMARY\s+KEY\s+DEFAULT\s+gen_random_uuid\(\)/i)
    })

    test('has user_id column as UUID NOT NULL', () => {
      expect(sql).toMatch(/user_id\s+UUID\s+NOT\s+NULL/i)
    })

    test('has player_id column as UUID NOT NULL', () => {
      expect(sql).toMatch(/player_id\s+UUID\s+NOT\s+NULL/i)
    })

    test('has scorer_points column as SMALLINT NOT NULL DEFAULT 0', () => {
      expect(sql).toMatch(/scorer_points\s+SMALLINT\s+NOT\s+NULL\s+DEFAULT\s+0/i)
    })

    test('has created_at column as TIMESTAMPTZ with default now()', () => {
      expect(sql).toMatch(/created_at\s+TIMESTAMPTZ\s+NOT\s+NULL\s+DEFAULT\s+now\(\)/i)
    })
  })

  describe('constraints', () => {
    test('foreign key references profiles(id) with ON DELETE CASCADE', () => {
      expect(sql).toMatch(/REFERENCES\s+profiles\s*\(\s*id\s*\)\s+ON\s+DELETE\s+CASCADE/i)
    })

    test('foreign key references scorer_players(id)', () => {
      expect(sql).toMatch(/REFERENCES\s+scorer_players\s*\(\s*id\s*\)/i)
    })

    test('unique constraint on user_id', () => {
      expect(sql).toMatch(/UNIQUE\s*\(\s*user_id\s*\)/i)
    })
  })

  describe('indexes', () => {
    test('creates index on user_id with IF NOT EXISTS', () => {
      expect(sql).toMatch(
        /CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_scorer_predictions_user\s+ON\s+scorer_predictions\s*\(\s*user_id\s*\)/i
      )
    })
  })

  describe('row level security', () => {
    test('enables RLS on scorer_predictions table', () => {
      expect(sql).toMatch(/ALTER\s+TABLE\s+scorer_predictions\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i)
    })

    test('creates read_own policy', () => {
      expect(sql).toMatch(/DROP\s+POLICY\s+IF\s+EXISTS\s+"scorer_read_own"/i)
      expect(sql).toMatch(
        /CREATE\s+POLICY\s+"scorer_read_own".*FOR\s+SELECT\s+USING\s+\(auth\.uid\(\)\s*=\s*user_id\)/is
      )
    })

    test('creates read_others_after_deadline policy with correct deadline', () => {
      expect(sql).toMatch(/DROP\s+POLICY\s+IF\s+EXISTS\s+"scorer_read_others_after_deadline"/i)
      expect(sql).toMatch(
        /CREATE\s+POLICY\s+"scorer_read_others_after_deadline".*FOR\s+SELECT\s+USING\s+\(.*now\(\)\s*>=\s*'2026-06-12T00:00:00\+00'.*\)/is
      )
    })

    test('creates insert_before_deadline policy with user_id check and deadline', () => {
      expect(sql).toMatch(/DROP\s+POLICY\s+IF\s+EXISTS\s+"scorer_insert_before_deadline"/i)
      expect(sql).toMatch(
        /CREATE\s+POLICY\s+"scorer_insert_before_deadline".*FOR\s+INSERT\s+WITH\s+CHECK\s+\(.*auth\.uid\(\)\s*=\s*user_id.*now\(\)\s*<\s*'2026-06-12T00:00:00\+00'.*\)/is
      )
    })

    test('creates update_before_deadline policy with user_id check and deadline', () => {
      expect(sql).toMatch(/DROP\s+POLICY\s+IF\s+EXISTS\s+"scorer_update_before_deadline"/i)
      expect(sql).toMatch(
        /CREATE\s+POLICY\s+"scorer_update_before_deadline".*FOR\s+UPDATE\s+USING\s+\(.*auth\.uid\(\)\s*=\s*user_id.*now\(\)\s*<\s*'2026-06-12T00:00:00\+00'.*\)/is
      )
    })
  })

  describe('leaderboard view', () => {
    test('creates or replaces leaderboard view', () => {
      expect(sql).toMatch(/CREATE\s+OR\s+REPLACE\s+VIEW\s+leaderboard/i)
    })

    test('includes LEFT JOIN with scorer_predictions', () => {
      expect(sql).toMatch(/LEFT\s+JOIN\s+scorer_predictions\s+sp\s+ON\s+sp\.user_id\s*=\s*p\.id/i)
    })

    test('includes LEFT JOIN with bonus_predictions', () => {
      expect(sql).toMatch(/LEFT\s+JOIN\s+bonus_predictions\s+bp\s+ON\s+bp\.user_id\s*=\s*p\.id/i)
    })

    test('includes LEFT JOIN with predictions', () => {
      expect(sql).toMatch(/LEFT\s+JOIN\s+predictions\s+pr\s+ON\s+pr\.user_id\s*=\s*p\.id/i)
    })

    test('uses MAX(sp.scorer_points) to avoid GROUP BY change', () => {
      expect(sql).toMatch(/COALESCE\s*\(\s*MAX\s*\(\s*sp\.scorer_points\s*\)\s*,\s*0\s*\)/i)
    })

    test('uses MAX(bp.bonus_points) to avoid GROUP BY change', () => {
      expect(sql).toMatch(/COALESCE\s*\(\s*MAX\s*\(\s*bp\.bonus_points\s*\)\s*,\s*0\s*\)/i)
    })

    test('preserves exact_score_count tiebreaker', () => {
      expect(sql).toMatch(/COUNT\s*\(CASE\s+WHEN\s+pr\.points\s*=\s*10\s+THEN\s+1\s+END\)/i)
    })

    test('preserves winner_with_diff_count tiebreaker', () => {
      expect(sql).toMatch(/COUNT\s*\(CASE\s+WHEN\s+pr\.points\s*=\s*7\s+THEN\s+1\s+END\)/i)
    })

    test('preserves winner_correct_count tiebreaker', () => {
      expect(sql).toMatch(/COUNT\s*\(CASE\s+WHEN\s+pr\.points\s*=\s*3\s+THEN\s+1\s+END\)/i)
    })

    test('preserves order by with tiebreakers', () => {
      expect(sql).toMatch(
        /ORDER\s+BY\s+total_points\s+DESC,\s+exact_score_count\s+DESC,\s+winner_with_diff_count\s+DESC,\s+winner_correct_count\s+DESC,\s+p\.name\s+ASC/i
      )
    })

    test('does NOT add sp.scorer_points to GROUP BY', () => {
      const groupByMatch = sql.match(/GROUP\s+BY\s+(.+?)(?:\s+ORDER|$)/i)
      expect(groupByMatch).not.toBeNull()
      if (groupByMatch) {
        const groupByCols = groupByMatch[1]
        expect(groupByCols).not.toMatch(/sp\.scorer_points/i)
        expect(groupByCols).not.toMatch(/bp\.bonus_points/i)
        expect(groupByCols).toMatch(/p\.id/)
        expect(groupByCols).toMatch(/p\.name/)
        expect(groupByCols).toMatch(/p\.avatar_url/)
      }
    })

    test('preserves total_predictions column', () => {
      expect(sql).toMatch(/COUNT\s*\(\s*pr\.id\s*\)\s+AS\s+total_predictions/i)
    })

    test('preserves user_id, name, avatar_url columns', () => {
      expect(sql).toMatch(/p\.id\s+AS\s+user_id/i)
      expect(sql).toMatch(/p\.name/i)
      expect(sql).toMatch(/p\.avatar_url/i)
    })

    test('total_points includes all three sources: predictions, bonus_predictions, scorer_predictions', () => {
      expect(sql).toMatch(/COALESCE\s*\(\s*SUM\s*\(\s*pr\.points\s*\)\s*,\s*0\s*\)/)
      expect(sql).toMatch(/COALESCE\s*\(\s*MAX\s*\(\s*bp\.bonus_points\s*\)\s*,\s*0\s*\)/)
      expect(sql).toMatch(/COALESCE\s*\(\s*MAX\s*\(\s*sp\.scorer_points\s*\)\s*,\s*0\s*\)/)
    })
  })

  describe('idempotency', () => {
    test('uses IF NOT EXISTS for table creation', () => {
      expect(sql).toMatch(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS/i)
    })

    test('uses IF NOT EXISTS for all indexes', () => {
      const indexMatches = sql.match(/CREATE\s+INDEX/gi) || []
      const ifNotExistsMatches = sql.match(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS/gi) || []
      expect(indexMatches.length).toBe(ifNotExistsMatches.length)
      expect(indexMatches.length).toBeGreaterThanOrEqual(1)
    })

    test('uses DROP POLICY IF EXISTS before each CREATE POLICY', () => {
      const createPolicies = sql.match(/CREATE\s+POLICY/gi) || []
      const dropPolicies = sql.match(/DROP\s+POLICY\s+IF\s+EXISTS/gi) || []
      expect(createPolicies.length).toBe(dropPolicies.length)
      expect(createPolicies.length).toBe(4)
    })
  })

  describe('deadline timestamp', () => {
    test('uses SCORER_DEADLINE 2026-06-12T00:00:00+00 in all policies', () => {
      const deadlineOccurrences = sql.match(/2026-06-12T00:00:00\+00/g) || []
      expect(deadlineOccurrences.length).toBeGreaterThanOrEqual(3)
    })

    test('does not use BONUS_DEADLINE value by mistake', () => {
      const bonusDeadlineOccurrences = sql.match(/2026-06-18T16:00:00\+00/g) || []
      expect(bonusDeadlineOccurrences.length).toBe(0)
    })
  })
})
