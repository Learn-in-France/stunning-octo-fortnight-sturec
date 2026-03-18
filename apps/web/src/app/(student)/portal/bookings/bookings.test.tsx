import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders, setMockAuth, makeUser } from '../../../../../test/helpers'
import api from '@/lib/api/client'
import BookingsPage from './page'

vi.mock('@sturec/shared', async () => {
  const actual = await vi.importActual('@sturec/shared')
  return { ...actual }
})

describe('BookingsPage', () => {
  beforeEach(() => {
    setMockAuth({ user: makeUser({ role: 'student' }) })
  })

  afterEach(() => {
    setMockAuth({})
  })

  it('shows empty state when no bookings', async () => {
    vi.mocked(api.get).mockResolvedValueOnce([])

    renderWithProviders(<BookingsPage />)

    await waitFor(() => {
      expect(screen.getByText('No bookings yet')).toBeInTheDocument()
    })
  })

  it('renders upcoming and past bookings', async () => {
    vi.mocked(api.get).mockResolvedValueOnce([
      {
        id: 'b-1',
        status: 'scheduled',
        scheduledAt: '2026-04-01T10:00:00Z',
        counsellorId: 'c-1',
        studentId: 's-1',
        notes: 'Visa prep discussion',
        createdAt: '2025-01-01',
      },
      {
        id: 'b-2',
        status: 'completed',
        scheduledAt: '2025-12-15T14:00:00Z',
        counsellorId: 'c-1',
        studentId: 's-1',
        notes: null,
        createdAt: '2025-01-01',
      },
    ])

    renderWithProviders(<BookingsPage />)

    await waitFor(() => {
      expect(screen.getByText('Past Bookings')).toBeInTheDocument()
    })
    expect(screen.getByText('Visa prep discussion')).toBeInTheDocument()

    // "Upcoming" appears as both the h2 heading and the badge — verify both exist
    expect(screen.getAllByText('Upcoming')).toHaveLength(2)
    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('has a Book Consultation button', async () => {
    vi.mocked(api.get).mockResolvedValueOnce([])

    renderWithProviders(<BookingsPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /book consultation/i })).toBeInTheDocument()
    })
  })
})
