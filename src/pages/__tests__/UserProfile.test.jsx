import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import UserProfile from '../UserProfile'

const mockNavigate = vi.hoisted(() => vi.fn())

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const mockUseUserPredictions = vi.hoisted(() => vi.fn())
vi.mock('../../hooks/useUserPredictions', () => ({
  useUserPredictions: mockUseUserPredictions,
}))

const mockUseLeaderboard = vi.hoisted(() => vi.fn())
vi.mock('../../hooks/useLeaderboard', () => ({
  useLeaderboard: mockUseLeaderboard,
}))

const mockUseAuth = vi.hoisted(() => vi.fn())
vi.mock('../../hooks/useAuth', () => ({
  useAuth: mockUseAuth,
}))

vi.mock('../../components/UserProfileHeader', () => ({
  default: ({ name, avatarUrl, totalPoints, rank }) => (
    <div data-testid="user-profile-header" data-name={name} data-avatar={avatarUrl} data-points={totalPoints} data-rank={rank}>
      {name}
    </div>
  ),
}))

vi.mock('../../components/UserStats', () => ({
  default: ({ predictions }) => (
    <div data-testid="user-stats" data-count={predictions.length}>
      Estatísticas
    </div>
  ),
}))

vi.mock('../../components/UserPredictionRow', () => ({
  default: ({ prediction }) => (
    <div data-testid={`prediction-row-${prediction.prediction_id}`}>
      {prediction.home_team} vs {prediction.away_team}
    </div>
  ),
}))

vi.mock('../../components/NotificationToggle', () => ({
  default: () => (
    <div data-testid="notification-toggle">
      Notificações
    </div>
  ),
}))

const defaultLeaderboard = [
  { user_id: 'user1', name: 'Alice', avatar_url: 'https://example.com/alice.jpg', total_points: 100, total_predictions: 10 },
  { user_id: 'user2', name: 'Bob', avatar_url: null, total_points: 80, total_predictions: 10 },
  { user_id: 'user3', name: 'Charlie', avatar_url: 'https://example.com/charlie.jpg', total_points: 60, total_predictions: 10 },
]

const defaultPredictions = [
  {
    prediction_id: 'p1',
    user_id: 'user2',
    match_id: 'm1',
    predicted_home: 2,
    predicted_away: 1,
    points: 10,
    created_at: '2026-06-10T10:00:00Z',
    home_team: 'Brasil',
    away_team: 'Argentina',
    home_flag: '🇧🇷',
    away_flag: '🇦🇷',
    group_name: 'Grupo A',
    kickoff_at: '2026-06-20T21:00:00Z',
    match_status: 'finished',
    actual_home: 2,
    actual_away: 1,
  },
  {
    prediction_id: 'p2',
    user_id: 'user2',
    match_id: 'm2',
    predicted_home: 1,
    predicted_away: 1,
    points: 7,
    created_at: '2026-06-09T10:00:00Z',
    home_team: 'Alemanha',
    away_team: 'França',
    home_flag: '🇩🇪',
    away_flag: '🇫🇷',
    group_name: 'Grupo B',
    kickoff_at: '2026-06-21T21:00:00Z',
    match_status: 'finished',
    actual_home: 1,
    actual_away: 1,
  },
]

