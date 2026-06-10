import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider, useTheme } from '../ThemeContext'

const originalMatchMedia = window.matchMedia

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
  window.matchMedia = originalMatchMedia
})

function TestConsumer() {
  const { theme, toggleTheme } = useTheme()
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button data-testid="toggle" onClick={toggleTheme}>Toggle</button>
    </div>
  )
}

describe('ThemeProvider', () => {
  it('renders children without errors', () => {
    render(<ThemeProvider><div>child</div></ThemeProvider>)
    expect(screen.getByText('child')).toBeInTheDocument()
  })

  it('provides theme and toggleTheme via useTheme', () => {
    render(<ThemeProvider><TestConsumer /></ThemeProvider>)
    expect(screen.getByTestId('theme')).toBeInTheDocument()
    expect(screen.getByTestId('toggle')).toBeInTheDocument()
  })
})

describe('theme initialization', () => {
  it('reads theme from localStorage if present', () => {
    localStorage.setItem('theme', 'dark')
    render(<ThemeProvider><TestConsumer /></ThemeProvider>)
    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
  })

  it('reads theme from localStorage if present (light)', () => {
    localStorage.setItem('theme', 'light')
    render(<ThemeProvider><TestConsumer /></ThemeProvider>)
    expect(screen.getByTestId('theme')).toHaveTextContent('light')
  })

  it('falls back to system preference if no localStorage', () => {
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: query === '(prefers-color-scheme: dark)' ? false : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
    render(<ThemeProvider><TestConsumer /></ThemeProvider>)
    expect(screen.getByTestId('theme')).toHaveTextContent('light')
  })

  it('falls back to dark if system prefers dark', () => {
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
    render(<ThemeProvider><TestConsumer /></ThemeProvider>)
    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
  })

  it('falls back to light when localStorage has invalid value', () => {
    localStorage.setItem('theme', 'blue')
    render(<ThemeProvider><TestConsumer /></ThemeProvider>)
    expect(screen.getByTestId('theme')).toHaveTextContent('light')
  })

  it('defaults to light when nothing is stored and no OS preference', () => {
    // This exercises the same fallback path as the SSR guard
    // (no localStorage value, no matchMedia match → 'light')
    render(<ThemeProvider><TestConsumer /></ThemeProvider>)
    expect(screen.getByTestId('theme')).toHaveTextContent('light')
  })
})

describe('toggleTheme', () => {
  it('switches from light to dark', () => {
    localStorage.setItem('theme', 'light')
    render(<ThemeProvider><TestConsumer /></ThemeProvider>)
    expect(screen.getByTestId('theme')).toHaveTextContent('light')
    fireEvent.click(screen.getByTestId('toggle'))
    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
  })

  it('switches from dark to light', () => {
    localStorage.setItem('theme', 'dark')
    render(<ThemeProvider><TestConsumer /></ThemeProvider>)
    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    fireEvent.click(screen.getByTestId('toggle'))
    expect(screen.getByTestId('theme')).toHaveTextContent('light')
  })
})

describe('dark class on documentElement', () => {
  it('adds dark class when theme is dark', () => {
    localStorage.setItem('theme', 'dark')
    render(<ThemeProvider><TestConsumer /></ThemeProvider>)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('removes dark class when theme is light', () => {
    localStorage.setItem('theme', 'light')
    render(<ThemeProvider><TestConsumer /></ThemeProvider>)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('toggles dark class when toggleTheme is called', () => {
    localStorage.setItem('theme', 'light')
    render(<ThemeProvider><TestConsumer /></ThemeProvider>)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    fireEvent.click(screen.getByTestId('toggle'))
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    fireEvent.click(screen.getByTestId('toggle'))
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})

describe('localStorage persistence', () => {
  it('persists theme to localStorage on change', () => {
    localStorage.setItem('theme', 'light')
    render(<ThemeProvider><TestConsumer /></ThemeProvider>)
    expect(localStorage.getItem('theme')).toBe('light')
    fireEvent.click(screen.getByTestId('toggle'))
    expect(localStorage.getItem('theme')).toBe('dark')
  })
})

describe('integration', () => {
  it('allows useTheme in nested child components', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )
    expect(screen.getByTestId('theme')).toHaveTextContent('light')
    fireEvent.click(screen.getByTestId('toggle'))
    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
  })

  it('persists theme across simulated page reload', () => {
    localStorage.setItem('theme', 'dark')
    const { unmount } = render(<ThemeProvider><TestConsumer /></ThemeProvider>)
    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    unmount()
    const stored = localStorage.getItem('theme')
    expect(stored).toBe('dark')
    render(<ThemeProvider><TestConsumer /></ThemeProvider>)
    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
  })
})
