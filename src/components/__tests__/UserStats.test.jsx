import { render, screen } from '@testing-library/react'
import UserStats from '../UserStats'

const samplePredictions = [
  { id: '1', points: 10 },
  { id: '2', points: 10 },
  { id: '3', points: 10 },
  { id: '4', points: 7 },
  { id: '5', points: 7 },
  { id: '6', points: 5 },
  { id: '7', points: 0 },
  { id: '8', points: 0 },
]

function renderStats(predictions) {
  return render(<UserStats predictions={predictions} />)
}

describe('UserStats', () => {
  it('renders without errors', () => {
    renderStats(samplePredictions)
    expect(screen.getByText('Estatísticas')).toBeInTheDocument()
  })

  it('displays total predictions count', () => {
    renderStats(samplePredictions)
    expect(screen.getByText('8')).toBeInTheDocument()
  })

  it('displays distribution counts correctly', () => {
    renderStats(samplePredictions)
    // distribution: 10pts→3, 7pts→2, 5pts→1, 0pts→2
    expect(screen.getAllByText('3')).toHaveLength(1)
    expect(screen.getAllByText('2')).toHaveLength(2)
    expect(screen.getAllByText('1')).toHaveLength(1)
  })

  it('calculates exact score rate percentage correctly', () => {
    renderStats(samplePredictions)
    expect(screen.getByText('37.5%')).toBeInTheDocument()
  })

  it('handles empty predictions array', () => {
    renderStats([])
    expect(screen.getByText('0.0%')).toBeInTheDocument()
    const zeros = screen.getAllByText('0')
    expect(zeros.length).toBeGreaterThanOrEqual(4)
  })

  it('handles predictions with no points (null/undefined)', () => {
    const predictions = [
      { id: '1', points: null },
      { id: '2', points: undefined },
    ]
    renderStats(predictions)
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('0.0%')).toBeInTheDocument()
  })

  it('shows 0 count for point values with no predictions', () => {
    const predictions = [
      { id: '1', points: 10 },
      { id: '2', points: 10 },
    ]
    renderStats(predictions)
    const zeros = screen.getAllByText('0')
    expect(zeros.length).toBeGreaterThanOrEqual(3)
  })

  it('renders distribution labels', () => {
    renderStats(samplePredictions)
    expect(screen.getByText('10pts')).toBeInTheDocument()
    expect(screen.getByText('7pts')).toBeInTheDocument()
    expect(screen.getByText('5pts')).toBeInTheDocument()
    expect(screen.getByText('0pts')).toBeInTheDocument()
  })

  it('displays section headings', () => {
    renderStats(samplePredictions)
    expect(screen.getByText('Distribuição por Pontos')).toBeInTheDocument()
  })

  it('has Tailwind classes on container', () => {
    const { container } = renderStats(samplePredictions)
    const card = container.querySelector('.bg-white')
    expect(card).toBeInTheDocument()
  })

  it('has dark mode classes', () => {
    const { container } = renderStats(samplePredictions)
    const card = container.querySelector('.dark\\:bg-dark-card')
    expect(card).toBeInTheDocument()
  })
})
