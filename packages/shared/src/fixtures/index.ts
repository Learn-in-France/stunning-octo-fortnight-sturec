import type {
  AuthUserResponse,
  LeadListItem,
  LeadDetail,
  LeadQualificationBlock,
  StudentListItem,
  StudentDetail,
  StudentOwnProfile,
  StudentProgress,
  AiAssessmentSummary,
  ApplicationListItem,
  DocumentListItem,
  DocumentRequirementItem,
  TeamMemberItem,
  ActivityLogItem,
  TimelineItem,
  NoteItem,
  ContactItem,
  ConsentEventItem,
  BookingListItem,
  ChatSessionItem,
  ChatMessageItem,
  ChatMessageResponse,
  NotificationItem,
  UniversityItem,
  ProgramItem,
  ProgramIntakeItem,
  AssignmentHistoryItem,
  AnalyticsOverview,
  PipelineMetrics,
  CounsellorAnalyticsItem,
  CounsellorAnalyticsDetail,
  StudentAnalyticsItem,
  StudentAnalyticsDetail,
} from '../types/responses'

// ─── Auth Fixtures ─────────────────────────────────────────────

export const FIXTURE_ADMIN_USER: AuthUserResponse = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'admin@sturec.com',
  emailVerified: true,
  role: 'admin',
  firstName: 'Admin',
  lastName: 'User',
  phone: null,
  avatarUrl: null,
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

export const FIXTURE_COUNSELLOR_USER: AuthUserResponse = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  email: 'sarah@sturec.com',
  emailVerified: true,
  role: 'counsellor',
  firstName: 'Sarah',
  lastName: 'Counsellor',
  phone: '+33612345678',
  avatarUrl: null,
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

export const FIXTURE_STUDENT_USER: AuthUserResponse = {
  id: '550e8400-e29b-41d4-a716-446655440002',
  email: 'priya.sharma@gmail.com',
  emailVerified: true,
  role: 'student',
  firstName: 'Priya',
  lastName: 'Sharma',
  phone: '+919876543210',
  avatarUrl: null,
  status: 'active',
  createdAt: '2026-02-15T10:30:00.000Z',
  updatedAt: '2026-03-01T14:22:00.000Z',
}

// ─── Lead Fixtures ─────────────────────────────────────────────

export const FIXTURE_LEAD_QUALIFICATION: LeadQualificationBlock = {
  qualificationScore: 82,
  priorityLevel: 'p1',
  profileCompleteness: 0.85,
  recommendedDisposition: 'assign_priority_queue',
  componentScores: {
    academicFitScore: 8,
    financialReadinessScore: 7,
    languageReadinessScore: 9,
    motivationClarityScore: 7,
    timelineUrgencyScore: 8,
    documentReadinessScore: 6,
    visaComplexityScore: 4,
  },
  summaryForTeam: 'Strong academic profile, good English scores, clear motivation. Financial proof pending. Recommend immediate counsellor assignment.',
}

export const FIXTURE_LEAD_LIST_ITEM: LeadListItem = {
  id: '660e8400-e29b-41d4-a716-446655440010',
  email: 'priya.sharma@gmail.com',
  phone: '+919876543210',
  firstName: 'Priya',
  lastName: 'Sharma',
  source: 'marketing',
  sourcePartner: null,
  status: 'qualified',
  qualificationScore: 82,
  priorityLevel: 'p1',
  profileCompleteness: 0.85,
  isPartnerHotLead: false,
  needsIntakeCompletion: false,
  assignedCounsellorId: '550e8400-e29b-41d4-a716-446655440001',
  createdAt: '2026-02-15T10:30:00.000Z',
  updatedAt: '2026-03-01T14:22:00.000Z',
}

export const FIXTURE_LEAD_DETAIL: LeadDetail = {
  ...FIXTURE_LEAD_LIST_ITEM,
  userId: '550e8400-e29b-41d4-a716-446655440002',
  notes: 'Interested in Data Science MSc. Has IELTS 7.5.',
  mauticContactId: 1234,
  convertedStudentId: null,
  qualifiedAt: '2026-02-20T08:00:00.000Z',
  priorityUpdatedAt: '2026-02-20T08:00:00.000Z',
  createdByUserId: null,
  qualification: FIXTURE_LEAD_QUALIFICATION,
}

