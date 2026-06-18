import { describe, test, expect } from 'vitest'
import { TEAMS, BONUS_DEADLINE, SCORER_DEADLINE, BRACKET_DETERMINED, getValidTeams, deriveFourthPlace } from '../bracketData'

describe('BONUS_DEADLINE', () => {
  test('exporta data correta (2026-06-21T21:00:00Z)', () => {
    expect(BONUS_DEADLINE).toBeInstanceOf(Date)
    expect(BONUS_DEADLINE.toISOString()).toBe('2026-06-21T21:00:00.000Z')
  })
})

describe('SCORER_DEADLINE', () => {
  test('é uma instância válida de Date', () => {
    expect(SCORER_DEADLINE).toBeInstanceOf(Date)
  })

  test('exporta data correta (2026-06-21T21:00:00Z)', () => {
    expect(SCORER_DEADLINE.toISOString()).toBe('2026-06-21T21:00:00.000Z')
  })

  test('é igual a BONUS_DEADLINE (mesmo prazo)', () => {
    expect(SCORER_DEADLINE.getTime()).toBe(BONUS_DEADLINE.getTime())
  })
})

describe('TEAMS', () => {
  test('contém 48 times', () => {
    expect(TEAMS.length).toBe(48)
  })

  test('cada time tem name, flag, bracketHalf', () => {
    for (const t of TEAMS) {
      expect(t).toHaveProperty('name')
      expect(t).toHaveProperty('flag')
      expect(t).toHaveProperty('bracketHalf')
    }
  })

  test('todos os bracketHalf são LEFT ou RIGHT', () => {
    for (const t of TEAMS) {
      expect(['LEFT', 'RIGHT']).toContain(t.bracketHalf)
    }
  })

  test('nomes correspondem exatamente ao seed: Países Baixos, Estados Unidos, Bósnia e Herzegovina, RD Congo, Tchéquia, Curaçao', () => {
    const names = TEAMS.map(t => t.name)
    expect(names).toContain('Países Baixos')
    expect(names).toContain('Estados Unidos')
    expect(names).toContain('Bósnia e Herzegovina')
    expect(names).toContain('RD Congo')
    expect(names).toContain('Tchéquia')
    expect(names).toContain('Curaçao')
  })
})

describe('BRACKET_DETERMINED', () => {
  test('está desativado (false) enquanto o bracket real não é conhecido', () => {
    expect(BRACKET_DETERMINED).toBe(false)
  })
})

describe('Existing exports integrity', () => {
  test('BONUS_DEADLINE continua exportado e inalterado', () => {
    expect(BONUS_DEADLINE).toBeInstanceOf(Date)
    expect(BONUS_DEADLINE.toISOString()).toBe('2026-06-21T21:00:00.000Z')
  })

  test('TEAMS continua exportado com 48 elementos', () => {
    expect(Array.isArray(TEAMS)).toBe(true)
    expect(TEAMS.length).toBe(48)
  })

  test('BRACKET_DETERMINED continua exportado e é false', () => {
    expect(BRACKET_DETERMINED).toBe(false)
  })
})

describe('getValidTeams (BRACKET_DETERMINED = false)', () => {
  test('first com picks vazio → retorna todos os 48 times', () => {
    const valid = getValidTeams('first', {})
    expect(valid.length).toBe(48)
  })

  test('second com first=Brasil → retorna todos exceto Brasil (sem filtro de bracketHalf)', () => {
    const valid = getValidTeams('second', { first: 'Brasil' })
    expect(valid.find(t => t.name === 'Brasil')).toBeUndefined()
    expect(valid.some(t => t.bracketHalf === 'LEFT')).toBe(true)
    expect(valid.some(t => t.bracketHalf === 'RIGHT')).toBe(true)
  })

  test('second com first=Espanha → retorna todos exceto Espanha (sem filtro de bracketHalf)', () => {
    const valid = getValidTeams('second', { first: 'Espanha' })
    expect(valid.find(t => t.name === 'Espanha')).toBeUndefined()
    expect(valid.some(t => t.bracketHalf === 'LEFT')).toBe(true)
    expect(valid.some(t => t.bracketHalf === 'RIGHT')).toBe(true)
  })

  test('third com picks [Brasil, Espanha] → não contém Brasil nem Espanha', () => {
    const valid = getValidTeams('third', { first: 'Brasil', second: 'Espanha' })
    expect(valid.find(t => t.name === 'Brasil')).toBeUndefined()
    expect(valid.find(t => t.name === 'Espanha')).toBeUndefined()
  })

  test('fourth com picks [Brasil, Espanha, Argentina] → retorna todos os demais', () => {
    const valid = getValidTeams('fourth', { first: 'Brasil', second: 'Espanha', third: 'Argentina' })
    expect(valid.find(t => t.name === 'Brasil')).toBeUndefined()
    expect(valid.find(t => t.name === 'Espanha')).toBeUndefined()
    expect(valid.find(t => t.name === 'Argentina')).toBeUndefined()
    expect(valid.length).toBe(45)
  })
})

describe('deriveFourthPlace (BRACKET_DETERMINED = false)', () => {
  test('sempre retorna null enquanto BRACKET_DETERMINED = false', () => {
    expect(deriveFourthPlace({ first: 'Brasil', second: 'Espanha', third: 'Argentina' })).toBeNull()
    expect(deriveFourthPlace({ first: 'Brasil', second: 'Espanha' })).toBeNull()
    expect(deriveFourthPlace({})).toBeNull()
  })
})
