import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders, setMockAuth, makeUser } from '../../../../test/helpers'
import api from '@/lib/api/client'
import DashboardPage from './page'

// Mock shared constants
vi.mock('@sturec/shared', () => ({
  STAGE_DISPLAY_NAMES: {
    lead: 'Lead',
    admitted: 'Admitted',
    enrolled: 'Enrolled',
  },
}))

describe('DashboardPage', () => {
  beforeEach(() => {
    setMockAuth({ user: makeUser({ firstName: 'Sarah' }) })
  })

  afterEach(() => {
    setMockAuth({})
  })

  it('renders greeting with user first name', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        leads: { total: 50, new: 10, qualified: 20, converted: 15, disqualified: 5 },
        students: { active: 30, byStage: { admitted: 10, enrolled: 20 } },
        applications: { total: 20, submitted: 10, offers: 5, enrolled: 3 },
        documents: { total: 100, pending: 8 },
      },
      period: { from: '2025-01-01', to: '2025-02-01' },
    })

    renderWithProviders(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText(/Sarah/)).toBeInTheDocument()
    })
  })

  it('displays KPI cards with correct values', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        leads: { total: 42, new: 5, qualified: 12, converted: 20, disqualified: 5 },
        students: { active: 25, byStage: {} },
        applications: { total: 15, submitted: 8, offers: 3, enrolled: 2 },
        documents: { total: 80, pending: 3 },
      },
      period: { from: '2025-01-01', to: '2025-02-01' },
    })

    renderWithProviders(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument() // Total Leads
    })
    // Qualified count appears in both KPI card and pipeline — verify at least one match
    expect(screen.getAllByText('12').length).toBeGreaterThanOrEqual(1) // Qualified
    expect(screen.getByText('25')).toBeInTheDocument() // Active Students
    // Pending docs "3" may appear with offers "3" — check at least one
    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1)
  })

  it('shows loading spinner while data fetches', () => {
    vi.mocked(api.get).mockReturnValueOnce(new Promise(() => {})) // never resolves

    renderWithProviders(<DashboardPage />)

    // The loading spinner SVG has animate-spin class
    const svg = document.querySelector('.animate-spin')
    expect(svg).toBeInTheDocument()
  })
})
