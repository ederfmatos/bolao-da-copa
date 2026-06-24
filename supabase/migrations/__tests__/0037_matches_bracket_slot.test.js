import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const migrationPath = resolve(import.meta.dirname, '..', '0037_matches_bracket_slot.sql')
let sql = ''

beforeAll(() => {
  sql = readFileSync(migrationPath, 'utf-8')
})

describe('Migration 0037: matches.bracket_slot', () => {
  test('migration file exists at correct path', () => {
    expect(existsSync(migrationPath)).toBe(true)
  })

  describe('column schema', () => {
    test('adds bracket_slot column to matches table', () => {
      expect(sql).toMatch(/ALTER\s+TABLE\s+matches\s+ADD\s+COLUMN\s+bracket_slot\s+TEXT/i)
    })

    test('bracket_slot column is TEXT type', () => {
      expect(sql).toMatch(/bracket_slot\s+TEXT/i)
    })

    test('bracket_slot column does NOT have NOT NULL constraint', () => {
      // Verify the line doesn't have NOT NULL
      const bracketSlotLine = sql.match(/bracket_slot\s+TEXT[^;,\n]*/i)
      expect(bracketSlotLine).toBeTruthy()
      expect(bracketSlotLine[0]).not.toMatch(/NOT\s+NULL/i)
    })

    test('bracket_slot column does NOT have default value', () => {
      // Verify no DEFAULT clause in the column definition
      const bracketSlotLine = sql.match(/bracket_slot\s+TEXT[^;,\n]*/i)
      expect(bracketSlotLine).toBeTruthy()
      expect(bracketSlotLine[0]).not.toMatch(/DEFAULT/i)
    })
  })

  describe('partial index', () => {
    test('creates partial index on bracket_slot column', () => {
      expect(sql).toMatch(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_matches_bracket_slot/i)
    })

    test('index is on matches(bracket_slot)', () => {
      expect(sql).toMatch(
        /CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_matches_bracket_slot\s+ON\s+matches\s*\(\s*bracket_slot\s*\)/i
      )
    })

    test('index has WHERE clause for bracket_slot IS NOT NULL', () => {
      expect(sql).toMatch(/WHERE\s+bracket_slot\s+IS\s+NOT\s+NULL/i)
    })
  })

  describe('backward compatibility', () => {
    test('migration uses ALTER TABLE ADD COLUMN (non-destructive)', () => {
      expect(sql).toMatch(/ALTER\s+TABLE\s+matches\s+ADD\s+COLUMN/i)
    })

    test('migration does not drop or modify existing columns', () => {
      // Should not contain DROP COLUMN or similar destructive operations
      expect(sql).not.toMatch(/DROP\s+COLUMN/i)
      expect(sql).not.toMatch(/TRUNCATE/i)
      expect(sql).not.toMatch(/DELETE\s+FROM/i)
    })

    test('migration does not modify existing data', () => {
      // Should not contain any UPDATE statements that would change existing rows
      expect(sql).not.toMatch(/UPDATE\s+matches/i)
    })
  })
})
