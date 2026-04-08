vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react')
  return {
    ...actual,
    use: (value: unknown) => {
      if (value && typeof (value as Promise<unknown>).then === 'function') {
        return { id: 'student-1' }
      }
      return actual.use(value as never)
    },
  }
})

import userEvent from '@testing-library/user-event'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders, setMockAuth, makeUser } from '../../../../../test/helpers'
import StudentDetailPage from './page'

const changeStageMutate = vi.fn()
const assignStudentMutate = vi.fn()
const recordOutcomeMutate = vi.fn()
const createReminderMutate = vi.fn()

const baseStudent = {
  id: 'student-1',
  userId: 'user-1',
  referenceCode: 'STU-001',
  firstName: 'Aisha',
  lastName: 'Khan',
  fullName: 'Aisha Khan',
  counsellorName: 'Sarah Counsellor',
  email: 'aisha@example.com',
  source: 'portal',
  sourcePartner: null,
  stage: 'counsellor_consultation',
  stageUpdatedAt: '2026-04-01T00:00:00.000Z',
  degreeLevel: 'bachelors',
  bachelorDegree: 'Computer Science',
  gpa: 3.7,
  graduationYear: 2024,
  workExperienceYears: 1,
  studyGapYears: 0,
  englishTestType: 'ielts',
  englishScore: 7.5,
  budgetMin: 10000,
  budgetMax: 18000,
  fundingRoute: 'self_funded',
  preferredCity: 'Paris',
  preferredIntake: 'fall_2026',
  housingNeeded: true,
  academicFitScore: 82,
  financialReadinessScore: 65,
  visaRisk: 'medium',
  overallReadinessScore: 74,
  lastAssessedAt: '2026-04-02T00:00:00.000Z',
  assignedCounsellorId: 'c-1',
  assignedAt: '2026-04-02T00:00:00.000Z',
  whatsappConsent: true,
  emailConsent: true,
  parentInvolvement: false,
  createdAt: '2026-03-20T00:00:00.000Z',
  updatedAt: '2026-04-04T00:00:00.000Z',
}

const useStudentMock = vi.fn()
const useStudentAssessmentsMock = vi.fn()
const useStudentTimelineMock = vi.fn()
const useStudentCaseLogMock = vi.fn()
const useStudentNotesMock = vi.fn()
const useChangeStudentStageMock = vi.fn()
const useCreateNoteMock = vi.fn()
const useStudentActivitiesMock = vi.fn()
const useCreateActivityMock = vi.fn()
const useStudentContactsMock = vi.fn()
const useCreateContactMock = vi.fn()
const useAssignStudentCounsellorMock = vi.fn()

const useStudentApplicationsMock = vi.fn()
const useStudentDocumentsMock = vi.fn()
const useStudentRequirementsMock = vi.fn()
const useVerifyDocumentMock = vi.fn()
const useRejectDocumentMock = vi.fn()

const useMeetingOutcomesMock = vi.fn()
const useRecordMeetingOutcomeMock = vi.fn()
const useCreateReminderMock = vi.fn()
const useCounsellorRemindersMock = vi.fn()

const useBookingsMock = vi.fn()

const useStudentCampaignsMock = vi.fn()
const useCampaignPacksMock = vi.fn()
const useStartCampaignMock = vi.fn()
const useSendStepMock = vi.fn()
const useSendAllMock = vi.fn()
const usePauseCampaignMock = vi.fn()
const useResumeCampaignMock = vi.fn()
const useUpdateCampaignModeMock = vi.fn()
const useCampaignHistoryMock = vi.fn()

const fetchTeamMembersMock = vi.fn()

vi.mock('@sturec/shared', () => ({
  STAGE_DISPLAY_NAMES: {
    lead_created: 'Getting started',
    counsellor_consultation: 'In consultation',
    documents_ready: 'Documents ready',
    applications_started: 'Applications started',
  },
  STAGE_ORDER: ['lead_created', 'counsellor_consultation', 'documents_ready', 'applications_started'],
}))

vi.mock('@/features/students/hooks/use-students', () => ({
  useStudent: (id: string) => useStudentMock(id),
  useStudentAssessments: (id: string) => useStudentAssessmentsMock(id),
  useStudentTimeline: (id: string) => useStudentTimelineMock(id),
  useStudentCaseLog: (id: string) => useStudentCaseLogMock(id),
  useStudentNotes: (id: string, page?: number) => useStudentNotesMock(id, page),
  useChangeStudentStage: (id: string) => useChangeStudentStageMock(id),
  useCreateNote: (id: string) => useCreateNoteMock(id),
  useStudentActivities: (id: string, page?: number) => useStudentActivitiesMock(id, page),
  useCreateActivity: (id: string) => useCreateActivityMock(id),
  useStudentContacts: (id: string) => useStudentContactsMock(id),
  useCreateContact: (id: string) => useCreateContactMock(id),
  useAssignStudentCounsellor: (id: string) => useAssignStudentCounsellorMock(id),
}))

