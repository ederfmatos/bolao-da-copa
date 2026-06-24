export const BONUS_DEADLINE = new Date('2026-06-21T21:00:00Z')

export const SCORER_DEADLINE = new Date('2026-06-21T21:00:00Z')

export const BRACKET_DEADLINE = new Date('2026-06-28T12:45:00Z')
// TODO: atualizar após confirmação do horário oficial (2026-06-27)

// Ativar quando o bracket real for conhecido (pós-fase de grupos).
// Também atualizar bracketHalf em TEAMS com os lados corretos.
export const BRACKET_DETERMINED = false

export const BRACKET_SLOTS = [
  'R32_01', 'R32_02', 'R32_03', 'R32_04', 'R32_05', 'R32_06', 'R32_07', 'R32_08',
  'R32_09', 'R32_10', 'R32_11', 'R32_12', 'R32_13', 'R32_14', 'R32_15', 'R32_16',
  'R16_01', 'R16_02', 'R16_03', 'R16_04', 'R16_05', 'R16_06', 'R16_07', 'R16_08',
  'QF_01', 'QF_02', 'QF_03', 'QF_04',
  'SF_01', 'SF_02',
  '3RD', 'FINAL',
]

export const BRACKET_PARENTS = {
  'R32_01': null, 'R32_02': null, 'R32_03': null, 'R32_04': null,
  'R32_05': null, 'R32_06': null, 'R32_07': null, 'R32_08': null,
  'R32_09': null, 'R32_10': null, 'R32_11': null, 'R32_12': null,
  'R32_13': null, 'R32_14': null, 'R32_15': null, 'R32_16': null,
  'R16_01': ['R32_01', 'R32_02'],
  'R16_02': ['R32_03', 'R32_04'],
  'R16_03': ['R32_05', 'R32_06'],
  'R16_04': ['R32_07', 'R32_08'],
  'R16_05': ['R32_09', 'R32_10'],
  'R16_06': ['R32_11', 'R32_12'],
  'R16_07': ['R32_13', 'R32_14'],
  'R16_08': ['R32_15', 'R32_16'],
  'QF_01': ['R16_01', 'R16_02'],
  'QF_02': ['R16_03', 'R16_04'],
  'QF_03': ['R16_05', 'R16_06'],
  'QF_04': ['R16_07', 'R16_08'],
  'SF_01': ['QF_01', 'QF_02'],
  'SF_02': ['QF_03', 'QF_04'],
  'FINAL': ['SF_01', 'SF_02'],
  '3RD': ['SF_01', 'SF_02'],
}

function buildDescendants() {
  const descendants = {}
  function getDescendants(slot, visited = new Set()) {
    if (visited.has(slot)) return []
    visited.add(slot)
    const result = []
    for (const [child, parents] of Object.entries(BRACKET_PARENTS)) {
      if (parents && parents.includes(slot)) {
        result.push(child, ...getDescendants(child, visited))
      }
    }
    return [...new Set(result)]
  }
  for (const slot of Object.keys(BRACKET_PARENTS)) {
    descendants[slot] = getDescendants(slot)
  }
  return descendants
}

export const BRACKET_DESCENDANTS = buildDescendants()

// 16 confrontos dos 16 avos — slot canônico + identificadores visuais dos times
// TODO: atualizar homeSlotLabel/awaySlotLabel quando o bracket oficial for confirmado
export const R32_MATCHUPS = [
  { slot: 'R32_01', homeSlotLabel: '1A', awaySlotLabel: '2B' },
  { slot: 'R32_02', homeSlotLabel: '1C', awaySlotLabel: '2D' },
  { slot: 'R32_03', homeSlotLabel: '1E', awaySlotLabel: '2F' },
  { slot: 'R32_04', homeSlotLabel: '1G', awaySlotLabel: '2H' },
  { slot: 'R32_05', homeSlotLabel: '1I', awaySlotLabel: '2J' },
  { slot: 'R32_06', homeSlotLabel: '1K', awaySlotLabel: '2L' },
  { slot: 'R32_07', homeSlotLabel: '1M', awaySlotLabel: '2N' },
  { slot: 'R32_08', homeSlotLabel: '1O', awaySlotLabel: '2P' },
  { slot: 'R32_09', homeSlotLabel: '1B', awaySlotLabel: '2A' },
  { slot: 'R32_10', homeSlotLabel: '1D', awaySlotLabel: '2C' },
  { slot: 'R32_11', homeSlotLabel: '1F', awaySlotLabel: '2E' },
  { slot: 'R32_12', homeSlotLabel: '1H', awaySlotLabel: '2G' },
  { slot: 'R32_13', homeSlotLabel: '1J', awaySlotLabel: '2I' },
  { slot: 'R32_14', homeSlotLabel: '1L', awaySlotLabel: '2K' },
  { slot: 'R32_15', homeSlotLabel: '1N', awaySlotLabel: '2M' },
  { slot: 'R32_16', homeSlotLabel: '1P', awaySlotLabel: '2O' },
]

