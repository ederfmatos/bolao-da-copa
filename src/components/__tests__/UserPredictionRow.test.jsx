import { render, screen } from '@testing-library/react'
import UserPredictionRow from '../UserPredictionRow'

const finishedPrediction = {
  prediction_id: 'pred-1',
  match_id: 'match-1',
  predicted_home: 2,
  predicted_away: 1,
  points: 10,
  created_at: '2026-06-10T10:00:00Z',
  home_team: 'Brasil',
  away_team: 'Argentina',
  home_flag: '🇧🇷',
  away_flag: '🇦🇷',
  group_name: 'Grupo A',
  kickoff_at: '2026-06-15T21:00:00Z',
  match_status: 'finished',
  actual_home: 2,
  actual_away: 1,
}

const scheduledPrediction = {
  ...finishedPrediction,
  match_status: 'scheduled',
  points: null,
  actual_home: null,
  actual_away: null,
}

const nullActualPrediction = {
  ...finishedPrediction,
  actual_home: null,
  actual_away: null,
}

function renderRow(prediction) {
  return render(<UserPredictionRow prediction={prediction} />)
}

describe('UserPredictionRow', () => {
  it('renders without errors', () => {
    const { container } = renderRow(finishedPrediction)
    expect(container.querySelector('.bg-white')).toBeInTheDocument()
  })

  it('displays team names', () => {
    const { container } = renderRow(finishedPrediction)
    expect(container.textContent).toContain('Brasil')
    expect(container.textContent).toContain('Argentina')
  })

  it('displays team flags', () => {
    const { container } = renderRow(finishedPrediction)
    expect(container.textContent).toContain('🇧🇷')
    expect(container.textContent).toContain('🇦🇷')
  })

  it('displays group name', () => {
    renderRow(finishedPrediction)
    expect(screen.getByText(/Grupo A/)).toBeInTheDocument()
  })

  it('displays kickoff date/time', () => {
    renderRow(finishedPrediction)
    expect(screen.getByText(/seg|15|18:00/)).toBeInTheDocument()
  })

  it('displays predicted score label', () => {
    renderRow(finishedPrediction)
    expect(screen.getAllByText('Palpite').length).toBeGreaterThanOrEqual(1)
  })

  it('displays actual result for finished match', () => {
    renderRow(finishedPrediction)
    expect(screen.getByText('Real')).toBeInTheDocument()
  })

  it('displays Aguardando for non-finished match', () => {
    renderRow(scheduledPrediction)
    expect(screen.getByText('Aguardando')).toBeInTheDocument()
  })

  it('does not display actual result for non-finished match', () => {
    renderRow(scheduledPrediction)
    expect(screen.queryByText('Real')).not.toBeInTheDocument()
  })

  it('displays points badge for finished match', () => {
    renderRow(finishedPrediction)
    expect(screen.getByText('10 pts')).toBeInTheDocument()
  })

  it('hides points badge for non-finished match', () => {
    renderRow(scheduledPrediction)
    expect(screen.queryByText(/pts$/)).not.toBeInTheDocument()
  })

  it('handles null actual scores', () => {
    const { container } = renderRow(nullActualPrediction)
    expect(container.textContent).toContain('- × -')
  })

  it('displays scores in the rendered output', () => {
    const { container } = renderRow(finishedPrediction)
    expect(container.textContent).toContain('2')
    expect(container.textContent).toContain('1')
  })

  describe('points badge colors', () => {
    it('is green for 10 points', () => {
      renderRow({ ...finishedPrediction, points: 10 })
      const badge = screen.getByText('10 pts')
      expect(badge.className).toContain('bg-green-500')
    })

    it('is blue for 7 points', () => {
      renderRow({ ...finishedPrediction, points: 7 })
      const badge = screen.getByText('7 pts')
      expect(badge.className).toContain('bg-blue-500')
    })

    it('is gray for 3 points', () => {
      renderRow({ ...finishedPrediction, points: 3 })
      const badge = screen.getByText('3 pts')
      expect(badge.className).toContain('bg-gray-400')
    })

    it('is gray for 0 points', () => {
      renderRow({ ...finishedPrediction, points: 0 })
      const badge = screen.getByText('0 pts')
      expect(badge.className).toContain('bg-gray-400')
    })
  })

  it('has dark mode classes on container', () => {
    const { container } = renderRow(finishedPrediction)
    const card = container.querySelector('.dark\\:bg-dark-card')
    expect(card).toBeInTheDocument()
  })

  it('has Tailwind classes on container', () => {
    const { container } = renderRow(finishedPrediction)
    const card = container.querySelector('.bg-white')
    expect(card).toBeInTheDocument()
  })
})
