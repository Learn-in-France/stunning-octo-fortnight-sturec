import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders, setMockAuth, makeUser } from '../../../../test/helpers'
import { replaceMock } from '../../../../test/setup'
import api from '@/lib/api/client'
import AutomationsPage from './page'

// Mock shared
vi.mock('@sturec/shared', () => ({
  UserRole: {},
}))

// Mock toast provider (automations page uses useToast)
vi.mock('@/providers/toast-provider', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}))

const MOCK_QUEUE_STATS = {
  queues: [
    { name: 'ai-processing', waiting: 2, active: 1, completed: 50, failed: 3, delayed: 0, isPaused: false },
    { name: 'lead-routing', waiting: 0, active: 0, completed: 30, failed: 0, delayed: 0, isPaused: false },
    { name: 'notifications', waiting: 1, active: 0, completed: 100, failed: 1, delayed: 0, isPaused: false },
    { name: 'mautic-sync', waiting: 0, active: 0, completed: 20, failed: 0, delayed: 0, isPaused: true },
    { name: 'documents', waiting: 0, active: 0, completed: 15, failed: 0, delayed: 0, isPaused: false },
    { name: 'imports', waiting: 0, active: 0, completed: 5, failed: 0, delayed: 0, isPaused: false },
    { name: 'webhooks', waiting: 0, active: 0, completed: 40, failed: 0, delayed: 0, isPaused: false },
  ],
}

const MOCK_INTEGRATIONS = {
  status: 'healthy',
  checks: [
    { name: 'redis', status: 'ok', latencyMs: 2 },
    { name: 'database', status: 'ok', latencyMs: 5 },
    { name: 'firebase', status: 'ok' },
    { name: 'groq', status: 'ok' },
    { name: 'mautic', status: 'error', error: 'Missing env vars: MAUTIC_BASE_URL', lastSuccess: '2026-03-17T10:00:00Z', lastError: '2026-03-18T08:00:00Z', lastErrorMessage: 'Connection timeout' },
    { name: 'gcs', status: 'ok' },
  ],
}

const MOCK_ALERTS = {
  alerts: [
    { severity: 'warning', category: 'queue', title: 'ai-processing: 3 failed jobs', detail: 'Queue has 3 failed jobs', timestamp: '2026-03-18T09:00:00Z' },
    { severity: 'critical', category: 'integration', title: 'mautic: unhealthy', detail: 'Service health check failed', timestamp: '2026-03-18T09:00:00Z' },
  ],
}

const MOCK_NO_ALERTS = { alerts: [] }

const MOCK_NOTIFICATION_HISTORY = {
  items: [
    { id: 'n1', recipient: 'user@test.com', channel: 'email', provider: 'sendgrid', templateKey: 'welcome', status: 'delivered', errorMessage: null, sentAt: '2026-03-18T10:00:00Z', deliveredAt: '2026-03-18T10:01:00Z', createdAt: '2026-03-18T10:00:00Z' },
  ],
  total: 1,
  page: 1,
  limit: 20,
}

const MOCK_AUDIT_HISTORY = {
  items: [
    { id: 'a1', userEmail: 'admin@test.com', action: 'queue_pause', target: 'ai-processing', metadata: null, createdAt: '2026-03-18T09:00:00Z' },
    { id: 'a2', userEmail: 'admin@test.com', action: 'retry_all', target: 'notifications', metadata: { retried: 5 }, createdAt: '2026-03-18T08:30:00Z' },
  ],
  total: 2,
  page: 1,
  limit: 20,
}

/** Helper: mock api.get to return different data per URL pattern */
function mockApiRoutes(overrides: Record<string, unknown> = {}) {
  vi.mocked(api.get).mockImplementation((url: string) => {
    if (url.includes('/ops/queues')) return Promise.resolve(overrides.queues ?? MOCK_QUEUE_STATS)
    if (url.includes('/ops/alerts')) return Promise.resolve(overrides.alerts ?? MOCK_NO_ALERTS)
    if (url.includes('/ops/integrations')) return Promise.resolve(overrides.integrations ?? MOCK_INTEGRATIONS)
    if (url.includes('/ops/history/notifications')) return Promise.resolve(overrides.notifications ?? MOCK_NOTIFICATION_HISTORY)
    if (url.includes('/ops/history/audit')) return Promise.resolve(overrides.audit ?? MOCK_AUDIT_HISTORY)
    return Promise.resolve({})
  })
}

