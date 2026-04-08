import { z } from 'zod'

// ─── Enum schemas ─────────────────────────────────────────────

export const studentStageSchema = z.enum([
  'lead_created',
  'intake_completed',
  'qualified',
  'counsellor_consultation',
  'application_started',
  'offer_confirmed',
  'campus_france_readiness',
  'visa_file_readiness',
  'visa_submitted',
  'visa_decision',
  'arrival_onboarding',
  'arrived_france',
  'alumni',
])

export const visaRiskSchema = z.enum(['low', 'medium', 'high'])

export const englishTestTypeSchema = z.enum(['ielts', 'toefl', 'duolingo', 'none'])

// ─── Response DTOs ────────────────────────────────────────────

export const studentListItemSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  referenceCode: z.string(),
  source: z.string(),
  stage: studentStageSchema,
  stageUpdatedAt: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  assignedCounsellorId: z.string().uuid().nullable(),
  overallReadinessScore: z.number().nullable(),
  visaRisk: visaRiskSchema.nullable(),
  createdAt: z.string(),
})

export const studentDetailSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  referenceCode: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  source: z.string(),
  sourcePartner: z.string().nullable(),
  stage: studentStageSchema,
  stageUpdatedAt: z.string(),
  degreeLevel: z.string().nullable(),
  bachelorDegree: z.string().nullable(),
  gpa: z.number().nullable(),
  graduationYear: z.number().nullable(),
  workExperienceYears: z.number().nullable(),
  studyGapYears: z.number().nullable(),
  englishTestType: englishTestTypeSchema.nullable(),
  englishScore: z.number().nullable(),
  budgetMin: z.number().nullable(),
  budgetMax: z.number().nullable(),
  fundingRoute: z.string().nullable(),
  preferredCity: z.string().nullable(),
  preferredIntake: z.string().nullable(),
  housingNeeded: z.boolean().nullable(),
  academicFitScore: z.number().nullable(),
  financialReadinessScore: z.number().nullable(),
  visaRisk: visaRiskSchema.nullable(),
  overallReadinessScore: z.number().nullable(),
  lastAssessedAt: z.string().nullable(),
  assignedCounsellorId: z.string().uuid().nullable(),
  assignedAt: z.string().nullable(),
  whatsappConsent: z.boolean(),
  emailConsent: z.boolean(),
  parentInvolvement: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const studentOwnProfileSchema = z.object({
  id: z.string().uuid(),
  referenceCode: z.string(),
  stage: studentStageSchema,
  stageUpdatedAt: z.string(),
  degreeLevel: z.string().nullable(),
  bachelorDegree: z.string().nullable(),
  gpa: z.number().nullable(),
  graduationYear: z.number().nullable(),
  englishTestType: englishTestTypeSchema.nullable(),
  englishScore: z.number().nullable(),
  budgetMin: z.number().nullable(),
  budgetMax: z.number().nullable(),
  fundingRoute: z.string().nullable(),
  preferredCity: z.string().nullable(),
  preferredIntake: z.string().nullable(),
  housingNeeded: z.boolean().nullable(),
  whatsappConsent: z.boolean(),
  emailConsent: z.boolean(),
  parentInvolvement: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

// ─── Student self-edit schema ────────────────────────────────

export const updateOwnProfileSchema = z.object({
  degreeLevel: z.string().optional(),
  bachelorDegree: z.string().optional(),
  gpa: z.number().optional(),
  graduationYear: z.number().int().optional(),
  workExperienceYears: z.number().int().min(0).optional(),
  studyGapYears: z.number().int().min(0).optional(),
  englishTestType: englishTestTypeSchema.optional(),
  englishScore: z.number().optional(),
  budgetMin: z.number().int().min(0).optional(),
  budgetMax: z.number().int().min(0).optional(),
  fundingRoute: z.string().optional(),
  preferredCity: z.string().optional(),
  preferredIntake: z.string().optional(),
  housingNeeded: z.boolean().optional(),
})

// ─── Student onboarding gate ─────────────────────────────────
//
// Required on the first portal visit. Captures the contact info we
// can't reliably get from Firebase auth (especially Google sign-ins,
// which often return a junky display name and never give us a phone).
//
// The phone is split into a country dial code (digits only, no '+')
// and a local part the user typed. The server normalizes both into
// strict E.164 before storing.
export const completeOnboardingSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'First name is required')
    .max(100),
  lastName: z
    .string()
    .trim()
    .min(1, 'Last name is required')
    .max(100),
  countryDialCode: z
    .string()
    .trim()
    .regex(/^[1-9]\d{0,3}$/, 'Invalid country dial code'),
  phoneLocal: z
    .string()
    .trim()
    .min(4, 'Phone number is too short')
    .max(20),
  whatsappConsent: z.boolean(),
})

export const studentProgressSchema = z.object({
  stage: studentStageSchema,
  progressPercent: z.number(),
  assignedCounsellorId: z.string().uuid().nullable(),
  bookingReady: z.boolean(),
  intakeCapture: z.object({
    captured: z.number(),
    total: z.number(),
    missing: z.array(z.string()),
  }),
  completedMilestones: z.array(z.string()),
  nextActions: z.array(z.string()),
  documentChecklist: z.object({
    completed: z.number(),
    total: z.number(),
  }),
  applications: z.object({
    total: z.number(),
    offers: z.number(),
  }),
  visa: z.object({
    status: z.string().nullable(),
  }),
})
