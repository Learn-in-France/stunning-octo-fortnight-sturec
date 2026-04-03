/**
 * Entity-to-DTO mappers.
 *
 * Each function translates a Prisma model record (Date objects, Prisma enum
 * identifiers) into the canonical response DTO exported by `@sturec/shared`.
 *
 * Rules:
 *  - Dates → ISO strings
 *  - Divergent enum values → mapped via ./enums.ts
 *  - Internal-only fields stripped from student-facing DTOs
 */

import type {
  User as PrismaUser,
  Lead as PrismaLead,
  Student as PrismaStudent,
  AiAssessment as PrismaAiAssessment,
  StageTransition as PrismaStageTransition,
  CounsellorNote as PrismaNote,
  CounsellorActivityLog as PrismaActivityLog,
  StudentContact as PrismaContact,
  ConsentEvent as PrismaConsentEvent,
  Booking as PrismaBooking,
  University as PrismaUniversity,
  Program as PrismaProgram,
  ProgramIntake as PrismaIntake,
  NotificationLog as PrismaNotification,
  StudentAssignment as PrismaAssignment,
  Application as PrismaApplication,
  Document as PrismaDocument,
  StudentDocumentRequirement as PrismaDocRequirement,
} from '@prisma/client'

import type {
  AuthUserResponse,
  LeadListItem,
  LeadDetail,
  LeadQualificationBlock,
  StudentListItem,
  StudentDetail,
  StudentOwnProfile,
  AiAssessmentSummary,
  TeamMemberItem,
  ActivityLogItem,
  TimelineItem,
  NoteItem,
  ContactItem,
  ConsentEventItem,
  BookingListItem,
  UniversityItem,
  ProgramItem,
  ProgramIntakeItem,
  NotificationItem,
  AssignmentHistoryItem,
  ApplicationListItem,
  DocumentListItem,
  DocumentRequirementItem,
} from '@sturec/shared'

import { mapLeadStatus, mapActivityChannel, mapConsentType } from './enums.js'

// ─── Helpers ──────────────────────────────────────────────────

function isoOrNull(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null
}

// ─── User → AuthUserResponse ─────────────────────────────────

export function mapUserToAuthResponse(user: PrismaUser): AuthUserResponse {
  return {
    id: user.id,
    email: user.email,
    role: user.role as AuthUserResponse['role'],
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    status: user.status as AuthUserResponse['status'],
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }
}

// ─── Lead → LeadListItem ─────────────────────────────────────

export function mapLeadToListItem(lead: PrismaLead): LeadListItem {
  return {
    id: lead.id,
    email: lead.email,
    phone: lead.phone,
    firstName: lead.firstName,
    lastName: lead.lastName,
    source: lead.source as LeadListItem['source'],
    sourcePartner: lead.sourcePartner,
    status: mapLeadStatus(lead.status),
    qualificationScore: lead.qualificationScore,
    priorityLevel: lead.priorityLevel as LeadListItem['priorityLevel'],
    profileCompleteness: lead.profileCompleteness ? Number(lead.profileCompleteness) : null,
    assignedCounsellorId: lead.assignedCounsellorId,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
  }
}

// ─── Lead → LeadDetail ───────────────────────────────────────

/**
 * Maps a lead with its latest AI assessment into a LeadDetail DTO.
 * Pass `assessment` separately — the service/repository join determines
 * whether to include it.
 */
export function mapLeadToDetail(
  lead: PrismaLead,
  assessment: PrismaAiAssessment | null,
): LeadDetail {
  const qualification: LeadQualificationBlock | null = assessment
    ? {
        qualificationScore: assessment.qualificationScore,
        priorityLevel: assessment.priorityLevel as LeadQualificationBlock['priorityLevel'],
        profileCompleteness: assessment.profileCompleteness
          ? Number(assessment.profileCompleteness)
          : null,
        recommendedDisposition: assessment.recommendedDisposition,
        componentScores: {
          academicFitScore: assessment.academicFitScore,
          financialReadinessScore: assessment.financialReadinessScore,
          languageReadinessScore: assessment.languageReadinessScore,
          motivationClarityScore: assessment.motivationClarityScore,
          timelineUrgencyScore: assessment.timelineUrgencyScore,
          documentReadinessScore: assessment.documentReadinessScore,
          visaComplexityScore: assessment.visaComplexityScore,
        },
        summaryForTeam: assessment.summaryForTeam,
      }
    : null

  return {
    ...mapLeadToListItem(lead),
    userId: lead.userId,
    notes: lead.notes,
    mauticContactId: lead.mauticContactId,
    convertedStudentId: lead.convertedStudentId,
    qualifiedAt: isoOrNull(lead.qualifiedAt),
    priorityUpdatedAt: isoOrNull(lead.priorityUpdatedAt),
    createdByUserId: lead.createdByUserId,
    qualification,
  }
}

