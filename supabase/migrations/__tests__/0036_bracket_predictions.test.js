import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const migrationPath = resolve(import.meta.dirname, '..', '0036_bracket_predictions.sql')
let sql = ''

beforeAll(() => {
  sql = readFileSync(migrationPath, 'utf-8')
})

describe('Migration 0036: bracket_predictions', () => {
  test('migration file exists at correct path', () => {
    expect(existsSync(migrationPath)).toBe(true)
  })

  describe('table schema', () => {
    test('creates bracket_predictions table with IF NOT EXISTS', () => {
      expect(sql).toMatch(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+bracket_predictions/i)
    })

    test('has id column as UUID PRIMARY KEY with gen_random_uuid()', () => {
      expect(sql).toMatch(/id\s+UUID\s+PRIMARY\s+KEY\s+DEFAULT\s+gen_random_uuid\(\)/i)
    })

    test('has user_id column as UUID NOT NULL with FK to profiles', () => {
      expect(sql).toMatch(/user_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+profiles\s*\(\s*id\s*\)/i)
    })

    test('has bracket_slot column as TEXT NOT NULL', () => {
      expect(sql).toMatch(/bracket_slot\s+TEXT\s+NOT\s+NULL/i)
    })

    test('has predicted_winner column as TEXT NOT NULL', () => {
      expect(sql).toMatch(/predicted_winner\s+TEXT\s+NOT\s+NULL/i)
    })

    test('has bracket_points column as SMALLINT NOT NULL DEFAULT 0', () => {
      expect(sql).toMatch(/bracket_points\s+SMALLINT\s+NOT\s+NULL\s+DEFAULT\s+0/i)
    })

    test('has created_at column as TIMESTAMPTZ with default now()', () => {
      expect(sql).toMatch(/created_at\s+TIMESTAMPTZ\s+NOT\s+NULL\s+DEFAULT\s+now\(\)/i)
    })

    test('has updated_at column as TIMESTAMPTZ with default now()', () => {
      expect(sql).toMatch(/updated_at\s+TIMESTAMPTZ\s+NOT\s+NULL\s+DEFAULT\s+now\(\)/i)
    })
  })

  describe('constraints', () => {
    test('foreign key references profiles(id) with ON DELETE CASCADE', () => {
      expect(sql).toMatch(/REFERENCES\s+profiles\s*\(\s*id\s*\)\s+ON\s+DELETE\s+CASCADE/i)
    })

    test('unique constraint on (user_id, bracket_slot)', () => {
      expect(sql).toMatch(/UNIQUE\s*\(\s*user_id\s*,\s*bracket_slot\s*\)/i)
    })
  })

  describe('indexes', () => {
    test('creates index on user_id with IF NOT EXISTS', () => {
      expect(sql).toMatch(
        /CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_bracket_predictions_user\s+ON\s+bracket_predictions\s*\(\s*user_id\s*\)/i
      )
    })

    test('creates index on bracket_slot with IF NOT EXISTS', () => {
      expect(sql).toMatch(
        /CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_bracket_predictions_slot\s+ON\s+bracket_predictions\s*\(\s*bracket_slot\s*\)/i
      )
    })
  })

  describe('row level security', () => {
    test('enables RLS on bracket_predictions table', () => {
      expect(sql).toMatch(/ALTER\s+TABLE\s+bracket_predictions\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i)
    })

    test('creates bracket_insert_before_deadline policy for INSERT', () => {
      expect(sql).toMatch(/DROP\s+POLICY\s+IF\s+EXISTS\s+"bracket_insert_before_deadline"/i)
      expect(sql).toMatch(
        /CREATE\s+POLICY\s+"bracket_insert_before_deadline".*FOR\s+INSERT\s+WITH\s+CHECK/is
      )
    })

    test('INSERT policy checks auth.uid() = user_id', () => {
      expect(sql).toMatch(
        /bracket_insert_before_deadline.*WITH\s+CHECK\s*\(.*auth\.uid\(\)\s*=\s*user_id/is
      )
    })

    test('INSERT policy checks deadline with MIN(kickoff_at)', () => {
      expect(sql).toMatch(
        /bracket_insert_before_deadline.*WITH\s+CHECK\s*\(.*now\(\)\s*<.*SELECT\s+MIN\s*\(\s*kickoff_at\s*\)/is
      )
    })

    test('creates bracket_update_before_deadline policy for UPDATE', () => {
      expect(sql).toMatch(/DROP\s+POLICY\s+IF\s+EXISTS\s+"bracket_update_before_deadline"/i)
      expect(sql).toMatch(
        /CREATE\s+POLICY\s+"bracket_update_before_deadline".*FOR\s+UPDATE/is
      )
    })

    test('UPDATE policy checks auth.uid() = user_id in USING', () => {
      expect(sql).toMatch(
        /bracket_update_before_deadline.*FOR\s+UPDATE\s+USING\s*\(.*auth\.uid\(\)\s*=\s*user_id/is
      )
    })

    test('UPDATE policy checks deadline in WITH CHECK', () => {
      expect(sql).toMatch(
        /bracket_update_before_deadline.*WITH\s+CHECK\s*\(.*now\(\)\s*<.*SELECT\s+MIN\s*\(\s*kickoff_at\s*\)/is
      )
    })

    test('creates bracket_select policy for SELECT', () => {
      expect(sql).toMatch(/DROP\s+POLICY\s+IF\s+EXISTS\s+"bracket_select"/i)
      expect(sql).toMatch(
        /CREATE\s+POLICY\s+"bracket_select".*FOR\s+SELECT\s+USING/is
      )
    })

    test('SELECT policy allows own rows (auth.uid() = user_id)', () => {
      expect(sql).toMatch(
        /bracket_select.*FOR\s+SELECT\s+USING\s*\(.*auth\.uid\(\)\s*=\s*user_id/is
      )
    })

    test('SELECT policy allows others after deadline', () => {
      expect(sql).toMatch(
        /bracket_select.*FOR\s+SELECT\s+USING\s*\(.*OR\s+now\(\)\s*>=.*SELECT\s+MIN\s*\(\s*kickoff_at\s*\)/is
      )
    })

    test('deadline in RLS derived from matches with group_name = 16 Avos', () => {
      expect(sql).toMatch(/WHERE\s+group_name\s*=\s*'16\s+Avos'/i)
    })

    test('deadline subquery uses INTERVAL 15 minutes', () => {
      expect(sql).toMatch(/INTERVAL\s+'15\s+minutes'/i)
    })
  })

  describe('column privileges', () => {
    test('revokes INSERT privilege before granting specific columns', () => {
      expect(sql).toMatch(/REVOKE\s+INSERT\s+ON\s+bracket_predictions\s+FROM\s+authenticated/i)
    })

    test('grants INSERT on user_id, bracket_slot, predicted_winner', () => {
      expect(sql).toMatch(
        /GRANT\s+INSERT\s*\(\s*user_id\s*,\s*bracket_slot\s*,\s*predicted_winner\s*\)\s+ON\s+bracket_predictions\s+TO\s+authenticated/i
      )
    })

    test('revokes UPDATE privilege before granting specific columns', () => {
      expect(sql).toMatch(/REVOKE\s+UPDATE\s+ON\s+bracket_predictions\s+FROM\s+authenticated/i)
    })

    test('grants UPDATE on user_id, bracket_slot, predicted_winner', () => {
      expect(sql).toMatch(
        /GRANT\s+UPDATE\s*\(\s*user_id\s*,\s*bracket_slot\s*,\s*predicted_winner\s*\)\s+ON\s+bracket_predictions\s+TO\s+authenticated/i
      )
    })
  })

  describe('updated_at trigger', () => {
    test('drops existing bracket_predictions_set_updated_at trigger if it exists', () => {
      expect(sql).toMatch(/DROP\s+TRIGGER\s+IF\s+EXISTS\s+bracket_predictions_set_updated_at/i)
    })

    test('creates bracket_predictions_set_updated_at trigger', () => {
      expect(sql).toMatch(
        /CREATE\s+TRIGGER\s+bracket_predictions_set_updated_at\s+BEFORE\s+UPDATE\s+ON\s+bracket_predictions/i
      )
    })

    test('trigger uses set_updated_at() function', () => {
      expect(sql).toMatch(/EXECUTE\s+FUNCTION\s+set_updated_at\(\)/i)
    })

    test('trigger executes FOR EACH ROW', () => {
      expect(sql).toMatch(/FOR\s+EACH\s+ROW\s+EXECUTE\s+FUNCTION\s+set_updated_at\(\)/i)
    })
  })
})