export const FIXTURE_IMPORTED_LEAD: LeadListItem = {
  id: '660e8400-e29b-41d4-a716-446655440011',
  email: 'rahul.verma@university.edu',
  phone: '+919812345678',
  firstName: 'Rahul',
  lastName: 'Verma',
  source: 'university',
  sourcePartner: 'IIT Delhi',
  status: 'new',
  qualificationScore: 68,
  priorityLevel: 'p2',
  profileCompleteness: 0.60,
  isPartnerHotLead: true,
  needsIntakeCompletion: true,
  assignedCounsellorId: null,
  createdAt: '2026-03-01T09:00:00.000Z',
  updatedAt: '2026-03-01T09:00:00.000Z',
}

// ─── Student Fixtures ──────────────────────────────────────────

export const FIXTURE_STUDENT_LIST_ITEM: StudentListItem = {
  id: '770e8400-e29b-41d4-a716-446655440020',
  userId: '550e8400-e29b-41d4-a716-446655440002',
  referenceCode: 'STU-2026-00001',
  source: 'marketing',
  stage: 'counsellor_consultation',
  stageUpdatedAt: '2026-03-05T11:00:00.000Z',
  firstName: 'Priya',
  lastName: 'Sharma',
  email: 'priya.sharma@gmail.com',
  assignedCounsellorId: '550e8400-e29b-41d4-a716-446655440001',
  overallReadinessScore: 7,
  visaRisk: 'low',
  createdAt: '2026-02-20T08:00:00.000Z',
}

export const FIXTURE_STUDENT_DETAIL: StudentDetail = {
  id: '770e8400-e29b-41d4-a716-446655440020',
  userId: '550e8400-e29b-41d4-a716-446655440002',
  referenceCode: 'STU-2026-00001',
  firstName: 'Priya',
  lastName: 'Sharma',
  email: 'priya@test.com',
  source: 'marketing',
  sourcePartner: null,
  stage: 'counsellor_consultation',
  stageUpdatedAt: '2026-03-05T11:00:00.000Z',
  degreeLevel: 'Bachelors',
  bachelorDegree: 'B.Tech Computer Science',
  gpa: 3.5,
  graduationYear: 2025,
  workExperienceYears: 1,
  studyGapYears: 0,
  englishTestType: 'ielts',
  englishScore: 7.5,
  budgetMin: 8000,
  budgetMax: 15000,
  fundingRoute: 'self_funded',
  preferredCity: 'Paris',
  preferredIntake: 'September 2026',
  housingNeeded: true,
  academicFitScore: 8,
  financialReadinessScore: 7,
  visaRisk: 'low',
  overallReadinessScore: 7,
  lastAssessedAt: '2026-03-01T14:22:00.000Z',
  assignedCounsellorId: '550e8400-e29b-41d4-a716-446655440001',
  assignedAt: '2026-02-22T10:00:00.000Z',
  whatsappConsent: true,
  emailConsent: true,
  parentInvolvement: false,
  createdAt: '2026-02-20T08:00:00.000Z',
  updatedAt: '2026-03-05T11:00:00.000Z',
}

export const FIXTURE_STUDENT_OWN_PROFILE: StudentOwnProfile = {
  id: '770e8400-e29b-41d4-a716-446655440020',
  referenceCode: 'STU-2026-00001',
  stage: 'counsellor_consultation',
  stageUpdatedAt: '2026-03-05T11:00:00.000Z',
  firstName: 'Aisha',
  lastName: 'Khan',
  email: 'aisha@example.com',
  phone: '+919876543210',
  degreeLevel: 'Bachelors',
  bachelorDegree: 'B.Tech Computer Science',
  gpa: 3.5,
  graduationYear: 2025,
  englishTestType: 'ielts',
  englishScore: 7.5,
  budgetMin: 8000,
  budgetMax: 15000,
  fundingRoute: 'self_funded',
  preferredCity: 'Paris',
  preferredIntake: 'September 2026',
  housingNeeded: true,
  whatsappConsent: true,
  emailConsent: true,
  parentInvolvement: false,
  onboardingCompletedAt: '2026-02-20T08:00:00.000Z',
  createdAt: '2026-02-20T08:00:00.000Z',
  updatedAt: '2026-03-05T11:00:00.000Z',
}

