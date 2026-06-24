import { describe, test, expect } from 'vitest'
import { PHASE_MAP } from '../phaseMapping'

describe('phaseMapping', () => {
  describe('PHASE_MAP', () => {
    test('maps LAST_32 to 16 Avos', () => {
      expect(PHASE_MAP['LAST_32']).toBe('16 Avos')
    })

    test('maps LAST_16 to Oitavas', () => {
      expect(PHASE_MAP['LAST_16']).toBe('Oitavas')
    })

    test('maps QUARTER_FINALS to Quartas', () => {
      expect(PHASE_MAP['QUARTER_FINALS']).toBe('Quartas')
    })

    test('maps SEMI_FINALS to Semifinal', () => {
      expect(PHASE_MAP['SEMI_FINALS']).toBe('Semifinal')
    })

    test('maps THIRD_PLACE to Terceiro Lugar', () => {
      expect(PHASE_MAP['THIRD_PLACE']).toBe('Terceiro Lugar')
    })

    test('maps FINAL to Final', () => {
      expect(PHASE_MAP['FINAL']).toBe('Final')
    })

    test('has exactly 6 mappings', () => {
      expect(Object.keys(PHASE_MAP).length).toBe(6)
    })

    test('all values are valid group_name canonical values', () => {
      const canonicalValues = ['16 Avos', 'Oitavas', 'Quartas', 'Semifinal', 'Terceiro Lugar', 'Final']
      const mappedValues = Object.values(PHASE_MAP)
      expect(mappedValues).toEqual(expect.arrayContaining(canonicalValues))
    })

    test('no duplicate values', () => {
      const values = Object.values(PHASE_MAP)
      const uniqueValues = new Set(values)
      expect(values.length).toBe(uniqueValues.size)
    })
  })
})
