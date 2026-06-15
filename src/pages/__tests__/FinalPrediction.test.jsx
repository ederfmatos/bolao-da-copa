import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import FinalPrediction from '../FinalPrediction'

const MOCK_TEAMS = vi.hoisted(() => [
  { name: 'Brasil', flag: '🇧🇷', bracketHalf: 'LEFT' },
  { name: 'Argentina', flag: '🇦🇷', bracketHalf: 'LEFT' },
  { name: 'Espanha', flag: '🇪🇸', bracketHalf: 'RIGHT' },
  { name: 'Portugal', flag: '🇵🇹', bracketHalf: 'RIGHT' },
])

vi.mock('../../lib/bracketData', () => {
  const teams = MOCK_TEAMS
  return {
    BONUS_DEADLINE: new Date('2099-12-31T23:59:00Z'),
    TEAMS: teams,
    getValidTeams: vi.fn((position, picks) => {
      const taken = Object.values(picks).filter(Boolean)
      const { first } = picks
      if (position === 'first') return teams.filter(t => !taken.includes(t.name))
      const firstHalf = first ? teams.find(t => t.name === first)?.bracketHalf : null
      const oppositeHalf = firstHalf === 'LEFT' ? 'RIGHT' : 'LEFT'
      if (position === 'second')
        return teams.filter(t => t.bracketHalf === oppositeHalf && !taken.includes(t.name))
      if (position === 'third') return teams.filter(t => !taken.includes(t.name))
      return []
    }),
    deriveFourthPlace: vi.fn((picks) => {
      const { first, second, third } = picks
      if (!first || !second || !third) return null
      const thirdHalf = teams.find(t => t.name === third)?.bracketHalf
      const taken = [first, second, third]
      return teams.find(t => t.bracketHalf !== thirdHalf && !taken.includes(t.name))?.name ?? null
    }),
  }
})

vi.mock('../../components/TeamPicker', () => ({
  default: ({ teams, onSelect, onClose }) => (
    <div data-testid="team-picker">
      {teams.map(t => (
        <button key={t.name} onClick={() => onSelect(t.name)}>
          {t.name}
        </button>
      ))}
      <button data-testid="close-picker" onClick={onClose}>
        Fechar
      </button>
    </div>
  ),
}))

vi.mock('../../components/BonusScorePanel', () => ({
  default: () => <div data-testid="bonus-score-panel">BonusScorePanel</div>,
}))

vi.mock('../../components/Avatar', () => ({
  default: ({ src, name, className }) => (
    <div data-testid="avatar" data-name={name} className={className}>
      {name?.charAt(0)}
    </div>
  ),
}))

const mockSavePrediction = vi.fn()

const mockUseBonusPrediction = vi.hoisted(() => vi.fn())
vi.mock('../../hooks/useBonusPrediction', () => ({
  useBonusPrediction: mockUseBonusPrediction,
}))

const mockUseAllBonusPredictions = vi.hoisted(() => vi.fn())
vi.mock('../../hooks/useAllBonusPredictions', () => ({
  useAllBonusPredictions: mockUseAllBonusPredictions,
}))

function defaultBonusHook(overrides = {}) {
  return {
    prediction: null,
    isPastDeadline: false,
    savePrediction: mockSavePrediction,
    loading: false,
    error: null,
    ...overrides,
  }
}

function defaultAllHook(overrides = {}) {
  return {
    predictions: [],
    loading: false,
    error: null,
    ...overrides,
  }
}