export const FIXTURE_STUDENT_PROGRESS: StudentProgress = {
  stage: 'counsellor_consultation',
  progressPercent: 31,
  assignedCounsellorId: '550e8400-e29b-41d4-a716-446655440001',
  bookingReady: true,
  intakeCapture: { captured: 5, total: 7, missing: ['budget awareness', 'source tracking'] },
  completedMilestones: [
    'Account created',
    'AI intake completed',
    'Profile qualified',
    'Counsellor assigned',
  ],
  nextActions: [
    'Complete counsellor consultation call',
    'Upload financial proof',
    'Upload transcript',
  ],
  documentChecklist: { completed: 2, total: 6 },
  applications: { total: 0, offers: 0 },
  visa: { status: null },
}

// ─── AI Assessment Fixture ─────────────────────────────────────

export const FIXTURE_AI_ASSESSMENT: AiAssessmentSummary = {
  id: '880e8400-e29b-41d4-a716-446655440030',
  sourceType: 'chat',
  academicFitScore: 8,
  financialReadinessScore: 7,
  languageReadinessScore: 9,
  motivationClarityScore: 7,
  timelineUrgencyScore: 8,
  documentReadinessScore: 6,
  visaComplexityScore: 4,
  visaRisk: 'low',
  overallReadinessScore: 7,
  qualificationScore: 82,
  priorityLevel: 'p1',
  recommendedDisposition: 'assign_priority_queue',
  summaryForTeam: 'Strong academic profile, good English scores, clear motivation. Financial proof pending. Recommend immediate counsellor assignment.',
  profileCompleteness: 0.85,
  leadHeat: 'hot',
  createdAt: '2026-03-01T14:22:00.000Z',
}

// ─── Application Fixture ───────────────────────────────────────

export const FIXTURE_APPLICATION: ApplicationListItem = {
  id: '990e8400-e29b-41d4-a716-446655440040',
  studentId: '770e8400-e29b-41d4-a716-446655440020',
  programId: '00000000-0000-0000-0000-000000000010',
  programName: 'MSc Data Science',
  universityName: 'Université Paris-Saclay',
  intakeId: '00000000-0000-0000-0000-0000000000a1',
  intakeName: 'September 2026',
  status: 'submitted',
  submittedAt: '2026-03-10T09:00:00.000Z',
  decisionAt: null,
  createdAt: '2026-03-08T14:00:00.000Z',
}

// ─── Document Fixtures ─────────────────────────────────────────

export const FIXTURE_DOCUMENTS: DocumentListItem[] = [
  {
    id: 'aa0e8400-e29b-41d4-a716-446655440050',
    type: 'passport',
    filename: 'passport_scan.pdf',
    status: 'verified',
    isCurrent: true,
    sharedAt: null,
    sharedWithCounsellorId: null,
    revokedAt: null,
    createdAt: '2026-02-25T10:00:00.000Z',
  },
  {
    id: 'aa0e8400-e29b-41d4-a716-446655440051',
    type: 'transcript',
    filename: 'btech_transcript.pdf',
    status: 'pending',
    isCurrent: true,
    sharedAt: null,
    sharedWithCounsellorId: null,
    revokedAt: null,
    createdAt: '2026-03-02T15:30:00.000Z',
  },
]

