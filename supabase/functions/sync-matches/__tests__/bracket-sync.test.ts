import { describe, test, expect } from 'vitest'
import { PHASE_MAP } from '../../_shared/phaseMapping.ts'
import { calculateBracketPoints } from '../../_shared/calculateBracketPoints.ts'
import { BRACKET_SLOTS, BRACKET_PARENTS } from '../../_shared/bracketSlots.ts'

describe('Phase Mapping for Knockout Matches', () => {
  test('PHASE_MAP[LAST_32] maps to "16 Avos"', () => {
    expect(PHASE_MAP['LAST_32']).toBe('16 Avos')
  })

  test('PHASE_MAP[LAST_16] maps to "Oitavas"', () => {
    expect(PHASE_MAP['LAST_16']).toBe('Oitavas')
  })

  test('PHASE_MAP[QUARTER_FINALS] maps to "Quartas"', () => {
    expect(PHASE_MAP['QUARTER_FINALS']).toBe('Quartas')
  })

  test('PHASE_MAP[SEMI_FINALS] maps to "Semifinal"', () => {
    expect(PHASE_MAP['SEMI_FINALS']).toBe('Semifinal')
  })

  test('PHASE_MAP[THIRD_PLACE] maps to "Terceiro Lugar"', () => {
    expect(PHASE_MAP['THIRD_PLACE']).toBe('Terceiro Lugar')
  })

  test('PHASE_MAP[FINAL] maps to "Final"', () => {
    expect(PHASE_MAP['FINAL']).toBe('Final')
  })
})

describe('Bracket Points Calculation', () => {
  describe('Round of 32 — 16 Avos (no partial credit)', () => {
    test('Correct winner, correct opponent → 5 points', () => {
      const points = calculateBracketPoints({
        slot: 'R32_01',
        actualWinner: 'Brasil',
        actualOpponent: 'Alemanha',
        userPredictedWinner: 'Brasil',
        userPredictedOpponent: 'Alemanha',
      })
      expect(points).toBe(5)
    })

    test('Correct winner, different opponent → 5 points (no partial credit for R32)', () => {
      const points = calculateBracketPoints({
        slot: 'R32_01',
        actualWinner: 'Brasil',
        actualOpponent: 'Alemanha',
        userPredictedWinner: 'Brasil',
        userPredictedOpponent: 'Argentina',
      })
      expect(points).toBe(5)
    })

    test('Wrong winner → 0 points', () => {
      const points = calculateBracketPoints({
        slot: 'R32_01',
        actualWinner: 'Brasil',
        actualOpponent: 'Alemanha',
        userPredictedWinner: 'Alemanha',
        userPredictedOpponent: 'Brasil',
      })
      expect(points).toBe(0)
    })
  })

  describe('Oitavas — R16 (partial credit available)', () => {
    test('Correct winner + correct opponent → 7 points', () => {
      const points = calculateBracketPoints({
        slot: 'R16_01',
        actualWinner: 'Brasil',
        actualOpponent: 'Argentina',
        userPredictedWinner: 'Brasil',
        userPredictedOpponent: 'Argentina',
      })
      expect(points).toBe(7)
    })

    test('Correct winner + wrong opponent → 5 points (partial)', () => {
      const points = calculateBracketPoints({
        slot: 'R16_01',
        actualWinner: 'Brasil',
        actualOpponent: 'Argentina',
        userPredictedWinner: 'Brasil',
        userPredictedOpponent: 'Alemanha',
      })
      expect(points).toBe(5)
    })

    test('Wrong winner → 0 points', () => {
      const points = calculateBracketPoints({
        slot: 'R16_01',
        actualWinner: 'Brasil',
        actualOpponent: 'Argentina',
        userPredictedWinner: 'Argentina',
        userPredictedOpponent: 'Brasil',
      })
      expect(points).toBe(0)
    })
  })

  describe('Quarter-finals — QF (partial credit available)', () => {
    test('Correct winner + correct opponent → 9 points', () => {
      const points = calculateBracketPoints({
        slot: 'QF_01',
        actualWinner: 'Brasil',
        actualOpponent: 'Argentina',
        userPredictedWinner: 'Brasil',
        userPredictedOpponent: 'Argentina',
      })
      expect(points).toBe(9)
    })

    test('Correct winner + wrong opponent → 7 points (partial)', () => {
      const points = calculateBracketPoints({
        slot: 'QF_01',
        actualWinner: 'Brasil',
        actualOpponent: 'Argentina',
        userPredictedWinner: 'Brasil',
        userPredictedOpponent: 'Alemanha',
      })
      expect(points).toBe(7)
    })

    test('Wrong winner → 0 points', () => {
      const points = calculateBracketPoints({
        slot: 'QF_01',
        actualWinner: 'Brasil',
        actualOpponent: 'Argentina',
        userPredictedWinner: 'Argentina',
        userPredictedOpponent: 'Brasil',
      })
      expect(points).toBe(0)
    })
  })

  describe('Semi-finals (partial credit)', () => {
    test('Correct winner + correct opponent → 11 points', () => {
      const points = calculateBracketPoints({
        slot: 'SF_01',
        actualWinner: 'Brasil',
        actualOpponent: 'Holanda',
        userPredictedWinner: 'Brasil',
        userPredictedOpponent: 'Holanda',
      })
      expect(points).toBe(11)
    })

    test('Correct winner + wrong opponent → 9 points (partial)', () => {
      const points = calculateBracketPoints({
        slot: 'SF_01',
        actualWinner: 'Brasil',
        actualOpponent: 'Holanda',
        userPredictedWinner: 'Brasil',
        userPredictedOpponent: 'Alemanha',
      })
      expect(points).toBe(9)
    })
  })

  describe('Final (partial credit)', () => {
    test('Correct winner + correct opponent → 15 points', () => {
      const points = calculateBracketPoints({
        slot: 'FINAL',
        actualWinner: 'Brasil',
        actualOpponent: 'Holanda',
        userPredictedWinner: 'Brasil',
        userPredictedOpponent: 'Holanda',
      })
      expect(points).toBe(15)
    })

    test('Correct winner + wrong opponent → 11 points (partial)', () => {
      const points = calculateBracketPoints({
        slot: 'FINAL',
        actualWinner: 'Brasil',
        actualOpponent: 'Holanda',
        userPredictedWinner: 'Brasil',
        userPredictedOpponent: 'Argentina',
      })
      expect(points).toBe(11)
    })
  })

  describe('Third Place (partial credit)', () => {
    test('Correct winner + correct opponent → 15 points', () => {
      const points = calculateBracketPoints({
        slot: '3RD',
        actualWinner: 'Argentina',
        actualOpponent: 'Alemanha',
        userPredictedWinner: 'Argentina',
        userPredictedOpponent: 'Alemanha',
      })
      expect(points).toBe(15)
    })

    test('Correct winner + wrong opponent → 11 points (partial)', () => {
      const points = calculateBracketPoints({
        slot: '3RD',
        actualWinner: 'Argentina',
        actualOpponent: 'Alemanha',
        userPredictedWinner: 'Argentina',
        userPredictedOpponent: 'Holanda',
      })
      expect(points).toBe(11)
    })
  })
})