// ─── Student → StudentListItem ───────────────────────────────

/**
 * Requires joined user data for name/email. Pass as a second argument.
 */
export function mapStudentToListItem(
  student: PrismaStudent,
  user: { firstName: string; lastName: string; email: string },
): StudentListItem {
  return {
    id: student.id,
    userId: student.userId,
    referenceCode: student.referenceCode,
    source: student.source as string,
    stage: student.stage as StudentListItem['stage'],
    stageUpdatedAt: student.stageUpdatedAt.toISOString(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    assignedCounsellorId: student.assignedCounsellorId,
    overallReadinessScore: student.overallReadinessScore,
    visaRisk: student.visaRisk as StudentListItem['visaRisk'],
    createdAt: student.createdAt.toISOString(),
  }
}

// ─── Student → StudentDetail ─────────────────────────────────

export function mapStudentToDetail(
  student: PrismaStudent & { user: { firstName: string; lastName: string; email: string } },
): StudentDetail {
  return {
    id: student.id,
    userId: student.userId,
    referenceCode: student.referenceCode,
    firstName: student.user.firstName,
    lastName: student.user.lastName,
    email: student.user.email,
    source: student.source as string,
    sourcePartner: student.sourcePartner,
    stage: student.stage as StudentDetail['stage'],
    stageUpdatedAt: student.stageUpdatedAt.toISOString(),
    degreeLevel: student.degreeLevel,
    bachelorDegree: student.bachelorDegree,
    gpa: student.gpa ? Number(student.gpa) : null,
    graduationYear: student.graduationYear,
    workExperienceYears: student.workExperienceYears,
    studyGapYears: student.studyGapYears,
    englishTestType: student.englishTestType as StudentDetail['englishTestType'],
    englishScore: student.englishScore ? Number(student.englishScore) : null,
    budgetMin: student.budgetMin ? Number(student.budgetMin) : null,
    budgetMax: student.budgetMax ? Number(student.budgetMax) : null,
    fundingRoute: student.fundingRoute,
    preferredCity: student.preferredCity,
    preferredIntake: student.preferredIntake,
    housingNeeded: student.housingNeeded,
    academicFitScore: student.academicFitScore,
    financialReadinessScore: student.financialReadinessScore,
    visaRisk: student.visaRisk as StudentDetail['visaRisk'],
    overallReadinessScore: student.overallReadinessScore,
    lastAssessedAt: isoOrNull(student.lastAssessedAt),
    assignedCounsellorId: student.assignedCounsellorId,
    assignedAt: isoOrNull(student.assignedAt),
    whatsappConsent: student.whatsappConsent,
    emailConsent: student.emailConsent,
    parentInvolvement: student.parentInvolvement,
    createdAt: student.createdAt.toISOString(),
    updatedAt: student.updatedAt.toISOString(),
  }
}

// ─── Student → StudentOwnProfile ─────────────────────────────

export function mapStudentToOwnProfile(student: PrismaStudent): StudentOwnProfile {
  return {
    id: student.id,
    referenceCode: student.referenceCode,
    stage: student.stage as StudentOwnProfile['stage'],
    stageUpdatedAt: student.stageUpdatedAt.toISOString(),
    degreeLevel: student.degreeLevel,
    bachelorDegree: student.bachelorDegree,
    gpa: student.gpa ? Number(student.gpa) : null,
    graduationYear: student.graduationYear,
    englishTestType: student.englishTestType as StudentOwnProfile['englishTestType'],
    englishScore: student.englishScore ? Number(student.englishScore) : null,
    budgetMin: student.budgetMin ? Number(student.budgetMin) : null,
    budgetMax: student.budgetMax ? Number(student.budgetMax) : null,
    fundingRoute: student.fundingRoute,
    preferredCity: student.preferredCity,
    preferredIntake: student.preferredIntake,
    housingNeeded: student.housingNeeded,
    whatsappConsent: student.whatsappConsent,
    emailConsent: student.emailConsent,
    parentInvolvement: student.parentInvolvement,
    createdAt: student.createdAt.toISOString(),
    updatedAt: student.updatedAt.toISOString(),
  }
}

// ─── AiAssessment → AiAssessmentSummary ──────────────────────

export function mapAiAssessmentToSummary(a: PrismaAiAssessment): AiAssessmentSummary {
  return {
    id: a.id,
    sourceType: a.sourceType as string,
    academicFitScore: a.academicFitScore,
    financialReadinessScore: a.financialReadinessScore,
    languageReadinessScore: a.languageReadinessScore,
    motivationClarityScore: a.motivationClarityScore,
    timelineUrgencyScore: a.timelineUrgencyScore,
    documentReadinessScore: a.documentReadinessScore,
    visaComplexityScore: a.visaComplexityScore,
    visaRisk: a.visaRisk as AiAssessmentSummary['visaRisk'],
    overallReadinessScore: a.overallReadinessScore,
    qualificationScore: a.qualificationScore,
    priorityLevel: a.priorityLevel as AiAssessmentSummary['priorityLevel'],
    recommendedDisposition: a.recommendedDisposition,
    summaryForTeam: a.summaryForTeam,
    profileCompleteness: a.profileCompleteness ? Number(a.profileCompleteness) : null,
    createdAt: a.createdAt.toISOString(),
  }
}

// ─── User → TeamMemberItem ───────────────────────────────────

export function mapUserToTeamMember(user: PrismaUser): TeamMemberItem {
  return {
    id: user.id,
    email: user.email,
    role: user.role as TeamMemberItem['role'],
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    status: user.status as TeamMemberItem['status'],
    createdAt: user.createdAt.toISOString(),
  }
}

// ─── StageTransition → TimelineItem ─────────────────────────

export function mapStageTransition(t: PrismaStageTransition): TimelineItem {
  return {
    id: t.id,
    fromStage: t.fromStage as TimelineItem['fromStage'],
    toStage: t.toStage as TimelineItem['toStage'],
    changedByType: t.changedByType as TimelineItem['changedByType'],
    changedByUserId: t.changedByUserId,
    reasonCode: t.reasonCode,
    reasonNote: t.reasonNote,
    createdAt: t.timestamp.toISOString(),
  }
}

// ─── CounsellorNote → NoteItem ──────────────────────────────

export function mapNote(
  note: PrismaNote,
  author: { firstName: string; lastName: string },
): NoteItem {
  return {
    id: note.id,
    noteType: note.noteType as string,
    content: note.content,
    createdByUserId: note.authorId,
    createdByName: `${author.firstName} ${author.lastName}`.trim(),
    createdAt: note.createdAt.toISOString(),
  }
}

// ─── CounsellorActivityLog → ActivityLogItem ────────────────

export function mapActivityLog(
  log: PrismaActivityLog,
  createdBy: { id: string; firstName: string; lastName: string },
): ActivityLogItem {
  return {
    id: log.id,
    activityType: log.activityType as ActivityLogItem['activityType'],
    channel: mapActivityChannel(log.channel),
    direction: log.direction as ActivityLogItem['direction'],
    outcome: log.outcome,
    summary: log.summary,
    nextActionDueAt: isoOrNull(log.nextActionDueAt),
    durationMinutes: log.durationMinutes,
    createdAt: log.createdAt.toISOString(),
    createdBy: {
      id: createdBy.id,
      name: `${createdBy.firstName} ${createdBy.lastName}`.trim(),
    },
  }
}

// ─── StudentContact → ContactItem ───────────────────────────

export function mapContact(contact: PrismaContact): ContactItem {
  return {
    id: contact.id,
    contactType: contact.type as ContactItem['contactType'],
    name: contact.name,
    relation: contact.relation,
    phone: contact.phone,
    email: contact.email,
    isPrimary: contact.isPrimary,
    createdAt: contact.createdAt.toISOString(),
  }
}

// ─── ConsentEvent → ConsentEventItem ────────────────────────

export function mapConsentEvent(event: PrismaConsentEvent): ConsentEventItem {
  return {
    id: event.id,
    consentType: mapConsentType(event.consentType),
    granted: event.granted,
    source: event.source as ConsentEventItem['source'],
    recordedByUserId: event.capturedByUserId,
    createdAt: event.createdAt.toISOString(),
  }
}

// ─── Booking → BookingListItem ──────────────────────────────

export function mapBooking(booking: PrismaBooking): BookingListItem {
  return {
    id: booking.id,
    studentId: booking.studentId,
    leadId: booking.leadId,
    counsellorId: booking.counsellorId,
    scheduledAt: booking.scheduledAt.toISOString(),
    status: booking.status as BookingListItem['status'],
    notes: booking.notes,
    createdAt: booking.createdAt.toISOString(),
  }
}

// ─── University → UniversityItem ────────────────────────────

export function mapUniversity(uni: PrismaUniversity): UniversityItem {
  return {
    id: uni.id,
    name: uni.name,
    city: uni.city,
    country: uni.country,
    websiteUrl: uni.websiteUrl,
    partnerStatus: uni.partnerStatus,
    active: uni.active,
    createdAt: uni.createdAt.toISOString(),
  }
}

// ─── Program → ProgramItem ──────────────────────────────────

export function mapProgram(
  program: PrismaProgram,
  universityName: string,
): ProgramItem {
  return {
    id: program.id,
    universityId: program.universityId,
    universityName,
    name: program.name,
    degreeLevel: program.degreeLevel,
    fieldOfStudy: program.fieldOfStudy,
    language: program.language,
    durationMonths: program.durationMonths,
    tuitionAmount: program.tuitionAmount,
    tuitionCurrency: program.tuitionCurrency,
    minimumGpa: program.minimumGpa ? Number(program.minimumGpa) : null,
    englishRequirementType: program.englishRequirementType,
    englishMinimumScore: program.englishMinimumScore ? Number(program.englishMinimumScore) : null,
    description: program.description,
    active: program.active,
  }
}

// ─── ProgramIntake → ProgramIntakeItem ──────────────────────

export function mapProgramIntake(intake: PrismaIntake): ProgramIntakeItem {
  return {
    id: intake.id,
    programId: intake.programId,
    intakeName: intake.intakeName,
    startMonth: intake.startMonth,
    startYear: intake.startYear,
    applicationDeadline: intake.applicationDeadline
      ? intake.applicationDeadline.toISOString().split('T')[0]
      : null,
    active: intake.active,
  }
}

// ─── NotificationLog → NotificationItem ─────────────────────

export function mapNotification(n: PrismaNotification): NotificationItem {
  return {
    id: n.id,
    channel: n.channel as NotificationItem['channel'],
    status: n.status as NotificationItem['status'],
    subject: n.templateKey,
    sentAt: isoOrNull(n.sentAt),
    createdAt: n.createdAt.toISOString(),
  }
}

// ─── StudentAssignment → AssignmentHistoryItem ──────────────

export function mapAssignment(
  assignment: PrismaAssignment,
  counsellor: { firstName: string; lastName: string },
): AssignmentHistoryItem {
  return {
    id: assignment.id,
    counsellorId: assignment.counsellorId,
    counsellorName: `${counsellor.firstName} ${counsellor.lastName}`.trim(),
    assignedAt: assignment.assignedAt.toISOString(),
    unassignedAt: isoOrNull(assignment.unassignedAt),
  }
}

// ─── Application → ApplicationListItem ──────────────────────

export function mapApplication(
  app: PrismaApplication,
  program: { name: string; university: { name: string } },
  intake: { intakeName: string } | null,
): ApplicationListItem {
  return {
    id: app.id,
    studentId: app.studentId,
    programId: app.programId,
    programName: program.name,
    universityName: program.university.name,
    intakeId: app.intakeId,
    intakeName: intake?.intakeName ?? null,
    status: app.status as ApplicationListItem['status'],
    submittedAt: isoOrNull(app.submittedAt),
    decisionAt: isoOrNull(app.decisionAt),
    createdAt: app.createdAt.toISOString(),
  }
}

// ─── Document → DocumentListItem ────────────────────────────

export function mapDocument(doc: PrismaDocument): DocumentListItem {
  return {
    id: doc.id,
    type: doc.type as DocumentListItem['type'],
    filename: doc.filename,
    status: doc.status as DocumentListItem['status'],
    isCurrent: doc.isCurrent,
    sharedAt: doc.sharedAt?.toISOString() ?? null,
    sharedWithCounsellorId: doc.sharedWithCounsellorId ?? null,
    revokedAt: doc.revokedAt?.toISOString() ?? null,
    createdAt: doc.createdAt.toISOString(),
  }
}

// ─── StudentDocumentRequirement → DocumentRequirementItem ───

export function mapDocumentRequirement(req: PrismaDocRequirement): DocumentRequirementItem {
  return {
    id: req.id,
    documentType: req.documentType,
    requirementSource: req.requirementSource as DocumentRequirementItem['requirementSource'],
    required: req.required,
    status: req.status as DocumentRequirementItem['status'],
    notes: req.notes,
    dueDate: req.dueDate ? req.dueDate.toISOString().split('T')[0] : null,
  }
}
