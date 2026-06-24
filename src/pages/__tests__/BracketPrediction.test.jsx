import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import BracketPrediction from '../BracketPrediction'

const mockData = vi.hoisted(() => {
  const MOCK_TEAMS = [
    { name: 'Brasil', flag: '🇧🇷', bracketHalf: 'LEFT' },
    { name: 'Argentina', flag: '🇦🇷', bracketHalf: 'LEFT' },
    { name: 'Espanha', flag: '🇪🇸', bracketHalf: 'RIGHT' },
    { name: 'Portugal', flag: '🇵🇹', bracketHalf: 'RIGHT' },
    { name: 'Alemanha', flag: '🇩🇪', bracketHalf: 'LEFT' },
    { name: 'França', flag: '🇫🇷', bracketHalf: 'LEFT' },
    { name: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', bracketHalf: 'LEFT' },
    { name: 'Países Baixos', flag: '🇳🇱', bracketHalf: 'LEFT' },
  ]

  const R32_MATCHUPS = Array.from({ length: 16 }, (_, i) => ({
    slot: `R32_${String(i + 1).padStart(2, '0')}`,
    homeSlotLabel: `${(i % 2) + 1}${String.fromCharCode(65 + i)}`,
    awaySlotLabel: `${((i % 2) + 1) === 1 ? 2 : 1}${String.fromCharCode(65 + i)}`,
  }))

  const BRACKET_SLOTS = [
    ...Array.from({ length: 16 }, (_, i) => `R32_${String(i + 1).padStart(2, '0')}`),
    ...Array.from({ length: 8 }, (_, i) => `R16_${String(i + 1).padStart(2, '0')}`),
    ...Array.from({ length: 4 }, (_, i) => `QF_${String(i + 1).padStart(2, '0')}`),
    'SF_01', 'SF_02', '3RD', 'FINAL',
  ]

  const BRACKET_PARENTS = {}
  for (let i = 1; i <= 16; i++) {
    BRACKET_PARENTS[`R32_${String(i).padStart(2, '0')}`] = null
  }
  for (let i = 1; i <= 8; i++) {
    const slot = `R16_${String(i).padStart(2, '0')}`
    const r32Idx = (i - 1) * 2 + 1
    BRACKET_PARENTS[slot] = [
      `R32_${String(r32Idx).padStart(2, '0')}`,
      `R32_${String(r32Idx + 1).padStart(2, '0')}`,
    ]
  }
  for (let i = 1; i <= 4; i++) {
    const slot = `QF_${String(i).padStart(2, '0')}`
    const r16Idx = (i - 1) * 2 + 1
    BRACKET_PARENTS[slot] = [
      `R16_${String(r16Idx).padStart(2, '0')}`,
      `R16_${String(r16Idx + 1).padStart(2, '0')}`,
    ]
  }
  BRACKET_PARENTS['SF_01'] = ['QF_01', 'QF_02']
  BRACKET_PARENTS['SF_02'] = ['QF_03', 'QF_04']
  BRACKET_PARENTS['FINAL'] = ['SF_01', 'SF_02']
  BRACKET_PARENTS['3RD'] = ['SF_01', 'SF_02']

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

  const BRACKET_DESCENDANTS = {}
  for (const slot of Object.keys(BRACKET_PARENTS)) {
    BRACKET_DESCENDANTS[slot] = getDescendants(slot)
  }

  const mockOrderFn = vi.fn().mockResolvedValue({ data: [], error: null })
  const mockEqFn = vi.fn(() => ({ order: mockOrderFn }))
  const mockSelectFn = vi.fn(() => ({ eq: mockEqFn }))

  const mockSetBracketPick = vi.fn()
  const mockUseBracketPrediction = vi.fn()
  const mockUseAuth = vi.fn()

  return {
    MOCK_TEAMS,
    R32_MATCHUPS,
    BRACKET_SLOTS,
    BRACKET_PARENTS,
    BRACKET_DESCENDANTS,
    mockOrderFn: mockOrderFn,
    mockEq: mockEqFn,
    mockSelect: mockSelectFn,
    mockSetBracketPick,
    mockUseBracketPrediction,
    mockUseAuth,
  }
})

vi.mock('../../lib/bracketData', () => ({
  BRACKET_DEADLINE: new Date('2099-12-31T23:59:00Z'),
  BRACKET_SLOTS: mockData.BRACKET_SLOTS,
  BRACKET_PARENTS: mockData.BRACKET_PARENTS,
  BRACKET_DESCENDANTS: mockData.BRACKET_DESCENDANTS,
  R32_MATCHUPS: mockData.R32_MATCHUPS,
  TEAMS: mockData.MOCK_TEAMS,
}))

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: (table) => {
      if (table === 'matches') {
        return {
          select: () => ({
            eq: () => ({
              order: mockData.mockOrderFn,
            }),
          }),
        }
      }
      return {}
    },
  },
}))

