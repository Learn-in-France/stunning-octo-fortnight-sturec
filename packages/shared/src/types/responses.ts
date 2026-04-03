import type { LeadSource, LeadStatus, PriorityLevel } from './lead'
import type { StudentStage, VisaRisk, EnglishTestType, ConsentType } from './student'
import type { ApplicationStatus } from './application'
import type { DocumentType, DocumentStatus, RequirementStatus, RequirementSource } from './document'
import type { UserRole, UserStatus } from './user'
import type { ActivityType, ActivityChannel, ActivityDirection } from './activity'
import type { ChatSessionStatus, MessageRole } from './chat'

// ─── Auth Responses ────────────────────────────────────────────

export interface AuthUserResponse {
  id: string
  email: string
  role: UserRole
  firstName: string
  lastName: string
  phone: string | null
  avatarUrl: string | null
  status: UserStatus
  createdAt: string
  updatedAt: string
}

// ─── Lead Responses ────────────────────────────────────────────

/** Lead list item — includes internal qualification block for admin/counsellor */
export interface LeadListItem {
  id: string
  email: string
  phone: string | null
  firstName: string
  lastName: string | null
  source: LeadSource
  sourcePartner: string | null
  status: LeadStatus
  qualificationScore: number | null
  priorityLevel: PriorityLevel | null
  profileCompleteness: number | null
  assignedCounsellorId: string | null
  createdAt: string
  updatedAt: string
}

/** Lead detail — full internal view for admin/counsellor */
export interface LeadDetail extends LeadListItem {
  userId: string | null
  notes: string | null
  mauticContactId: number | null
  convertedStudentId: string | null
  qualifiedAt: string | null
  priorityUpdatedAt: string | null
  createdByUserId: string | null
  /** Internal qualification block — never exposed to students */
  qualification: LeadQualificationBlock | null
}

/** Internal-only qualification block on lead detail */
export interface LeadQualificationBlock {
  qualificationScore: number | null
  priorityLevel: PriorityLevel | null
  profileCompleteness: number | null
  recommendedDisposition: string | null
  componentScores: {
    academicFitScore: number | null
    financialReadinessScore: number | null
    languageReadinessScore: number | null
    motivationClarityScore: number | null
    timelineUrgencyScore: number | null
    documentReadinessScore: number | null
    visaComplexityScore: number | null
  } | null
  summaryForTeam: string | null
}

/** Convert endpoint response */
export interface LeadConvertResponse {
  action: 'created' | 'linked' | 'already_converted' | 'requires_user_account'
  student?: StudentDetail
}

// ─── Student Responses ─────────────────────────────────────────

/** Student list item for admin/counsellor */
export interface StudentListItem {
  id: string
  userId: string
  referenceCode: string
  source: string
  stage: StudentStage
  stageUpdatedAt: string
  firstName: string
  lastName: string
  email: string
  assignedCounsellorId: string | null
  overallReadinessScore: number | null
  visaRisk: VisaRisk | null
  createdAt: string
}

/** Student detail for admin/counsellor — includes scores */
export interface StudentDetail {
  id: string
  userId: string
  referenceCode: string
  firstName: string
  lastName: string
  email: string
  source: string
  sourcePartner: string | null
  stage: StudentStage
  stageUpdatedAt: string
  // Profile
  degreeLevel: string | null
  bachelorDegree: string | null
  gpa: number | null
  graduationYear: number | null
  workExperienceYears: number | null
  studyGapYears: number | null
  englishTestType: EnglishTestType | null
  englishScore: number | null
  budgetMin: number | null
  budgetMax: number | null
  fundingRoute: string | null
  preferredCity: string | null
  preferredIntake: string | null
  housingNeeded: boolean | null
  // Scores (admin/counsellor only)
  academicFitScore: number | null
  financialReadinessScore: number | null
  visaRisk: VisaRisk | null
  overallReadinessScore: number | null
  lastAssessedAt: string | null
  // Assignment
  assignedCounsellorId: string | null
  assignedAt: string | null
  // Consent
  whatsappConsent: boolean
  emailConsent: boolean
  parentInvolvement: boolean
  // Meta
  createdAt: string
  updatedAt: string
}