describe('AutomationsPage', () => {
  afterEach(() => {
    setMockAuth({})
    replaceMock.mockClear()
  })

  describe('admin guard', () => {
    it('renders page content for admin users', async () => {
      setMockAuth({ user: makeUser({ role: 'admin' }) })
      mockApiRoutes()

      renderWithProviders(<AutomationsPage />)

      await waitFor(() => {
        expect(screen.getByText('Automations')).toBeInTheDocument()
      })
    })

    it('redirects counsellor to /dashboard', () => {
      setMockAuth({ user: makeUser({ role: 'counsellor' }) })

      renderWithProviders(<AutomationsPage />)

      expect(screen.queryByText('Automations')).not.toBeInTheDocument()
      expect(replaceMock).toHaveBeenCalledWith('/dashboard')
    })

    it('redirects student to /portal', () => {
      setMockAuth({ user: makeUser({ role: 'student' }) })

      renderWithProviders(<AutomationsPage />)

      expect(screen.queryByText('Automations')).not.toBeInTheDocument()
      expect(replaceMock).toHaveBeenCalledWith('/portal')
    })
  })

  describe('queues tab', () => {
    beforeEach(() => {
      setMockAuth({ user: makeUser({ role: 'admin' }) })
    })

    it('renders all 7 queue cards', async () => {
      mockApiRoutes()

      renderWithProviders(<AutomationsPage />)

      await waitFor(() => {
        expect(screen.getByText('ai-processing')).toBeInTheDocument()
      })
      expect(screen.getByText('lead-routing')).toBeInTheDocument()
      expect(screen.getByText('notifications')).toBeInTheDocument()
      expect(screen.getByText('mautic-sync')).toBeInTheDocument()
      expect(screen.getByText('documents')).toBeInTheDocument()
      expect(screen.getByText('imports')).toBeInTheDocument()
      expect(screen.getByText('webhooks')).toBeInTheDocument()
    })

    it('shows summary strip with queue count', async () => {
      mockApiRoutes()

      renderWithProviders(<AutomationsPage />)

      await waitFor(() => {
        expect(screen.getByText('7 queues')).toBeInTheDocument()
      })
    })

    it('shows failed badge when queues have failures', async () => {
      mockApiRoutes()

      renderWithProviders(<AutomationsPage />)

      await waitFor(() => {
        // Total failed = 3 + 1 = 4
        expect(screen.getByText('4 failed')).toBeInTheDocument()
      })
    })

    it('shows paused badge for paused queues', async () => {
      mockApiRoutes()

      renderWithProviders(<AutomationsPage />)

      await waitFor(() => {
        expect(screen.getByText('1 paused')).toBeInTheDocument()
      })
    })

    it('shows loading spinner while fetching', () => {
      setMockAuth({ user: makeUser({ role: 'admin' }) })
      vi.mocked(api.get).mockReturnValue(new Promise(() => {}))

      renderWithProviders(<AutomationsPage />)

      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })
  })

  describe('integrations tab', () => {
    beforeEach(() => {
      setMockAuth({ user: makeUser({ role: 'admin' }) })
    })

    it('renders integration health checks with correct labels', async () => {
      mockApiRoutes()

      renderWithProviders(<AutomationsPage />)

      await waitFor(() => {
        expect(screen.getByText('Integrations')).toBeInTheDocument()
      })
      screen.getByText('Integrations').click()

      await waitFor(() => {
        expect(screen.getByText('Redis')).toBeInTheDocument()
      })
      expect(screen.getByText('PostgreSQL')).toBeInTheDocument()
      expect(screen.getByText('Firebase Auth')).toBeInTheDocument()
      expect(screen.getByText('Groq AI')).toBeInTheDocument()
    })

    it('shows "Connected" for live-checked services and "Configured" for env-only', async () => {
      mockApiRoutes()

      renderWithProviders(<AutomationsPage />)

      await waitFor(() => {
        expect(screen.getByText('Integrations')).toBeInTheDocument()
      })
      screen.getByText('Integrations').click()

      await waitFor(() => {
        expect(screen.getByText('Redis')).toBeInTheDocument()
      })

      // Redis and database are live-checked → "Connected"
      const connectedBadges = screen.getAllByText('Connected')
      expect(connectedBadges.length).toBe(2)

      // Others are env-check only → "Configured"
      const configuredBadges = screen.getAllByText('Configured')
      expect(configuredBadges.length).toBeGreaterThanOrEqual(1)
    })

    it('shows last-success/failure timestamps for integrations with log data', async () => {
      mockApiRoutes()

      renderWithProviders(<AutomationsPage />)

      await waitFor(() => {
        expect(screen.getByText('Integrations')).toBeInTheDocument()
      })
      screen.getByText('Integrations').click()

      await waitFor(() => {
        expect(screen.getByText('Mautic')).toBeInTheDocument()
      })

      // Mautic has lastSuccess and lastError in mock data
      expect(screen.getByText(/Last OK:/)).toBeInTheDocument()
      expect(screen.getByText(/Last fail:/)).toBeInTheDocument()
    })
  })

  describe('history tab', () => {
    beforeEach(() => {
      setMockAuth({ user: makeUser({ role: 'admin' }) })
    })

    it('renders history tab with sub-tabs', async () => {
      mockApiRoutes()

      renderWithProviders(<AutomationsPage />)

      await waitFor(() => {
        expect(screen.getByText('History')).toBeInTheDocument()
      })
      screen.getByText('History').click()

      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument()
      })
      expect(screen.getByText('Mautic Sync')).toBeInTheDocument()
      expect(screen.getByText('Webhooks')).toBeInTheDocument()
      expect(screen.getByText('Operator Actions')).toBeInTheDocument()
    })

    it('renders notification history table', async () => {
      mockApiRoutes()

      renderWithProviders(<AutomationsPage />)

      await waitFor(() => {
        expect(screen.getByText('History')).toBeInTheDocument()
      })
      screen.getByText('History').click()

      // Notifications tab is default
      await waitFor(() => {
        expect(screen.getByText('user@test.com')).toBeInTheDocument()
      })
      expect(screen.getByText('welcome')).toBeInTheDocument()
    })

    it('renders audit history with operator actions', async () => {
      mockApiRoutes()

      renderWithProviders(<AutomationsPage />)

      await waitFor(() => {
        expect(screen.getByText('History')).toBeInTheDocument()
      })
      screen.getByText('History').click()

      await waitFor(() => {
        expect(screen.getByText('Operator Actions')).toBeInTheDocument()
      })
      screen.getByText('Operator Actions').click()

      await waitFor(() => {
        expect(screen.getAllByText('admin@test.com').length).toBe(2)
      })
      expect(screen.getByText('Paused queue')).toBeInTheDocument()
      expect(screen.getByText('ai-processing')).toBeInTheDocument()
    })
  })

  describe('alerts banner', () => {
    beforeEach(() => {
      setMockAuth({ user: makeUser({ role: 'admin' }) })
    })

    it('shows alert banners when alerts exist', async () => {
      mockApiRoutes({ alerts: MOCK_ALERTS })

      renderWithProviders(<AutomationsPage />)

      await waitFor(() => {
        expect(screen.getByText('ai-processing: 3 failed jobs')).toBeInTheDocument()
      })
      expect(screen.getByText('mautic: unhealthy')).toBeInTheDocument()
    })

    it('does not show alert banner when no alerts', async () => {
      mockApiRoutes({ alerts: MOCK_NO_ALERTS })

      renderWithProviders(<AutomationsPage />)

      await waitFor(() => {
        expect(screen.getByText('Automations')).toBeInTheDocument()
      })

      // No alert banners
      expect(screen.queryByText('ai-processing: 3 failed jobs')).not.toBeInTheDocument()
    })
  })
})