describe('FinalPrediction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseBonusPrediction.mockReturnValue(defaultBonusHook())
    mockUseAllBonusPredictions.mockReturnValue(defaultAllHook())
  })

  it('exibe estado de loading quando loading é true', () => {
    mockUseBonusPrediction.mockReturnValue(defaultBonusHook({ loading: true }))

    render(<FinalPrediction />)

    expect(screen.getByText('Carregando...')).toBeInTheDocument()
  })

  it('exibe mensagem de erro quando error não é null', () => {
    mockUseBonusPrediction.mockReturnValue(defaultBonusHook({ error: 'Algo deu errado' }))

    render(<FinalPrediction />)

    expect(screen.getByText('Algo deu errado')).toBeInTheDocument()
  })

  it('exibe o formulário quando isPastDeadline é false', () => {
    render(<FinalPrediction />)

    expect(screen.getByText('Palpite Bônus')).toBeInTheDocument()
    expect(screen.getByText(/Escolha as 4 seleções/)).toBeInTheDocument()
    expect(screen.queryByText('Palpites encerrados')).not.toBeInTheDocument()
  })

  it('exibe a view de leitura quando isPastDeadline é true', () => {
    mockUseBonusPrediction.mockReturnValue(defaultBonusHook({ isPastDeadline: true }))

    render(<FinalPrediction />)

    expect(screen.getByText('Palpites encerrados')).toBeInTheDocument()
    expect(screen.getByText('Seu palpite bônus')).toBeInTheDocument()
    expect(screen.queryByText('Palpite Bônus')).not.toBeInTheDocument()
  })

  it('exibe "Prazo encerrado — nenhum palpite enviado" quando não há palpite após deadline', () => {
    mockUseBonusPrediction.mockReturnValue(defaultBonusHook({ isPastDeadline: true, prediction: null }))

    render(<FinalPrediction />)

    expect(screen.getByText('Prazo encerrado — nenhum palpite enviado')).toBeInTheDocument()
  })

  it('exibe os 4 times selecionados na view de leitura quando prediction existe', () => {
    mockUseBonusPrediction.mockReturnValue(
      defaultBonusHook({
        isPastDeadline: true,
        prediction: {
          first_place: 'Brasil',
          second_place: 'Espanha',
          third_place: 'Argentina',
          fourth_place: 'Portugal',
          bonus_points: 0,
        },
      })
    )

    render(<FinalPrediction />)

    expect(screen.getByText('Brasil')).toBeInTheDocument()
    expect(screen.getByText('Espanha')).toBeInTheDocument()
    expect(screen.getByText('Argentina')).toBeInTheDocument()
    expect(screen.getByText('Portugal')).toBeInTheDocument()
  })

  it('destaca palpites corretos com checkmark quando bonus_points > 0', () => {
    mockUseBonusPrediction.mockReturnValue(
      defaultBonusHook({
        isPastDeadline: true,
        prediction: {
          first_place: 'Brasil',
          second_place: 'Espanha',
          third_place: 'Argentina',
          fourth_place: 'Portugal',
          bonus_points: 100,
        },
      })
    )

    render(<FinalPrediction />)

    expect(screen.getByText(/100 pontos bônus/)).toBeInTheDocument()
    expect(screen.getAllByText('✓').length).toBeGreaterThanOrEqual(4)
  })

  it('renderiza a lista de allPredictions com nome e avatar', () => {
    mockUseBonusPrediction.mockReturnValue(defaultBonusHook({ isPastDeadline: true }))
    mockUseAllBonusPredictions.mockReturnValue(
      defaultAllHook({
        predictions: [
          {
            userId: 'u1',
            userName: 'Alice',
            avatarUrl: 'https://example.com/avatar1.jpg',
            firstPlace: 'Brasil',
            secondPlace: 'Espanha',
            thirdPlace: 'Argentina',
            fourthPlace: 'Portugal',
            bonusPoints: 50,
          },
          {
            userId: 'u2',
            userName: 'Bob',
            avatarUrl: null,
            firstPlace: 'Espanha',
            secondPlace: 'Brasil',
            thirdPlace: 'Portugal',
            fourthPlace: 'Argentina',
            bonusPoints: 0,
          },
        ],
      })
    )

    render(<FinalPrediction />)

    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    const avatars = screen.getAllByTestId('avatar')
    expect(avatars).toHaveLength(2)
  })

  it('exibe BonusScorePanel no topo da página', () => {
    render(<FinalPrediction />)

    const panels = screen.getAllByTestId('bonus-score-panel')
    expect(panels.length).toBeGreaterThan(0)
  })

  describe('fluxo sequencial do formulário', () => {
    it('clica na etapa Campeão e abre TeamPicker com todos os times', () => {
      render(<FinalPrediction />)

      fireEvent.click(screen.getByText(/1º lugar.*Campeão/))

      const picker = screen.getByTestId('team-picker')
      expect(picker).toBeInTheDocument()
      expect(screen.getByText('Brasil')).toBeInTheDocument()
      expect(screen.getByText('Argentina')).toBeInTheDocument()
      expect(screen.getByText('Espanha')).toBeInTheDocument()
      expect(screen.getByText('Portugal')).toBeInTheDocument()
    })

    it('selecionar Brasil como 1º → 2º lugar ativa com apenas times da metade RIGHT', () => {
      render(<FinalPrediction />)

      fireEvent.click(screen.getByText(/1º lugar.*Campeão/))
      fireEvent.click(screen.getByText('Brasil'))

      expect(screen.getByText('Brasil')).toBeInTheDocument()

      fireEvent.click(screen.getByText(/2º lugar.*Vice/))

      const picker = screen.getByTestId('team-picker')
      expect(picker).toBeInTheDocument()
      expect(picker).toHaveTextContent('Espanha')
      expect(picker).toHaveTextContent('Portugal')
      expect(picker).not.toHaveTextContent('Brasil')
      expect(picker).not.toHaveTextContent('Argentina')
    })

    it('selecionar Espanha para 2º → 3º lugar ativa excluindo Brasil e Espanha', () => {
      render(<FinalPrediction />)

      fireEvent.click(screen.getByText(/1º lugar.*Campeão/))
      fireEvent.click(screen.getByText('Brasil'))

      fireEvent.click(screen.getByText(/2º lugar.*Vice/))
      fireEvent.click(screen.getByText('Espanha'))

      fireEvent.click(screen.getByText(/3º lugar/))

      const picker = screen.getByTestId('team-picker')
      expect(picker).toBeInTheDocument()
      expect(picker).toHaveTextContent('Argentina')
      expect(picker).toHaveTextContent('Portugal')
      expect(picker).not.toHaveTextContent('Brasil')
      expect(picker).not.toHaveTextContent('Espanha')
    })

    it('após selecionar 3º → fourth é preenchido e Confirmar Palpite aparece', () => {
      render(<FinalPrediction />)

      fireEvent.click(screen.getByText(/1º lugar.*Campeão/))
      fireEvent.click(screen.getByText('Brasil'))

      fireEvent.click(screen.getByText(/2º lugar.*Vice/))
      fireEvent.click(screen.getByText('Espanha'))

      fireEvent.click(screen.getByText(/3º lugar/))
      fireEvent.click(screen.getByText('Argentina'))

      expect(screen.getByText('Portugal')).toBeInTheDocument()
      expect(screen.getByText('Confirmar Palpite')).toBeInTheDocument()
    })

    it('Confirmar Palpite chama savePrediction com parâmetros corretos', async () => {
      mockSavePrediction.mockResolvedValue({
        first_place: 'Brasil',
        second_place: 'Espanha',
        third_place: 'Argentina',
        fourth_place: 'Portugal',
      })

      render(<FinalPrediction />)

      fireEvent.click(screen.getByText(/1º lugar.*Campeão/))
      fireEvent.click(screen.getByText('Brasil'))

      fireEvent.click(screen.getByText(/2º lugar.*Vice/))
      fireEvent.click(screen.getByText('Espanha'))

      fireEvent.click(screen.getByText(/3º lugar/))
      fireEvent.click(screen.getByText('Argentina'))

      fireEvent.click(screen.getByText('Confirmar Palpite'))

      await waitFor(() => {
        expect(mockSavePrediction).toHaveBeenCalledWith({
          firstPlace: 'Brasil',
          secondPlace: 'Espanha',
          thirdPlace: 'Argentina',
          fourthPlace: 'Portugal',
        })
      })
    })

    it('exibe mensagem de confirmação após save bem-sucedido', async () => {
      mockSavePrediction.mockResolvedValue({
        first_place: 'Brasil',
        second_place: 'Espanha',
        third_place: 'Argentina',
        fourth_place: 'Portugal',
      })

      render(<FinalPrediction />)

      fireEvent.click(screen.getByText(/1º lugar.*Campeão/))
      fireEvent.click(screen.getByText('Brasil'))

      fireEvent.click(screen.getByText(/2º lugar.*Vice/))
      fireEvent.click(screen.getByText('Espanha'))

      fireEvent.click(screen.getByText(/3º lugar/))
      fireEvent.click(screen.getByText('Argentina'))

      fireEvent.click(screen.getByText('Confirmar Palpite'))

      await waitFor(() => {
        expect(screen.getByText('Palpite salvo com sucesso!')).toBeInTheDocument()
      })
    })

    it('exibe mensagem de erro quando savePrediction falha', async () => {
      mockSavePrediction.mockRejectedValue(new Error('Falha na conexão'))

      render(<FinalPrediction />)

      fireEvent.click(screen.getByText(/1º lugar.*Campeão/))
      fireEvent.click(screen.getByText('Brasil'))

      fireEvent.click(screen.getByText(/2º lugar.*Vice/))
      fireEvent.click(screen.getByText('Espanha'))

      fireEvent.click(screen.getByText(/3º lugar/))
      fireEvent.click(screen.getByText('Argentina'))

      fireEvent.click(screen.getByText('Confirmar Palpite'))

      await waitFor(() => {
        expect(screen.getByText('Erro ao salvar: Falha na conexão')).toBeInTheDocument()
      })
    })

    it('exibe estado de loading durante save', async () => {
      let resolveSave
      mockSavePrediction.mockReturnValue(new Promise(resolve => { resolveSave = resolve }))

      render(<FinalPrediction />)

      fireEvent.click(screen.getByText(/1º lugar.*Campeão/))
      fireEvent.click(screen.getByText('Brasil'))

      fireEvent.click(screen.getByText(/2º lugar.*Vice/))
      fireEvent.click(screen.getByText('Espanha'))

      fireEvent.click(screen.getByText(/3º lugar/))
      fireEvent.click(screen.getByText('Argentina'))

      fireEvent.click(screen.getByText('Confirmar Palpite'))

      expect(screen.getByText('Salvando...')).toBeInTheDocument()
      expect(screen.getByText('Salvando...').closest('button')).toBeDisabled()

      resolveSave({
        first_place: 'Brasil',
        second_place: 'Espanha',
        third_place: 'Argentina',
        fourth_place: 'Portugal',
      })

      await waitFor(() => {
        expect(screen.getByText('Palpite salvo com sucesso!')).toBeInTheDocument()
      })
    })

    it('limpa o pick do 1º lugar e seus downstream ao clicar ✕', () => {
      render(<FinalPrediction />)

      fireEvent.click(screen.getByText(/1º lugar.*Campeão/))
      fireEvent.click(screen.getByText('Brasil'))

      fireEvent.click(screen.getByText(/2º lugar.*Vice/))
      fireEvent.click(screen.getByText('Espanha'))

      expect(screen.getByText('Brasil')).toBeInTheDocument()
      expect(screen.getByText('Espanha')).toBeInTheDocument()

      const clearButtons = screen.getAllByText('✕')
      fireEvent.click(clearButtons[0])

      expect(screen.queryByText('Espanha')).not.toBeInTheDocument()
    })

    it('fecha o TeamPicker ao clicar em Fechar', () => {
      render(<FinalPrediction />)

      fireEvent.click(screen.getByText(/1º lugar.*Campeão/))
      expect(screen.getByTestId('team-picker')).toBeInTheDocument()

      fireEvent.click(screen.getByText('Fechar'))

      expect(screen.queryByTestId('team-picker')).not.toBeInTheDocument()
    })

    it('pré-popula picks quando usuário já tem prediction salvo', () => {
      mockUseBonusPrediction.mockReturnValue(
        defaultBonusHook({
          prediction: {
            first_place: 'Argentina',
            second_place: 'Portugal',
            third_place: 'Brasil',
            fourth_place: 'Espanha',
            bonus_points: 0,
          },
        })
      )

      render(<FinalPrediction />)

      expect(screen.getByText('Argentina')).toBeInTheDocument()
      expect(screen.getByText('Portugal')).toBeInTheDocument()
      expect(screen.getByText('Brasil')).toBeInTheDocument()
      expect(screen.getByText('Espanha')).toBeInTheDocument()
    })

    it('não abre picker ao clicar em etapa bloqueada', () => {
      render(<FinalPrediction />)

      fireEvent.click(screen.getByText(/3º lugar/))

      expect(screen.queryByTestId('team-picker')).not.toBeInTheDocument()
    })

    it('allPredictions lista exibe nomes na view pós-deadline', () => {
      mockUseBonusPrediction.mockReturnValue(defaultBonusHook({ isPastDeadline: true }))
      mockUseAllBonusPredictions.mockReturnValue(
        defaultAllHook({
          predictions: [
            {
              userId: 'u3',
              userName: 'Carlos',
              avatarUrl: null,
              firstPlace: 'Portugal',
              secondPlace: 'Brasil',
              thirdPlace: 'Espanha',
              fourthPlace: 'Argentina',
              bonusPoints: 0,
            },
          ],
        })
      )

      render(<FinalPrediction />)

      expect(screen.getByText('Carlos')).toBeInTheDocument()
    })
  })
})
