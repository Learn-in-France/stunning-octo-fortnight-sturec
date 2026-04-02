import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders, setMockAuth, makeUser } from '../../../../test/helpers'
import api from '@/lib/api/client'
import PortalPage from './page'

// Mock shared constants
vi.mock('@sturec/shared', () => ({
  STAGE_ORDER: [
    'lead_created', 'intake_completed', 'qualified', 'counsellor_consultation',
    'application_started', 'offer_confirmed', 'campus_france_readiness',
    'visa_file_readiness', 'visa_submitted', 'visa_decision',
    'arrival_onboarding', 'arrived_france', 'alumni',
  ],
  STAGE_STUDENT_LABELS: {
    lead_created: 'Getting started',
    intake_completed: 'Profile reviewed',
    qualified: 'Matched with counsellor',
    counsellor_consultation: 'In consultation',
    application_started: 'Applications in progress',
    offer_confirmed: 'Offer received',
    campus_france_readiness: 'Campus France prep',
    visa_file_readiness: 'Visa preparation',
    visa_submitted: 'Visa submitted',
    visa_decision: 'Visa decision',
    arrival_onboarding: 'Preparing to arrive',
    arrived_france: 'Welcome to France',
    alumni: 'Alumni',
  },
  STAGE_NEXT_STEP: {
    lead_created: 'Talk to our AI advisor to explore your options for studying in France.',
    intake_completed: 'Your profile is being reviewed. A counsellor will be assigned shortly.',
    qualified: 'Your counsellor will reach out to schedule an introductory meeting.',
    counsellor_consultation: 'Work with your counsellor to select programs and prepare applications.',
    application_started: 'Your applications are being prepared and submitted.',
    offer_confirmed: 'Great news — you have an offer! Next step: Campus France registration.',
    campus_france_readiness: 'Complete your Campus France dossier and prepare for the interview.',
    visa_file_readiness: 'Gather your visa documents.',
    visa_submitted: 'Your visa application is being processed. No action needed from you right now.',
    visa_decision: 'Visa decision received. Your counsellor will discuss next steps with you.',
    arrival_onboarding: 'Prepare for your move — housing, banking, insurance.',
    arrived_france: 'Welcome! Our team is here to help you settle in.',
    alumni: 'You are part of the Learn in France community.',
  },
}))

describe('PortalPage (student dashboard)', () => {
  beforeEach(() => {
    setMockAuth({ user: makeUser({ firstName: 'Omar', role: 'student' }) })
  })

  afterEach(() => {
    setMockAuth({})
  })

  it('renders greeting and stage progress with student-facing labels', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      stage: 'counsellor_consultation',
      progressPercent: 30,
      assignedCounsellorId: 'c-123',
      nextActions: ['Upload passport copy'],
      completedMilestones: [],
    })

    renderWithProviders(<PortalPage />)

    await waitFor(() => {
      expect(screen.getByText(/Omar/)).toBeInTheDocument()
    })

    // Student-facing stage label, not internal name
    expect(screen.getByText('In consultation')).toBeInTheDocument()

    // Next step description (appears in banner + stage card)
    expect(screen.getAllByText(/Work with your counsellor/).length).toBeGreaterThanOrEqual(1)

    // Pending actions
    expect(screen.getByText('Upload passport copy')).toBeInTheDocument()

    // Counsellor assigned state
    expect(screen.getByText('Counsellor assigned')).toBeInTheDocument()
  })

  it('shows awaiting counsellor when not assigned', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      stage: 'lead_created',
      progressPercent: 0,
      assignedCounsellorId: null,
      nextActions: [],
      completedMilestones: [],
    })

    renderWithProviders(<PortalPage />)

    await waitFor(() => {
      expect(screen.getByText(/Omar/)).toBeInTheDocument()
    })

    expect(screen.getByText('Getting started')).toBeInTheDocument()
    expect(screen.getByText('Awaiting counsellor')).toBeInTheDocument()
  })

  it('shows quick links to documents and bookings only', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      stage: 'lead_created',
      progressPercent: 0,
      assignedCounsellorId: null,
      nextActions: [],
      completedMilestones: [],
    })

    renderWithProviders(<PortalPage />)

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Open AI Advisor' })).toHaveAttribute('href', '/portal/chat')
    })

    // Only Documents and Bookings as quick links — not Applications or Checklist
    const quickLinks = screen
      .getAllByText(/Documents|Bookings/)
      .map((node) => node.closest('a'))
      .filter((node): node is HTMLAnchorElement => Boolean(node))

    const hrefs = quickLinks.map((link) => link.getAttribute('href'))
    expect(hrefs).toContain('/portal/documents')
    expect(hrefs).toContain('/portal/bookings')

    // These should NOT be in quick links anymore
    expect(screen.queryByRole('link', { name: /Applications/i })).toBeNull()
    expect(screen.queryByRole('link', { name: /Checklist/i })).toBeNull()
  })

  it('shows loading skeleton', () => {
    vi.mocked(api.get).mockReturnValueOnce(new Promise(() => {}))

    renderWithProviders(<PortalPage />)

    const skeleton = document.querySelector('.animate-pulse')
    expect(skeleton).toBeInTheDocument()
  })
})
