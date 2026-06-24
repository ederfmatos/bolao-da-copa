import { render, screen, fireEvent } from '@testing-library/react'
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

const mockEntry = (id, points, tiebreakers = {}, extra = {}) => ({
  user_id: id,
  name: `Player${id}`,
  avatar_url: null,
  total_points: points,
  total_predictions: 5,
  exact_score_count: tiebreakers.exact_score_count ?? 0,
  winner_with_diff_count: tiebreakers.winner_with_diff_count ?? 0,
  winner_correct_count: tiebreakers.winner_correct_count ?? 0,
  group_points: extra.group_points ?? points,
  bracket_points: extra.bracket_points ?? 0,
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

  it('renders entries in order provided by backend (tiebreakers applied server-side)', () => {
    mockUseLeaderboard.mockReturnValue({
      leaderboard: [
        mockEntry('u1', 30, { exact_score_count: 2, winner_with_diff_count: 1, winner_correct_count: 3 }),
        mockEntry('u2', 30, { exact_score_count: 1, winner_with_diff_count: 2, winner_correct_count: 2 }),
        mockEntry('u3', 30, { exact_score_count: 1, winner_with_diff_count: 1, winner_correct_count: 4 }),
        mockEntry('u4', 25, { exact_score_count: 0, winner_with_diff_count: 3, winner_correct_count: 1 }),
      ],
      loading: false,
      error: null,
    })
    renderLeaderboard()
    expect(screen.getByTestId('leaderboard-row-u1').getAttribute('data-rank')).toBe('1')
    expect(screen.getByTestId('leaderboard-row-u2').getAttribute('data-rank')).toBe('2')
    expect(screen.getByTestId('leaderboard-row-u3').getAttribute('data-rank')).toBe('3')
    expect(screen.getByTestId('leaderboard-row-u4').getAttribute('data-rank')).toBe('4')
  })

  it('shows Geral button active by default and Mata-Mata inactive', () => {
    mockUseLeaderboard.mockReturnValue({
      leaderboard: [mockEntry('u1', 30, {}, { bracket_points: 10 })],
      loading: false,
      error: null,
    })
    renderLeaderboard()
    const geralBtn = screen.getByText('Geral')
    const mataBtn = screen.getByText('Mata-Mata')
    expect(geralBtn.className).toContain('bg-green-500')
    expect(mataBtn.className).not.toContain('bg-purple-500')
  })

  it('sorts by bracket_points DESC when Mata-Mata toggle is active', () => {
    mockUseLeaderboard.mockReturnValue({
      leaderboard: [
        mockEntry('u1', 30, {}, { bracket_points: 5 }),
        mockEntry('u2', 25, {}, { bracket_points: 15 }),
        mockEntry('u3', 20, {}, { bracket_points: 10 }),
      ],
      loading: false,
      error: null,
    })
    renderLeaderboard()
    fireEvent.click(screen.getByText('Mata-Mata'))

    const rows = screen.getAllByTestId(/leaderboard-row-u/)
    expect(rows[0].getAttribute('data-rank')).toBe('1')
    expect(rows[0].textContent).toBe('Playeru2')
    expect(rows[1].getAttribute('data-rank')).toBe('2')
    expect(rows[1].textContent).toBe('Playeru3')
    expect(rows[2].getAttribute('data-rank')).toBe('3')
    expect(rows[2].textContent).toBe('Playeru1')
  })

  it('returns to total_points order when Geral toggle is clicked after Mata-Mata', () => {
    mockUseLeaderboard.mockReturnValue({
      leaderboard: [
        mockEntry('u1', 30, {}, { bracket_points: 5 }),
        mockEntry('u2', 25, {}, { bracket_points: 15 }),
        mockEntry('u3', 20, {}, { bracket_points: 10 }),
      ],
      loading: false,
      error: null,
    })
    renderLeaderboard()
    fireEvent.click(screen.getByText('Mata-Mata'))
    fireEvent.click(screen.getByText('Geral'))

    const rows = screen.getAllByTestId(/leaderboard-row-u/)
    expect(rows[0].getAttribute('data-rank')).toBe('1')
    expect(rows[0].textContent).toBe('Playeru1')
    expect(rows[1].getAttribute('data-rank')).toBe('2')
    expect(rows[1].textContent).toBe('Playeru2')
  })

  it('uses original order when bracket_points are equal in Mata-Mata mode', () => {
    mockUseLeaderboard.mockReturnValue({
      leaderboard: [
        mockEntry('u1', 30, {}, { bracket_points: 10 }),
        mockEntry('u2', 25, {}, { bracket_points: 10 }),
        mockEntry('u3', 20, {}, { bracket_points: 5 }),
      ],
      loading: false,
      error: null,
    })
    renderLeaderboard()
    fireEvent.click(screen.getByText('Mata-Mata'))

    const rows = screen.getAllByTestId(/leaderboard-row-u/)
    expect(rows[0].textContent).toBe('Playeru1')
    expect(rows[1].textContent).toBe('Playeru2')
    expect(rows[2].textContent).toBe('Playeru3')
  })

  it('applies purple style to active Mata-Mata button', () => {
    mockUseLeaderboard.mockReturnValue({
      leaderboard: [mockEntry('u1', 30)],
      loading: false,
      error: null,
    })
    renderLeaderboard()
    fireEvent.click(screen.getByText('Mata-Mata'))
    expect(screen.getByText('Mata-Mata').className).toContain('bg-purple-500')
    expect(screen.getByText('Geral').className).not.toContain('bg-green-500')
  })
})
