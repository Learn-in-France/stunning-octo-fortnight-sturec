import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders, setMockAuth, makeUser } from '../../../../test/helpers'
import api from '@/lib/api/client'
import DashboardPage from './page'

vi.mock('@sturec/shared', () => ({
  STAGE_DISPLAY_NAMES: {
    lead_created: 'Lead created',
    counsellor_consultation: 'In consultation',
    arrived_france: 'Arrived in France',
  },
}))

const overview = {
  data: {
    leads: { total: 42, new: 5, qualified: 12, converted: 20, disqualified: 5 },
    students: { active: 25, byStage: { counsellor_consultation: 8, arrived_france: 3 } },
    applications: { total: 15, submitted: 8, offers: 3, enrolled: 2 },
    documents: { pending: 3, verified: 20, rejected: 1 },
    bookings: { scheduled: 4, completed: 6, awaitingAssignment: 2, assigned: 1 },
  },
  period: { from: '2025-01-01', to: '2025-02-01' },
}

function mockAdminDashboardCalls() {
  vi.mocked(api.get).mockImplementation((url: string) => {
    if (url === '/analytics/overview') return Promise.resolve(overview as never)
    if (url === '/bookings') {
      return Promise.resolve([
        {
          id: 'booking-1',
          studentId: 'student-1',
          leadId: null,
          counsellorId: null,
          counsellorName: 'Unassigned',
          scheduledAt: '2026-04-10T10:00:00.000Z',
          status: 'awaiting_assignment',
          notes: 'Needs first consultation',
          createdAt: '2026-04-01T09:00:00.000Z',
        },
      ] as never)
    }
    if (url === '/analytics/counsellors') {
      return Promise.resolve([
        {
          id: 'c-1',
          name: 'Jane Doe',
          email: 'jane@example.com',
          assignedLeads: 3,
          assignedStudents: 5,
          activityCount: 12,
          conversionRate: 0.4,
          overdueActions: 1,
        },
      ] as never)
    }
    return Promise.resolve([] as never)
  })
}

describe('DashboardPage', () => {
  afterEach(() => {
    setMockAuth({})
  })

  it('renders greeting with user first name', async () => {
    setMockAuth({ user: makeUser({ firstName: 'Sarah', role: 'admin' }) })
    mockAdminDashboardCalls()

    renderWithProviders(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText(/Sarah/)).toBeInTheDocument()
    })
  })

  it('shows admin handoff widgets and KPI cards', async () => {
    setMockAuth({ user: makeUser({ firstName: 'Sarah', role: 'admin' }) })
    mockAdminDashboardCalls()

    renderWithProviders(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Pending Assignment Queue')).toBeInTheDocument()
    })

    expect(screen.getByText('Counsellor Workload')).toBeInTheDocument()
    expect(screen.getByText('Bookings & Handoffs')).toBeInTheDocument()
    expect(screen.getAllByText('Awaiting assignment').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('shows counsellor agenda view without admin analytics', async () => {
    setMockAuth({ user: makeUser({ firstName: 'Nadia', role: 'counsellor' }) })
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === '/bookings') return Promise.resolve([] as never)
      if (url === '/counsellor/agenda') return Promise.resolve({
        todayMeetings: [],
        overdueReminders: [],
        upcomingReminders: [],
        docsWaitingReview: [],
        staleStudents: [],
      } as never)
      return Promise.resolve([] as never)
    })

    renderWithProviders(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText("Today's meetings")).toBeInTheDocument()
    })

    expect(screen.getByText('Overdue follow-ups')).toBeInTheDocument()
    expect(screen.getByText('Documents to review')).toBeInTheDocument()
    expect(screen.getByText('Stale students')).toBeInTheDocument()
    expect(screen.queryByText('Pending Assignment Queue')).toBeNull()
  })

  it('shows loading spinner while data fetches for admin', () => {
    setMockAuth({ user: makeUser({ firstName: 'Sarah', role: 'admin' }) })
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === '/analytics/overview') return new Promise(() => {}) as never
      if (url === '/bookings') return Promise.resolve([] as never)
      if (url === '/analytics/counsellors') return Promise.resolve([] as never)
      return Promise.resolve([] as never)
    })

    renderWithProviders(<DashboardPage />)

    const svg = document.querySelector('.animate-spin')
    expect(svg).toBeInTheDocument()
  })
})
