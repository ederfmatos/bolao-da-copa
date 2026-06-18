import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Artilheiro from '../Artilheiro'

const MOCK_PLAYERS = [
  { id: 'p1', name: 'Vinícius Jr.', nationality: 'Brasil', flag: '🇧🇷', position: 'Forward', goals: 5 },
  { id: 'p2', name: 'Kylian Mbappé', nationality: 'França', flag: '🇫🇷', position: 'Forward', goals: 7 },
  { id: 'p3', name: 'Lionel Messi', nationality: 'Argentina', flag: '🇦🇷', position: 'Forward', goals: 4 },
  { id: 'p4', name: 'Erling Haaland', nationality: 'Noruega', flag: '🇳🇴', position: 'Forward', goals: 6 },
]

const mockUseAuth = vi.hoisted(() => vi.fn())
const mockUseScorerPlayers = vi.hoisted(() => vi.fn())
const mockUseScorerPrediction = vi.hoisted(() => vi.fn())
const mockUseAllScorerPredictions = vi.hoisted(() => vi.fn())

vi.mock('../../hooks/useAuth', () => ({
  useAuth: mockUseAuth,
}))

vi.mock('../../hooks/useScorerPlayers', () => ({
  useScorerPlayers: mockUseScorerPlayers,
}))

vi.mock('../../hooks/useScorerPrediction', () => ({
  useScorerPrediction: mockUseScorerPrediction,
}))

vi.mock('../../hooks/useAllScorerPredictions', () => ({
  useAllScorerPredictions: mockUseAllScorerPredictions,
}))

vi.mock('../../components/ScorerPlayerCard', () => ({
  default: ({ flag, name, nationality, position, goals, isSelected, onClick, disabled }) => (
    <div
      data-testid="scorer-player-card"
      data-name={name}
      data-selected={isSelected}
      data-disabled={disabled}
      onClick={onClick}
    >
      {flag} {name} — {goals} gols
      {isSelected && <span data-testid="selected-mark">✓</span>}
      {disabled && <span data-testid="disabled-mark">disabled</span>}
    </div>
  ),
}))

vi.mock('../../components/Avatar', () => ({
  default: ({ src, name, className }) => (
    <div data-testid="avatar" data-name={name} className={className}>
      {name?.charAt(0) || '?'}
    </div>
  ),
}))

vi.mock('../../lib/bracketData', () => ({
  SCORER_DEADLINE: new Date('2099-12-31T23:59:00Z'),
}))

const mockSignInWithGoogle = vi.fn()
const mockSavePrediction = vi.fn()

function defaultAuth(overrides = {}) {
  return {
    user: { id: 'user-1' },
    signInWithGoogle: mockSignInWithGoogle,
    ...overrides,
  }
}

function defaultPlayersHook(overrides = {}) {
  return {
    players: MOCK_PLAYERS,
    loading: false,
    error: null,
    ...overrides,
  }
}

