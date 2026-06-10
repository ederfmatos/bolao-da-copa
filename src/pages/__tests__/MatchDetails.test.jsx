import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import MatchDetails from '../MatchDetails'

const mockState = vi.hoisted(() => {
  const resolveRef = { current: null }
  const builder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    then: (onFulfilled) => Promise.resolve(resolveRef.current).then(onFulfilled),
  }
  return {
    builder,
    mockFrom: vi.fn(() => builder),
    resolveRef,
  }
})

vi.mock('../../lib/supabase', () => ({
  supabase: { from: mockState.mockFrom },
}))

const mockUseAuth = vi.hoisted(() => vi.fn())
vi.mock('../../hooks/useAuth', () => ({
  useAuth: mockUseAuth,
}))

const mockUsePredictions = vi.hoisted(() => vi.fn())
vi.mock('../../hooks/usePredictions', () => ({
  usePredictions: mockUsePredictions,
}))

const mockUseMatchPredictions = vi.hoisted(() => vi.fn())
vi.mock('../../hooks/useMatchPredictions', () => ({
  useMatchPredictions: mockUseMatchPredictions,
}))

vi.mock('../../components/ScorePicker', () => ({
  default: ({ homeScore, awayScore, disabled }) => (
    <div data-testid="score-picker" data-disabled={disabled}>
      {homeScore} × {awayScore}
    </div>
  ),
}))

vi.mock('../../components/PredictionRow', () => ({
  default: ({ prediction, isCurrentUser, isFinished }) => (
    <div
      data-testid={`prediction-row-${prediction.user_id}`}
      data-current={isCurrentUser}
      data-finished={isFinished}
    >
      {prediction.user_name}
    </div>
  ),
}))

const defaultMatch = {
  id: 'm1',
  home_team: 'Brasil',
  away_team: 'Argentina',
  home_flag: '🇧🇷',
  away_flag: '🇦🇷',
  group_name: 'Grupo A',
  kickoff_at: '2099-06-20T21:00:00Z',
  status: 'scheduled',
  home_score: null,
  away_score: null,
}

