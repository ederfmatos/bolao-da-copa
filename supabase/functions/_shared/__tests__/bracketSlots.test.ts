import { describe, test, expect } from 'vitest'
import { BRACKET_SLOTS, BracketSlot, BRACKET_PARENTS, SLOT_PHASE } from '../bracketSlots'

describe('bracketSlots', () => {
  describe('BRACKET_SLOTS', () => {
    test('has exactly 32 slots', () => {
      expect(BRACKET_SLOTS.length).toBe(32)
    })

    test('has 16 R32 slots (16 avos)', () => {
      const r32Slots = BRACKET_SLOTS.filter(s => s.startsWith('R32_'))
      expect(r32Slots.length).toBe(16)
    })

    test('has 8 R16 slots (oitavas)', () => {
      const r16Slots = BRACKET_SLOTS.filter(s => s.startsWith('R16_'))
      expect(r16Slots.length).toBe(8)
    })

    test('has 4 QF slots (quartas)', () => {
      const qfSlots = BRACKET_SLOTS.filter(s => s.startsWith('QF_'))
      expect(qfSlots.length).toBe(4)
    })

    test('has 2 SF slots', () => {
      const sfSlots = BRACKET_SLOTS.filter(s => s.startsWith('SF_'))
      expect(sfSlots.length).toBe(2)
    })

    test('has 3RD and FINAL', () => {
      expect(BRACKET_SLOTS).toContain('3RD')
      expect(BRACKET_SLOTS).toContain('FINAL')
    })
  })

  describe('BRACKET_PARENTS', () => {
    test('all R32 slots have null parents', () => {
      BRACKET_SLOTS.filter(s => s.startsWith('R32_')).forEach(slot => {
        expect(BRACKET_PARENTS[slot as BracketSlot]).toBeNull()
      })
    })

    test('R16_01 parents are R32_01 and R32_02', () => {
      expect(BRACKET_PARENTS['R16_01']).toEqual(['R32_01', 'R32_02'])
    })

    test('R16_02 parents are R32_03 and R32_04', () => {
      expect(BRACKET_PARENTS['R16_02']).toEqual(['R32_03', 'R32_04'])
    })

    test('R16_08 parents are R32_15 and R32_16', () => {
      expect(BRACKET_PARENTS['R16_08']).toEqual(['R32_15', 'R32_16'])
    })

    test('QF_01 parents are R16_01 and R16_02', () => {
      expect(BRACKET_PARENTS['QF_01']).toEqual(['R16_01', 'R16_02'])
    })

    test('QF_02 parents are R16_03 and R16_04', () => {
      expect(BRACKET_PARENTS['QF_02']).toEqual(['R16_03', 'R16_04'])
    })

    test('QF_03 parents are R16_05 and R16_06', () => {
      expect(BRACKET_PARENTS['QF_03']).toEqual(['R16_05', 'R16_06'])
    })

    test('QF_04 parents are R16_07 and R16_08', () => {
      expect(BRACKET_PARENTS['QF_04']).toEqual(['R16_07', 'R16_08'])
    })

    test('SF_01 parents are QF_01 and QF_02', () => {
      expect(BRACKET_PARENTS['SF_01']).toEqual(['QF_01', 'QF_02'])
    })

    test('SF_02 parents are QF_03 and QF_04', () => {
      expect(BRACKET_PARENTS['SF_02']).toEqual(['QF_03', 'QF_04'])
    })

    test('FINAL parents are SF_01 and SF_02', () => {
      expect(BRACKET_PARENTS['FINAL']).toEqual(['SF_01', 'SF_02'])
    })

    test('3RD parents are SF_01 and SF_02 (losers)', () => {
      expect(BRACKET_PARENTS['3RD']).toEqual(['SF_01', 'SF_02'])
    })

    test('all 32 slots have BRACKET_PARENTS entry', () => {
      BRACKET_SLOTS.forEach(slot => {
        expect(BRACKET_PARENTS).toHaveProperty(slot)
      })
    })
  })

  describe('SLOT_PHASE', () => {
    test('R32_01 has 5 points and null partial credit', () => {
      expect(SLOT_PHASE['R32_01']).toEqual({
        phase: '16 Avos',
        fullPts: 5,
        partialPts: null,
      })
    })

    test('all R32 slots have 5 points and null partial credit', () => {
      BRACKET_SLOTS.filter(s => s.startsWith('R32_')).forEach(slot => {
        const phase = SLOT_PHASE[slot as BracketSlot]
        expect(phase.fullPts).toBe(5)
        expect(phase.partialPts).toBeNull()
        expect(phase.phase).toBe('16 Avos')
      })
    })

    test('R16_01 has 7 points and 5 partial credit', () => {
      expect(SLOT_PHASE['R16_01']).toEqual({
        phase: 'Oitavas',
        fullPts: 7,
        partialPts: 5,
      })
    })

    test('all R16 slots have 7 points and 5 partial credit', () => {
      BRACKET_SLOTS.filter(s => s.startsWith('R16_')).forEach(slot => {
        const phase = SLOT_PHASE[slot as BracketSlot]
        expect(phase.fullPts).toBe(7)
        expect(phase.partialPts).toBe(5)
        expect(phase.phase).toBe('Oitavas')
      })
    })

    test('QF_01 has 9 points and 7 partial credit', () => {
      expect(SLOT_PHASE['QF_01']).toEqual({
        phase: 'Quartas',
        fullPts: 9,
        partialPts: 7,
      })
    })

    test('all QF slots have 9 points and 7 partial credit', () => {
      BRACKET_SLOTS.filter(s => s.startsWith('QF_')).forEach(slot => {
        const phase = SLOT_PHASE[slot as BracketSlot]
        expect(phase.fullPts).toBe(9)
        expect(phase.partialPts).toBe(7)
        expect(phase.phase).toBe('Quartas')
      })
    })

    test('SF_01 has 11 points and 9 partial credit', () => {
      expect(SLOT_PHASE['SF_01']).toEqual({
        phase: 'Semifinal',
        fullPts: 11,
        partialPts: 9,
      })
    })

    test('all SF slots have 11 points and 9 partial credit', () => {
      BRACKET_SLOTS.filter(s => s.startsWith('SF_')).forEach(slot => {
        const phase = SLOT_PHASE[slot as BracketSlot]
        expect(phase.fullPts).toBe(11)
        expect(phase.partialPts).toBe(9)
        expect(phase.phase).toBe('Semifinal')
      })
    })

    test('FINAL has 15 points and 11 partial credit', () => {
      expect(SLOT_PHASE['FINAL']).toEqual({
        phase: 'Final',
        fullPts: 15,
        partialPts: 11,
      })
    })

    test('3RD has 15 points and 11 partial credit', () => {
      expect(SLOT_PHASE['3RD']).toEqual({
        phase: 'Terceiro Lugar',
        fullPts: 15,
        partialPts: 11,
      })
    })

    test('all 32 slots have SLOT_PHASE entry', () => {
      BRACKET_SLOTS.forEach(slot => {
        expect(SLOT_PHASE).toHaveProperty(slot)
        const phase = SLOT_PHASE[slot]
        expect(phase.phase).toBeTruthy()
        expect(phase.fullPts).toBeGreaterThan(0)
      })
    })

    test('non-R32 slots have partial credit', () => {
      BRACKET_SLOTS.filter(s => !s.startsWith('R32_')).forEach(slot => {
        const phase = SLOT_PHASE[slot as BracketSlot]
        expect(phase.partialPts).not.toBeNull()
      })
    })
  })

  describe('BracketSlot type', () => {
    test('BracketSlot includes R32_01', () => {
      const testSlot: BracketSlot = 'R32_01'
      expect(BRACKET_SLOTS).toContain(testSlot)
    })
  })
})
