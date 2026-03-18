export type StudentStage =
  | 'lead_created'
  | 'intake_completed'
  | 'qualified'
  | 'counsellor_consultation'
  | 'application_started'
  | 'offer_confirmed'
  | 'campus_france_readiness'
  | 'visa_file_readiness'
  | 'visa_submitted'
  | 'visa_decision'
  | 'arrival_onboarding'
  | 'arrived_france'
  | 'alumni'

export type VisaRisk = 'low' | 'medium' | 'high'

export type ConsentType = 'whatsapp' | 'email' | 'parent_contact'

export type EnglishTestType = 'ielts' | 'toefl' | 'duolingo' | 'none'

export interface Student {
  id: string
  userId: string
  referenceCode: string
  source: string
  sourcePartner: string | null
  stage: StudentStage
  stageUpdatedAt: string
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
  academicFitScore: number | null
  financialReadinessScore: number | null
  visaRisk: VisaRisk | null
  overallReadinessScore: number | null
  latestAiAssessmentId: string | null
  lastAssessedAt: string | null
  assignedCounsellorId: string | null
  assignedAt: string | null
  mauticContactId: number | null
  mauticSyncedAt: string | null
  whatsappConsent: boolean
  emailConsent: boolean
  parentInvolvement: boolean
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}
