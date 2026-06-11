import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import fs from 'fs'
import path from 'path'
import NotificationPrompt from '../NotificationPrompt'

const mockRequestPermission = vi.fn()
const mockUseNotifications = vi.fn()

vi.mock('../../hooks/useNotifications', () => ({
  useNotifications: () => mockUseNotifications(),
}))

function setupHook(overrides = {}) {
  mockUseNotifications.mockReturnValue({
    permission: 'default',
    subscribed: false,
    loading: false,
    error: null,
    requestPermission: mockRequestPermission,
    unsubscribe: vi.fn(),
    ...overrides,
  })
}

function renderComponent() {
  return render(<NotificationPrompt />)
}

describe('NotificationPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    setupHook()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('conditional rendering', () => {
    it('renders when permission is default', () => {
      setupHook({ permission: 'default' })
      renderComponent()
      expect(screen.getByText('Ative as notificações')).toBeInTheDocument()
    })

    it('does not render when permission is denied', () => {
      setupHook({ permission: 'denied' })
      const { container } = renderComponent()
      expect(container.firstChild).toBeNull()
    })

    it('does not render when permission is granted', () => {
      setupHook({ permission: 'granted' })
      const { container } = renderComponent()
      expect(container.firstChild).toBeNull()
    })

    it('does not render when permission is unsupported', () => {
      setupHook({ permission: 'unsupported' })
      const { container } = renderComponent()
      expect(container.firstChild).toBeNull()
    })

    it('does not render when already subscribed', () => {
      setupHook({ permission: 'default', subscribed: true })
      const { container } = renderComponent()
      expect(container.firstChild).toBeNull()
    })
  })

  describe('content', () => {
    it('displays explanatory text about notification benefits', () => {
      renderComponent()
      expect(
        screen.getByText(/resumos diários dos jogos/i),
      ).toBeInTheDocument()
      expect(
        screen.getByText(/resultados em tempo real/i),
      ).toBeInTheDocument()
      expect(
        screen.getByText(/lembretes de prazo/i),
      ).toBeInTheDocument()
    })

    it('displays CTA button with correct text', () => {
      renderComponent()
      const button = screen.getByRole('button', { name: /ativar notificações/i })
      expect(button).toBeInTheDocument()
      expect(button).toHaveTextContent('Ativar notificações')
    })

    it('displays close button with accessible label', () => {
      renderComponent()
      expect(screen.getByRole('button', { name: /fechar/i })).toBeInTheDocument()
    })
  })

  describe('interactions', () => {
    it('calls requestPermission on CTA button click', async () => {
      mockRequestPermission.mockResolvedValue(undefined)
      renderComponent()

      fireEvent.click(screen.getByRole('button', { name: /ativar notificações/i }))

      expect(mockRequestPermission).toHaveBeenCalledTimes(1)
    })

    it('dismiss button hides the component', () => {
      renderComponent()
      expect(screen.getByText('Ative as notificações')).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: /fechar/i }))

      expect(screen.queryByText('Ative as notificações')).not.toBeInTheDocument()
    })

    it('shows loading state during permission request', () => {
      setupHook({ loading: true })
      renderComponent()
      expect(screen.getByRole('button', { name: /ativando/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /ativando/i })).toBeDisabled()
    })

    it('shows success message after enabling', async () => {
      mockRequestPermission.mockResolvedValue(undefined)
      renderComponent()

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /ativar notificações/i }))
      })

      expect(screen.getByText(/notificações ativadas com sucesso/i)).toBeInTheDocument()
    })

    it('success message disappears after timeout', async () => {
      mockRequestPermission.mockResolvedValue(undefined)
      renderComponent()

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /ativar notificações/i }))
      })

      expect(screen.getByText(/notificações ativadas com sucesso/i)).toBeInTheDocument()

      await act(() => {
        vi.advanceTimersByTime(3000)
      })

      expect(screen.queryByText(/notificações ativadas com sucesso/i)).not.toBeInTheDocument()
    })

    it('success message has a close button', async () => {
      mockRequestPermission.mockResolvedValue(undefined)
      renderComponent()

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /ativar notificações/i }))
      })

      expect(screen.getByText(/notificações ativadas com sucesso/i)).toBeInTheDocument()

      const closeButtons = screen.getAllByRole('button', { name: /fechar/i })
      fireEvent.click(closeButtons[0])

      expect(screen.queryByText(/notificações ativadas com sucesso/i)).not.toBeInTheDocument()
    })
  })

  describe('styling', () => {
    it('uses Tailwind classes without inline styles', () => {
      const { container } = renderComponent()
      const banner = container.firstChild
      expect(banner).not.toHaveAttribute('style')
    })

    it('applies Tailwind card styling classes', () => {
      const { container } = renderComponent()
      const banner = container.firstChild
      expect(banner.className).toContain('p-4')
      expect(banner.className).toContain('rounded-lg')
      expect(banner.className).toContain('shadow')
    })

    it('applies dark mode classes', () => {
      const { container } = renderComponent()
      const banner = container.firstChild
      expect(banner.className).toContain('dark:bg-dark-card')
      expect(banner.className).toContain('dark:border-dark-border')
    })

    it('applies dark mode classes to text elements', () => {
      renderComponent()
      const title = screen.getByText('Ative as notificações')
      expect(title.className).toContain('dark:text-white')

      const description = screen.getByText(/resumos diários/i)
      expect(description.className).toContain('dark:text-dark-muted')
    })

    it('CTA button has Tailwind classes with dark mode', () => {
      renderComponent()
      const button = screen.getByRole('button', { name: /ativar notificações/i })
      expect(button.className).toContain('bg-primary-500')
      expect(button.className).toContain('dark:bg-primary-600')
    })

    it('CTA button shows disabled state when loading', () => {
      setupHook({ loading: true })
      renderComponent()
      const button = screen.getByRole('button', { name: /ativando/i })
      expect(button).toBeDisabled()
      expect(button.className).toContain('disabled:opacity-50')
    })
  })
})

describe('NotificationPrompt integration with App.jsx', () => {
  const appPath = path.resolve(__dirname, '../../App.jsx')
  const appContent = fs.readFileSync(appPath, 'utf-8')

  it('NotificationPrompt is imported in App.jsx', () => {
    expect(appContent).toContain("import NotificationPrompt from './components/NotificationPrompt'")
  })

  it('NotificationPrompt is rendered for authenticated users', () => {
    expect(appContent).toContain('<NotificationPrompt />')
  })
})