vi.mock('../../hooks/useBracketPrediction', () => ({
  useBracketPrediction: mockData.mockUseBracketPrediction,
}))

vi.mock('../../hooks/useAuth', () => ({
  useAuth: mockData.mockUseAuth,
}))

function defaultBracketHook(overrides = {}) {
  return {
    bracketPicks: {},
    setBracketPick: mockData.mockSetBracketPick,
    isPastDeadline: false,
    loading: false,
    error: null,
    isSaving: false,
    ...overrides,
  }
}

function createR32Match(index, homeTeam, awayTeam) {
  return {
    id: `match-${index}`,
    home_team: homeTeam,
    away_team: awayTeam,
    kickoff_at: `2026-06-28T${12 + index}:00:00Z`,
    bracket_slot: `R32_${String(index).padStart(2, '0')}`,
  }
}

describe('BracketPrediction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockData.mockUseAuth.mockReturnValue({ user: { id: 'test-user' } })
    mockData.mockUseBracketPrediction.mockReturnValue(defaultBracketHook())
    mockData.mockOrderFn.mockResolvedValue({ data: [], error: null })
  })

  describe('loading and error states', () => {
    it('exibe estado de loading enquanto hook carrega', () => {
      mockData.mockUseBracketPrediction.mockReturnValue(defaultBracketHook({ loading: true }))

      render(<BracketPrediction />)

      expect(screen.getByText('Carregando...')).toBeInTheDocument()
    })

    it('exibe estado de loading enquanto matches carregam', () => {
      mockData.mockOrderFn.mockReturnValue(new Promise(() => {}))

      render(<BracketPrediction />)

      expect(screen.getByText('Carregando...')).toBeInTheDocument()
    })

    it('exibe mensagem de erro do hook', async () => {
      mockData.mockUseBracketPrediction.mockReturnValue(defaultBracketHook({ error: 'Erro de conexão', loading: false }))

      render(<BracketPrediction />)

      await waitFor(() => {
        expect(screen.getByText('Erro de conexão')).toBeInTheDocument()
      })
    })
  })

  describe('preview mode - no matches', () => {
    it('exibe prévia do chaveamento com labels de grupo quando não há matches de 16 Avos', async () => {
      mockData.mockOrderFn.mockResolvedValue({ data: [], error: null })

      render(<BracketPrediction />)

      await waitFor(() => {
        expect(screen.getByText(/Prévia do chaveamento/i)).toBeInTheDocument()
      })
    })
  })

  describe('bracket with matches', () => {
    function setupWithMatches() {
      const matches = Array.from({ length: 16 }, (_, i) =>
        createR32Match(i + 1, `Time${i * 2 + 1}`, `Time${i * 2 + 2}`)
      )
      mockData.mockOrderFn.mockResolvedValue({ data: matches, error: null })
    }

    it('exibe todos os 16 confrontos com times corretos', async () => {
      setupWithMatches()

      render(<BracketPrediction />)

      await waitFor(() => {
        expect(screen.getByText('Palpites do Mata-Mata')).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByText('Time1')).toBeInTheDocument()
      })
      expect(screen.getByText('Time2')).toBeInTheDocument()
      expect(screen.getByText('Time31')).toBeInTheDocument()
      expect(screen.getByText('Time32')).toBeInTheDocument()

      const slotColumns = screen.getByTestId('bracket-columns')
      expect(slotColumns).toBeInTheDocument()

      for (let i = 1; i <= 16; i++) {
        const slotId = `R32_${String(i).padStart(2, '0')}`
        expect(screen.getByTestId(`slot-${slotId}`)).toBeInTheDocument()
      }
    })

    it('clique em time R32_01 avança e limpa descendentes', async () => {
      setupWithMatches()

      render(<BracketPrediction />)

      await waitFor(() => {
        expect(screen.getByText('Palpites do Mata-Mata')).toBeInTheDocument()
      })

      const homeTeamBtn = screen.getByTestId('pick-btn-R32_01-Time1')
      fireEvent.click(homeTeamBtn)

      const descendants = mockData.BRACKET_DESCENDANTS['R32_01']
      expect(descendants.length).toBeGreaterThan(0)
      descendants.forEach(desc => {
        expect(mockData.mockSetBracketPick).toHaveBeenCalledWith(desc, null)
      })
      expect(mockData.mockSetBracketPick).toHaveBeenCalledWith('R32_01', 'Time1')
    })

    it('trocar vencedor de R32_01 limpa QF_01 e todos os descendentes', async () => {
      mockData.mockUseBracketPrediction.mockReturnValue(
        defaultBracketHook({
          bracketPicks: {
            R32_01: 'Time1',
            QF_01: 'Time1',
            SF_01: 'Time1',
            FINAL: 'Time1',
            '3RD': 'Time2',
          },
        })
      )
      setupWithMatches()

      render(<BracketPrediction />)

      await waitFor(() => {
        expect(screen.getByText('Palpites do Mata-Mata')).toBeInTheDocument()
      })

      const awayTeamBtn = screen.getByTestId('pick-btn-R32_01-Time2')
      fireEvent.click(awayTeamBtn)

      const descendants = mockData.BRACKET_DESCENDANTS['R32_01']
      expect(descendants).toEqual(expect.arrayContaining(['QF_01', 'SF_01', 'FINAL', '3RD']))
      descendants.forEach(desc => {
        expect(mockData.mockSetBracketPick).toHaveBeenCalledWith(desc, null)
      })
      expect(mockData.mockSetBracketPick).toHaveBeenCalledWith('R32_01', 'Time2')
    })

    it('isPastDeadline true → cliques em times não alteram o estado', async () => {
      mockData.mockUseBracketPrediction.mockReturnValue(
        defaultBracketHook({ isPastDeadline: true })
      )
      setupWithMatches()

      render(<BracketPrediction />)

      await waitFor(() => {
        expect(screen.getByText('Palpites do Mata-Mata')).toBeInTheDocument()
      })

      const teamBtns = screen.getAllByText('Time1')
      expect(teamBtns.length).toBeGreaterThan(0)
      teamBtns.forEach(btn => {
        expect(btn.closest('button')).toBeDisabled()
      })
    })

    it('isPastDeadline true → badge "Palpites encerrados" visível', async () => {
      mockData.mockUseBracketPrediction.mockReturnValue(
        defaultBracketHook({ isPastDeadline: true })
      )
      setupWithMatches()

      render(<BracketPrediction />)

      await waitFor(() => {
        expect(screen.getByText(/Palpites encerrados/)).toBeInTheDocument()
      })
    })

    it('exibe indicador de progresso N/32 palpites feitos', async () => {
      mockData.mockUseBracketPrediction.mockReturnValue(
        defaultBracketHook({
          bracketPicks: {
            R32_01: 'Time1',
            R32_02: 'Time3',
            R32_03: 'Time5',
            R32_04: 'Time7',
            R32_05: 'Time9',
            R32_06: 'Time11',
            R32_07: 'Time13',
            R32_08: 'Time15',
            R32_09: 'Time17',
            R32_10: 'Time19',
            R32_11: 'Time21',
            R32_12: 'Time23',
            R32_13: 'Time25',
            R32_14: 'Time27',
            R32_15: 'Time29',
            R32_16: 'Time31',
          },
        })
      )
      setupWithMatches()

      render(<BracketPrediction />)

      await waitFor(() => {
        const indicator = screen.getByTestId('progress-indicator')
        expect(indicator).toHaveTextContent(/^16\/32/)
      })
    })

    it('exibe contador regressivo com formato correto', async () => {
      setupWithMatches()

      render(<BracketPrediction />)

      await waitFor(() => {
        const countdown = screen.getByTestId('countdown-value')
        expect(countdown).toBeInTheDocument()
        expect(countdown.textContent).not.toBe('')
      })
    })

    it('isSaving true → indicador "Salvando..." visível', async () => {
      mockData.mockUseBracketPrediction.mockReturnValue(
        defaultBracketHook({ isSaving: true })
      )
      setupWithMatches()

      render(<BracketPrediction />)

      await waitFor(() => {
        expect(screen.getByTestId('saving-indicator')).toBeInTheDocument()
        expect(screen.getByText('Salvando...')).toBeInTheDocument()
      })
    })

    it('exibe todas as fases como colunas (16 Avos, Quartas, Semifinal, Final / 3º Lugar)', async () => {
      setupWithMatches()

      render(<BracketPrediction />)

      await waitFor(() => {
        expect(screen.getByText('Palpites do Mata-Mata')).toBeInTheDocument()
      })

      expect(screen.getByText('16 Avos')).toBeInTheDocument()
      expect(screen.getByText('Quartas')).toBeInTheDocument()
      expect(screen.getByText('Semifinal')).toBeInTheDocument()
      expect(screen.getByText('Final / 3º Lugar')).toBeInTheDocument()
    })

    it('slot QF exibe times que avançaram dos R16 pais', async () => {
      mockData.mockUseBracketPrediction.mockReturnValue(
        defaultBracketHook({
          bracketPicks: {
            R16_01: 'Time1',
            R16_02: 'Time3',
          },
        })
      )
      setupWithMatches()

      render(<BracketPrediction />)

      await waitFor(() => {
        expect(screen.getByText('Palpites do Mata-Mata')).toBeInTheDocument()
      })

      const qfSlot = screen.getByTestId('slot-QF_01')
      expect(qfSlot).toBeInTheDocument()
      expect(qfSlot.textContent).toContain('Time1')
      expect(qfSlot.textContent).toContain('Time3')
    })

    it('exibe CheckMark no time vencedor do slot', async () => {
      mockData.mockUseBracketPrediction.mockReturnValue(
        defaultBracketHook({
          bracketPicks: {
            R32_01: 'Time1',
          },
        })
      )
      setupWithMatches()

      render(<BracketPrediction />)

      await waitFor(() => {
        expect(screen.getByText('Palpites do Mata-Mata')).toBeInTheDocument()
      })

      const slot = screen.getByTestId('slot-R32_01')
      expect(slot.textContent).toContain('✓')
    })
  })
})

describe('BracketPrediction integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockData.mockUseAuth.mockReturnValue({ user: { id: 'test-user' } })
    mockData.mockUseBracketPrediction.mockReturnValue(defaultBracketHook())
    mockData.mockOrderFn.mockResolvedValue({ data: [], error: null })
  })

  it('rota /bracket-prediction renderiza a página sem crash', async () => {
    mockData.mockOrderFn.mockResolvedValue({
      data: [createR32Match(1, 'Brasil', 'Argentina')],
      error: null,
    })

    render(<BracketPrediction />)

    await waitFor(() => {
      expect(screen.getByText('Palpites do Mata-Mata')).toBeInTheDocument()
    })
  })

  it('usuário não autenticado → não crasha (tratamento interno do hook)', async () => {
    mockData.mockUseAuth.mockReturnValue({ user: null })

    render(<BracketPrediction />)

    await waitFor(() => {
      expect(screen.getByText(/Prévia do chaveamento/i)).toBeInTheDocument()
    })
  })
})
