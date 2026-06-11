import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import MatchCard from '../MatchCard'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const defaultMatch = {
  id: 'match-1',
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

function renderCard(overrides = {}) {
  const props = {
    match: { ...defaultMatch, ...overrides.match },
    hasPrediction: overrides.hasPrediction ?? false,
    predictionCount: overrides.predictionCount ?? 0,
  }
  return render(
    <MemoryRouter>
      <MatchCard {...props} />
    </MemoryRouter>,
  )
}

describe('MatchCard', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('renders without inline styles', () => {
    const { container } = renderCard()
    const card = container.firstChild
    expect(card).not.toHaveAttribute('style')
  })

  it('applies Tailwind card styling classes', () => {
    const { container } = renderCard()
    const card = container.firstChild
    expect(card.className).toContain('p-4')
    expect(card.className).toContain('mb-3')
    expect(card.className).toContain('bg-white')
    expect(card.className).toContain('rounded-lg')
    expect(card.className).toContain('shadow')
    expect(card.className).toContain('relative')
  })

  it('shows click cursor for open scheduled match', () => {
    const { container } = renderCard()
    const card = container.firstChild
    expect(card.className).toContain('cursor-pointer')
  })

  it('shows click cursor for finished match', () => {
    const { container } = renderCard({ match: { status: 'finished' } })
    const card = container.firstChild
    expect(card.className).toContain('cursor-pointer')
  })

  it('applies opacity for finished match', () => {
    const { container } = renderCard({ match: { status: 'finished' } })
    const card = container.firstChild
    expect(card.className).toContain('opacity-70')
  })

  it('displays group name', () => {
    renderCard()
    expect(screen.getByText(/Grupo A/)).toBeInTheDocument()
  })

  it('displays team names', () => {
    renderCard()
    expect(screen.getByText(/Brasil/)).toBeInTheDocument()
    expect(screen.getByText(/Argentina/)).toBeInTheDocument()
  })

  it('shows prediction count when greater than 0', () => {
    renderCard({ predictionCount: 8 })
    expect(screen.getByText(/8 palpites/)).toBeInTheDocument()
  })

  it('hides prediction count when 0', () => {
    renderCard({ predictionCount: 0 })
    expect(screen.queryByText(/palpites/)).not.toBeInTheDocument()
  })

  it('shows Palpitado badge when hasPrediction is true', () => {
    renderCard({ hasPrediction: true })
    expect(screen.getByText('Palpitado')).toBeInTheDocument()
  })

  it('hides Palpitado badge when hasPrediction is false', () => {
    renderCard({ hasPrediction: false })
    expect(screen.queryByText('Palpitado')).not.toBeInTheDocument()
  })

  it('shows scheduled status badge', () => {
    renderCard()
    expect(screen.getByText('Agendado')).toBeInTheDocument()
  })

  it('shows live status badge', () => {
    renderCard({ match: { status: 'live' } })
    expect(screen.getByText('Ao Vivo')).toBeInTheDocument()
  })

  it('shows finished status badge', () => {
    renderCard({ match: { status: 'finished' } })
    expect(screen.getByText('Encerrado')).toBeInTheDocument()
  })

  it('applies correct Tailwind color to live badge', () => {
    renderCard({ match: { status: 'live' } })
    const badge = screen.getByText('Ao Vivo')
    expect(badge.className).toContain('bg-red-500')
  })

  it('applies correct Tailwind color to finished badge', () => {
    renderCard({ match: { status: 'finished' } })
    const badge = screen.getByText('Encerrado')
    expect(badge.className).toContain('bg-gray-400')
  })

  it('shows score for finished matches', () => {
    renderCard({ match: { status: 'finished', home_score: 3, away_score: 1 } })
    expect(screen.getByText('3 × 1')).toBeInTheDocument()
  })

  it('does not show score for scheduled matches', () => {
    renderCard()
    expect(screen.queryByText('×')).not.toBeInTheDocument()
  })

  it('does not show score for live matches with null scores', () => {
    renderCard({ match: { status: 'live', home_score: null, away_score: null } })
    expect(screen.getByText(/×/)).toBeInTheDocument()
    expect(screen.getByText('- × -')).toBeInTheDocument()
  })

  it('navigates to /match/:id on click for open match', () => {
    const { container } = renderCard()
    fireEvent.click(container.firstChild)
    expect(mockNavigate).toHaveBeenCalledWith('/match/match-1')
  })

  it('navigates on click for finished match', () => {
    const { container } = renderCard({ match: { status: 'finished' } })
    fireEvent.click(container.firstChild)
    expect(mockNavigate).toHaveBeenCalledWith('/match/match-1')
  })

  it('navigates on click for live match', () => {
    const { container } = renderCard({ match: { status: 'live' } })
    fireEvent.click(container.firstChild)
    expect(mockNavigate).toHaveBeenCalledWith('/match/match-1')
  })

  it('navigates on click for closed match (kickoff within 1 hour)', () => {
    const thirtyMinutesFromNow = new Date(Date.now() + 30 * 60 * 1000).toISOString()
    const { container } = renderCard({ match: { kickoff_at: thirtyMinutesFromNow, status: 'scheduled' } })
    fireEvent.click(container.firstChild)
    expect(mockNavigate).toHaveBeenCalledWith('/match/match-1')
  })

  it('shows click cursor for closed match (kickoff within 1 hour)', () => {
    const thirtyMinutesFromNow = new Date(Date.now() + 30 * 60 * 1000).toISOString()
    const { container } = renderCard({ match: { kickoff_at: thirtyMinutesFromNow, status: 'scheduled' } })
    const card = container.firstChild
    expect(card.className).toContain('cursor-pointer')
  })
})
