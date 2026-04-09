import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders, setMockAuth, makeUser } from '../../../../test/helpers'
import { replaceMock } from '../../../../test/setup'
import api from '@/lib/api/client'
import SettingsPage from './page'

// Mock shared
vi.mock('@sturec/shared', () => ({
  UserRole: {},
}))

const MOCK_PROFILE = {
  id: 'user-1',
  email: 'admin@sturec.com',
  emailVerified: true,
  role: 'admin',
  firstName: 'Jane',
  lastName: 'Admin',
  phone: '+33612345678',
  avatarUrl: null,
  status: 'active',
}

const MOCK_INTEGRATIONS = {
  status: 'healthy',
  checks: [
    { name: 'redis', status: 'ok', latencyMs: 3 },
    { name: 'database', status: 'ok', latencyMs: 7 },
    { name: 'firebase', status: 'ok' },
    { name: 'groq', status: 'ok' },
    { name: 'mautic', status: 'error', error: 'Missing env vars: MAUTIC_BASE_URL', lastSuccess: '2026-03-17T10:00:00Z' },
    { name: 'gcs', status: 'ok' },
    { name: 'calcom', status: 'ok', lastSuccess: '2026-03-18T08:00:00Z' },
    { name: 'whatsapp', status: 'ok', lastSuccess: '2026-03-18T07:30:00Z' },
  ],
}

function mockApiRoutes() {
  vi.mocked(api.get).mockImplementation((url: string) => {
    if (url.includes('/users/me')) return Promise.resolve(MOCK_PROFILE)
    if (url.includes('/ops/integrations')) return Promise.resolve(MOCK_INTEGRATIONS)
    return Promise.resolve({})
  })
}

describe('SettingsPage', () => {
  afterEach(() => {
    setMockAuth({})
    replaceMock.mockClear()
  })

  describe('admin guard', () => {
    it('renders settings page for admin users', async () => {
      setMockAuth({ user: makeUser({ role: 'admin' }) })
      mockApiRoutes()

      renderWithProviders(<SettingsPage />)

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument()
      })
    })

    it('redirects counsellor to /dashboard', () => {
      setMockAuth({ user: makeUser({ role: 'counsellor' }) })

      renderWithProviders(<SettingsPage />)

      expect(screen.queryByText('Settings')).not.toBeInTheDocument()
      expect(replaceMock).toHaveBeenCalledWith('/dashboard')
    })

    it('redirects student to /portal', () => {
      setMockAuth({ user: makeUser({ role: 'student' }) })

      renderWithProviders(<SettingsPage />)

      expect(screen.queryByText('Settings')).not.toBeInTheDocument()
      expect(replaceMock).toHaveBeenCalledWith('/portal')
    })
  })

  describe('account tab', () => {
    beforeEach(() => {
      setMockAuth({ user: makeUser({ role: 'admin' }) })
      mockApiRoutes()
    })

    it('renders account form with profile data', async () => {
      renderWithProviders(<SettingsPage />)

      await waitFor(() => {
        expect(screen.getByText('Account')).toBeInTheDocument()
      })

      // Form fields
      await waitFor(() => {
        const firstNameInput = screen.getByDisplayValue('Jane')
        expect(firstNameInput).toBeInTheDocument()
      })
      expect(screen.getByDisplayValue('Admin')).toBeInTheDocument()
      expect(screen.getByDisplayValue('+33612345678')).toBeInTheDocument()
    })

    it('shows read-only email and role', async () => {
      renderWithProviders(<SettingsPage />)

      await waitFor(() => {
        expect(screen.getByText('admin@sturec.com')).toBeInTheDocument()
      })
      expect(screen.getByText('admin')).toBeInTheDocument()
    })

    it('shows disabled Save button when form is clean', async () => {
      renderWithProviders(<SettingsPage />)

      await waitFor(() => {
        expect(screen.getByText('Save Changes')).toBeInTheDocument()
      })

      const saveButton = screen.getByText('Save Changes').closest('button')
      expect(saveButton).toBeDisabled()
    })
  })

  describe('integrations tab', () => {
    beforeEach(() => {
      setMockAuth({ user: makeUser({ role: 'admin' }) })
      mockApiRoutes()
    })

    it('renders external service integration cards', async () => {
      renderWithProviders(<SettingsPage />)

      // Navigate to Integrations tab
      await waitFor(() => {
        // Find Integrations tab button (not the heading)
        const tabs = screen.getAllByText('Integrations')
        expect(tabs.length).toBeGreaterThan(0)
      })
      screen.getAllByText('Integrations')[0].click()

      await waitFor(() => {
        expect(screen.getByText('Mautic')).toBeInTheDocument()
      })
      expect(screen.getByText('Firebase Auth')).toBeInTheDocument()
      expect(screen.getByText('Groq AI')).toBeInTheDocument()
      expect(screen.getByText('Cloud Storage')).toBeInTheDocument()
    })

    it('shows Configured badge for OK services', async () => {
      renderWithProviders(<SettingsPage />)

      await waitFor(() => {
        const tabs = screen.getAllByText('Integrations')
        expect(tabs.length).toBeGreaterThan(0)
      })
      screen.getAllByText('Integrations')[0].click()

      await waitFor(() => {
        expect(screen.getByText('Firebase Auth')).toBeInTheDocument()
      })

      const configuredBadges = screen.getAllByText('Configured')
      expect(configuredBadges.length).toBeGreaterThanOrEqual(1)
    })

    it('shows Not configured badge for error services', async () => {
      renderWithProviders(<SettingsPage />)

      await waitFor(() => {
        const tabs = screen.getAllByText('Integrations')
        expect(tabs.length).toBeGreaterThan(0)
      })
      screen.getAllByText('Integrations')[0].click()

      await waitFor(() => {
        expect(screen.getByText('Mautic')).toBeInTheDocument()
      })

      expect(screen.getByText('Not configured')).toBeInTheDocument()
    })
  })

  describe('system tab', () => {
    beforeEach(() => {
      setMockAuth({ user: makeUser({ role: 'admin' }) })
      mockApiRoutes()
    })

    it('renders infrastructure health and platform info', async () => {
      renderWithProviders(<SettingsPage />)

      await waitFor(() => {
        expect(screen.getByText('System')).toBeInTheDocument()
      })
      screen.getByText('System').click()

      await waitFor(() => {
        expect(screen.getByText('Infrastructure')).toBeInTheDocument()
      })
      expect(screen.getByText('Platform')).toBeInTheDocument()

      // Infrastructure cards
      expect(screen.getByText('Redis (Queue Backend)')).toBeInTheDocument()
      expect(screen.getByText('PostgreSQL (Primary Store)')).toBeInTheDocument()

      // Connected badges
      const connectedBadges = screen.getAllByText('Connected')
      expect(connectedBadges.length).toBe(2)

      // Platform info
      expect(screen.getByText('Next.js 15')).toBeInTheDocument()
      expect(screen.getByText('Fastify + Prisma')).toBeInTheDocument()
    })
  })
})