export const FIXTURE_DOCUMENT_REQUIREMENTS: DocumentRequirementItem[] = [
  {
    id: 'bb0e8400-e29b-41d4-a716-446655440060',
    documentType: 'passport',
    requirementSource: 'visa',
    required: true,
    status: 'verified',
    notes: null,
    dueDate: null,
  },
  {
    id: 'bb0e8400-e29b-41d4-a716-446655440061',
    documentType: 'transcript',
    requirementSource: 'admission',
    required: true,
    status: 'uploaded',
    notes: null,
    dueDate: '2026-04-15',
  },
  {
    id: 'bb0e8400-e29b-41d4-a716-446655440062',
    documentType: 'financial_proof',
    requirementSource: 'visa',
    required: true,
    status: 'missing',
    notes: 'Bank statements for last 6 months',
    dueDate: '2026-05-01',
  },
  {
    id: 'bb0e8400-e29b-41d4-a716-446655440063',
    documentType: 'sop',
    requirementSource: 'admission',
    required: true,
    status: 'missing',
    notes: null,
    dueDate: '2026-04-15',
  },
  {
    id: 'bb0e8400-e29b-41d4-a716-446655440064',
    documentType: 'accommodation',
    requirementSource: 'housing',
    required: false,
    status: 'missing',
    notes: null,
    dueDate: null,
  },
  {
    id: 'bb0e8400-e29b-41d4-a716-446655440065',
    documentType: 'offer_letter',
    requirementSource: 'visa',
    required: true,
    status: 'missing',
    notes: null,
    dueDate: null,
  },
]

// ─── Team Fixtures ────────────────────────────────────────────

export const FIXTURE_TEAM_MEMBER: TeamMemberItem = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  email: 'sarah@sturec.com',
  role: 'counsellor',
  firstName: 'Sarah',
  lastName: 'Counsellor',
  phone: '+33612345678',
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
}

// ─── Activity Log Fixtures ────────────────────────────────────

export const FIXTURE_ACTIVITY_LOG: ActivityLogItem = {
  id: 'cc0e8400-e29b-41d4-a716-446655440070',
  activityType: 'call',
  channel: 'phone',
  direction: 'outbound',
  outcome: 'connected',
  summary: 'Discussed missing financial proof and agreed next follow-up on Friday',
  nextActionDueAt: '2026-03-20T10:00:00.000Z',
  durationMinutes: 18,
  createdAt: '2026-03-17T09:30:00.000Z',
  createdBy: { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Sarah Counsellor' },
}

// ─── Timeline Fixtures ────────────────────────────────────────

export const FIXTURE_TIMELINE_ITEM: TimelineItem = {
  id: 'dd0e8400-e29b-41d4-a716-446655440080',
  fromStage: 'qualified',
  toStage: 'counsellor_consultation',
  changedByType: 'user',
  changedByUserId: '550e8400-e29b-41d4-a716-446655440001',
  reasonCode: 'counsellor_assigned',
  reasonNote: 'Assigned to Sarah for initial consultation',
  createdAt: '2026-03-05T11:00:00.000Z',
}

// ─── Note Fixtures ────────────────────────────────────────────

export const FIXTURE_NOTE: NoteItem = {
  id: 'ee0e8400-e29b-41d4-a716-446655440090',
  noteType: 'general',
  content: 'Student is well-prepared, has clear motivation for Data Science MSc.',
  createdByUserId: '550e8400-e29b-41d4-a716-446655440001',
  createdByName: 'Sarah Counsellor',
  createdAt: '2026-03-06T14:00:00.000Z',
}

// ─── Contact Fixtures ─────────────────────────────────────────

export const FIXTURE_CONTACT: ContactItem = {
  id: 'ff0e8400-e29b-41d4-a716-446655440100',
  contactType: 'parent',
  name: 'Raj Sharma',
  relation: 'Father',
  phone: '+919876543211',
  email: 'raj.sharma@gmail.com',
  isPrimary: true,
  createdAt: '2026-02-25T10:00:00.000Z',
}

// ─── Consent Event Fixtures ───────────────────────────────────

export const FIXTURE_CONSENT_EVENT: ConsentEventItem = {
  id: '110e8400-e29b-41d4-a716-446655440110',
  consentType: 'whatsapp',
  granted: true,
  source: 'form',
  recordedByUserId: null,
  createdAt: '2026-02-15T10:30:00.000Z',
}

// ─── Booking Fixtures ─────────────────────────────────────────

export const FIXTURE_BOOKING: BookingListItem = {
  id: '220e8400-e29b-41d4-a716-446655440120',
  studentId: '770e8400-e29b-41d4-a716-446655440020',
  leadId: null,
  counsellorId: '550e8400-e29b-41d4-a716-446655440001',
  scheduledAt: '2026-03-22T14:00:00.000Z',
  status: 'scheduled',
  notes: 'Initial consultation call',
  createdAt: '2026-03-17T09:00:00.000Z',
}

// ─── Chat Fixtures ────────────────────────────────────────────

export const FIXTURE_CHAT_SESSION: ChatSessionItem = {
  id: '330e8400-e29b-41d4-a716-446655440130',
  status: 'completed',
  createdAt: '2026-03-01T14:00:00.000Z',
  endedAt: '2026-03-01T14:22:00.000Z',
}

export const FIXTURE_CHAT_MESSAGE: ChatMessageItem = {
  id: '440e8400-e29b-41d4-a716-446655440140',
  role: 'assistant',
  content: 'Welcome! I\'m your France study advisor. Tell me about your academic background.',
  timestamp: '2026-03-01T14:00:30.000Z',
}

export const FIXTURE_CHAT_MESSAGE_RESPONSE: ChatMessageResponse = {
  message: {
    id: '440e8400-e29b-41d4-a716-446655440141',
    role: 'assistant',
    content: 'That\'s a great foundation! A 7.5 GPA opens up several MSc options in France.',
    timestamp: '2026-03-01T14:01:15.000Z',
  },
  options: ['Understand timelines', 'Talk about budget', 'Prepare for a counsellor call', 'Speak with an advisor'],
  shouldSuggestBooking: true,
}

// ─── Notification Fixtures ────────────────────────────────────

export const FIXTURE_NOTIFICATION: NotificationItem = {
  id: '550e8400-e29b-41d4-a716-446655440150',
  channel: 'email',
  status: 'delivered',
  subject: 'welcome_email',
  sentAt: '2026-02-15T10:31:00.000Z',
  createdAt: '2026-02-15T10:30:00.000Z',
}

// ─── Catalog Fixtures ─────────────────────────────────────────

export const FIXTURE_UNIVERSITY: UniversityItem = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Université Paris-Saclay',
  city: 'Paris',
  country: 'France',
  websiteUrl: 'https://www.universite-paris-saclay.fr',
  partnerStatus: 'active',
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
}

