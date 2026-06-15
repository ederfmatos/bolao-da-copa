import { render, screen, fireEvent } from '@testing-library/react'
import BonusScorePanel from '../BonusScorePanel'

describe('BonusScorePanel', () => {
  it('renders collapsed by default (content not visible)', () => {
    render(<BonusScorePanel />)
    expect(screen.getByText('Ver pontuação bônus')).toBeInTheDocument()
    expect(screen.queryByText('+50 pts')).not.toBeInTheDocument()
  })

  it('shows scoring content after toggle click', () => {
    render(<BonusScorePanel />)
    fireEvent.click(screen.getByText('Ver pontuação bônus'))
    expect(screen.getByText('+50 pts')).toBeInTheDocument()
    expect(screen.getByText('+250 pts total')).toBeInTheDocument()
    expect(screen.getByText(/Acertei só o campeão/)).toBeInTheDocument()
    expect(screen.getByText(/Acertei campeão/)).toBeInTheDocument()
    expect(screen.getByText(/Acertei os 4/)).toBeInTheDocument()
  })

  it('collapses on second toggle click', () => {
    render(<BonusScorePanel />)
    const toggle = screen.getByText('Ver pontuação bônus')
    fireEvent.click(toggle)
    expect(screen.getByText('+50 pts')).toBeInTheDocument()
    fireEvent.click(toggle)
    expect(screen.queryByText('+50 pts')).not.toBeInTheDocument()
  })

  it('displays "250 pts" text when expanded', () => {
    render(<BonusScorePanel />)
    fireEvent.click(screen.getByText('Ver pontuação bônus'))
    expect(screen.getByText('+250 pts total')).toBeInTheDocument()
  })
})
