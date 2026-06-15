import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '../context/ThemeContext'

const mockUseAuth = vi.hoisted(() => vi.fn())

vi.mock('../hooks/useAuth', () => ({
  useAuth: mockUseAuth,
}))

vi.mock('../pages/Login.jsx', () => ({
  default: () => <div data-testid="login-page">Login</div>,
}))

vi.mock('../pages/Home.jsx', () => ({
  default: () => <div data-testid="home-page">Home</div>,
}))

vi.mock('../pages/Matches.jsx', () => ({
  default: () => <div data-testid="matches-page">Matches</div>,
}))

vi.mock('../pages/MatchDetails.jsx', () => ({
  default: () => <div data-testid="match-details-page">MatchDetails</div>,
}))

vi.mock('../pages/Leaderboard.jsx', () => ({
  default: () => <div data-testid="leaderboard-page">Leaderboard</div>,
}))

vi.mock('../pages/Rules.jsx', () => ({
  default: () => <div data-testid="rules-page">Rules</div>,
}))

vi.mock('../pages/FinalPrediction.jsx', () => ({
  default: () => <div data-testid="final-prediction-page">FinalPrediction</div>,
}))

async function renderApp(route, authState = { user: null, loading: false }) {
  mockUseAuth.mockReturnValue(authState)

  const App = (await import('../App.jsx')).default

  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[route]}>
        <App />
      </MemoryRouter>
    </ThemeProvider>,
  )
}

describe('App routing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders login page at / when not authenticated', async () => {
    await renderApp('/')
    expect(screen.getByTestId('login-page')).toBeInTheDocument()
  })

  it('redirects to /matches at / when authenticated', async () => {
    await renderApp('/', { user: { id: 'u1' }, loading: false })
    expect(screen.getByTestId('matches-page')).toBeInTheDocument()
  })

  it('renders /home as redirect to /matches', async () => {
    await renderApp('/home', { user: { id: 'u1' }, loading: false })
    expect(screen.getByTestId('matches-page')).toBeInTheDocument()
  })

  it('renders /matches with BottomNavigation', async () => {
    await renderApp('/matches', { user: { id: 'u1' }, loading: false })
    expect(screen.getByTestId('matches-page')).toBeInTheDocument()
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('renders /match/:matchId route', async () => {
    await renderApp('/match/123', { user: { id: 'u1' }, loading: false })
    expect(screen.getByTestId('match-details-page')).toBeInTheDocument()
  })

  it('renders BottomNavigation on /match/:matchId', async () => {
    await renderApp('/match/123', { user: { id: 'u1' }, loading: false })
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('renders /leaderboard with BottomNavigation', async () => {
    await renderApp('/leaderboard', { user: { id: 'u1' }, loading: false })
    expect(screen.getByTestId('leaderboard-page')).toBeInTheDocument()
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('renders /rules with BottomNavigation', async () => {
    await renderApp('/rules', { user: { id: 'u1' }, loading: false })
    expect(screen.getByTestId('rules-page')).toBeInTheDocument()
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('renders /final-prediction with BottomNavigation', async () => {
    await renderApp('/final-prediction', { user: { id: 'u1' }, loading: false })
    expect(screen.getByTestId('final-prediction-page')).toBeInTheDocument()
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('does not render BottomNavigation on Login page', async () => {
    await renderApp('/')
    expect(screen.getByTestId('login-page')).toBeInTheDocument()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('redirects unknown routes to /', async () => {
    await renderApp('/unknown')
    expect(screen.getByTestId('login-page')).toBeInTheDocument()
  })

  it('shows loading state when auth is loading', async () => {
    await renderApp('/', { user: null, loading: true })
    expect(screen.getByText('Carregando...')).toBeInTheDocument()
  })
})

describe('ThemeProvider wrapping', () => {
  it('App is wrapped in ThemeProvider', async () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false })
    const App = (await import('../App.jsx')).default

    const { container } = render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      </ThemeProvider>,
    )

    expect(screen.getByTestId('login-page')).toBeInTheDocument()
    expect(container.querySelector('.min-h-screen')).toBeInTheDocument()
  })
})
