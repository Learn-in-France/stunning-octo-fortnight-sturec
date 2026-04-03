import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders, setMockAuth, makeUser } from '../../../../../test/helpers'
import api from '@/lib/api/client'
import BookingsPage from './page'

vi.mock('@sturec/shared', async () => {
  const actual = await vi.importActual('@sturec/shared')
  return { ...actual }
})

function mockBookingPageCalls({
  bookings = [],
  progress,
  profile,
}: {
  bookings?: unknown[]
  progress?: Record<string, unknown>
  profile?: Record<string, unknown>
} = {}) {
  vi.mocked(api.get).mockImplementation((url: string) => {
    if (url === '/students/me/bookings') return Promise.resolve(bookings as never)
    if (url === '/students/me/progress') {
      return Promise.resolve((progress ?? {
        stage: 'lead_created',
        progressPercent: 10,
        assignedCounsellorId: null,
        bookingReady: false,
        intakeCapture: { captured: 0, total: 7, missing: ['budget awareness', 'source tracking'] },
        nextActions: [],
        completedMilestones: [],
        documentChecklist: { completed: 0, total: 0 },
        applications: { total: 0, offers: 0 },
        visa: { status: null },
      }) as never)
    }
    if (url === '/students/me') {
      return Promise.resolve((profile ?? {
        id: 'student-1',
        referenceCode: 'STU-001',
        stage: 'lead_created',
        stageUpdatedAt: '2026-04-01T09:00:00.000Z',
        degreeLevel: null,
        bachelorDegree: null,
        gpa: null,
        graduationYear: null,
        englishTestType: null,
        englishScore: null,
        budgetMin: null,
        budgetMax: null,
        fundingRoute: null,
        preferredCity: null,
        preferredIntake: null,
        housingNeeded: null,
        whatsappConsent: true,
        emailConsent: true,
        parentInvolvement: false,
        createdAt: '2026-04-01T09:00:00.000Z',
        updatedAt: '2026-04-01T09:00:00.000Z',
      }) as never)
    }
    return Promise.resolve([] as never)
  })
}

describe('BookingsPage', () => {
  beforeEach(() => {
    setMockAuth({ user: makeUser({ role: 'student' }) })
  })

  afterEach(() => {
    setMockAuth({})
  })

  it('shows empty state when no bookings', async () => {
    mockBookingPageCalls()

    renderWithProviders(<BookingsPage />)

    await waitFor(() => {
      expect(screen.getByText('No meetings requested yet')).toBeInTheDocument()
    })
  })

  it('renders upcoming and past bookings', async () => {
    mockBookingPageCalls({
      bookings: [
        {
          id: 'b-1',
          status: 'assigned',
          scheduledAt: '2026-04-10T10:00:00.000Z',
          counsellorId: 'c-1',
          studentId: 'student-1',
          leadId: null,
          notes: 'Visa prep discussion',
          createdAt: '2026-04-01T09:00:00.000Z',
          source: 'portal',
        },
        {
          id: 'b-2',
          status: 'completed',
          scheduledAt: '2026-03-15T14:00:00.000Z',
          counsellorId: 'c-1',
          studentId: 'student-1',
          leadId: null,
          notes: null,
          createdAt: '2026-03-01T09:00:00.000Z',
          source: 'chat',
        },
      ],
      progress: {
        stage: 'qualified',
        progressPercent: 35,
        assignedCounsellorId: 'c-1',
        bookingReady: true,
        intakeCapture: { captured: 5, total: 7, missing: ['budget awareness', 'source tracking'] },
        nextActions: [],
        completedMilestones: [],
        documentChecklist: { completed: 0, total: 0 },
        applications: { total: 0, offers: 0 },
        visa: { status: null },
      },
    })

    renderWithProviders(<BookingsPage />)

    await waitFor(() => {
      expect(screen.getByText('Upcoming requests')).toBeInTheDocument()
    })
    expect(screen.getByText('Past bookings')).toBeInTheDocument()
    expect(screen.getByText('Visa prep discussion')).toBeInTheDocument()
    expect(screen.getByText('Assigned')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('has a request counsellor session button', async () => {
    mockBookingPageCalls()

    renderWithProviders(<BookingsPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /request counsellor session/i })).toBeInTheDocument()
    })
  })
})