export const FIXTURE_PROGRAM: ProgramItem = {
  id: '00000000-0000-0000-0000-000000000010',
  universityId: '00000000-0000-0000-0000-000000000001',
  universityName: 'Université Paris-Saclay',
  name: 'MSc Data Science',
  degreeLevel: 'Masters',
  fieldOfStudy: 'Data Science',
  language: 'English',
  durationMonths: 24,
  tuitionAmount: 12000,
  tuitionCurrency: 'EUR',
  minimumGpa: 3.0,
  englishRequirementType: 'ielts',
  englishMinimumScore: 6.5,
  description: 'A comprehensive data science program covering ML, statistics, and big data.',
  active: true,
}

export const FIXTURE_PROGRAM_INTAKE: ProgramIntakeItem = {
  id: '00000000-0000-0000-0000-0000000000a1',
  programId: '00000000-0000-0000-0000-000000000010',
  intakeName: 'September 2026',
  startMonth: 9,
  startYear: 2026,
  applicationDeadline: '2026-05-15',
  active: true,
}

// ─── Assignment History Fixtures ──────────────────────────────

export const FIXTURE_ASSIGNMENT: AssignmentHistoryItem = {
  id: '660e8400-e29b-41d4-a716-446655440160',
  counsellorId: '550e8400-e29b-41d4-a716-446655440001',
  counsellorName: 'Sarah Counsellor',
  assignedAt: '2026-02-22T10:00:00.000Z',
  unassignedAt: null,
}

// ─── Analytics Fixtures ──────────────────────────────────────

export const FIXTURE_ANALYTICS_OVERVIEW: AnalyticsOverview = {
  period: { from: '2026-01-01', to: '2026-03-17' },
  data: {
    leads: { total: 120, new: 45, qualified: 30, converted: 20, disqualified: 10 },
    students: { total: 65, active: 50, byStage: { counsellor_consultation: 15, application_started: 12, visa_file_readiness: 8 } },
    applications: { total: 40, submitted: 25, offers: 10, enrolled: 5 },
    documents: { pending: 18, verified: 35, rejected: 3 },
    bookings: { scheduled: 12, completed: 28 },
  },
}

