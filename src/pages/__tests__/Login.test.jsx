import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Login from '../Login'

const mockUseAuth = vi.hoisted(() => vi.fn())
vi.mock('../../hooks/useAuth', () => ({
  useAuth: mockUseAuth,
}))

const signInWithGoogle = vi.fn()

function renderLogin() {
  return render(<Login />)
}

describe('Login page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ signInWithGoogle, user: null })
  })

  it('renders without inline styles', () => {
    const { container } = renderLogin()
    const elementsWithStyle = container.querySelectorAll('[style]')
    expect(elementsWithStyle.length).toBe(0)
  })

  it('renders page title', () => {
    renderLogin()
    expect(screen.getByText('Bolão Copa 2026')).toBeInTheDocument()
  })

  it('renders description text', () => {
    renderLogin()
    expect(screen.getByText('Faça login para participar do bolão')).toBeInTheDocument()
  })

  it('renders Google sign-in button', () => {
    renderLogin()
    expect(screen.getByRole('button', { name: /Continue with Google/i })).toBeInTheDocument()
  })

  it('calls signInWithGoogle on button click', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.click(screen.getByRole('button', { name: /Continue with Google/i }))
    expect(signInWithGoogle).toHaveBeenCalledTimes(1)
  })

  it('has Tailwind classes on container', () => {
    const { container } = renderLogin()
    const pageContainer = container.querySelector('.min-h-screen.flex.flex-col.items-center.justify-center')
    expect(pageContainer).toBeInTheDocument()
  })

  it('has dark mode classes on title', () => {
    renderLogin()
    const title = screen.getByText('Bolão Copa 2026')
    expect(title.className).toContain('dark:text-dark-text')
  })
})