vi.mock('@/features/applications/hooks/use-applications', () => ({
  useStudentApplications: (id: string) => useStudentApplicationsMock(id),
}))

vi.mock('@/features/documents/hooks/use-documents', () => ({
  useStudentDocuments: (id: string) => useStudentDocumentsMock(id),
  useStudentRequirements: (id: string) => useStudentRequirementsMock(id),
  useVerifyDocument: (id: string) => useVerifyDocumentMock(id),
  useRejectDocument: (id: string) => useRejectDocumentMock(id),
}))

vi.mock('@/features/counsellor/hooks/use-counsellor', () => ({
  useMeetingOutcomes: (id: string) => useMeetingOutcomesMock(id),
  useRecordMeetingOutcome: () => useRecordMeetingOutcomeMock(),
  useCreateReminder: () => useCreateReminderMock(),
  useCounsellorReminders: () => useCounsellorRemindersMock(),
}))

vi.mock('@/features/bookings/hooks/use-bookings', () => ({
  useBookings: () => useBookingsMock(),
}))

vi.mock('@/features/campaigns/hooks/use-campaigns', () => ({
  useStudentCampaigns: (id: string) => useStudentCampaignsMock(id),
  useCampaignPacks: () => useCampaignPacksMock(),
  useStartCampaign: () => useStartCampaignMock(),
  useSendStep: () => useSendStepMock(),
  useSendAll: () => useSendAllMock(),
  usePauseCampaign: () => usePauseCampaignMock(),
  useResumeCampaign: () => useResumeCampaignMock(),
  useUpdateCampaignMode: () => useUpdateCampaignModeMock(),
  useCampaignHistory: (id: string) => useCampaignHistoryMock(id),
}))

vi.mock('@/features/team/lib/team-cache', () => ({
  fetchTeamMembers: () => fetchTeamMembersMock(),
}))

