import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { formatTimeRemaining } from '../timeUtils'

describe('formatTimeRemaining', () => {
  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-15T12:00:00Z'))
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  test('returns null when kickoff is in the past', () => {
    expect(formatTimeRemaining(new Date('2026-06-14T12:00:00Z'))).toBeNull()
  })

  test('returns null when kickoff is now', () => {
    expect(formatTimeRemaining(new Date('2026-06-15T12:00:00Z'))).toBeNull()
  })

  test('formats hours and minutes', () => {
    expect(formatTimeRemaining(new Date('2026-06-15T13:10:00Z'))).toBe('1 hora e 10 minutos')
  })

  test('formats only hours when minutes is 0', () => {
    expect(formatTimeRemaining(new Date('2026-06-15T14:00:00Z'))).toBe('2 horas')
  })

  test('formats only minutes when hours is 0', () => {
    expect(formatTimeRemaining(new Date('2026-06-15T12:57:00Z'))).toBe('57 minutos')
  })

  test('uses singular for 1 hour', () => {
    expect(formatTimeRemaining(new Date('2026-06-15T13:00:00Z'))).toBe('1 hora')
  })

  test('uses singular for 1 minute', () => {
    expect(formatTimeRemaining(new Date('2026-06-15T12:01:00Z'))).toBe('1 minuto')
  })

  test('uses singular for 1 hour and 1 minute', () => {
    expect(formatTimeRemaining(new Date('2026-06-15T13:01:00Z'))).toBe('1 hora e 1 minuto')
  })

  test('formats many hours and minutes', () => {
    expect(formatTimeRemaining(new Date('2026-06-15T16:42:00Z'))).toBe('4 horas e 42 minutos')
  })
})
