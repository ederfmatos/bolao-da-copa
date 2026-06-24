import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PredictionRow from '../PredictionRow'

const basePrediction = {
  user_avatar_url: 'https://example.com/avatar.jpg',
  user_name: 'João Silva',
  home_score: 2,
  away_score: 1,
  points: 10,
  prediction_id: 'pred-1',
  match_id: 'match-1',
  user_id: 'user-1',
  created_at: '2026-06-10T10:00:00Z',
  updated_at: '2026-06-10T10:00:00Z',
}

function renderRow(overrides = {}) {
  const props = {
    prediction: { ...basePrediction, ...overrides.prediction },
    isCurrentUser: overrides.isCurrentUser ?? false,
    isFinished: overrides.isFinished ?? false,
  }
  return render(
    <MemoryRouter>
      <PredictionRow {...props} />
    </MemoryRouter>,
  )
}

describe('PredictionRow', () => {
  it('renders without errors', () => {
    renderRow()
    expect(screen.getByText('João Silva')).toBeInTheDocument()
  })

  it('displays user avatar with correct src', () => {
    const { container } = renderRow()
    const img = container.querySelector('img')
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg')
    expect(img).toHaveClass('w-10', 'h-10', 'rounded-full')
  })

  it('renders fallback avatar when no avatar_url', () => {
    renderRow({ prediction: { user_avatar_url: null } })
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('J')).toBeInTheDocument()
  })

  it('renders fallback with question mark when user_name is empty', () => {
    renderRow({ prediction: { user_avatar_url: null, user_name: '' } })
    expect(screen.getByText('?')).toBeInTheDocument()
  })

  it('displays user name', () => {
    renderRow()
    expect(screen.getByText('João Silva')).toBeInTheDocument()
  })

  it('renders name in bold when isCurrentUser is true', () => {
    renderRow({ isCurrentUser: true })
    const name = screen.getByText('João Silva')
    expect(name.className).toContain('font-bold')
  })

  it('does not render name in bold when isCurrentUser is false', () => {
    renderRow()
    const name = screen.getByText('João Silva')
    expect(name.className).not.toContain('font-bold')
  })

  it('displays score as home × away', () => {
    renderRow()
    expect(screen.getByText('2 × 1')).toBeInTheDocument()
  })

  it('shows points badge when isFinished is true', () => {
    renderRow({ isFinished: true })
    expect(screen.getByText('10pts')).toBeInTheDocument()
  })

  it('hides points badge when isFinished is false', () => {
    renderRow({ isFinished: false })
    expect(screen.queryByText('10pts')).not.toBeInTheDocument()
  })

  it('hides points badge when points is null even if finished', () => {
    renderRow({ isFinished: true, prediction: { points: null } })
    expect(screen.queryByText(/pts$/)).not.toBeInTheDocument()
  })

  describe('points badge colors', () => {
    it('is green for 10 points', () => {
      renderRow({ isFinished: true, prediction: { points: 10 } })
      const badge = screen.getByText('10pts')
      expect(badge.className).toContain('bg-green-500')
    })

    it('is teal for 7 points', () => {
      renderRow({ isFinished: true, prediction: { points: 7 } })
      const badge = screen.getByText('7pts')
      expect(badge.className).toContain('bg-teal-500')
    })

    it('is blue for 6 points', () => {
      renderRow({ isFinished: true, prediction: { points: 6 } })
      const badge = screen.getByText('6pts')
      expect(badge.className).toContain('bg-blue-500')
    })

    it('is orange for 5 points', () => {
      renderRow({ isFinished: true, prediction: { points: 5 } })
      const badge = screen.getByText('5pts')
      expect(badge.className).toContain('bg-orange-400')
    })

    it('is gray for 3 points', () => {
      renderRow({ isFinished: true, prediction: { points: 3 } })
      const badge = screen.getByText('3pts')
      expect(badge.className).toContain('bg-gray-400')
    })

    it('is red for 0 points', () => {
      renderRow({ isFinished: true, prediction: { points: 0 } })
      const badge = screen.getByText('0pts')
      expect(badge.className).toContain('bg-red-400')
    })
  })

  it('highlights current user row with distinct background', () => {
    renderRow({ isCurrentUser: true })
    const row = screen.getByText('João Silva').closest('div')?.parentElement
    expect(row.className).toContain('bg-primary-50')
  })

  it('uses default background when not current user', () => {
    renderRow()
    const row = screen.getByText('João Silva').closest('div')?.parentElement
    expect(row.className).not.toContain('bg-primary-50')
  })
})