/** Student-facing own profile — excludes internal scores */
export interface StudentOwnProfile {
  id: string
  referenceCode: string
  stage: StudentStage
  stageUpdatedAt: string
  // Profile
  degreeLevel: string | null
  bachelorDegree: string | null
  gpa: number | null
  graduationYear: number | null
  englishTestType: EnglishTestType | null
  englishScore: number | null
  budgetMin: number | null
  budgetMax: number | null
  fundingRoute: string | null
  preferredCity: string | null
  preferredIntake: string | null
  housingNeeded: boolean | null
  // Consent
  whatsappConsent: boolean
  emailConsent: boolean
  parentInvolvement: boolean
  // Meta
  createdAt: string
  updatedAt: string
}

/** Student progress — safe for student portal display */
export interface StudentProgress {
  stage: StudentStage
  progressPercent: number
  assignedCounsellorId: string | null
  completedMilestones: string[]
  nextActions: string[]
  documentChecklist: { completed: number; total: number }
  applications: { total: number; offers: number }
  visa: { status: string | null }
}

// ─── Application Responses ─────────────────────────────────────

export interface ApplicationListItem {
  id: string
  studentId: string
  programId: string
  programName: string
  universityName: string
  intakeId: string | null
  intakeName: string | null
  status: ApplicationStatus
  submittedAt: string | null
  decisionAt: string | null
  createdAt: string
}

// ─── Document Responses ────────────────────────────────────────

export interface DocumentListItem {
  id: string
  type: DocumentType
  filename: string
  status: DocumentStatus
  isCurrent: boolean
  sharedAt: string | null
  sharedWithCounsellorId: string | null
  revokedAt: string | null
  createdAt: string
}

export interface DocumentRequirementItem {
  id: string
  documentType: string
  requirementSource: RequirementSource
  required: boolean
  status: RequirementStatus
  notes: string | null
  dueDate: string | null
}

// ─── AI Assessment Responses ───────────────────────────────────

/** AI assessment summary — internal only, never shown to students */
export interface AiAssessmentSummary {
  id: string
  sourceType: string
  academicFitScore: number | null
  financialReadinessScore: number | null
  languageReadinessScore: number | null
  motivationClarityScore: number | null
  timelineUrgencyScore: number | null
  documentReadinessScore: number | null
  visaComplexityScore: number | null
  visaRisk: VisaRisk | null
  overallReadinessScore: number | null
  qualificationScore: number | null
  priorityLevel: PriorityLevel | null
  recommendedDisposition: string | null
  summaryForTeam: string
  profileCompleteness: number | null
  createdAt: string
}

// ─── Team Responses ───────────────────────────────────────────

export interface TeamMemberItem {
  id: string
  email: string
  role: UserRole
  firstName: string
  lastName: string
  phone: string | null
  status: UserStatus
  createdAt: string
}

// ─── Activity Log Responses ───────────────────────────────────

export interface ActivityLogItem {
  id: string
  activityType: ActivityType
  channel: ActivityChannel
  direction: ActivityDirection
  outcome: string | null
  summary: string | null
  nextActionDueAt: string | null
  durationMinutes: number | null
  createdAt: string
  createdBy: { id: string; name: string }
}

// ─── Timeline / Stage Transition Responses ────────────────────

export interface TimelineItem {
  id: string
  fromStage: StudentStage | null
  toStage: StudentStage
  changedByType: 'user' | 'system' | 'automation'
  changedByUserId: string | null
  reasonCode: string | null
  reasonNote: string | null
  createdAt: string
}

// ─── Notes Responses ──────────────────────────────────────────

export interface NoteItem {
  id: string
  noteType: string
  content: string
  createdByUserId: string
  createdByName: string
  createdAt: string
}

// ─── Contact Responses ────────────────────────────────────────

export type ContactType = 'parent' | 'guardian' | 'emergency'

export interface ContactItem {
  id: string
  contactType: ContactType
  name: string
  relation: string
  phone: string | null
  email: string | null
  isPrimary: boolean
  createdAt: string
}

// ─── Consent Event Responses ──────────────────────────────────

export type ConsentSource = 'form' | 'manual' | 'import' | 'webhook'

export interface ConsentEventItem {
  id: string
  consentType: ConsentType
  granted: boolean
  source: ConsentSource
  recordedByUserId: string | null
  createdAt: string
}

// ─── Booking Responses ────────────────────────────────────────

