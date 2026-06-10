import { render, screen, fireEvent } from '@testing-library/react'
import ScorePicker from '../ScorePicker'

function renderPicker(overrides = {}) {
  const props = {
    homeScore: 0,
    awayScore: 0,
    onChange: vi.fn(),
    disabled: false,
    ...overrides,
  }
  return render(<ScorePicker {...props} />)
}

describe('ScorePicker', () => {
  it('renders without errors', () => {
    renderPicker()
    const scores = screen.getAllByText('0')
    expect(scores).toHaveLength(2)
  })

  it('renders without inline styles', () => {
    const { container } = renderPicker()
    expect(container.querySelectorAll('[style]').length).toBe(0)
  })

  it('displays home and away scores', () => {
    renderPicker({ homeScore: 2, awayScore: 1 })
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('renders the separator', () => {
    renderPicker()
    expect(screen.getByText('×')).toBeInTheDocument()
  })

  it('increments home score on + button click', () => {
    const onChange = vi.fn()
    renderPicker({ homeScore: 1, awayScore: 0, onChange })
    const buttons = screen.getAllByText('+')
    fireEvent.click(buttons[0])
    expect(onChange).toHaveBeenCalledWith(2, 0)
  })

  it('decrements home score on − button click', () => {
    const onChange = vi.fn()
    renderPicker({ homeScore: 3, awayScore: 2, onChange })
    const buttons = screen.getAllByText('−')
    fireEvent.click(buttons[0])
    expect(onChange).toHaveBeenCalledWith(2, 2)
  })

  it('increments away score on + button click', () => {
    const onChange = vi.fn()
    renderPicker({ homeScore: 0, awayScore: 1, onChange })
    const buttons = screen.getAllByText('+')
    fireEvent.click(buttons[1])
    expect(onChange).toHaveBeenCalledWith(0, 2)
  })

  it('decrements away score on − button click', () => {
    const onChange = vi.fn()
    renderPicker({ homeScore: 2, awayScore: 3, onChange })
    const buttons = screen.getAllByText('−')
    fireEvent.click(buttons[1])
    expect(onChange).toHaveBeenCalledWith(2, 2)
  })

  it('does not decrement home score below 0', () => {
    const onChange = vi.fn()
    renderPicker({ homeScore: 0, awayScore: 0, onChange })
    const buttons = screen.getAllByText('−')
    buttons.forEach(btn => fireEvent.click(btn))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('does not decrement away score below 0', () => {
    const onChange = vi.fn()
    renderPicker({ homeScore: 1, awayScore: 0, onChange })
    const buttons = screen.getAllByText('−')
    fireEvent.click(buttons[1])
    expect(onChange).not.toHaveBeenCalled()
  })

  it('disables all buttons when disabled is true', () => {
    const onChange = vi.fn()
    renderPicker({ disabled: true, onChange })
    const buttons = screen.getAllByRole('button')
    buttons.forEach(btn => {
      expect(btn).toBeDisabled()
    })
  })

  it('does not call onChange when disabled', () => {
    const onChange = vi.fn()
    renderPicker({ disabled: true, homeScore: 2, awayScore: 1, onChange })
    const buttons = screen.getAllByRole('button')
    buttons.forEach(btn => fireEvent.click(btn))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('applies Tailwind classes to score display', () => {
    renderPicker({ homeScore: 5, awayScore: 3 })
    const scores = screen.getAllByText(/[53]/)
    scores.forEach(el => {
      expect(el.className).toContain('text-3xl')
      expect(el.className).toContain('font-bold')
      expect(el.className).toContain('min-w-[60px]')
    })
  })
})
