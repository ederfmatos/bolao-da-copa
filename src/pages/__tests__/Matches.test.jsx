import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Matches from '../Matches'

const mockUseMatches = vi.hoisted(() => vi.fn())
vi.mock('../../hooks/useMatches', () => ({
  useMatches: mockUseMatches,
}))

const mockUsePredictions = vi.hoisted(() => vi.fn())
vi.mock('../../hooks/usePredictions', () => ({
  usePredictions: mockUsePredictions,
}))

vi.mock('../../components/MatchCard', () => ({
  default: ({ match, hasPrediction, predictionCount }) => (
    <div
      data-testid={`match-card-${match.id}`}
      data-has-prediction={hasPrediction}
      data-prediction-count={predictionCount}
    >
      {match.home_team} vs {match.away_team}
    </div>
  ),
}))

const futureMatch = (id, hoursFromNow = 48) => ({
  id,
  home_team: `Home${id}`,
  away_team: `Away${id}`,
  home_flag: `https://flag.com/h${id}.png`,
  away_flag: `https://flag.com/a${id}.png`,
  group_name: 'Grupo A',
  kickoff_at: new Date(Date.now() + hoursFromNow * 60 * 60 * 1000).toISOString(),
  status: 'scheduled',
  home_score: null,
  away_score: null,
})

const closedMatch = (id) => ({
  id,
  home_team: `Home${id}`,
  away_team: `Away${id}`,
  home_flag: `https://flag.com/h${id}.png`,
  away_flag: `https://flag.com/a${id}.png`,
  group_name: 'Grupo B',
  kickoff_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  status: 'scheduled',
  home_score: null,
  away_score: null,
})

const liveMatch = (id) => ({
  id,
  home_team: `Home${id}`,
  away_team: `Away${id}`,
  home_flag: `https://flag.com/h${id}.png`,
  away_flag: `https://flag.com/a${id}.png`,
  group_name: 'Grupo C',
  kickoff_at: new Date().toISOString(),
  status: 'live',
  home_score: 1,
  away_score: 0,
})

const finishedMatch = (id) => ({
  id,
  home_team: `Home${id}`,
  away_team: `Away${id}`,
  home_flag: `https://flag.com/h${id}.png`,
  away_flag: `https://flag.com/a${id}.png`,
  group_name: 'Grupo D',
  kickoff_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  status: 'finished',
  home_score: 2,
  away_score: 1,
})

function renderMatches() {
  return render(
    <MemoryRouter>
      <Matches />
    </MemoryRouter>,
  )
}