describe('Bracket Slot Structure', () => {
  test('BRACKET_SLOTS has 32 slots', () => {
    expect(BRACKET_SLOTS).toHaveLength(32)
  })

  test('R32 slots range from R32_01 to R32_16 (16 avos)', () => {
    const r32Slots = BRACKET_SLOTS.filter(s => s.startsWith('R32_'))
    expect(r32Slots).toHaveLength(16)
    expect(r32Slots[0]).toBe('R32_01')
    expect(r32Slots[15]).toBe('R32_16')
  })

  test('R16 slots range from R16_01 to R16_08 (oitavas)', () => {
    const r16Slots = BRACKET_SLOTS.filter(s => s.startsWith('R16_'))
    expect(r16Slots).toHaveLength(8)
    expect(r16Slots[0]).toBe('R16_01')
    expect(r16Slots[7]).toBe('R16_08')
  })

  test('QF slots range from QF_01 to QF_04 (quartas)', () => {
    const qfSlots = BRACKET_SLOTS.filter(s => s.startsWith('QF_'))
    expect(qfSlots).toHaveLength(4)
  })

  test('SF slots are SF_01 and SF_02', () => {
    const sfSlots = BRACKET_SLOTS.filter(s => s.startsWith('SF_'))
    expect(sfSlots).toHaveLength(2)
  })

  test('FINAL and 3RD slots exist', () => {
    expect(BRACKET_SLOTS).toContain('FINAL')
    expect(BRACKET_SLOTS).toContain('3RD')
  })
})

describe('Bracket Parents Mapping', () => {
  test('R32 slots have no parents', () => {
    expect(BRACKET_PARENTS['R32_01']).toBeNull()
    expect(BRACKET_PARENTS['R32_16']).toBeNull()
  })

  test('R16_01 has parents R32_01 and R32_02', () => {
    expect(BRACKET_PARENTS['R16_01']).toEqual(['R32_01', 'R32_02'])
  })

  test('R16_08 has parents R32_15 and R32_16', () => {
    expect(BRACKET_PARENTS['R16_08']).toEqual(['R32_15', 'R32_16'])
  })

  test('QF_01 has parents R16_01 and R16_02', () => {
    expect(BRACKET_PARENTS['QF_01']).toEqual(['R16_01', 'R16_02'])
  })

  test('QF_04 has parents R16_07 and R16_08', () => {
    expect(BRACKET_PARENTS['QF_04']).toEqual(['R16_07', 'R16_08'])
  })

  test('SF_01 has parents QF_01 and QF_02', () => {
    expect(BRACKET_PARENTS['SF_01']).toEqual(['QF_01', 'QF_02'])
  })

  test('SF_02 has parents QF_03 and QF_04', () => {
    expect(BRACKET_PARENTS['SF_02']).toEqual(['QF_03', 'QF_04'])
  })

  test('FINAL has parents SF_01 and SF_02', () => {
    expect(BRACKET_PARENTS['FINAL']).toEqual(['SF_01', 'SF_02'])
  })

  test('3RD has parents SF_01 and SF_02 (for losers)', () => {
    expect(BRACKET_PARENTS['3RD']).toEqual(['SF_01', 'SF_02'])
  })
})
