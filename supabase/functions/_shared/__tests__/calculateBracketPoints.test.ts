import { describe, test, expect } from 'vitest'
import { calculateBracketPoints } from '../calculateBracketPoints'

describe('calculateBracketPoints', () => {
  describe('Round of 32 (R32_01) - 16 Avos', () => {
    test('correct winner, correct opponent → 5 pts', () => {
      const points = calculateBracketPoints({
        slot: 'R32_01',
        actualWinner: 'Brazil',
        actualOpponent: 'Mexico',
        userPredictedWinner: 'Brazil',
        userPredictedOpponent: 'Mexico',
      })
      expect(points).toBe(5)
    })

    test('incorrect winner → 0 pts', () => {
      const points = calculateBracketPoints({
        slot: 'R32_01',
        actualWinner: 'Brazil',
        actualOpponent: 'Mexico',
        userPredictedWinner: 'Mexico',
        userPredictedOpponent: 'Brazil',
      })
      expect(points).toBe(0)
    })

    test('correct winner, different opponent → 5 pts (no partial credit for R32)', () => {
      const points = calculateBracketPoints({
        slot: 'R32_01',
        actualWinner: 'Brazil',
        actualOpponent: 'Mexico',
        userPredictedWinner: 'Brazil',
        userPredictedOpponent: 'Argentina',
      })
      expect(points).toBe(5)
    })
  })

  describe('Round of 16 (R16_01) - Oitavas', () => {
    test('correct winner, correct opponent → 7 pts', () => {
      const points = calculateBracketPoints({
        slot: 'R16_01',
        actualWinner: 'Brazil',
        actualOpponent: 'Mexico',
        userPredictedWinner: 'Brazil',
        userPredictedOpponent: 'Mexico',
      })
      expect(points).toBe(7)
    })

    test('correct winner, different opponent → 5 pts (partial credit)', () => {
      const points = calculateBracketPoints({
        slot: 'R16_01',
        actualWinner: 'Brazil',
        actualOpponent: 'Mexico',
        userPredictedWinner: 'Brazil',
        userPredictedOpponent: 'Argentina',
      })
      expect(points).toBe(5)
    })

    test('incorrect winner → 0 pts', () => {
      const points = calculateBracketPoints({
        slot: 'R16_01',
        actualWinner: 'Brazil',
        actualOpponent: 'Mexico',
        userPredictedWinner: 'Mexico',
        userPredictedOpponent: 'Brazil',
      })
      expect(points).toBe(0)
    })
  })

  describe('Quarter-finals (QF_01) - Quartas', () => {
    test('correct winner, correct opponent → 9 pts', () => {
      const points = calculateBracketPoints({
        slot: 'QF_01',
        actualWinner: 'Brazil',
        actualOpponent: 'Mexico',
        userPredictedWinner: 'Brazil',
        userPredictedOpponent: 'Mexico',
      })
      expect(points).toBe(9)
    })

    test('correct winner, different opponent → 7 pts (partial credit)', () => {
      const points = calculateBracketPoints({
        slot: 'QF_01',
        actualWinner: 'Brazil',
        actualOpponent: 'Mexico',
        userPredictedWinner: 'Brazil',
        userPredictedOpponent: 'Argentina',
      })
      expect(points).toBe(7)
    })

    test('incorrect winner → 0 pts', () => {
      const points = calculateBracketPoints({
        slot: 'QF_01',
        actualWinner: 'Brazil',
        actualOpponent: 'Mexico',
        userPredictedWinner: 'Mexico',
        userPredictedOpponent: 'Brazil',
      })
      expect(points).toBe(0)
    })
  })

  describe('Semi-finals (SF_01) - Semifinais', () => {
    test('correct winner, correct opponent → 11 pts', () => {
      const points = calculateBracketPoints({
        slot: 'SF_01',
        actualWinner: 'Brazil',
        actualOpponent: 'Mexico',
        userPredictedWinner: 'Brazil',
        userPredictedOpponent: 'Mexico',
      })
      expect(points).toBe(11)
    })

    test('correct winner, different opponent → 9 pts (partial credit)', () => {
      const points = calculateBracketPoints({
        slot: 'SF_01',
        actualWinner: 'Brazil',
        actualOpponent: 'Mexico',
        userPredictedWinner: 'Brazil',
        userPredictedOpponent: 'Argentina',
      })
      expect(points).toBe(9)
    })
  })

  describe('Final (FINAL)', () => {
    test('correct winner, correct opponent → 15 pts', () => {
      const points = calculateBracketPoints({
        slot: 'FINAL',
        actualWinner: 'Brazil',
        actualOpponent: 'France',
        userPredictedWinner: 'Brazil',
        userPredictedOpponent: 'France',
      })
      expect(points).toBe(15)
    })

    test('correct winner, different opponent → 11 pts (partial credit)', () => {
      const points = calculateBracketPoints({
        slot: 'FINAL',
        actualWinner: 'Brazil',
        actualOpponent: 'France',
        userPredictedWinner: 'Brazil',
        userPredictedOpponent: 'Argentina',
      })
      expect(points).toBe(11)
    })
  })

  describe('Third Place (3RD)', () => {
    test('correct winner, correct opponent → 15 pts', () => {
      const points = calculateBracketPoints({
        slot: '3RD',
        actualWinner: 'Argentina',
        actualOpponent: 'Mexico',
        userPredictedWinner: 'Argentina',
        userPredictedOpponent: 'Mexico',
      })
      expect(points).toBe(15)
    })

    test('correct winner, different opponent → 11 pts (partial credit)', () => {
      const points = calculateBracketPoints({
        slot: '3RD',
        actualWinner: 'Argentina',
        actualOpponent: 'Mexico',
        userPredictedWinner: 'Argentina',
        userPredictedOpponent: 'France',
      })
      expect(points).toBe(11)
    })

    test('incorrect winner → 0 pts', () => {
      const points = calculateBracketPoints({
        slot: '3RD',
        actualWinner: 'Argentina',
        actualOpponent: 'Mexico',
        userPredictedWinner: 'Mexico',
        userPredictedOpponent: 'Argentina',
      })
      expect(points).toBe(0)
    })
  })

  describe('Additional coverage - R16, QF, SF', () => {
    test('R16_02 with partial credit', () => {
      const points = calculateBracketPoints({
        slot: 'R16_02',
        actualWinner: 'France',
        actualOpponent: 'Netherlands',
        userPredictedWinner: 'France',
        userPredictedOpponent: 'Germany',
      })
      expect(points).toBe(5)
    })

    test('R16_05 full points', () => {
      const points = calculateBracketPoints({
        slot: 'R16_05',
        actualWinner: 'Spain',
        actualOpponent: 'Portugal',
        userPredictedWinner: 'Spain',
        userPredictedOpponent: 'Portugal',
      })
      expect(points).toBe(7)
    })

    test('QF_02 partial credit', () => {
      const points = calculateBracketPoints({
        slot: 'QF_02',
        actualWinner: 'Italy',
        actualOpponent: 'Belgium',
        userPredictedWinner: 'Italy',
        userPredictedOpponent: 'Switzerland',
      })
      expect(points).toBe(7)
    })

    test('QF_04 full points', () => {
      const points = calculateBracketPoints({
        slot: 'QF_04',
        actualWinner: 'Germany',
        actualOpponent: 'Belgium',
        userPredictedWinner: 'Germany',
        userPredictedOpponent: 'Belgium',
      })
      expect(points).toBe(9)
    })

    test('SF_02 full points', () => {
      const points = calculateBracketPoints({
        slot: 'SF_02',
        actualWinner: 'Germany',
        actualOpponent: 'Belgium',
        userPredictedWinner: 'Germany',
        userPredictedOpponent: 'Belgium',
      })
      expect(points).toBe(11)
    })

    test('SF_02 partial credit', () => {
      const points = calculateBracketPoints({
        slot: 'SF_02',
        actualWinner: 'Germany',
        actualOpponent: 'Belgium',
        userPredictedWinner: 'Germany',
        userPredictedOpponent: 'Netherlands',
      })
      expect(points).toBe(9)
    })
  })

  describe('R32 all slots coverage', () => {
    const r32Slots = [
      'R32_02', 'R32_03', 'R32_04', 'R32_05', 'R32_06', 'R32_07', 'R32_08',
      'R32_09', 'R32_10', 'R32_11', 'R32_12', 'R32_13', 'R32_14', 'R32_15', 'R32_16',
    ] as const

    r32Slots.forEach(slot => {
      test(`${slot} correct winner, different opponent → 5 pts`, () => {
        const points = calculateBracketPoints({
          slot,
          actualWinner: 'TeamA',
          actualOpponent: 'TeamB',
          userPredictedWinner: 'TeamA',
          userPredictedOpponent: 'TeamC',
        })
        expect(points).toBe(5)
      })
    })
  })

  describe('Edge cases', () => {
    test('empty string teams still work correctly', () => {
      const points = calculateBracketPoints({
        slot: 'R32_01',
        actualWinner: '',
        actualOpponent: '',
        userPredictedWinner: '',
        userPredictedOpponent: '',
      })
      expect(points).toBe(5)
    })

    test('case sensitivity matters', () => {
      const points = calculateBracketPoints({
        slot: 'R32_01',
        actualWinner: 'Brazil',
        actualOpponent: 'Mexico',
        userPredictedWinner: 'brazil',
        userPredictedOpponent: 'Mexico',
      })
      expect(points).toBe(0)
    })

    test('different opponent strings with correct winner', () => {
      const points = calculateBracketPoints({
        slot: 'QF_01',
        actualWinner: 'Brazil',
        actualOpponent: 'Mexico',
        userPredictedWinner: 'Brazil',
        userPredictedOpponent: 'Netherlands',
      })
      expect(points).toBe(7)
    })
  })
})