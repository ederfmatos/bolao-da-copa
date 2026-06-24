import { render, screen, fireEvent, act } from '@testing-library/react'
import fs from 'fs'
import path from 'path'
import NotificationToggle from '../NotificationToggle'

const mockRequestPermission = vi.fn()
const mockUnsubscribe = vi.fn()
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
    unsubscribe: mockUnsubscribe,
    ...overrides,
  })
}

function renderComponent() {
  return render(<NotificationToggle />)
}

describe('NotificationToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupHook()
  })

  describe('rendering', () => {
    it('renders with toggle switch and label', () => {
      renderComponent()
      expect(screen.getByText('Notificações')).toBeInTheDocument()
      expect(screen.getByRole('switch')).toBeInTheDocument()
    })

    it('toggle shows "off" state when not subscribed', () => {
      setupHook({ subscribed: false })
      renderComponent()
      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
    })

    it('toggle shows "on" state when subscribed', () => {
      setupHook({ subscribed: true })
      renderComponent()
      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
    })

    it('shows descriptive text when not subscribed', () => {
      setupHook({ subscribed: false, permission: 'default' })
      renderComponent()
      expect(screen.getByText('Ative para receber notificações')).toBeInTheDocument()
    })

    it('shows descriptive text when subscribed', () => {
      setupHook({ subscribed: true })
      renderComponent()
      expect(screen.getByText('Receba atualizações em tempo real')).toBeInTheDocument()
    })
  })

  describe('toggle on', () => {
    it('calls requestPermission when toggling on', async () => {
      setupHook({ subscribed: false, permission: 'default' })
      mockRequestPermission.mockResolvedValue(undefined)
      renderComponent()

      await act(async () => {
        fireEvent.click(screen.getByRole('switch'))
      })

      expect(mockRequestPermission).toHaveBeenCalledTimes(1)
    })

    it('does not call unsubscribe when toggling on', async () => {
      setupHook({ subscribed: false, permission: 'default' })
      mockRequestPermission.mockResolvedValue(undefined)
      renderComponent()

      await act(async () => {
        fireEvent.click(screen.getByRole('switch'))
      })

      expect(mockUnsubscribe).not.toHaveBeenCalled()
    })
  })

  describe('toggle off', () => {
    it('calls unsubscribe when toggling off', async () => {
      setupHook({ subscribed: true })
      mockUnsubscribe.mockResolvedValue(undefined)
      renderComponent()

      await act(async () => {
        fireEvent.click(screen.getByRole('switch'))
      })

      expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
    })

    it('does not call requestPermission when toggling off', async () => {
      setupHook({ subscribed: true })
      mockUnsubscribe.mockResolvedValue(undefined)
      renderComponent()

      await act(async () => {
        fireEvent.click(screen.getByRole('switch'))
      })

      expect(mockRequestPermission).not.toHaveBeenCalled()
    })
  })

  describe('permission denied', () => {
    it('shows permission denied message when permission is denied', () => {
      setupHook({ permission: 'denied', subscribed: false })
      renderComponent()
      expect(
        screen.getByText(/habilite as notificações nas configurações do navegador/i),
      ).toBeInTheDocument()
    })

    it('toggle is disabled when permission is denied', () => {
      setupHook({ permission: 'denied', subscribed: false })
      renderComponent()
      expect(screen.getByRole('switch')).toBeDisabled()
    })

    it('shows blocked message in subtitle when permission is denied', () => {
      setupHook({ permission: 'denied', subscribed: false })
      renderComponent()
      expect(screen.getByText('Permissões bloqueadas pelo navegador')).toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('shows loading indicator during toggle operation', () => {
      setupHook({ loading: true })
      renderComponent()
      expect(screen.getByText('Processando...')).toBeInTheDocument()
    })

    it('toggle is disabled during loading', () => {
      setupHook({ loading: true })
      renderComponent()
      expect(screen.getByRole('switch')).toBeDisabled()
    })

    it('does not call handlers when loading', async () => {
      setupHook({ loading: true })
      renderComponent()

      await act(async () => {
        fireEvent.click(screen.getByRole('switch'))
      })

      expect(mockRequestPermission).not.toHaveBeenCalled()
      expect(mockUnsubscribe).not.toHaveBeenCalled()
    })
  })

  describe('error state', () => {
    it('shows error message when operation fails', () => {
      setupHook({ error: 'Failed to register subscription' })
      renderComponent()
      expect(screen.getByText('Failed to register subscription')).toBeInTheDocument()
    })
  })

  describe('styling', () => {
    it('uses Tailwind classes without inline styles', () => {
      const { container } = renderComponent()
      const card = container.firstChild
      expect(card).not.toHaveAttribute('style')
    })

    it('applies Tailwind card styling classes', () => {
      const { container } = renderComponent()
      const card = container.firstChild
      expect(card.className).toContain('p-4')
      expect(card.className).toContain('rounded-lg')
      expect(card.className).toContain('shadow-sm')
    })

    it('applies dark mode classes to card', () => {
      const { container } = renderComponent()
      const card = container.firstChild
      expect(card.className).toContain('dark:bg-dark-card')
    })

    it('applies dark mode classes to text elements', () => {
      renderComponent()
      const title = screen.getByText('Notificações')
      expect(title.className).toContain('dark:text-dark-text')
    })

    it('toggle switch has active color when subscribed', () => {
      setupHook({ subscribed: true })
      renderComponent()
      const toggle = screen.getByRole('switch')
      expect(toggle.className).toContain('bg-primary-500')
      expect(toggle.className).toContain('dark:bg-primary-600')
    })

    it('toggle switch has inactive color when not subscribed', () => {
      setupHook({ subscribed: false })
      renderComponent()
      const toggle = screen.getByRole('switch')
      expect(toggle.className).toContain('bg-gray-200')
      expect(toggle.className).toContain('dark:bg-gray-700')
    })

    it('toggle has disabled styling when loading', () => {
      setupHook({ loading: true })
      renderComponent()
      const toggle = screen.getByRole('switch')
      expect(toggle.className).toContain('opacity-50')
      expect(toggle.className).toContain('cursor-not-allowed')
    })

    it('error text has red color with dark mode', () => {
      setupHook({ error: 'Some error' })
      renderComponent()
      const errorText = screen.getByText('Some error')
      expect(errorText.className).toContain('text-red-600')
      expect(errorText.className).toContain('dark:text-red-400')
    })

    it('permission denied text has red color with dark mode', () => {
      setupHook({ permission: 'denied' })
      renderComponent()
      const deniedText = screen.getByText(/habilite as notificações/i)
      expect(deniedText.className).toContain('text-red-600')
      expect(deniedText.className).toContain('dark:text-red-400')
    })
  })
})

describe('NotificationToggle integration with UserProfile', () => {
  const userProfilePath = path.resolve(__dirname, '../../pages/UserProfile.jsx')
  const userProfileContent = fs.readFileSync(userProfilePath, 'utf-8')

  it('NotificationToggle is imported in UserProfile.jsx', () => {
    expect(userProfileContent).toContain("import NotificationToggle from '../components/NotificationToggle'")
  })

  it('NotificationToggle is rendered in UserProfile page', () => {
    expect(userProfileContent).toContain('<NotificationToggle')
  })
})