function renderWithRouter(route = '/user/user2') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/user/:userId" element={<UserProfile />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('UserProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ user: { id: 'user2' } })
    mockUseUserPredictions.mockReturnValue({
      predictions: defaultPredictions,
      loading: false,
      error: null,
    })
    mockUseLeaderboard.mockReturnValue({
      leaderboard: defaultLeaderboard,
      loading: false,
      error: null,
    })
  })

  it('page renders without errors', async () => {
    renderWithRouter()
    await waitFor(() => {
      expect(screen.getByTestId('user-profile-header')).toBeInTheDocument()
    })
    expect(screen.getByTestId('user-stats')).toBeInTheDocument()
  })

  it('UserProfileHeader displays with correct data', async () => {
    renderWithRouter()
    await waitFor(() => {
      const header = screen.getByTestId('user-profile-header')
      expect(header).toHaveAttribute('data-name', 'Bob')
      expect(header).toHaveAttribute('data-points', '80')
      expect(header).toHaveAttribute('data-rank', '2')
    })
  })

  it('UserStats displays with correct statistics', async () => {
    renderWithRouter()
    await waitFor(() => {
      const stats = screen.getByTestId('user-stats')
      expect(stats).toHaveAttribute('data-count', '2')
    })
  })

  it('prediction list renders all predictions', async () => {
    renderWithRouter()
    await waitFor(() => {
      expect(screen.getByTestId('prediction-row-p1')).toBeInTheDocument()
    })
    expect(screen.getByTestId('prediction-row-p2')).toBeInTheDocument()
    expect(screen.getByText('Brasil vs Argentina')).toBeInTheDocument()
    expect(screen.getByText('Alemanha vs França')).toBeInTheDocument()
  })

  it('loading state displays while fetching', () => {
    mockUseUserPredictions.mockReturnValue({
      predictions: [],
      loading: true,
      error: null,
    })
    mockUseLeaderboard.mockReturnValue({
      leaderboard: [],
      loading: true,
      error: null,
    })
    renderWithRouter()
    expect(screen.getByText('Carregando perfil...')).toBeInTheDocument()
  })

  it('error state displays on fetch failure', async () => {
    mockUseUserPredictions.mockReturnValue({
      predictions: [],
      loading: false,
      error: 'Failed to fetch',
    })
    mockUseLeaderboard.mockReturnValue({
      leaderboard: [],
      loading: false,
      error: null,
    })
    renderWithRouter()
    await waitFor(() => {
      expect(screen.getByText(/Erro ao carregar perfil/)).toBeInTheDocument()
    })
    expect(screen.getByText(/Failed to fetch/)).toBeInTheDocument()
  })

  it('Voltar button calls navigate(-1)', async () => {
    renderWithRouter()
    await waitFor(() => {
      const backButton = screen.getByText('← Voltar')
      fireEvent.click(backButton)
      expect(mockNavigate).toHaveBeenCalledWith(-1)
    })
  })

  it('page handles user with no predictions', async () => {
    mockUseUserPredictions.mockReturnValue({
      predictions: [],
      loading: false,
      error: null,
    })
    renderWithRouter()
    await waitFor(() => {
      expect(screen.getByText('Nenhum palpite registrado')).toBeInTheDocument()
    })
    expect(screen.getByTestId('user-profile-header')).toBeInTheDocument()
    expect(screen.getByTestId('user-stats')).toBeInTheDocument()
  })

  it('page handles user not found in leaderboard', async () => {
    renderWithRouter('/user/nonexistent')
    await waitFor(() => {
      expect(screen.getByText('Usuário não encontrado')).toBeInTheDocument()
    })
  })

  it('deep linking to /user/:userId works', async () => {
    renderWithRouter('/user/user1')
    await waitFor(() => {
      const header = screen.getByTestId('user-profile-header')
      expect(header).toHaveAttribute('data-name', 'Alice')
      expect(header).toHaveAttribute('data-points', '100')
      expect(header).toHaveAttribute('data-rank', '1')
    })
  })

  it('page shows leaderboard error', async () => {
    mockUseLeaderboard.mockReturnValue({
      leaderboard: [],
      loading: false,
      error: 'Leaderboard error',
    })
    renderWithRouter()
    await waitFor(() => {
      expect(screen.getByText(/Erro ao carregar perfil/)).toBeInTheDocument()
    })
    expect(screen.getByText(/Leaderboard error/)).toBeInTheDocument()
  })

  it('page handles user with avatar_url as null', async () => {
    renderWithRouter('/user/user2')
    await waitFor(() => {
      const header = screen.getByTestId('user-profile-header')
      expect(header).not.toHaveAttribute('data-avatar')
    })
  })

  it('NotificationToggle component is rendered on own profile', async () => {
    renderWithRouter('/user/user2')
    await waitFor(() => {
      expect(screen.getByTestId('notification-toggle')).toBeInTheDocument()
    })
  })

  it('NotificationToggle component is NOT rendered on other user profile', async () => {
    renderWithRouter('/user/user1')
    await waitFor(() => {
      expect(screen.queryByTestId('notification-toggle')).not.toBeInTheDocument()
    })
  })
})
