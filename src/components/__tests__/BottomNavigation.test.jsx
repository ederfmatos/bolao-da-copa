import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '../../context/ThemeContext'
import BottomNavigation from '../BottomNavigation'

function renderWithProviders(ui, { route = '/matches' } = {}) {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </ThemeProvider>
  )
}

describe('BottomNavigation', () => {
  it('renders without errors', () => {
    renderWithProviders(<BottomNavigation />)
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('renders three navigation tabs', () => {
    renderWithProviders(<BottomNavigation />)
    expect(screen.getByText('Partidas')).toBeInTheDocument()
    expect(screen.getByText('Classificação')).toBeInTheDocument()
    expect(screen.getByText('Regras')).toBeInTheDocument()
  })

  it('renders theme toggle button with accessible label', () => {
    renderWithProviders(<BottomNavigation />)
    expect(screen.getByRole('button', { name: /ativar modo escuro/i })).toBeInTheDocument()
  })

  it('theme toggle button label changes with theme', () => {
    localStorage.setItem('theme', 'dark')
    renderWithProviders(<BottomNavigation />)
    expect(screen.getByRole('button', { name: /ativar modo claro/i })).toBeInTheDocument()
  })

  it('renders emoji icons for each tab', () => {
    renderWithProviders(<BottomNavigation />)
    expect(screen.getByText('⚽')).toBeInTheDocument()
    expect(screen.getByText('🏆')).toBeInTheDocument()
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
})

describe('theme toggle', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('renders moon icon in light mode', () => {
    localStorage.setItem('theme', 'light')
    renderWithProviders(<BottomNavigation />)
    expect(screen.getByText('🌙')).toBeInTheDocument()
  })

  it('renders sun icon in dark mode', () => {
    localStorage.setItem('theme', 'dark')
    renderWithProviders(<BottomNavigation />)
    expect(screen.getByText('☀️')).toBeInTheDocument()
  })

  it('switches from light to dark on toggle click', () => {
    localStorage.setItem('theme', 'light')
    renderWithProviders(<BottomNavigation />)
    expect(screen.getByText('🌙')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /ativar modo escuro/i }))
    expect(screen.getByText('☀️')).toBeInTheDocument()
  })

  it('switches from dark to light on toggle click', () => {
    localStorage.setItem('theme', 'dark')
    renderWithProviders(<BottomNavigation />)
    expect(screen.getByText('☀️')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /ativar modo claro/i }))
    expect(screen.getByText('🌙')).toBeInTheDocument()
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

  it('Regras link points to /rules', () => {
    renderWithProviders(<BottomNavigation />)
    const link = screen.getByText('Regras').closest('a')
    expect(link).toHaveAttribute('href', '/rules')
  })
})
