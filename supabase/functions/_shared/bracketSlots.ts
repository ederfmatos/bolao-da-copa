export const BRACKET_SLOTS = [
  // Round of 32 (16 matches, 32 teams)
  'R32_01', 'R32_02', 'R32_03', 'R32_04', 'R32_05', 'R32_06', 'R32_07', 'R32_08',
  'R32_09', 'R32_10', 'R32_11', 'R32_12', 'R32_13', 'R32_14', 'R32_15', 'R32_16',
  // Round of 16 (8 matches, 16 teams)
  'R16_01', 'R16_02', 'R16_03', 'R16_04', 'R16_05', 'R16_06', 'R16_07', 'R16_08',
  // Quarter-finals (4 matches, 8 teams)
  'QF_01', 'QF_02', 'QF_03', 'QF_04',
  // Semi-finals (2 matches, 4 teams)
  'SF_01', 'SF_02',
  // Third place & Final
  '3RD', 'FINAL',
] as const

export type BracketSlot = typeof BRACKET_SLOTS[number]

// Maps a bracket_slot to its two "parent" slots (whose winners feed into it)
// For '3RD', parents are the LOSERS of the semi-finals, not the winners
export const BRACKET_PARENTS: Record<BracketSlot, [BracketSlot, BracketSlot] | null> = {
  // Round of 32 (16 Avos) - no parents (first round)
  'R32_01': null, 'R32_02': null, 'R32_03': null, 'R32_04': null,
  'R32_05': null, 'R32_06': null, 'R32_07': null, 'R32_08': null,
  'R32_09': null, 'R32_10': null, 'R32_11': null, 'R32_12': null,
  'R32_13': null, 'R32_14': null, 'R32_15': null, 'R32_16': null,
  // Round of 16 (Oitavas) - winners of paired R32 matches
  'R16_01': ['R32_01', 'R32_02'],
  'R16_02': ['R32_03', 'R32_04'],
  'R16_03': ['R32_05', 'R32_06'],
  'R16_04': ['R32_07', 'R32_08'],
  'R16_05': ['R32_09', 'R32_10'],
  'R16_06': ['R32_11', 'R32_12'],
  'R16_07': ['R32_13', 'R32_14'],
  'R16_08': ['R32_15', 'R32_16'],
  // Quarter-finals (Quartas) - winners of paired R16 matches
  'QF_01': ['R16_01', 'R16_02'],
  'QF_02': ['R16_03', 'R16_04'],
  'QF_03': ['R16_05', 'R16_06'],
  'QF_04': ['R16_07', 'R16_08'],
  // Semi-finals (Semifinais) - winners of paired QF matches
  'SF_01': ['QF_01', 'QF_02'],
  'SF_02': ['QF_03', 'QF_04'],
  // Final: winners of SF_01 and SF_02
  'FINAL': ['SF_01', 'SF_02'],
  // Third place: LOSERS of SF_01 and SF_02 (not winners)
  '3RD': ['SF_01', 'SF_02'],
}

// Maps bracket_slot to group_name phase and points values
export const SLOT_PHASE: Record<BracketSlot, { phase: string; fullPts: number; partialPts: number | null }> = {
  // Round of 32 (16 Avos) - 5 points, no partial credit (first phase)
  'R32_01': { phase: '16 Avos', fullPts: 5, partialPts: null },
  'R32_02': { phase: '16 Avos', fullPts: 5, partialPts: null },
  'R32_03': { phase: '16 Avos', fullPts: 5, partialPts: null },
  'R32_04': { phase: '16 Avos', fullPts: 5, partialPts: null },
  'R32_05': { phase: '16 Avos', fullPts: 5, partialPts: null },
  'R32_06': { phase: '16 Avos', fullPts: 5, partialPts: null },
  'R32_07': { phase: '16 Avos', fullPts: 5, partialPts: null },
  'R32_08': { phase: '16 Avos', fullPts: 5, partialPts: null },
  'R32_09': { phase: '16 Avos', fullPts: 5, partialPts: null },
  'R32_10': { phase: '16 Avos', fullPts: 5, partialPts: null },
  'R32_11': { phase: '16 Avos', fullPts: 5, partialPts: null },
  'R32_12': { phase: '16 Avos', fullPts: 5, partialPts: null },
  'R32_13': { phase: '16 Avos', fullPts: 5, partialPts: null },
  'R32_14': { phase: '16 Avos', fullPts: 5, partialPts: null },
  'R32_15': { phase: '16 Avos', fullPts: 5, partialPts: null },
  'R32_16': { phase: '16 Avos', fullPts: 5, partialPts: null },
  // Round of 16 (Oitavas) - 7 points, 5 with partial credit
  'R16_01': { phase: 'Oitavas', fullPts: 7, partialPts: 5 },
  'R16_02': { phase: 'Oitavas', fullPts: 7, partialPts: 5 },
  'R16_03': { phase: 'Oitavas', fullPts: 7, partialPts: 5 },
  'R16_04': { phase: 'Oitavas', fullPts: 7, partialPts: 5 },
  'R16_05': { phase: 'Oitavas', fullPts: 7, partialPts: 5 },
  'R16_06': { phase: 'Oitavas', fullPts: 7, partialPts: 5 },
  'R16_07': { phase: 'Oitavas', fullPts: 7, partialPts: 5 },
  'R16_08': { phase: 'Oitavas', fullPts: 7, partialPts: 5 },
  // Quarter-finals (Quartas) - 9 points, 7 with partial credit
  'QF_01': { phase: 'Quartas', fullPts: 9, partialPts: 7 },
  'QF_02': { phase: 'Quartas', fullPts: 9, partialPts: 7 },
  'QF_03': { phase: 'Quartas', fullPts: 9, partialPts: 7 },
  'QF_04': { phase: 'Quartas', fullPts: 9, partialPts: 7 },
  // Semi-finals (Semifinais) - 11 points, 9 with partial credit
  'SF_01': { phase: 'Semifinal', fullPts: 11, partialPts: 9 },
  'SF_02': { phase: 'Semifinal', fullPts: 11, partialPts: 9 },
  // Third place (Terceiro Lugar) - 15 points, 11 with partial credit
  '3RD': { phase: 'Terceiro Lugar', fullPts: 15, partialPts: 11 },
  // Final - 15 points, 11 with partial credit
  'FINAL': { phase: 'Final', fullPts: 15, partialPts: 11 },
}