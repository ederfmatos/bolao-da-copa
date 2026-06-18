export const BONUS_DEADLINE = new Date('2026-06-21T21:00:00Z')

export const SCORER_DEADLINE = new Date('2026-06-21T21:00:00Z')

// Ativar quando o bracket real for conhecido (pós-fase de grupos).
// Também atualizar bracketHalf em TEAMS com os lados corretos.
export const BRACKET_DETERMINED = false

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
