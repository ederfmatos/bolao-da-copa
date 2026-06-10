import { render, screen } from '@testing-library/react'
import LeaderboardRow from '../LeaderboardRow'

const baseEntry = {
  user_id: 'u1',
  name: 'Alice',
  avatar_url: null,
  total_points: 25,
  total_predictions: 10,
}

function renderRow(props = {}) {
  return render(
    <LeaderboardRow
      entry={baseEntry}
      rank={1}
      isCurrentUser={false}
      {...props}
    />,
  )
}

describe('LeaderboardRow', () => {
  it('renders entry name', () => {
    renderRow()
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('shows (você) for current user', () => {
    renderRow({ isCurrentUser: true })
    expect(screen.getByText('(você)')).toBeInTheDocument()
  })

  it('does not show (você) for non-current user', () => {
    renderRow({ isCurrentUser: false })
    expect(screen.queryByText('(você)')).not.toBeInTheDocument()
  })

  it('renders rank number', () => {
    renderRow({ rank: 3 })
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('renders total points', () => {
    renderRow({ entry: { ...baseEntry, total_points: 42 } })
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renders prediction count', () => {
    renderRow({ entry: { ...baseEntry, total_predictions: 7 } })
    expect(screen.getByText('7 palpites')).toBeInTheDocument()
  })

  it('uses singular palpite for 1 prediction', () => {
    renderRow({ entry: { ...baseEntry, total_predictions: 1 } })
    expect(screen.getByText('1 palpite')).toBeInTheDocument()
  })

  it('renders avatar with initials when no avatar_url', () => {
    renderRow()
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('renders avatar URL when provided', () => {
    renderRow({
      entry: { ...baseEntry, avatar_url: 'https://example.com/avatar.jpg' },
    })
    const img = screen.getByAltText('Alice')
    expect(img.getAttribute('src')).toBe('https://example.com/avatar.jpg')
  })

  it('renders without inline styles', () => {
    const { container } = renderRow()
    const elementsWithStyle = container.querySelectorAll('[style]')
    expect(elementsWithStyle.length).toBe(0)
  })

  it('has Tailwind classes on container', () => {
    const { container } = renderRow()
    const card = container.querySelector('.flex.items-center')
    expect(card).toBeInTheDocument()
  })
})