function setupDefaultMocks() {
  useStudentMock.mockReturnValue({
    data: baseStudent,
    isLoading: false,
    error: null,
  })
  useStudentAssessmentsMock.mockReturnValue({
    data: [{
      id: 'assessment-1',
      sourceType: 'chat',
      academicFitScore: 82,
      financialReadinessScore: 65,
      languageReadinessScore: 78,
      motivationClarityScore: 85,
      timelineUrgencyScore: 60,
      documentReadinessScore: 55,
      visaComplexityScore: 40,
      visaRisk: 'medium',
      overallReadinessScore: 74,
      qualificationScore: 76,
      priorityLevel: 'p1',
      recommendedDisposition: 'book_consultation',
      summaryForTeam: 'Indian student with strong CS background and active momentum.',
      profileCompleteness: 0.71,
      leadHeat: 'warm',
      createdAt: '2026-04-04T00:00:00.000Z',
    }],
    isLoading: false,
  })
  useStudentTimelineMock.mockReturnValue({
    data: [{
      id: 'timeline-1',
      fromStage: 'lead_created',
      toStage: 'counsellor_consultation',
      changedByType: 'user',
      changedByUserId: 'c-1',
      reasonCode: 'manual_review',
      reasonNote: 'Initial consultation completed',
      createdAt: '2026-04-01T00:00:00.000Z',
    }],
    isLoading: false,
  })
  useStudentCaseLogMock.mockReturnValue({
    data: [{
      id: 'case-1',
      kind: 'meeting_outcome',
      title: 'Consultation completed',
      summary: 'Student is ready for document collection.',
      detail: 'Asked for transcripts and passport copy next.',
      status: 'done',
      actorName: 'Sarah Counsellor',
      dueAt: '2026-04-10T00:00:00.000Z',
      createdAt: '2026-04-04T00:00:00.000Z',
    }],
    isLoading: false,
  })
  useStudentNotesMock.mockReturnValue({
    data: { items: [], total: 0, page: 1, limit: 20 },
    isLoading: false,
  })
  useChangeStudentStageMock.mockReturnValue({
    mutate: changeStageMutate,
    isPending: false,
  })
  useCreateNoteMock.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  })
  useStudentActivitiesMock.mockReturnValue({
    data: { items: [], total: 0, page: 1, limit: 20 },
    isLoading: false,
  })
  useCreateActivityMock.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  })
  useStudentContactsMock.mockReturnValue({
    data: [],
    isLoading: false,
  })
  useCreateContactMock.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  })
  useAssignStudentCounsellorMock.mockReturnValue({
    mutate: assignStudentMutate,
    isPending: false,
  })
  useStudentApplicationsMock.mockReturnValue({
    data: [],
    isLoading: false,
  })
  useStudentDocumentsMock.mockReturnValue({
    data: { items: [], total: 0, page: 1, limit: 20 },
    isLoading: false,
  })
  useStudentRequirementsMock.mockReturnValue({
    data: { items: [{ id: 'req-1', documentType: 'transcript', requirementSource: 'admission', required: true, status: 'requested', notes: null, dueDate: null }], total: 1, page: 1, limit: 20 },
    isLoading: false,
  })
  useVerifyDocumentMock.mockReturnValue({ mutate: vi.fn(), isPending: false })
  useRejectDocumentMock.mockReturnValue({ mutate: vi.fn(), isPending: false })
  useMeetingOutcomesMock.mockReturnValue({
    data: [{
      id: 'outcome-1',
      bookingId: 'booking-1',
      outcome: 'needs_follow_up',
      nextAction: 'Review transcript and follow up on missing marksheets',
      followUpDueAt: '2026-04-10T00:00:00.000Z',
      privateNote: 'Good fit but needs transcript clarity.',
      stageAfter: 'documents_ready',
      createdAt: '2026-04-04T00:00:00.000Z',
    }],
    isLoading: false,
  })
  useRecordMeetingOutcomeMock.mockReturnValue({
    mutate: recordOutcomeMutate,
    isPending: false,
  })
  useCreateReminderMock.mockReturnValue({
    mutate: createReminderMutate,
    isPending: false,
  })
  useCounsellorRemindersMock.mockReturnValue({
    data: [{
      id: 'reminder-1',
      title: 'Follow up on transcript upload',
      dueAt: '2026-04-03T00:00:00.000Z',
      status: 'pending',
      source: 'manual',
      student: { id: 'student-1', userId: 'user-1' },
    }],
  })
  useBookingsMock.mockReturnValue({
    data: [{
      id: 'booking-1',
      studentId: 'student-1',
      leadId: null,
      counsellorId: 'c-1',
      counsellorName: 'Sarah Counsellor',
      scheduledAt: '2026-04-04T10:00:00.000Z',
      status: 'completed',
      notes: 'Initial consultation',
      createdAt: '2026-04-01T00:00:00.000Z',
    }],
  })
  useStudentCampaignsMock.mockReturnValue({
    data: [{
      id: 'campaign-1',
      phaseKey: 'consultation',
      mode: 'manual',
      status: 'active',
      pack: { id: 'pack-1', name: 'Consultation follow-up' },
      steps: [],
    }],
    isLoading: false,
  })
  useCampaignPacksMock.mockReturnValue({
    data: [{
      id: 'pack-1',
      name: 'Consultation follow-up',
      phaseKey: 'consultation',
      steps: [{ id: 'step-template-1' }],
    }],
  })
  useStartCampaignMock.mockReturnValue({ mutate: vi.fn(), isPending: false })
  useSendStepMock.mockReturnValue({ mutate: vi.fn(), isPending: false })
  useSendAllMock.mockReturnValue({ mutate: vi.fn(), isPending: false })
  usePauseCampaignMock.mockReturnValue({ mutate: vi.fn(), isPending: false })
  useResumeCampaignMock.mockReturnValue({ mutate: vi.fn(), isPending: false })
  useUpdateCampaignModeMock.mockReturnValue({ mutate: vi.fn(), isPending: false })
  useCampaignHistoryMock.mockReturnValue({ data: [] })
  fetchTeamMembersMock.mockResolvedValue([
    { id: 'c-1', email: 'sarah@example.com', role: 'counsellor', firstName: 'Sarah', lastName: 'Counsellor', phone: null, status: 'active', createdAt: '2026-01-01T00:00:00.000Z' },
    { id: 'c-2', email: 'omar@example.com', role: 'counsellor', firstName: 'Omar', lastName: 'Advisor', phone: null, status: 'active', createdAt: '2026-01-01T00:00:00.000Z' },
  ])
}

