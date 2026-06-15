import { describe, test, expect } from 'vitest'
import { TEAMS, BONUS_DEADLINE, getValidTeams, deriveFourthPlace } from '../bracketData'

describe('BONUS_DEADLINE', () => {
  test('exporta data correta (2026-06-18T16:00:00Z)', () => {
    expect(BONUS_DEADLINE).toBeInstanceOf(Date)
    expect(BONUS_DEADLINE.toISOString()).toBe('2026-06-18T16:00:00.000Z')
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

describe('getValidTeams', () => {
  test('first com picks vazio → retorna todos os 48 times', () => {
    const valid = getValidTeams('first', {})
    expect(valid.length).toBe(48)
  })

  test('second com first=Brasil (LEFT) → retorna apenas times RIGHT', () => {
    const valid = getValidTeams('second', { first: 'Brasil' })
    expect(valid.every(t => t.bracketHalf === 'RIGHT')).toBe(true)
  })

  test('second com first=Espanha (RIGHT) → retorna apenas times LEFT', () => {
    const valid = getValidTeams('second', { first: 'Espanha' })
    expect(valid.every(t => t.bracketHalf === 'LEFT')).toBe(true)
  })

  test('second com first=Brasil → não contém Brasil', () => {
    const valid = getValidTeams('second', { first: 'Brasil' })
    expect(valid.find(t => t.name === 'Brasil')).toBeUndefined()
  })

  test('third com picks [Brasil, Espanha] → não contém Brasil nem Espanha', () => {
    const valid = getValidTeams('third', { first: 'Brasil', second: 'Espanha' })
    expect(valid.find(t => t.name === 'Brasil')).toBeUndefined()
    expect(valid.find(t => t.name === 'Espanha')).toBeUndefined()
  })

  test('third → permite times de ambas as metades', () => {
    const valid = getValidTeams('third', { first: 'Brasil', second: 'Espanha' })
    expect(valid.some(t => t.bracketHalf === 'LEFT')).toBe(true)
    expect(valid.some(t => t.bracketHalf === 'RIGHT')).toBe(true)
  })

  test('fourth → retorna array vazio', () => {
    expect(getValidTeams('fourth', { first: 'Brasil', second: 'Espanha' })).toEqual([])
  })
})

describe('deriveFourthPlace', () => {
  test('com first=Brasil, second=Espanha, third=Argentina → retorna time RIGHT diferente de Espanha', () => {
    const result = deriveFourthPlace({ first: 'Brasil', second: 'Espanha', third: 'Argentina' })
    expect(result).not.toBeNull()
    const team = TEAMS.find(t => t.name === result)
    expect(team?.bracketHalf).toBe('RIGHT')
    expect(result).not.toBe('Espanha')
    expect(result).not.toBe('Brasil')
    expect(result).not.toBe('Argentina')
  })

  test('com first=Brasil, second=Espanha → retorna null (3º ausente)', () => {
    expect(deriveFourthPlace({ first: 'Brasil', second: 'Espanha' })).toBeNull()
  })

  test('com first=Brasil, second=Espanha, third=null → retorna null', () => {
    expect(deriveFourthPlace({ first: 'Brasil', second: 'Espanha', third: null })).toBeNull()
  })

  test('com picks vazio → retorna null', () => {
    expect(deriveFourthPlace({})).toBeNull()
  })
})