export type BookingStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show' | 'awaiting_assignment' | 'assigned'

export interface BookingListItem {
  id: string
  studentId: string | null
  leadId: string | null
  counsellorId: string | null
  scheduledAt: string
  status: BookingStatus
  notes: string | null
  createdAt: string
}

// ─── Chat Responses ───────────────────────────────────────────

export interface ChatSessionItem {
  id: string
  status: ChatSessionStatus
  createdAt: string
  endedAt: string | null
}

export interface ChatMessageItem {
  id: string
  role: MessageRole
  content: string
  timestamp: string
}

export interface ChatMessageResponse {
  message: ChatMessageItem
  options: string[] | null
}

// ─── Upload URL Response ──────────────────────────────────────

export interface UploadUrlResponse {
  uploadUrl: string
  documentId: string
  gcsPath: string
}

// ─── Notification Responses ───────────────────────────────────

export type NotificationChannel = 'email' | 'whatsapp' | 'sms'
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'failed'

export interface NotificationItem {
  id: string
  channel: NotificationChannel
  status: NotificationStatus
  subject: string | null
  sentAt: string | null
  createdAt: string
}

// ─── Support Responses ────────────────────────────────────────

export interface SupportRequestResponse {
  id: string
  status: 'received'
  message: string
}

// ─── Catalog Responses ────────────────────────────────────────

export interface UniversityItem {
  id: string
  name: string
  city: string
  country: string
  websiteUrl: string | null
  partnerStatus: string | null
  active: boolean
  createdAt: string
}

export interface ProgramItem {
  id: string
  universityId: string
  universityName: string
  name: string
  degreeLevel: string
  fieldOfStudy: string
  language: string
  durationMonths: number
  tuitionAmount: number
  tuitionCurrency: string
  minimumGpa: number | null
  englishRequirementType: string | null
  englishMinimumScore: number | null
  description: string | null
  active: boolean
}

export interface ProgramIntakeItem {
  id: string
  programId: string
  intakeName: string
  startMonth: number
  startYear: number
  applicationDeadline: string | null
  active: boolean
}

// ─── Assignment History ───────────────────────────────────────

export interface AssignmentHistoryItem {
  id: string
  counsellorId: string
  counsellorName: string
  assignedAt: string
  unassignedAt: string | null
}

// ─── Analytics Responses ─────────────────────────────────────

export interface AnalyticsOverview {
  period: { from: string; to: string }
  data: {
    leads: { total: number; new: number; qualified: number; converted: number; disqualified: number }
    students: { total: number; active: number; byStage: Record<string, number> }
    applications: { total: number; submitted: number; offers: number; enrolled: number }
    documents: { pending: number; verified: number; rejected: number }
    bookings: { scheduled: number; completed: number }
  }
}

export interface PipelineMetrics {
  period: { from: string; to: string }
  data: {
    funnel: Array<{ stage: string; count: number }>
    conversionRate: number | null
    averageDaysInStage: Record<string, number>
  }
}

export interface CounsellorAnalyticsItem {
  id: string
  name: string
  email: string
  assignedLeads: number
  assignedStudents: number
  activityCount: number
  conversionRate: number | null
  overdueActions: number
}

export interface CounsellorAnalyticsDetail {
  id: string
  name: string
  email: string
  period: { from: string; to: string }
  caseload: { leads: number; students: number }
  activityByType: Record<string, number>
  activityByChannel: Record<string, number>
  recentActivities: Array<{
    id: string
    activityType: string
    channel: string
    summary: string | null
    createdAt: string
  }>
  studentStages: Record<string, number>
}

export interface StudentAnalyticsItem {
  id: string
  referenceCode: string
  firstName: string
  lastName: string
  stage: string
  daysInStage: number
  documentProgress: { completed: number; total: number }
  applicationCount: number
  lastCounsellorTouchpoint: string | null
}

export interface StudentAnalyticsDetail {
  id: string
  referenceCode: string
  firstName: string
  lastName: string
  stage: string
  daysInStage: number
  period: { from: string; to: string }
  documentProgress: { completed: number; total: number }
  applications: { total: number; offers: number; enrolled: number }
  stageHistory: Array<{ stage: string; enteredAt: string; daysInStage: number }>
  lastCounsellorTouchpoint: string | null
}
