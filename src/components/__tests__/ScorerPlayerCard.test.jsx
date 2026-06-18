import { render, screen, fireEvent } from '@testing-library/react'
import ScorerPlayerCard from '../ScorerPlayerCard'

const defaultProps = {
  flag: '🇧🇷',
  name: 'Vinícius Jr.',
  nationality: 'Brasil',
  position: 'Forward',
  goals: 5,
}

function renderCard(overrides = {}) {
  const props = { ...defaultProps, ...overrides }
  return render(<ScorerPlayerCard {...props} />)
}

describe('ScorerPlayerCard', () => {
  it('renders flag, name, nationality, position, and goals', () => {
    renderCard()
    expect(screen.getByText('🇧🇷')).toBeInTheDocument()
    expect(screen.getByText('Vinícius Jr.')).toBeInTheDocument()
    expect(screen.getByText('Brasil')).toBeInTheDocument()
    expect(screen.getByText('Forward')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('applies selected border class when isSelected is true', () => {
    const { container } = renderCard({ isSelected: true })
    const card = container.firstChild
    expect(card.className).toContain('border-primary-600')
  })

  it('renders checkmark when isSelected is true', () => {
    renderCard({ isSelected: true })
    expect(screen.getByText('✓')).toBeInTheDocument()
  })

  it('does not render checkmark when isSelected is false', () => {
    renderCard({ isSelected: false })
    expect(screen.queryByText('✓')).not.toBeInTheDocument()
  })

  it('calls onClick when card is clicked and disabled is false', () => {
    const onClick = vi.fn()
    const { container } = renderCard({ onClick })
    fireEvent.click(container.firstChild)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick when disabled is true', () => {
    const onClick = vi.fn()
    const { container } = renderCard({ onClick, disabled: true })
    fireEvent.click(container.firstChild)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('sets aria-pressed to "true" when selected', () => {
    const { container } = renderCard({ isSelected: true })
    const card = container.firstChild
    expect(card.getAttribute('aria-pressed')).toBe('true')
  })

  it('sets aria-pressed to "false" when not selected', () => {
    const { container } = renderCard({ isSelected: false })
    const card = container.firstChild
    expect(card.getAttribute('aria-pressed')).toBe('false')
  })

  it('applies disabled opacity class when disabled is true', () => {
    const { container } = renderCard({ disabled: true })
    const card = container.firstChild
    expect(card.className).toContain('opacity-60')
    expect(card.className).toContain('cursor-default')
  })

  it('applies cursor-pointer when disabled is false', () => {
    const { container } = renderCard()
    const card = container.firstChild
    expect(card.className).toContain('cursor-pointer')
  })

  it('renders with transparent border when not selected', () => {
    const { container } = renderCard()
    const card = container.firstChild
    expect(card.className).toContain('border-transparent')
  })

  it('renders correctly inside a grid layout without overflow', () => {
    const { container } = render(
      <div className="grid grid-cols-3 gap-4">
        <ScorerPlayerCard {...defaultProps} />
        <ScorerPlayerCard {...defaultProps} flag="🇦🇷" name="Lionel Messi" nationality="Argentina" />
        <ScorerPlayerCard {...defaultProps} flag="🇫🇷" name="Kylian Mbappé" nationality="França" />
      </div>,
    )
    const grid = container.firstChild
    expect(grid.className).toContain('grid')
    expect(screen.getByText('Vinícius Jr.')).toBeInTheDocument()
    expect(screen.getByText('Lionel Messi')).toBeInTheDocument()
    expect(screen.getByText('Kylian Mbappé')).toBeInTheDocument()
  })
})
