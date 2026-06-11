import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const migrationPath = resolve(import.meta.dirname, '..', '0008_notifications.sql')
let sql = ''

beforeAll(() => {
  sql = readFileSync(migrationPath, 'utf-8')
})

describe('Migration 0008: push_subscriptions', () => {
  test('migration file exists at correct path', () => {
    expect(existsSync(migrationPath)).toBe(true)
  })

  describe('table schema', () => {
    test('creates push_subscriptions table with IF NOT EXISTS', () => {
      expect(sql).toMatch(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+push_subscriptions/i)
    })

    test('has id column as UUID PRIMARY KEY with gen_random_uuid()', () => {
      expect(sql).toMatch(/id\s+UUID\s+PRIMARY\s+KEY\s+DEFAULT\s+gen_random_uuid\(\)/i)
    })

    test('has user_id column as UUID NOT NULL', () => {
      expect(sql).toMatch(/user_id\s+UUID\s+NOT\s+NULL/i)
    })

    test('has endpoint column as TEXT NOT NULL', () => {
      expect(sql).toMatch(/endpoint\s+TEXT\s+NOT\s+NULL/i)
    })

    test('has p256dh_key column as TEXT NOT NULL', () => {
      expect(sql).toMatch(/p256dh_key\s+TEXT\s+NOT\s+NULL/i)
    })

    test('has auth_key column as TEXT NOT NULL', () => {
      expect(sql).toMatch(/auth_key\s+TEXT\s+NOT\s+NULL/i)
    })

    test('has created_at column as TIMESTAMPTZ with default now()', () => {
      expect(sql).toMatch(/created_at\s+TIMESTAMPTZ\s+NOT\s+NULL\s+DEFAULT\s+now\(\)/i)
    })
  })

  describe('constraints', () => {
    test('foreign key references profiles(id) with ON DELETE CASCADE', () => {
      expect(sql).toMatch(/REFERENCES\s+profiles\s*\(\s*id\s*\)\s+ON\s+DELETE\s+CASCADE/i)
    })

    test('unique constraint on endpoint column', () => {
      expect(sql).toMatch(/endpoint\s+TEXT\s+NOT\s+NULL\s+UNIQUE/i)
    })
  })

  describe('indexes', () => {
    test('creates index on user_id with IF NOT EXISTS', () => {
      expect(sql).toMatch(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_push_subscriptions_user\s+ON\s+push_subscriptions\s*\(\s*user_id\s*\)/i)
    })

    test('creates index on endpoint with IF NOT EXISTS', () => {
      expect(sql).toMatch(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_push_subscriptions_endpoint\s+ON\s+push_subscriptions\s*\(\s*endpoint\s*\)/i)
    })
  })

  describe('row level security', () => {
    test('enables RLS on push_subscriptions table', () => {
      expect(sql).toMatch(/ALTER\s+TABLE\s+push_subscriptions\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i)
    })

    test('creates read_own policy for users', () => {
      expect(sql).toMatch(/DROP\s+POLICY\s+IF\s+EXISTS\s+"push_subscriptions_read_own"/i)
      expect(sql).toMatch(/CREATE\s+POLICY\s+"push_subscriptions_read_own".*FOR\s+SELECT\s+USING\s+\(auth\.uid\(\)\s*=\s*user_id\)/is)
    })

    test('creates insert_own policy for users', () => {
      expect(sql).toMatch(/DROP\s+POLICY\s+IF\s+EXISTS\s+"push_subscriptions_insert_own"/i)
      expect(sql).toMatch(/CREATE\s+POLICY\s+"push_subscriptions_insert_own".*FOR\s+INSERT\s+WITH\s+CHECK\s+\(auth\.uid\(\)\s*=\s*user_id\)/is)
    })

    test('creates delete_own policy for users', () => {
      expect(sql).toMatch(/DROP\s+POLICY\s+IF\s+EXISTS\s+"push_subscriptions_delete_own"/i)
      expect(sql).toMatch(/CREATE\s+POLICY\s+"push_subscriptions_delete_own".*FOR\s+DELETE\s+USING\s+\(auth\.uid\(\)\s*=\s*user_id\)/is)
    })

    test('creates service_read_all policy for service role', () => {
      expect(sql).toMatch(/DROP\s+POLICY\s+IF\s+EXISTS\s+"push_subscriptions_service_read_all"/i)
      expect(sql).toMatch(/CREATE\s+POLICY\s+"push_subscriptions_service_read_all".*FOR\s+SELECT\s+USING\s+\(auth\.role\(\)\s*=\s*'service_role'\)/is)
    })

    test('creates service_delete_all policy for service role', () => {
      expect(sql).toMatch(/DROP\s+POLICY\s+IF\s+EXISTS\s+"push_subscriptions_service_delete_all"/i)
      expect(sql).toMatch(/CREATE\s+POLICY\s+"push_subscriptions_service_delete_all".*FOR\s+DELETE\s+USING\s+\(auth\.role\(\)\s*=\s*'service_role'\)/is)
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
      expect(indexMatches.length).toBeGreaterThanOrEqual(2)
    })

    test('uses DROP POLICY IF EXISTS before each CREATE POLICY', () => {
      const createPolicies = sql.match(/CREATE\s+POLICY/gi) || []
      const dropPolicies = sql.match(/DROP\s+POLICY\s+IF\s+EXISTS/gi) || []
      expect(createPolicies.length).toBe(dropPolicies.length)
      expect(createPolicies.length).toBe(5)
    })
  })
})
