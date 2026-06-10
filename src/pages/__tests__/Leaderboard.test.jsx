import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Leaderboard from '../Leaderboard'

const mockUseLeaderboard = vi.hoisted(() => vi.fn())
vi.mock('../../hooks/useLeaderboard', () => ({
  useLeaderboard: mockUseLeaderboard,
}))

const mockUseAuth = vi.hoisted(() => vi.fn())
vi.mock('../../hooks/useAuth', () => ({
  useAuth: mockUseAuth,
}))

vi.mock('../../components/LeaderboardRow', () => ({
  default: ({ entry, rank, isCurrentUser }) => (
    <div
      data-testid={`leaderboard-row-${entry.user_id}`}
      data-rank={rank}
      data-current={isCurrentUser}
    >
      {entry.name}
    </div>
  ),
}))

vi.mock('../../components/Podium', () => ({
  default: ({ top3 }) => (
    <div data-testid="podium" data-count={top3.length}>
      Podium
    </div>
  ),
}))

const mockEntry = (id, points) => ({
  user_id: id,
  name: `Player${id}`,
  avatar_url: null,
  total_points: points,
  total_predictions: 5,
})

function renderLeaderboard() {
  return render(
    <MemoryRouter>
      <Leaderboard />
    </MemoryRouter>,
  )
}

describe('Leaderboard page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } })
  })

  it('shows loading state', () => {
    mockUseLeaderboard.mockReturnValue({
      leaderboard: [],
      loading: true,
      error: null,
    })
    renderLeaderboard()
    expect(screen.getByText('Carregando classificação...')).toBeInTheDocument()
  })

  it('shows error state', () => {
    mockUseLeaderboard.mockReturnValue({
      leaderboard: [],
      loading: false,
      error: 'Failed to fetch',
    })
    renderLeaderboard()
    expect(screen.getByText('Erro: Failed to fetch')).toBeInTheDocument()
  })

  it('renders without inline styles', () => {
    mockUseLeaderboard.mockReturnValue({
      leaderboard: [],
      loading: false,
      error: null,
    })
    const { container } = renderLeaderboard()
    const elementsWithStyle = container.querySelectorAll('[style]')
    expect(elementsWithStyle.length).toBe(0)
  })

  it('renders page title', () => {
    mockUseLeaderboard.mockReturnValue({
      leaderboard: [],
      loading: false,
      error: null,
    })
    renderLeaderboard()
    expect(screen.getByText('Classificação')).toBeInTheDocument()
  })

  it('shows empty state when no data', () => {
    mockUseLeaderboard.mockReturnValue({
      leaderboard: [],
      loading: false,
      error: null,
    })
    renderLeaderboard()
    expect(screen.getByText('Nenhum palpite registrado ainda.')).toBeInTheDocument()
    expect(screen.getByText('Seja o primeiro a palpitar!')).toBeInTheDocument()
  })

  it('displays podium when top 3 exist', () => {
    mockUseLeaderboard.mockReturnValue({
      leaderboard: [
        mockEntry('u1', 30),
        mockEntry('u2', 25),
        mockEntry('u3', 20),
        mockEntry('u4', 15),
      ],
      loading: false,
      error: null,
    })
    renderLeaderboard()
    expect(screen.getByTestId('podium')).toBeInTheDocument()
  })

  it('does not display podium when less than 3 entries', () => {
    mockUseLeaderboard.mockReturnValue({
      leaderboard: [
        mockEntry('u1', 30),
        mockEntry('u2', 25),
      ],
      loading: false,
      error: null,
    })
    renderLeaderboard()
    expect(screen.queryByTestId('podium')).not.toBeInTheDocument()
  })

  it('renders leaderboard rows for all entries', () => {
    mockUseLeaderboard.mockReturnValue({
      leaderboard: [
        mockEntry('u1', 30),
        mockEntry('u2', 25),
        mockEntry('u3', 20),
        mockEntry('u4', 15),
      ],
      loading: false,
      error: null,
    })
    renderLeaderboard()
    expect(screen.getByTestId('leaderboard-row-u1')).toBeInTheDocument()
    expect(screen.getByTestId('leaderboard-row-u2')).toBeInTheDocument()
    expect(screen.getByTestId('leaderboard-row-u3')).toBeInTheDocument()
    expect(screen.getByTestId('leaderboard-row-u4')).toBeInTheDocument()
  })

  it('marks current user row', () => {
    mockUseLeaderboard.mockReturnValue({
      leaderboard: [
        mockEntry('u1', 30),
        mockEntry('u2', 25),
      ],
      loading: false,
      error: null,
    })
    renderLeaderboard()
    const currentRow = screen.getByTestId('leaderboard-row-u1')
    expect(currentRow.getAttribute('data-current')).toBe('true')
    const otherRow = screen.getByTestId('leaderboard-row-u2')
    expect(otherRow.getAttribute('data-current')).toBe('false')
  })

  it('assigns correct rank numbers', () => {
    mockUseLeaderboard.mockReturnValue({
      leaderboard: [
        mockEntry('u1', 30),
        mockEntry('u2', 25),
        mockEntry('u3', 20),
        mockEntry('u4', 15),
      ],
      loading: false,
      error: null,
    })
    renderLeaderboard()
    expect(screen.getByTestId('leaderboard-row-u1').getAttribute('data-rank')).toBe('1')
    expect(screen.getByTestId('leaderboard-row-u3').getAttribute('data-rank')).toBe('3')
    expect(screen.getByTestId('leaderboard-row-u4').getAttribute('data-rank')).toBe('4')
  })

  it('has Tailwind classes on container', () => {
    mockUseLeaderboard.mockReturnValue({
      leaderboard: [mockEntry('u1', 30)],
      loading: false,
      error: null,
    })
    const { container } = renderLeaderboard()
    const pageContainer = container.querySelector('.p-4.max-w-xl.mx-auto')
    expect(pageContainer).toBeInTheDocument()
  })

  it('handles user being null without crashing', () => {
    mockUseAuth.mockReturnValue({ user: null })
    mockUseLeaderboard.mockReturnValue({
      leaderboard: [mockEntry(1, 30)],
      loading: false,
      error: null,
    })
    renderLeaderboard()
    expect(screen.getByText('Player1')).toBeInTheDocument()
    expect(screen.getByTestId('leaderboard-row-1').getAttribute('data-current')).toBe('false')
  })
})