export const TEAMS = [
  { name: 'África do Sul', flag: '🇿🇦', bracketHalf: 'LEFT' },
  { name: 'Alemanha', flag: '🇩🇪', bracketHalf: 'LEFT' },
  { name: 'Arábia Saudita', flag: '🇸🇦', bracketHalf: 'RIGHT' },
  { name: 'Argentina', flag: '🇦🇷', bracketHalf: 'LEFT' },
  { name: 'Argélia', flag: '🇩🇿', bracketHalf: 'LEFT' },
  { name: 'Austrália', flag: '🇦🇺', bracketHalf: 'RIGHT' },
  { name: 'Áustria', flag: '🇦🇹', bracketHalf: 'LEFT' },
  { name: 'Bélgica', flag: '🇧🇪', bracketHalf: 'LEFT' },
  { name: 'Bósnia e Herzegovina', flag: '🇧🇦', bracketHalf: 'RIGHT' },
  { name: 'Brasil', flag: '🇧🇷', bracketHalf: 'LEFT' },
  { name: 'Cabo Verde', flag: '🇨🇻', bracketHalf: 'RIGHT' },
  { name: 'Canadá', flag: '🇨🇦', bracketHalf: 'RIGHT' },
  { name: 'Catar', flag: '🇶🇦', bracketHalf: 'RIGHT' },
  { name: 'Colômbia', flag: '🇨🇴', bracketHalf: 'RIGHT' },
  { name: 'Coreia do Sul', flag: '🇰🇷', bracketHalf: 'LEFT' },
  { name: 'Costa do Marfim', flag: '🇨🇮', bracketHalf: 'LEFT' },
  { name: 'Croácia', flag: '🇭🇷', bracketHalf: 'LEFT' },
  { name: 'Curaçao', flag: '🇨🇼', bracketHalf: 'LEFT' },
  { name: 'Egito', flag: '🇪🇬', bracketHalf: 'LEFT' },
  { name: 'Equador', flag: '🇪🇨', bracketHalf: 'LEFT' },
  { name: 'Escócia', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', bracketHalf: 'LEFT' },
  { name: 'Espanha', flag: '🇪🇸', bracketHalf: 'RIGHT' },
  { name: 'Estados Unidos', flag: '🇺🇸', bracketHalf: 'RIGHT' },
  { name: 'França', flag: '🇫🇷', bracketHalf: 'LEFT' },
  { name: 'Gana', flag: '🇬🇭', bracketHalf: 'LEFT' },
  { name: 'Haiti', flag: '🇭🇹', bracketHalf: 'LEFT' },
  { name: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', bracketHalf: 'LEFT' },
  { name: 'Iraque', flag: '🇮🇶', bracketHalf: 'LEFT' },
  { name: 'Irã', flag: '🇮🇷', bracketHalf: 'LEFT' },
  { name: 'Japão', flag: '🇯🇵', bracketHalf: 'LEFT' },
  { name: 'Jordânia', flag: '🇯🇴', bracketHalf: 'LEFT' },
  { name: 'Marrocos', flag: '🇲🇦', bracketHalf: 'LEFT' },
  { name: 'México', flag: '🇲🇽', bracketHalf: 'LEFT' },
  { name: 'Noruega', flag: '🇳🇴', bracketHalf: 'LEFT' },
  { name: 'Nova Zelândia', flag: '🇳🇿', bracketHalf: 'LEFT' },
  { name: 'Países Baixos', flag: '🇳🇱', bracketHalf: 'LEFT' },
  { name: 'Panamá', flag: '🇵🇦', bracketHalf: 'LEFT' },
  { name: 'Paraguai', flag: '🇵🇾', bracketHalf: 'RIGHT' },
  { name: 'Portugal', flag: '🇵🇹', bracketHalf: 'RIGHT' },
  { name: 'RD Congo', flag: '🇨🇩', bracketHalf: 'RIGHT' },
  { name: 'Senegal', flag: '🇸🇳', bracketHalf: 'LEFT' },
  { name: 'Suécia', flag: '🇸🇪', bracketHalf: 'LEFT' },
  { name: 'Suíça', flag: '🇨🇭', bracketHalf: 'RIGHT' },
  { name: 'Tchéquia', flag: '🇨🇿', bracketHalf: 'LEFT' },
  { name: 'Tunísia', flag: '🇹🇳', bracketHalf: 'LEFT' },
  { name: 'Turquia', flag: '🇹🇷', bracketHalf: 'RIGHT' },
  { name: 'Uruguai', flag: '🇺🇾', bracketHalf: 'RIGHT' },
  { name: 'Uzbequistão', flag: '🇺🇿', bracketHalf: 'RIGHT' },
]

export function getValidTeams(position, picks) {
  const taken = Object.values(picks).filter(Boolean)

  if (!BRACKET_DETERMINED) {
    return TEAMS.filter(t => !taken.includes(t.name))
  }

  const { first } = picks
  if (position === 'first') return TEAMS.filter(t => !taken.includes(t.name))

  const firstHalf = first ? TEAMS.find(t => t.name === first)?.bracketHalf : null
  const oppositeHalf = firstHalf === 'LEFT' ? 'RIGHT' : 'LEFT'

  if (position === 'second')
    return TEAMS.filter(t => t.bracketHalf === oppositeHalf && !taken.includes(t.name))

  if (position === 'third')
    return TEAMS.filter(t => !taken.includes(t.name))

  return []
}

export function deriveFourthPlace(picks) {
  if (!BRACKET_DETERMINED) return null
  const { first, second, third } = picks
  if (!first || !second || !third) return null
  const thirdHalf = TEAMS.find(t => t.name === third)?.bracketHalf
  const taken = [first, second, third]
  return TEAMS.find(t => t.bracketHalf !== thirdHalf && !taken.includes(t.name))?.name ?? null
}
