import { render, screen } from '@testing-library/react'
import UserProfileHeader from '../UserProfileHeader'

const defaultProps = {
  name: 'Alice',
  avatarUrl: null,
  totalPoints: 25,
  rank: 1,
}

function renderHeader(props = {}) {
  return render(<UserProfileHeader {...defaultProps} {...props} />)
}

describe('UserProfileHeader', () => {
  it('renders user name', () => {
    renderHeader()
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('renders total points', () => {
    renderHeader({ totalPoints: 42 })
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renders rank number', () => {
    renderHeader({ rank: 3 })
    expect(screen.getByText('#3')).toBeInTheDocument()
  })

  it('renders rank with amber color for top 3', () => {
    const { container } = renderHeader({ rank: 1 })
    const rankEl = container.querySelector('.text-amber-500')
    expect(rankEl).toBeInTheDocument()
  })

  it('renders rank with muted color for ranks > 3', () => {
    const { container } = renderHeader({ rank: 5 })
    const rankEl = container.querySelector('.text-gray-400')
    expect(rankEl).toBeInTheDocument()
  })

  it('renders avatar with initials when no avatarUrl', () => {
    renderHeader()
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('renders avatar image when avatarUrl is provided', () => {
    renderHeader({ avatarUrl: 'https://example.com/avatar.jpg' })
    const img = screen.getByAltText('Alice')
    expect(img.getAttribute('src')).toBe('https://example.com/avatar.jpg')
  })

  it('renders without inline styles', () => {
    const { container } = renderHeader()
    const elementsWithStyle = container.querySelectorAll('[style]')
    expect(elementsWithStyle.length).toBe(0)
  })

  it('has Tailwind classes on container', () => {
    const { container } = renderHeader()
    const card = container.querySelector('.flex.items-center')
    expect(card).toBeInTheDocument()
  })
})