describe('Matches page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUsePredictions.mockReturnValue({ predictions: [] })
  })

  it('shows loading state', () => {
    mockUseMatches.mockReturnValue({
      matches: [],
      predictionCounts: {},
      loading: true,
      error: null,
    })
    renderMatches()
    expect(screen.getByText('Carregando partidas...')).toBeInTheDocument()
  })

  it('shows error state', () => {
    mockUseMatches.mockReturnValue({
      matches: [],
      predictionCounts: {},
      loading: false,
      error: 'Failed to fetch',
    })
    renderMatches()
    expect(screen.getByText('Erro: Failed to fetch')).toBeInTheDocument()
  })

  it('renders without inline styles', () => {
    mockUseMatches.mockReturnValue({
      matches: [],
      predictionCounts: {},
      loading: false,
      error: null,
    })
    const { container } = renderMatches()
    const elementsWithStyle = container.querySelectorAll('[style]')
    expect(elementsWithStyle.length).toBe(0)
  })

  it('renders page title', () => {
    mockUseMatches.mockReturnValue({
      matches: [],
      predictionCounts: {},
      loading: false,
      error: null,
    })
    renderMatches()
    expect(screen.getByText('Partidas')).toBeInTheDocument()
  })

  it('shows empty state when no open matches', () => {
    mockUseMatches.mockReturnValue({
      matches: [],
      predictionCounts: {},
      loading: false,
      error: null,
    })
    renderMatches()
    expect(screen.getByText('Nenhuma partida aberta para palpites no momento.')).toBeInTheDocument()
  })

  it('groups matches into open, closed, finished sections', () => {
    mockUseMatches.mockReturnValue({
      matches: [
        futureMatch('m1'),
        closedMatch('m2'),
        liveMatch('m3'),
        finishedMatch('m4'),
      ],
      predictionCounts: { m1: 3, m2: 5, m3: 2, m4: 1 },
      loading: false,
      error: null,
    })
    renderMatches()

    const heading1 = screen.getByText(/^Abertas para Palpite/)
    expect(heading1).toHaveTextContent('Abertas para Palpite (1)')

    const heading2 = screen.getByText(/^Fechadas/)
    expect(heading2).toHaveTextContent('Fechadas (2)')

    const heading3 = screen.getByText(/^Encerradas/)
    expect(heading3).toHaveTextContent('Encerradas (1)')

    expect(screen.getByTestId('match-card-m1')).toBeInTheDocument()
    expect(screen.getByTestId('match-card-m2')).toBeInTheDocument()
    expect(screen.getByTestId('match-card-m3')).toBeInTheDocument()
    expect(screen.getByTestId('match-card-m4')).toBeInTheDocument()
  })

  it('passes predictionCount to MatchCard', () => {
    mockUseMatches.mockReturnValue({
      matches: [futureMatch('m1')],
      predictionCounts: { m1: 7 },
      loading: false,
      error: null,
    })
    renderMatches()
    const card = screen.getByTestId('match-card-m1')
    expect(card.getAttribute('data-prediction-count')).toBe('7')
  })

  it('passes hasPrediction to MatchCard when user predicted', () => {
    mockUsePredictions.mockReturnValue({
      predictions: [{ id: 'p1', match_id: 'm1', user_id: 'u1', home_score: 1, away_score: 0 }],
    })
    mockUseMatches.mockReturnValue({
      matches: [futureMatch('m1')],
      predictionCounts: { m1: 3 },
      loading: false,
      error: null,
    })
    renderMatches()
    const card = screen.getByTestId('match-card-m1')
    expect(card.getAttribute('data-has-prediction')).toBe('true')
  })

  it('passes hasPrediction=false when user did not predict', () => {
    mockUseMatches.mockReturnValue({
      matches: [futureMatch('m1')],
      predictionCounts: { m1: 3 },
      loading: false,
      error: null,
    })
    renderMatches()
    const card = screen.getByTestId('match-card-m1')
    expect(card.getAttribute('data-has-prediction')).toBe('false')
  })

  it('handles multiple matches in each group', () => {
    mockUseMatches.mockReturnValue({
      matches: [
        futureMatch('m1', 72),
        futureMatch('m2', 96),
        closedMatch('m3'),
        liveMatch('m4'),
        finishedMatch('m5'),
        finishedMatch('m6'),
      ],
      predictionCounts: {},
      loading: false,
      error: null,
    })
    renderMatches()

    expect(screen.getByText(/^Abertas para Palpite/)).toHaveTextContent('(2)')
    expect(screen.getByText(/^Fechadas/)).toHaveTextContent('(2)')
    expect(screen.getByText(/^Encerradas/)).toHaveTextContent('(2)')
  })

  it('matches have Tailwind classes on container', () => {
    mockUseMatches.mockReturnValue({
      matches: [futureMatch('m1')],
      predictionCounts: {},
      loading: false,
      error: null,
    })
    const { container } = renderMatches()
    const pageContainer = container.querySelector('.p-4.max-w-xl.mx-auto')
    expect(pageContainer).toBeInTheDocument()
  })

  describe('bonus prediction banner', () => {
    beforeEach(() => {
      localStorage.clear()
    })

    it('renders bonus banner when deadline has not passed and banner not dismissed', () => {
      mockUseMatches.mockReturnValue({
        matches: [],
        predictionCounts: {},
        loading: false,
        error: null,
      })
      renderMatches()
      expect(screen.getByText(/Palpite Bônus/)).toBeInTheDocument()
    })

    it('does not render bonus banner when localStorage has bonus_banner_dismissed', () => {
      localStorage.setItem('bonus_banner_dismissed', 'true')
      mockUseMatches.mockReturnValue({
        matches: [],
        predictionCounts: {},
        loading: false,
        error: null,
      })
      renderMatches()
      expect(screen.queryByText(/Palpite Bônus/)).not.toBeInTheDocument()
    })

    it('does not render bonus banner when deadline has passed', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-06-19T00:00:00Z'))
      mockUseMatches.mockReturnValue({
        matches: [],
        predictionCounts: {},
        loading: false,
        error: null,
      })
      renderMatches()
      expect(screen.queryByText(/Palpite Bônus/)).not.toBeInTheDocument()
      vi.useRealTimers()
    })

    it('dismisses banner and sets localStorage when close button is clicked', () => {
      mockUseMatches.mockReturnValue({
        matches: [],
        predictionCounts: {},
        loading: false,
        error: null,
      })
      renderMatches()
      expect(screen.getByText(/Palpite Bônus/)).toBeInTheDocument()
      fireEvent.click(screen.getByLabelText('Fechar banner'))
      expect(localStorage.getItem('bonus_banner_dismissed')).toBe('true')
      expect(screen.queryByText(/Palpite Bônus/)).not.toBeInTheDocument()
    })
  })
})