function renderWithRouter(route = '/match/m1') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/match/:matchId" element={<MatchDetails />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('MatchDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockState.resolveRef.current = { data: defaultMatch, error: null }
    mockUseAuth.mockReturnValue({
      user: { id: 'u1', user_metadata: { full_name: 'Alice', avatar_url: null } },
    })
    mockUsePredictions.mockReturnValue({
      predictions: [],
      savePrediction: vi.fn().mockResolvedValue({}),
    })
    mockUseMatchPredictions.mockReturnValue({
      predictions: [],
      loading: false,
      error: null,
    })
  })

  it('page renders without errors', async () => {
    renderWithRouter()
    await waitFor(() => {
      expect(screen.getByText(/Brasil/)).toBeInTheDocument()
    })
  })

  it('match info displays correctly', async () => {
    renderWithRouter()
    await waitFor(() => {
      expect(screen.getByText(/Brasil/)).toBeInTheDocument()
    })
    expect(screen.getByText(/Argentina/)).toBeInTheDocument()
    expect(screen.getByText('Grupo A')).toBeInTheDocument()
    expect(screen.getByText(/20 de junho/)).toBeInTheDocument()
    expect(screen.getByText(/🇧🇷/)).toBeInTheDocument()
    expect(screen.getByText(/🇦🇷/)).toBeInTheDocument()
  })

  it('user prediction section shows ScorePicker for open matches', async () => {
    mockUsePredictions.mockReturnValue({
      predictions: [],
      savePrediction: vi.fn().mockResolvedValue({}),
    })
    renderWithRouter()
    await waitFor(() => {
      expect(screen.getByTestId('score-picker')).toBeInTheDocument()
    })
    expect(screen.getByText('Salvar Palpite')).toBeInTheDocument()
  })

  it('user prediction pre-fills ScorePicker with existing prediction', async () => {
    mockUsePredictions.mockReturnValue({
      predictions: [
        { id: 'p1', match_id: 'm1', user_id: 'u1', home_score: 2, away_score: 1, points: null },
      ],
      savePrediction: vi.fn().mockResolvedValue({}),
    })
    renderWithRouter()
    await waitFor(() => {
      expect(screen.getByTestId('score-picker')).toHaveTextContent('2 × 1')
    })
  })

  it('user prediction section is read-only for closed matches', async () => {
    mockState.resolveRef.current = {
      data: { ...defaultMatch, kickoff_at: '2020-01-01T00:00:00Z' },
      error: null,
    }
    renderWithRouter()
    await waitFor(() => {
      expect(screen.getByTestId('score-picker')).toBeInTheDocument()
    })
    expect(screen.queryByText('Salvar Palpite')).not.toBeInTheDocument()
    expect(screen.getByText(/encerrados/)).toBeInTheDocument()
  })

  it('user prediction section is read-only for finished matches', async () => {
    mockState.resolveRef.current = {
      data: {
        ...defaultMatch,
        status: 'finished',
        home_score: 1,
        away_score: 0,
        kickoff_at: '2020-01-01T00:00:00Z',
      },
      error: null,
    }
    renderWithRouter()
    await waitFor(() => {
      expect(screen.getByText('Finalizada')).toBeInTheDocument()
    })
    expect(screen.queryByText('Salvar Palpite')).not.toBeInTheDocument()
    const scorePicker = screen.getByTestId('score-picker')
    expect(scorePicker.getAttribute('data-disabled')).toBe('true')
  })

  it('shows final result for finished matches', async () => {
    mockState.resolveRef.current = {
      data: {
        ...defaultMatch,
        status: 'finished',
        home_score: 3,
        away_score: 1,
        kickoff_at: '2020-01-01T00:00:00Z',
      },
      error: null,
    }
    renderWithRouter()
    await waitFor(() => {
      expect(screen.getByText('Resultado')).toBeInTheDocument()
    })
    expect(screen.getByText('3 × 1')).toBeInTheDocument()
  })

  it('social predictions list renders PredictionRow for each prediction', async () => {
    mockUsePredictions.mockReturnValue({
      predictions: [
        { id: 'p1', match_id: 'm1', user_id: 'u1', home_score: 2, away_score: 1, points: null },
      ],
      savePrediction: vi.fn().mockResolvedValue({}),
    })
    mockUseMatchPredictions.mockReturnValue({
      predictions: [
        {
          prediction_id: 'p2',
          match_id: 'm1',
          user_id: 'u2',
          home_score: 1,
          away_score: 1,
          points: null,
          user_name: 'Bob',
          user_avatar_url: null,
        },
        {
          prediction_id: 'p3',
          match_id: 'm1',
          user_id: 'u3',
          home_score: 0,
          away_score: 2,
          points: null,
          user_name: 'Charlie',
          user_avatar_url: 'https://example.com/charlie.jpg',
        },
      ],
      loading: false,
      error: null,
    })
    renderWithRouter()
    await waitFor(() => {
      expect(screen.getByTestId('prediction-row-u2')).toBeInTheDocument()
    })
    expect(screen.getByTestId('prediction-row-u3')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('Charlie')).toBeInTheDocument()
  })

  it('prediction count displays in header', async () => {
    mockUseMatchPredictions.mockReturnValue({
      predictions: [
        {
          prediction_id: 'p2',
          match_id: 'm1',
          user_id: 'u2',
          home_score: 1,
          away_score: 1,
          points: null,
          user_name: 'Bob',
          user_avatar_url: null,
        },
        {
          prediction_id: 'p3',
          match_id: 'm1',
          user_id: 'u3',
          home_score: 0,
          away_score: 2,
          points: null,
          user_name: 'Charlie',
          user_avatar_url: null,
        },
      ],
      loading: false,
      error: null,
    })
    renderWithRouter()
    await waitFor(() => {
      expect(screen.getByText('2 palpites')).toBeInTheDocument()
    })
  })

  it('shows single prediction count with correct grammar', async () => {
    mockUseMatchPredictions.mockReturnValue({
      predictions: [
        {
          prediction_id: 'p2',
          match_id: 'm1',
          user_id: 'u2',
          home_score: 1,
          away_score: 1,
          points: null,
          user_name: 'Bob',
          user_avatar_url: null,
        },
      ],
      loading: false,
      error: null,
    })
    renderWithRouter()
    await waitFor(() => {
      expect(screen.getByText('1 palpite')).toBeInTheDocument()
    })
  })

  it('loading state shows while data fetches', () => {
    mockState.resolveRef.current = new Promise(() => {})
    renderWithRouter()
    expect(screen.getByText('Carregando...')).toBeInTheDocument()
  })

  it('error state displays error message', async () => {
    mockState.resolveRef.current = {
      data: null,
      error: { message: 'Match not found' },
    }
    renderWithRouter()
    await waitFor(() => {
      expect(screen.getByText('Match not found')).toBeInTheDocument()
    })
  })

  it('shows warning for matches starting within 3 hours', async () => {
    const threeHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
    mockState.resolveRef.current = {
      data: { ...defaultMatch, kickoff_at: threeHoursFromNow },
      error: null,
    }
    renderWithRouter()
    await waitFor(() => {
      expect(screen.getByText(/Atenção/)).toBeInTheDocument()
    })
  })

  it('saving prediction shows success message', async () => {
    const savePrediction = vi.fn().mockResolvedValue({})
    mockUsePredictions.mockReturnValue({
      predictions: [],
      savePrediction,
    })
    renderWithRouter()
    await waitFor(() => {
      expect(screen.getByText('Salvar Palpite')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Salvar Palpite'))
    await waitFor(() => {
      expect(screen.getByText('Palpite salvo com sucesso!')).toBeInTheDocument()
    })
    expect(savePrediction).toHaveBeenCalledWith('m1', 0, 0)
  })

  it('shows social loading state while match predictions load', async () => {
    mockUseMatchPredictions.mockReturnValue({
      predictions: [],
      loading: true,
      error: null,
    })
    renderWithRouter()
    await waitFor(() => {
      expect(screen.getByText('Carregando palpites...')).toBeInTheDocument()
    })
  })

  it('shows empty state when no predictions exist', async () => {
    renderWithRouter()
    await waitFor(() => {
      expect(screen.getByText('Nenhum palpite ainda. Seja o primeiro!')).toBeInTheDocument()
    })
  })

  it('shows editable ScorePicker on open scheduled match', async () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    mockState.resolveRef.current = {
      data: { ...defaultMatch, kickoff_at: futureDate, status: 'scheduled' },
      error: null,
    }
    mockUsePredictions.mockReturnValue({
      predictions: [],
      savePrediction: vi.fn().mockResolvedValue({}),
    })
    renderWithRouter()
    await waitFor(() => {
      expect(screen.getByTestId('score-picker')).toBeInTheDocument()
    })
    const scorePicker = screen.getByTestId('score-picker')
    expect(scorePicker.getAttribute('data-disabled')).toBe('false')
    expect(screen.getByText('Salvar Palpite')).toBeInTheDocument()
  })

  it('shows live badge for live matches', async () => {
    mockState.resolveRef.current = {
      data: { ...defaultMatch, status: 'live' },
      error: null,
    }
    renderWithRouter()
    await waitFor(() => {
      expect(screen.getByText('Ao vivo')).toBeInTheDocument()
    })
  })
})
