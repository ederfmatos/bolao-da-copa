import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import BottomNavigation from '../BottomNavigation'

function renderWithProviders(ui, { route = '/matches' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
  )
}

describe('BottomNavigation', () => {
  it('renders without errors', () => {
    renderWithProviders(<BottomNavigation />)
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('renders five navigation tabs', () => {
    renderWithProviders(<BottomNavigation />)
    expect(screen.getByText('Partidas')).toBeInTheDocument()
    expect(screen.getByText('Classificação')).toBeInTheDocument()
    expect(screen.getByText('Mata-Mata')).toBeInTheDocument()
    expect(screen.getByText('Artilheiro')).toBeInTheDocument()
    expect(screen.getByText('Regras')).toBeInTheDocument()
  })

  it('renders exactly 5 NavLink elements', () => {
    renderWithProviders(<BottomNavigation />)
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(5)
  })

  it('renders a link with to="/artilheiro" and label "Artilheiro"', () => {
    renderWithProviders(<BottomNavigation />)
    const link = screen.getByText('Artilheiro').closest('a')
    expect(link).toHaveAttribute('href', '/artilheiro')
  })

  it('does NOT render a standalone theme toggle button', () => {
    renderWithProviders(<BottomNavigation />)
    expect(screen.queryByRole('button', { name: /ativar modo escuro/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /ativar modo claro/i })).not.toBeInTheDocument()
  })

  it('renders emoji icons for each tab', () => {
    renderWithProviders(<BottomNavigation />)
    expect(screen.getByText('⚽')).toBeInTheDocument()
    expect(screen.getByText('🏆')).toBeInTheDocument()
    expect(screen.getByText('🏅')).toBeInTheDocument()
    expect(screen.getByText('🥅')).toBeInTheDocument()
    expect(screen.getByText('📋')).toBeInTheDocument()
  })

  it('applies active class to current route tab', () => {
    renderWithProviders(<BottomNavigation />, { route: '/matches' })
    const matchesLink = screen.getByText('Partidas').closest('a')
    expect(matchesLink.className).toContain('text-primary-600')
  })

  it('does not apply active class to inactive tabs', () => {
    renderWithProviders(<BottomNavigation />, { route: '/matches' })
    const leaderboardLink = screen.getByText('Classificação').closest('a')
    expect(leaderboardLink.className).toContain('text-gray-500')
  })

  it('updates active class when navigating to another tab', () => {
    renderWithProviders(<BottomNavigation />, { route: '/leaderboard' })
    const leaderboardLink = screen.getByText('Classificação').closest('a')
    expect(leaderboardLink.className).toContain('text-primary-600')
    const matchesLink = screen.getByText('Partidas').closest('a')
    expect(matchesLink.className).toContain('text-gray-500')
  })

  it('applies active class to Artilheiro tab when on /artilheiro', () => {
    renderWithProviders(<BottomNavigation />, { route: '/artilheiro' })
    const artilheiroLink = screen.getByText('Artilheiro').closest('a')
    expect(artilheiroLink.className).toContain('text-primary-600')
  })
})

describe('navigation', () => {
  it('Partidas link points to /matches', () => {
    renderWithProviders(<BottomNavigation />)
    const link = screen.getByText('Partidas').closest('a')
    expect(link).toHaveAttribute('href', '/matches')
  })

  it('Classificação link points to /leaderboard', () => {
    renderWithProviders(<BottomNavigation />)
    const link = screen.getByText('Classificação').closest('a')
    expect(link).toHaveAttribute('href', '/leaderboard')
  })

  it('Mata-Mata link points to /bracket-prediction', () => {
    renderWithProviders(<BottomNavigation />)
    const link = screen.getByText('Mata-Mata').closest('a')
    expect(link).toHaveAttribute('href', '/bracket-prediction')
  })

  it('Artilheiro link points to /artilheiro', () => {
    renderWithProviders(<BottomNavigation />)
    const link = screen.getByText('Artilheiro').closest('a')
    expect(link).toHaveAttribute('href', '/artilheiro')
  })

  it('Regras link points to /rules', () => {
    renderWithProviders(<BottomNavigation />)
    const link = screen.getByText('Regras').closest('a')
    expect(link).toHaveAttribute('href', '/rules')
  })
})