describe('StudentDetailPage', () => {
  beforeEach(() => {
    setupDefaultMocks()
  })

  afterEach(() => {
    setMockAuth({})
    vi.clearAllMocks()
  })

  it('renders the simplified case-desk summary and tabs for counsellors', async () => {
    setMockAuth({ user: makeUser({ role: 'counsellor', firstName: 'Sarah' }) })

    renderWithProviders(<StudentDetailPage params={Promise.resolve({ id: 'student-1' })} />)

    await waitFor(() => {
      expect(screen.getByText('Operational Summary')).toBeInTheDocument()
    })

    expect(screen.getByText('Quick Actions')).toBeInTheDocument()
    expect(screen.getByText('What should happen next?')).toBeInTheDocument()
    expect(screen.getByText('Follow up on transcript upload')).toBeInTheDocument()
    expect(screen.getByText('Working signals')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Work' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'History' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Profile' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /assign counsellor|reassign counsellor/i })).toBeNull()
  })

  it('opens write actions in right-side drawers, not by switching tabs', async () => {
    setMockAuth({ user: makeUser({ role: 'counsellor', firstName: 'Sarah' }) })
    const user = userEvent.setup()

    renderWithProviders(<StudentDetailPage params={Promise.resolve({ id: 'student-1' })} />)

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Record Outcome' }).length).toBeGreaterThan(0)
    })

    // No drawer initially
    expect(screen.queryByRole('dialog')).toBeNull()

    // Record Outcome opens the outcome drawer with the form footer button
    await user.click(screen.getAllByRole('button', { name: 'Record Outcome' })[0])
    let dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Record Outcome' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save outcome' })).toBeInTheDocument()

    // Switching to Add Reminder closes the outcome drawer and opens the reminder one
    await user.click(screen.getAllByRole('button', { name: 'Add Reminder' })[0])
    dialog = screen.getByRole('dialog')
    expect(screen.getByRole('heading', { name: 'Add Reminder' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create reminder' })).toBeInTheDocument()
    // Outcome footer button is gone — only one drawer at a time
    expect(screen.queryByRole('button', { name: 'Save outcome' })).toBeNull()

    // Add Note opens the note drawer and closes the reminder one
    await user.click(screen.getAllByRole('button', { name: 'Add Note' })[0])
    expect(screen.getByRole('heading', { name: 'Add Note' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add note' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Create reminder' })).toBeNull()

    // Change Stage opens the stage drawer
    await user.click(screen.getAllByRole('button', { name: 'Change Stage' })[0])
    expect(screen.getByRole('heading', { name: 'Change Stage' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save stage change' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add note' })).toBeNull()

    // Closing the drawer leaves the read-only Work tab still visible underneath
    await user.click(screen.getByRole('button', { name: 'Close drawer' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByText('Meeting Outcomes')).toBeInTheDocument()

    // Manage Campaigns opens the campaign drawer with start + active sections
    await user.click(screen.getAllByRole('button', { name: 'Manage Campaigns' })[0])
    expect(screen.getByRole('heading', { name: 'Manage Campaigns' })).toBeInTheDocument()
    expect(screen.getByText('Start a new pack')).toBeInTheDocument()
    expect(screen.getByText('Active campaigns')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start pack' })).toBeInTheDocument()
  })

  it('shows admin reassignment controls and opens the drawer', async () => {
    setMockAuth({ user: makeUser({ role: 'admin', firstName: 'Jane' }) })
    const user = userEvent.setup()

    renderWithProviders(<StudentDetailPage params={Promise.resolve({ id: 'student-1' })} />)

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Reassign Counsellor' }).length).toBeGreaterThan(0)
    })

    await user.click(screen.getAllByRole('button', { name: 'Reassign Counsellor' })[0])

    // Reassign now opens as a right-side drawer, same surface as every other write action
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
    expect(screen.getByRole('heading', { name: 'Reassign Counsellor' })).toBeInTheDocument()
    expect(screen.getByLabelText('Counsellor')).toBeInTheDocument()
    expect(screen.getByLabelText('Handoff note')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save reassignment' })).toBeInTheDocument()
  })

  it('does not crash on legacy campaign and activity records with missing nested relations', async () => {
    setMockAuth({ user: makeUser({ role: 'counsellor', firstName: 'Sarah' }) })
    const user = userEvent.setup()
    useStudentActivitiesMock.mockReturnValue({
      data: {
        items: [{
          id: 'activity-1',
          activityType: 'call',
          channel: 'phone',
          direction: 'outbound',
          outcome: 'Reached voicemail',
          summary: 'Tried to confirm next document step.',
          createdAt: '2026-04-04T00:00:00.000Z',
          createdBy: null,
        }],
        total: 1,
        page: 1,
        limit: 20,
      },
      isLoading: false,
    })
    useStudentCampaignsMock.mockReturnValue({
      data: [{
        id: 'campaign-legacy',
        phaseKey: 'consultation',
        mode: 'manual',
        status: 'active',
        pack: null,
        steps: null,
      }],
      isLoading: false,
    })

    renderWithProviders(<StudentDetailPage params={Promise.resolve({ id: 'student-1' })} />)

    await waitFor(() => {
      expect(screen.getByText('Operational Summary')).toBeInTheDocument()
    })

    expect(screen.getByText('Campaign pack unavailable (manual)')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'History' }))
    expect(screen.getByText('Tried to confirm next document step.')).toBeInTheDocument()
  })
})
