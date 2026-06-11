import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const migrationPath = resolve(import.meta.dirname, '..', '0009_cron_notifications.sql')
let sql = ''

beforeAll(() => {
  sql = readFileSync(migrationPath, 'utf-8')
})

describe('Migration 0009: cron notifications', () => {
  test('migration file exists at correct path', () => {
    expect(existsSync(migrationPath)).toBe(true)
  })

  describe('daily-digest cron job', () => {
    test('creates cron job with name daily-digest-8am', () => {
      expect(sql).toMatch(/'daily-digest-8am'/)
    })

    test('daily-digest cron expression is 0 8 * * *', () => {
      expect(sql).toMatch(/'0\s+8\s+\*\s+\*\s+\*'/)
    })

    test('daily-digest calls send-notifications endpoint', () => {
      expect(sql).toMatch(/\/functions\/v1\/send-notifications/)
    })

    test('daily-digest passes type daily-digest in body', () => {
      const scheduleStart = sql.indexOf("cron.schedule(\n  'daily-digest-8am'")
      const scheduleEnd = sql.indexOf("'America/Sao_Paulo'", scheduleStart) + 30
      const dailyDigestSection = sql.substring(scheduleStart, scheduleEnd)
      expect(dailyDigestSection).toMatch(/'daily-digest'/)
    })

    test('daily-digest uses America/Sao_Paulo timezone', () => {
      const scheduleStart = sql.indexOf("cron.schedule(\n  'daily-digest-8am'")
      const scheduleEnd = sql.indexOf("'America/Sao_Paulo'", scheduleStart) + 30
      const dailyDigestSection = sql.substring(scheduleStart, scheduleEnd)
      expect(dailyDigestSection).toMatch(/'America\/Sao_Paulo'/)
    })
  })

  describe('deadline-reminder cron job', () => {
    test('creates cron job with name deadline-reminders-15min', () => {
      expect(sql).toMatch(/'deadline-reminders-15min'/)
    })

    test('deadline-reminder cron expression is */15 * * * *', () => {
      expect(sql).toMatch(/'\*\/15\s+\*\s+\*\s+\*\s+\*'/)
    })

    test('deadline-reminder calls send-notifications endpoint', () => {
      expect(sql).toMatch(/\/functions\/v1\/send-notifications/g)
    })

    test('deadline-reminder passes type deadline-reminder in body', () => {
      const scheduleStart = sql.indexOf("cron.schedule(\n  'deadline-reminders-15min'")
      const deadlineSection = sql.substring(scheduleStart)
      expect(deadlineSection).toMatch(/'deadline-reminder'/)
    })

    test('deadline-reminder uses America/Sao_Paulo timezone', () => {
      const scheduleStart = sql.indexOf("cron.schedule(\n  'deadline-reminders-15min'")
      const deadlineSection = sql.substring(scheduleStart)
      expect(deadlineSection).toMatch(/'America\/Sao_Paulo'/)
    })
  })

  describe('authentication', () => {
    test('both jobs use vault secrets for supabase_url', () => {
      const urlRefs = sql.match(/current_setting\('app\.settings\.supabase_url'\)/g) || []
      expect(urlRefs.length).toBeGreaterThanOrEqual(2)
    })

    test('both jobs use vault secrets for service_role_key', () => {
      const keyRefs = sql.match(/current_setting\('app\.settings\.service_role_key'\)/g) || []
      expect(keyRefs.length).toBeGreaterThanOrEqual(2)
    })

    test('both jobs set Authorization header with Bearer token', () => {
      const authHeaders = sql.match(/'Authorization',\s*'Bearer\s+'\s*\|\|/g) || []
      expect(authHeaders.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('pg_net usage', () => {
    test('both jobs use net.http_post for HTTP calls', () => {
      const httpPosts = sql.match(/net\.http_post/g) || []
      expect(httpPosts.length).toBe(2)
    })

    test('both jobs set Content-Type header', () => {
      const contentTypes = sql.match(/'Content-Type',\s*'application\/json'/g) || []
      expect(contentTypes.length).toBe(2)
    })
  })

  describe('cron.schedule usage', () => {
    test('uses cron.schedule for both jobs', () => {
      const schedules = sql.match(/cron\.schedule\(/g) || []
      expect(schedules.length).toBe(2)
    })
  })

  describe('idempotency', () => {
    test('unschedules daily-digest-8am before scheduling', () => {
      expect(sql).toMatch(/cron\.unschedule\('daily-digest-8am'\)/)
    })

    test('unschedules deadline-reminders-15min before scheduling', () => {
      expect(sql).toMatch(/cron\.unschedule\('deadline-reminders-15min'\)/)
    })

    test('uses EXCEPTION handling for unschedule idempotency', () => {
      const exceptionBlocks = sql.match(/EXCEPTION\s+WHEN\s+OTHERS/gi) || []
      expect(exceptionBlocks.length).toBe(2)
    })
  })
})
