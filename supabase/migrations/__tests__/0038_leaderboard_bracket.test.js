import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const migrationPath = resolve(import.meta.dirname, '..', '0038_leaderboard_bracket.sql')
let sql = ''

beforeAll(() => {
  sql = readFileSync(migrationPath, 'utf-8')
})

describe('Migration 0038: leaderboard_bracket', () => {
  test('migration file exists at correct path', () => {
    expect(existsSync(migrationPath)).toBe(true)
  })

  describe('leaderboard view', () => {
    test('creates or replaces leaderboard view', () => {
      expect(sql).toMatch(/CREATE\s+OR\s+REPLACE\s+VIEW\s+leaderboard/i)
    })

    test('exposes group_points as COALESCE(SUM(pr.points), 0)', () => {
      expect(sql).toMatch(/COALESCE\s*\(\s*SUM\s*\(\s*pr\.points\s*\)\s*,\s*0\s*\)\s+AS\s+group_points/i)
    })

    test('exposes bracket_points as COALESCE(SUM(bp.bracket_points), 0)', () => {
      expect(sql).toMatch(/COALESCE\s*\(\s*SUM\s*\(\s*bp\.bracket_points\s*\)\s*,\s*0\s*\)\s+AS\s+bracket_points/i)
    })

    test('exposes scorer_points as COALESCE(MAX(sp.scorer_points), 0)', () => {
      expect(sql).toMatch(/COALESCE\s*\(\s*MAX\s*\(\s*sp\.scorer_points\s*\)\s*,\s*0\s*\)\s+AS\s+scorer_points/i)
    })

    test('total_points = group_points + bracket_points + scorer_points', () => {
      expect(sql).toMatch(/COALESCE\s*\(\s*SUM\s*\(\s*pr\.points\s*\)\s*,\s*0\s*\)\s*\+/)
      expect(sql).toMatch(/COALESCE\s*\(\s*SUM\s*\(\s*bp\.bracket_points\s*\)\s*,\s*0\s*\)\s*\+/)
      expect(sql).toMatch(/COALESCE\s*\(\s*MAX\s*\(\s*sp\.scorer_points\s*\)\s*,\s*0\s*\)/)
    })

    test('includes LEFT JOIN with bracket_predictions', () => {
      expect(sql).toMatch(/LEFT\s+JOIN\s+bracket_predictions\s+bp\s+ON\s+bp\.user_id\s*=\s*p\.id/i)
    })

    test('includes LEFT JOIN with predictions', () => {
      expect(sql).toMatch(/LEFT\s+JOIN\s+predictions\s+pr\s+ON\s+pr\.user_id\s*=\s*p\.id/i)
    })

    test('includes LEFT JOIN with scorer_predictions', () => {
      expect(sql).toMatch(/LEFT\s+JOIN\s+scorer_predictions\s+sp\s+ON\s+sp\.user_id\s*=\s*p\.id/i)
    })

    test('does NOT include LEFT JOIN with bonus_predictions', () => {
      expect(sql).not.toMatch(/LEFT\s+JOIN\s+bonus_predictions/i)
    })

    test('preserves total_predictions column', () => {
      expect(sql).toMatch(/COUNT\s*\(\s*pr\.id\s*\)\s+AS\s+total_predictions/i)
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

    test('GROUP BY only p.id, p.name, p.avatar_url', () => {
      const groupByMatch = sql.match(/GROUP\s+BY\s+(.+?)(?:\s+ORDER|$)/i)
      expect(groupByMatch).not.toBeNull()
      if (groupByMatch) {
        const groupByCols = groupByMatch[1]
        expect(groupByCols).toMatch(/p\.id/)
        expect(groupByCols).toMatch(/p\.name/)
        expect(groupByCols).toMatch(/p\.avatar_url/)
        expect(groupByCols).not.toMatch(/bp\.bracket_points/i)
        expect(groupByCols).not.toMatch(/sp\.scorer_points/i)
      }
    })

    test('preserves user_id, name, avatar_url columns', () => {
      expect(sql).toMatch(/p\.id\s+AS\s+user_id/i)
      expect(sql).toMatch(/p\.name/i)
      expect(sql).toMatch(/p\.avatar_url/i)
    })
  })

  describe('idempotency', () => {
    test('uses CREATE OR REPLACE VIEW for idempotent application', () => {
      expect(sql).toMatch(/CREATE\s+OR\s+REPLACE\s+VIEW\s+leaderboard/i)
    })
  })
})
