import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders, setMockAuth, makeUser } from '../../../../test/helpers'
import api from '@/lib/api/client'
import PortalPage from './page'

// Mock shared constants
vi.mock('@sturec/shared', () => ({
  STAGE_ORDER: ['lead', 'contacted', 'admitted', 'enrolled', 'alumni'],
}))

// Mock StageBadge which uses shared constants internally
vi.mock('@/components/shared/stage-badge', () => ({
  StageBadge: ({ stage }: { stage: string }) => <span data-testid="stage-badge">{stage}</span>,
}))

describe('PortalPage (student progress)', () => {
  beforeEach(() => {
    setMockAuth({ user: makeUser({ firstName: 'Omar', role: 'student' }) })
  })

  afterEach(() => {
    setMockAuth({})
  })

  it('renders greeting with student name and progress data', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      stage: 'admitted',
      progressPercent: 60,
      applications: { total: 3, offers: 1 },
      documentChecklist: { completed: 5, total: 10 },
      visa: { status: 'not_started' },
      nextActions: ['Upload passport copy'],
      completedMilestones: ['Profile completed', 'First application submitted'],
    })

    renderWithProviders(<PortalPage />)

    await waitFor(() => {
      expect(screen.getByText(/Omar/)).toBeInTheDocument()
    })

    // Stage displayed
    expect(screen.getByTestId('stage-badge')).toHaveTextContent('admitted')

    // Progress percent
    expect(screen.getByText('60%')).toBeInTheDocument()

    // Application stats
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText(/1 offer received/)).toBeInTheDocument()

    // Document stats
    expect(screen.getByText('5')).toBeInTheDocument()

    // Next actions
    expect(screen.getByText('Upload passport copy')).toBeInTheDocument()

    // Milestones
    expect(screen.getByText('Profile completed')).toBeInTheDocument()
    expect(screen.getByText('First application submitted')).toBeInTheDocument()
  })

  it('shows quick links to portal sections', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      stage: 'lead',
      progressPercent: 10,
      applications: { total: 0, offers: 0 },
      documentChecklist: { completed: 0, total: 5 },
      visa: { status: null },
      nextActions: [],
      completedMilestones: [],
    })

    renderWithProviders(<PortalPage />)

    // Quick links are <a> tags — verify by href
    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Applications' })).toHaveAttribute('href', '/portal/applications')
    })
    expect(screen.getByRole('link', { name: 'Documents' })).toHaveAttribute('href', '/portal/documents')
    expect(screen.getByRole('link', { name: 'Checklist' })).toHaveAttribute('href', '/portal/checklist')
    expect(screen.getByRole('link', { name: 'Bookings' })).toHaveAttribute('href', '/portal/bookings')
  })

  it('shows loading state', () => {
    vi.mocked(api.get).mockReturnValueOnce(new Promise(() => {}))

    renderWithProviders(<PortalPage />)

    const svg = document.querySelector('.animate-spin')
    expect(svg).toBeInTheDocument()
  })
})
