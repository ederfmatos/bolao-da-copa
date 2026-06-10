import { render, screen } from '@testing-library/react'
import Podium from '../Podium'

const entries = [
  { user_id: 'u1', name: 'Alice', avatar_url: null, total_points: 30, total_predictions: 10 },
  { user_id: 'u2', name: 'Bob', avatar_url: null, total_points: 25, total_predictions: 9 },
  { user_id: 'u3', name: 'Charlie', avatar_url: null, total_points: 20, total_predictions: 8 },
]

describe('Podium', () => {
  it('returns null when top3 is null', () => {
    const { container } = render(<Podium top3={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('returns null when top3 is empty array', () => {
    const { container } = render(<Podium top3={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('displays all three entries', () => {
    render(<Podium top3={entries} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('Charlie')).toBeInTheDocument()
  })

  it('displays points for each entry', () => {
    render(<Podium top3={entries} />)
    expect(screen.getByText('30')).toBeInTheDocument()
    expect(screen.getByText('25')).toBeInTheDocument()
    expect(screen.getByText('20')).toBeInTheDocument()
  })

  it('renders without inline styles', () => {
    const { container } = render(<Podium top3={entries} />)
    const elementsWithStyle = container.querySelectorAll('[style]')
    expect(elementsWithStyle.length).toBe(0)
  })

  it('has Tailwind classes on container', () => {
    const { container } = render(<Podium top3={entries} />)
    const podiumContainer = container.querySelector('.flex.justify-center.items-end')
    expect(podiumContainer).toBeInTheDocument()
  })
})
