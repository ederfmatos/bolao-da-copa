import { render, screen } from '@testing-library/react'
import Rules from '../Rules'

const scenarioTitles = [
  'Placar Exato',
  'Vencedor + Saldo de Gols',
  'Empate Correto',
  'Vencedor Correto',
  'Resultado Errado',
]

function renderRules() {
  return render(<Rules />)
}

describe('Rules page', () => {
  it('renders without inline styles', () => {
    const { container } = renderRules()
    const elementsWithStyle = container.querySelectorAll('[style]')
    expect(elementsWithStyle.length).toBe(0)
  })

  it('renders page title', () => {
    renderRules()
    expect(screen.getByText('Regras do Bolão')).toBeInTheDocument()
  })

  it('renders all 5 scoring scenarios', () => {
    renderRules()
    scenarioTitles.forEach(title => {
      expect(screen.getByText(title)).toBeInTheDocument()
    })
  })

  it('shows deadline notice', () => {
    renderRules()
    expect(screen.getByText(/1 hora de antecedência/)).toBeInTheDocument()
  })

  it('shows tip box', () => {
    renderRules()
    expect(screen.getByText(/Quanto mais preciso for seu palpite/)).toBeInTheDocument()
  })

  it('displays correct points for each scenario', () => {
    renderRules()
    expect(screen.getByText('10 pts')).toBeInTheDocument()
    expect(screen.getAllByText('7 pts')).toHaveLength(2)
    expect(screen.getByText('3 pts')).toBeInTheDocument()
    expect(screen.getByText('0 pts')).toBeInTheDocument()
  })

  it('renders example text for each scenario', () => {
    renderRules()
    expect(screen.getByText(/Palpite: 2×1 \| Resultado: 2×1/)).toBeInTheDocument()
    expect(screen.getByText(/Palpite: 2×0 \| Resultado: 3×1/)).toBeInTheDocument()
    expect(screen.getByText(/Palpite: 1×1 \| Resultado: 2×2/)).toBeInTheDocument()
    expect(screen.getByText(/Palpite: 1×0 \| Resultado: 3×1/)).toBeInTheDocument()
    expect(screen.getByText(/Palpite: 2×0 \| Resultado: 0×1/)).toBeInTheDocument()
  })

  it('has Tailwind classes on container', () => {
    const { container } = renderRules()
    const pageContainer = container.querySelector('.p-4.max-w-xl.mx-auto')
    expect(pageContainer).toBeInTheDocument()
  })
})
