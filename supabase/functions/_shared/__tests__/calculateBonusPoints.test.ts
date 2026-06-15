import { describe, test, expect } from 'vitest'
import { calculateBonusPoints } from '../calculateBonusPoints'

describe('calculateBonusPoints', () => {
  test('0 correct → 0 pts', () => {
    const prediction = {
      first_place: 'Brasil', second_place: 'Argentina',
      third_place: 'França', fourth_place: 'Alemanha',
    }
    const standings = {
      first: 'Espanha', second: 'Portugal',
      third: 'Inglaterra', fourth: 'Países Baixos',
    }
    expect(calculateBonusPoints(prediction, standings)).toBe(0)
  })

  test('apenas campeão correto → 50 pts', () => {
    const prediction = {
      first_place: 'Brasil', second_place: 'Argentina',
      third_place: 'França', fourth_place: 'Alemanha',
    }
    const standings = {
      first: 'Brasil', second: 'Portugal',
      third: 'Inglaterra', fourth: 'Países Baixos',
    }
    expect(calculateBonusPoints(prediction, standings)).toBe(50)
  })

  test('2 acertos quaisquer → 100 pts', () => {
    const prediction = {
      first_place: 'Brasil', second_place: 'Argentina',
      third_place: 'França', fourth_place: 'Alemanha',
    }
    const standings = {
      first: 'Brasil', second: 'Argentina',
      third: 'Inglaterra', fourth: 'Países Baixos',
    }
    expect(calculateBonusPoints(prediction, standings)).toBe(100)
  })

  test('3 acertos → 150 pts', () => {
    const prediction = {
      first_place: 'Brasil', second_place: 'Argentina',
      third_place: 'França', fourth_place: 'Alemanha',
    }
    const standings = {
      first: 'Brasil', second: 'Argentina',
      third: 'França', fourth: 'Países Baixos',
    }
    expect(calculateBonusPoints(prediction, standings)).toBe(150)
  })

  test('todos 4 corretos → 250 pts (bônus extra)', () => {
    const prediction = {
      first_place: 'Brasil', second_place: 'Argentina',
      third_place: 'França', fourth_place: 'Alemanha',
    }
    const standings = {
      first: 'Brasil', second: 'Argentina',
      third: 'França', fourth: 'Alemanha',
    }
    expect(calculateBonusPoints(prediction, standings)).toBe(250)
  })

  test('standings parcial com apenas first/second definidos e prediction com 3º correto → não conta 3º', () => {
    const prediction = {
      first_place: 'Brasil', second_place: 'Argentina',
      third_place: 'França', fourth_place: 'Alemanha',
    }
    const standings = {
      first: 'Brasil', second: 'Argentina',
    }
    expect(calculateBonusPoints(prediction, standings)).toBe(100)
  })
})
