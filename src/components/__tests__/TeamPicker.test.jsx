import { render, screen, fireEvent } from '@testing-library/react'
import TeamPicker from '../TeamPicker'

const teams = [
  { name: 'Brasil', flag: '🇧🇷' },
  { name: 'Argentina', flag: '🇦🇷' },
  { name: 'França', flag: '🇫🇷' },
  { name: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { name: 'Espanha', flag: '🇪🇸' },
]

function renderPicker(overrides = {}) {
  const props = {
    teams,
    onSelect: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  }
  return render(<TeamPicker {...props} />)
}

describe('TeamPicker', () => {
  it('renders all teams when search is empty', () => {
    renderPicker()
    teams.forEach(team => {
      expect(screen.getByText(team.name)).toBeInTheDocument()
    })
  })

  it('filters list to Brasil when search is "bras" (case-insensitive)', () => {
    renderPicker()
    const input = screen.getByPlaceholderText('Buscar time...')
    fireEvent.change(input, { target: { value: 'bras' } })
    expect(screen.getByText('Brasil')).toBeInTheDocument()
    expect(screen.queryByText('Argentina')).not.toBeInTheDocument()
    expect(screen.queryByText('França')).not.toBeInTheDocument()
  })

  it('shows empty message when search matches no team', () => {
    renderPicker()
    const input = screen.getByPlaceholderText('Buscar time...')
    fireEvent.change(input, { target: { value: 'xyz' } })
    expect(screen.getByText('Nenhum time encontrado')).toBeInTheDocument()
    expect(screen.queryByText('Brasil')).not.toBeInTheDocument()
  })

  it('calls onSelect with team name when a team is clicked', () => {
    const onSelect = vi.fn()
    renderPicker({ onSelect })
    fireEvent.click(screen.getByText('Brasil'))
    expect(onSelect).toHaveBeenCalledWith('Brasil')
  })

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn()
    renderPicker({ onClose })
    const input = screen.getByPlaceholderText('Buscar time...')
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when overlay is clicked', () => {
    const onClose = vi.fn()
    const { container } = renderPicker({ onClose })
    const overlay = container.firstChild
    fireEvent.click(overlay)
    expect(onClose).toHaveBeenCalled()
  })

  it('does not call onClose when modal content is clicked', () => {
    const onClose = vi.fn()
    renderPicker({ onClose })
    const modal = screen.getByPlaceholderText('Buscar time...').closest('div[class*="bg-white"]')
    if (modal) fireEvent.click(modal)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('navigates with ArrowDown and selects with Enter', () => {
    const onSelect = vi.fn()
    renderPicker({ onSelect })
    const input = screen.getByPlaceholderText('Buscar time...')
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onSelect).toHaveBeenCalledWith('França')
  })

  it('does not select on Enter when list is empty', () => {
    const onSelect = vi.fn()
    renderPicker({ onSelect })
    const input = screen.getByPlaceholderText('Buscar time...')
    fireEvent.change(input, { target: { value: 'xyz' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('does not navigate below list bounds with ArrowDown', () => {
    const onSelect = vi.fn()
    renderPicker({ onSelect })
    const input = screen.getByPlaceholderText('Buscar time...')
    for (let i = 0; i < 10; i++) {
      fireEvent.keyDown(input, { key: 'ArrowDown' })
    }
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onSelect).toHaveBeenCalledWith('Espanha')
  })

  it('does not navigate above list bounds with ArrowUp', () => {
    const onSelect = vi.fn()
    renderPicker({ onSelect })
    const input = screen.getByPlaceholderText('Buscar time...')
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onSelect).toHaveBeenCalledWith('Brasil')
  })
})
