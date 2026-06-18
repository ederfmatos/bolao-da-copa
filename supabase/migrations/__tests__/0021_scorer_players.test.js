import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const migrationPath = resolve(import.meta.dirname, '..', '0021_scorer_players.sql')
let sql = ''

beforeAll(() => {
  sql = readFileSync(migrationPath, 'utf-8')
})

describe('Migration 0021: scorer_players', () => {
  test('migration file exists at correct path', () => {
    expect(existsSync(migrationPath)).toBe(true)
  })

  describe('table schema', () => {
    test('creates scorer_players table with IF NOT EXISTS', () => {
      expect(sql).toMatch(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+scorer_players/i)
    })

    test('has id column as UUID PRIMARY KEY with gen_random_uuid()', () => {
      expect(sql).toMatch(/id\s+UUID\s+PRIMARY\s+KEY\s+DEFAULT\s+gen_random_uuid\(\)/i)
    })

    test('has name column as TEXT NOT NULL', () => {
      expect(sql).toMatch(/name\s+TEXT\s+NOT\s+NULL/i)
    })

    test('has nationality column as TEXT NOT NULL', () => {
      expect(sql).toMatch(/nationality\s+TEXT\s+NOT\s+NULL/i)
    })

    test('has flag column as TEXT NOT NULL', () => {
      expect(sql).toMatch(/flag\s+TEXT\s+NOT\s+NULL/i)
    })

    test('has position column as TEXT NOT NULL with CHECK constraint', () => {
      expect(sql).toMatch(/position\s+TEXT\s+NOT\s+NULL\s+CHECK\s*\(.*position\s+IN\s+\(/i)
    })

    test('has goals column as SMALLINT NOT NULL DEFAULT 0', () => {
      expect(sql).toMatch(/goals\s+SMALLINT\s+NOT\s+NULL\s+DEFAULT\s+0/i)
    })

    test('has football_data_id column as INT', () => {
      expect(sql).toMatch(/football_data_id\s+INT/i)
    })

    test('has api_sports_id column as INT', () => {
      expect(sql).toMatch(/api_sports_id\s+INT/i)
    })
  })

  describe('constraints', () => {
    test('CHECK constraint allows only Forward, Midfielder, Defender', () => {
      expect(sql).toMatch(
        /CHECK\s*\(\s*position\s+IN\s*\(\s*'Forward'\s*,\s*'Midfielder'\s*,\s*'Defender'\s*\)\s*\)/i
      )
    })
  })

  describe('row level security', () => {
    test('enables RLS on scorer_players table', () => {
      expect(sql).toMatch(/ALTER\s+TABLE\s+scorer_players\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i)
    })

    test('creates public read policy', () => {
      expect(sql).toMatch(/DROP\s+POLICY\s+IF\s+EXISTS\s+"scorer_players_public_read"/i)
      expect(sql).toMatch(
        /CREATE\s+POLICY\s+"scorer_players_public_read".*FOR\s+SELECT\s+USING\s+\(true\)/is
      )
    })
  })

  describe('seed data', () => {
    test('inserts exactly 30 rows', () => {
      const insertMatches = sql.match(/INSERT\s+INTO\s+scorer_players\s+.*VALUES\s*\(/is)
      expect(insertMatches).not.toBeNull()

      const valuesSection = sql.match(/VALUES\s*\((?:[^;]|\(\s*NULL\s*,\s*NULL\s*\))*\)/is)
      const rowCount = (sql.match(/,\s*\(/g) || []).length + 1
      expect(rowCount).toBe(30)
    })

    test('every row has non-null name, nationality, flag, and position', () => {
      const rows = extractRows(sql)
      expect(rows.length).toBe(30)
      rows.forEach((row, i) => {
        expect(row.name, `Row ${i + 1}: name is required`).toBeTruthy()
        expect(row.nationality, `Row ${i + 1}: nationality is required`).toBeTruthy()
        expect(row.flag, `Row ${i + 1}: flag is required`).toBeTruthy()
        expect(row.position, `Row ${i + 1}: position is required`).toBeTruthy()
      })
    })

    test('position values are restricted to Forward, Midfielder, Defender', () => {
      const rows = extractRows(sql)
      const validPositions = ['Forward', 'Midfielder', 'Defender']
      rows.forEach((row, i) => {
        expect(validPositions, `Row ${i + 1}: invalid position "${row.position}"`).toContain(
          row.position
        )
      })
    })

    test('all goals values default to 0', () => {
      const rows = extractRows(sql)
      rows.forEach((row, i) => {
        expect(row.goals, `Row ${i + 1}: goals should be 0`).toBe('0')
      })
    })

    test('football_data_id and api_sports_id may be NULL', () => {
      const insertRegex = /INSERT\s+INTO\s+scorer_players[\s\S]*?VALUES\s*\(([\s\S]*?)\);\s*$/im
      const match = sql.match(insertRegex)
      expect(match).not.toBeNull()
    })
  })

  describe('idempotency', () => {
    test('uses IF NOT EXISTS for table creation', () => {
      expect(sql).toMatch(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS/i)
    })

    test('uses DROP POLICY IF EXISTS before each CREATE POLICY', () => {
      const createPolicies = sql.match(/CREATE\s+POLICY/gi) || []
      const dropPolicies = sql.match(/DROP\s+POLICY\s+IF\s+EXISTS/gi) || []
      expect(createPolicies.length).toBe(dropPolicies.length)
    })
  })
})

// Helper: extract seeded rows from the INSERT statement
function extractRows(sqlText) {
  const insertMatch = sqlText.match(
    /INSERT\s+INTO\s+scorer_players\s*\([^)]+\)\s*VALUES\s*([\s\S]*?);/i
  )
  if (!insertMatch) return []

  const valuesBlock = insertMatch[1]
  const rowRegex = /\(\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*(\d+)\s*,\s*(NULL|\d+)\s*,\s*(NULL|\d+)\s*\)/g
  const rows = []
  let rowMatch

  while ((rowMatch = rowRegex.exec(valuesBlock)) !== null) {
    rows.push({
      name: rowMatch[1],
      nationality: rowMatch[2],
      flag: rowMatch[3],
      position: rowMatch[4],
      goals: rowMatch[5],
      football_data_id: rowMatch[6],
      api_sports_id: rowMatch[7],
    })
  }

  return rows
}