export const FIXTURE_PIPELINE_METRICS: PipelineMetrics = {
  period: { from: '2026-01-01', to: '2026-03-17' },
  data: {
    funnel: [
      { stage: 'lead_created', count: 45 },
      { stage: 'intake_completed', count: 38 },
      { stage: 'qualified', count: 30 },
      { stage: 'counsellor_consultation', count: 15 },
      { stage: 'application_started', count: 12 },
      { stage: 'offer_confirmed', count: 8 },
      { stage: 'campus_france_readiness', count: 5 },
      { stage: 'visa_file_readiness', count: 3 },
      { stage: 'visa_submitted', count: 2 },
      { stage: 'visa_decision', count: 1 },
      { stage: 'arrival_onboarding', count: 0 },
      { stage: 'arrived_france', count: 0 },
      { stage: 'alumni', count: 0 },
    ],
    conversionRate: 0.02,
    averageDaysInStage: { counsellor_consultation: 8, application_started: 14 },
  },
}

export const FIXTURE_COUNSELLOR_ANALYTICS_ITEM: CounsellorAnalyticsItem = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  name: 'Sarah Counsellor',
  email: 'sarah@sturec.com',
  assignedLeads: 8,
  assignedStudents: 12,
  activityCount: 45,
  conversionRate: 0.71,
  overdueActions: 2,
}

export const FIXTURE_COUNSELLOR_ANALYTICS_DETAIL: CounsellorAnalyticsDetail = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  name: 'Sarah Counsellor',
  email: 'sarah@sturec.com',
  period: { from: '2026-01-01', to: '2026-03-17' },
  caseload: { leads: 8, students: 12 },
  activityByType: { call: 20, meeting: 10, note: 15 },
  activityByChannel: { phone: 15, email: 10, whatsapp: 12, video: 8 },
  recentActivities: [
    {
      id: 'cc0e8400-e29b-41d4-a716-446655440070',
      activityType: 'call',
      channel: 'phone',
      summary: 'Discussed missing financial proof',
      createdAt: '2026-03-17T09:30:00.000Z',
    },
  ],
  studentStages: { counsellor_consultation: 5, application_started: 4, visa_file_readiness: 3 },
}

export const FIXTURE_STUDENT_ANALYTICS_ITEM: StudentAnalyticsItem = {
  id: '770e8400-e29b-41d4-a716-446655440020',
  referenceCode: 'STU-2026-00001',
  firstName: 'Priya',
  lastName: 'Sharma',
  stage: 'counsellor_consultation',
  daysInStage: 12,
  documentProgress: { completed: 2, total: 6 },
  applicationCount: 1,
  lastCounsellorTouchpoint: '2026-03-17T09:30:00.000Z',
}

export const FIXTURE_STUDENT_ANALYTICS_DETAIL: StudentAnalyticsDetail = {
  id: '770e8400-e29b-41d4-a716-446655440020',
  referenceCode: 'STU-2026-00001',
  firstName: 'Priya',
  lastName: 'Sharma',
  stage: 'counsellor_consultation',
  daysInStage: 12,
  period: { from: '2026-01-01', to: '2026-03-17' },
  documentProgress: { completed: 2, total: 6 },
  applications: { total: 1, offers: 0, enrolled: 0 },
  stageHistory: [
    { stage: 'lead_created', enteredAt: '2026-02-15T10:30:00.000Z', daysInStage: 5 },
    { stage: 'intake_completed', enteredAt: '2026-02-20T08:00:00.000Z', daysInStage: 3 },
    { stage: 'qualified', enteredAt: '2026-02-23T08:00:00.000Z', daysInStage: 10 },
    { stage: 'counsellor_consultation', enteredAt: '2026-03-05T11:00:00.000Z', daysInStage: 12 },
  ],
  lastCounsellorTouchpoint: '2026-03-17T09:30:00.000Z',
}