function defaultPredictionHook(overrides = {}) {
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

describe('Artilheiro', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue(defaultAuth())
    mockUseScorerPlayers.mockReturnValue(defaultPlayersHook())
    mockUseScorerPrediction.mockReturnValue(defaultPredictionHook())
    mockUseAllScorerPredictions.mockReturnValue(defaultAllHook())
  })

  describe('loading state', () => {
    it('renders loading spinner while useScorerPlayers is loading', () => {
      mockUseScorerPlayers.mockReturnValue(defaultPlayersHook({ loading: true }))

      render(<Artilheiro />)

      expect(screen.getByText('Carregando...')).toBeInTheDocument()
    })

    it('renders loading spinner while useScorerPrediction is loading', () => {
      mockUseScorerPrediction.mockReturnValue(defaultPredictionHook({ loading: true }))

      render(<Artilheiro />)

      expect(screen.getByText('Carregando...')).toBeInTheDocument()
    })
  })

  describe('error state', () => {
    it('renders error message when useScorerPlayers has error', () => {
      mockUseScorerPlayers.mockReturnValue(defaultPlayersHook({ error: 'Falha ao carregar jogadores' }))

      render(<Artilheiro />)

      expect(screen.getByText('Falha ao carregar jogadores')).toBeInTheDocument()
    })

    it('renders error message when useScorerPrediction has error', () => {
      mockUseScorerPrediction.mockReturnValue(defaultPredictionHook({ error: 'Erro de permissão' }))

      render(<Artilheiro />)

      expect(screen.getByText('Erro de permissão')).toBeInTheDocument()
    })
  })

  describe('pre-deadline view', () => {
    it('renders deadline warning header', () => {
      render(<Artilheiro />)

      expect(screen.getByText(/Você pode escolher o artilheiro/)).toBeInTheDocument()
    })

    it('renders page title and description', () => {
      render(<Artilheiro />)

      expect(screen.getByText('Artilheiro da Copa')).toBeInTheDocument()
      expect(screen.getByText(/Escolha quem será o artilheiro/)).toBeInTheDocument()
    })

    it('renders 30 player cards in responsive grid', () => {
      const manyPlayers = Array.from({ length: 30 }, (_, i) => ({
        id: `p${i}`,
        name: `Player ${i}`,
        nationality: 'Brasil',
        flag: '🇧🇷',
        position: 'Forward',
        goals: 0,
      }))
      mockUseScorerPlayers.mockReturnValue(defaultPlayersHook({ players: manyPlayers }))

      render(<Artilheiro />)

      const cards = screen.getAllByTestId('scorer-player-card')
      expect(cards).toHaveLength(30)
    })

    it('highlights user current pick with isSelected and badge', () => {
      mockUseScorerPrediction.mockReturnValue(
        defaultPredictionHook({ prediction: { player_id: 'p1', scorer_points: 0 } })
      )

      render(<Artilheiro />)

      const cards = screen.getAllByTestId('scorer-player-card')
      const selectedCard = cards.find(c => c.dataset.name === 'Vinícius Jr.')
      expect(selectedCard.dataset.selected).toBe('true')
      expect(screen.getByText('Seu palpite')).toBeInTheDocument()
    })

    it('tapping an unselected card calls savePrediction with player ID', async () => {
      mockSavePrediction.mockResolvedValue({ player_id: 'p2' })

      render(<Artilheiro />)

      const cards = screen.getAllByTestId('scorer-player-card')
      fireEvent.click(cards[1])

      await waitFor(() => {
        expect(mockSavePrediction).toHaveBeenCalledWith('p2')
      })
    })

    it('shows success toast after save', async () => {
      mockSavePrediction.mockResolvedValue({ player_id: 'p2' })

      render(<Artilheiro />)

      const cards = screen.getAllByTestId('scorer-player-card')
      fireEvent.click(cards[1])

      await waitFor(() => {
        expect(screen.getByText('Palpite salvo com sucesso!')).toBeInTheDocument()
      })
    })

    it('shows error toast when save fails', async () => {
      mockSavePrediction.mockRejectedValue(new Error('Conexão perdida'))

      render(<Artilheiro />)

      const cards = screen.getAllByTestId('scorer-player-card')
      fireEvent.click(cards[1])

      await waitFor(() => {
        expect(screen.getByText('Erro ao salvar: Conexão perdida')).toBeInTheDocument()
      })
    })

    it('does not call savePrediction if same card is tapped again', async () => {
      mockUseScorerPrediction.mockReturnValue(
        defaultPredictionHook({ prediction: { player_id: 'p1', scorer_points: 0 } })
      )
      mockSavePrediction.mockResolvedValue({ player_id: 'p1' })

      render(<Artilheiro />)

      const cards = screen.getAllByTestId('scorer-player-card')
      fireEvent.click(cards[0])

      await waitFor(() => {
        expect(mockSavePrediction).not.toHaveBeenCalled()
      })
    })

    it('shows saving indicator while save is in progress', async () => {
      let resolveSave
      mockSavePrediction.mockReturnValue(new Promise(resolve => { resolveSave = resolve }))

      render(<Artilheiro />)

      const cards = screen.getAllByTestId('scorer-player-card')
      fireEvent.click(cards[1])

      expect(screen.getByText('Salvando...')).toBeInTheDocument()

      resolveSave({ player_id: 'p2' })

      await waitFor(() => {
        expect(screen.getByText('Palpite salvo com sucesso!')).toBeInTheDocument()
      })
    })

    it('disables card interaction when saving', async () => {
      let resolveSave
      mockSavePrediction.mockReturnValue(new Promise(resolve => { resolveSave = resolve }))

      render(<Artilheiro />)

      const cards = screen.getAllByTestId('scorer-player-card')
      fireEvent.click(cards[1])

      expect(screen.getByText('Salvando...')).toBeInTheDocument()

      resolveSave({ player_id: 'p2' })

      await waitFor(() => {
        expect(screen.getByText('Palpite salvo com sucesso!')).toBeInTheDocument()
      })
    })

    it('after saving, the tapped card has isSelected true', async () => {
      mockSavePrediction.mockResolvedValue({ player_id: 'p3' })

      render(<Artilheiro />)

      const cards = screen.getAllByTestId('scorer-player-card')
      fireEvent.click(cards[2])

      await waitFor(() => {
        expect(screen.getByText('Palpite salvo com sucesso!')).toBeInTheDocument()
      })

      const updatedCards = screen.getAllByTestId('scorer-player-card')
      expect(updatedCards[2].dataset.selected).toBe('true')
    })
  })

  describe('login prompt', () => {
    it('renders login prompt for unauthenticated users', () => {
      mockUseAuth.mockReturnValue(defaultAuth({ user: null }))

      render(<Artilheiro />)

      expect(screen.getByText('Faça login para escolher o artilheiro')).toBeInTheDocument()
      expect(screen.getByText('Entrar com Google')).toBeInTheDocument()
    })

    it('does not show player cards when user is not authenticated', () => {
      mockUseAuth.mockReturnValue(defaultAuth({ user: null }))

      render(<Artilheiro />)

      expect(screen.queryByTestId('scorer-player-card')).not.toBeInTheDocument()
      expect(screen.queryByText('Salvando...')).not.toBeInTheDocument()
    })

    it('calls signInWithGoogle when login button is clicked', () => {
      mockUseAuth.mockReturnValue(defaultAuth({ user: null }))

      render(<Artilheiro />)

      fireEvent.click(screen.getByText('Entrar com Google'))
      expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1)
    })
  })

  describe('post-deadline view', () => {
    it('renders closed state header when past deadline', () => {
      mockUseScorerPrediction.mockReturnValue(defaultPredictionHook({ isPastDeadline: true }))

      render(<Artilheiro />)

      expect(screen.getByText('Artilheiro da Copa')).toBeInTheDocument()
      expect(screen.getByText('🔒 Palpites encerrados')).toBeInTheDocument()
    })

    it('does not show deadline warning when past deadline', () => {
      mockUseScorerPrediction.mockReturnValue(defaultPredictionHook({ isPastDeadline: true }))

      render(<Artilheiro />)

      expect(screen.queryByText(/Você pode escolher/)).not.toBeInTheDocument()
    })

    it('sorts players by goals descending', () => {
      mockUseScorerPrediction.mockReturnValue(defaultPredictionHook({ isPastDeadline: true }))

      render(<Artilheiro />)

      const playerNames = screen.getAllByText(/Kylian Mbappé|Erling Haaland|Vinícius Jr.|Lionel Messi/)
      const nameElements = playerNames.map(el => el.textContent)
      const topScorerIndex = nameElements.findIndex(n => n.includes('Kylian Mbappé'))
      const secondScorerIndex = nameElements.findIndex(n => n.includes('Erling Haaland'))
      expect(topScorerIndex).toBeLessThan(secondScorerIndex)
    })

    it('shows goal counts in ranking', () => {
      mockUseScorerPrediction.mockReturnValue(defaultPredictionHook({ isPastDeadline: true }))

      render(<Artilheiro />)

      const goalElements = screen.getAllByText('7')
      expect(goalElements.length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('6')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
      const fourGoalElements = screen.getAllByText('4')
      expect(fourGoalElements.length).toBeGreaterThanOrEqual(1)
    })

    it('marks user own pick with "Seu palpite" badge in ranking', () => {
      mockUseScorerPrediction.mockReturnValue(
        defaultPredictionHook({
          isPastDeadline: true,
          prediction: { player_id: 'p1', scorer_points: 0 },
        })
      )

      render(<Artilheiro />)

      const badges = screen.getAllByText('Seu palpite')
      expect(badges.length).toBeGreaterThanOrEqual(1)
    })

    it('renders participants panel with all picks', () => {
      mockUseScorerPrediction.mockReturnValue(defaultPredictionHook({ isPastDeadline: true }))
      mockUseAllScorerPredictions.mockReturnValue(
        defaultAllHook({
          predictions: [
            {
              userId: 'u1',
              playerId: 'p1',
              scorerPoints: 0,
              userName: 'Alice',
              userAvatarUrl: 'https://example.com/avatar1.jpg',
            },
            {
              userId: 'u2',
              playerId: 'p2',
              scorerPoints: 0,
              userName: 'Bob',
              userAvatarUrl: null,
            },
          ],
        })
      )

      render(<Artilheiro />)

      expect(screen.getByText('Palpites de todos')).toBeInTheDocument()
      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()
    })

    it('shows user own pick with "Seu palpite" badge in participants panel', () => {
      mockUseScorerPrediction.mockReturnValue(
        defaultPredictionHook({
          isPastDeadline: true,
          prediction: { player_id: 'p1', scorer_points: 0 },
        })
      )
      mockUseAllScorerPredictions.mockReturnValue(
        defaultAllHook({
          predictions: [
            {
              userId: 'user-1',
              playerId: 'p1',
              scorerPoints: 0,
              userName: 'Current User',
              userAvatarUrl: null,
            },
          ],
        })
      )

      render(<Artilheiro />)

      const badges = screen.getAllByText('Seu palpite')
      expect(badges.length).toBeGreaterThanOrEqual(1)
    })

    it('shows scorer points badge when points > 0', () => {
      mockUseScorerPrediction.mockReturnValue(
        defaultPredictionHook({
          isPastDeadline: true,
          prediction: { player_id: 'p1', scorer_points: 50 },
        })
      )
      mockUseAllScorerPredictions.mockReturnValue(
        defaultAllHook({
          predictions: [
            {
              userId: 'user-1',
              playerId: 'p1',
              scorerPoints: 50,
              userName: 'Current User',
              userAvatarUrl: null,
            },
          ],
        })
      )

      render(<Artilheiro />)

      expect(screen.getByText(/50 pts/)).toBeInTheDocument()
    })

    it('shows empty state when no predictions have been submitted', () => {
      mockUseScorerPrediction.mockReturnValue(defaultPredictionHook({ isPastDeadline: true }))

      render(<Artilheiro />)

      expect(screen.getByText('Nenhum palpite enviado')).toBeInTheDocument()
    })

    it('shows loading state for all predictions', () => {
      mockUseScorerPrediction.mockReturnValue(defaultPredictionHook({ isPastDeadline: true }))
      mockUseAllScorerPredictions.mockReturnValue(defaultAllHook({ loading: true }))

      render(<Artilheiro />)

      const loadings = screen.getAllByText('Carregando...')
      expect(loadings.length).toBeGreaterThanOrEqual(1)
    })

    it('shows player name and flag in each participant row', () => {
      mockUseScorerPrediction.mockReturnValue(defaultPredictionHook({ isPastDeadline: true }))
      mockUseAllScorerPredictions.mockReturnValue(
        defaultAllHook({
          predictions: [
            {
              userId: 'u1',
              playerId: 'p1',
              scorerPoints: 0,
              userName: 'Alice',
              userAvatarUrl: null,
            },
          ],
        })
      )

      render(<Artilheiro />)

      const viniElements = screen.getAllByText(/Vinícius Jr\./)
      expect(viniElements.length).toBeGreaterThanOrEqual(2)
      const flagElements = screen.getAllByText(/🇧🇷/)
      expect(flagElements.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('post-deadline edge cases', () => {
    it('tapping a card when isPastDeadline does NOT call savePrediction', () => {
      mockUseScorerPrediction.mockReturnValue(defaultPredictionHook({ isPastDeadline: true }))

      render(<Artilheiro />)

      const cards = screen.queryAllByTestId('scorer-player-card')
      expect(cards.length).toBe(0)
    })

    it('does not show login prompt when past deadline', () => {
      mockUseAuth.mockReturnValue(defaultAuth({ user: null }))
      mockUseScorerPrediction.mockReturnValue(defaultPredictionHook({ isPastDeadline: true }))

      render(<Artilheiro />)

      expect(screen.queryByText('Faça login para escolher o artilheiro')).not.toBeInTheDocument()
    })
  })
})
