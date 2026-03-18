import type { PriorityLevel } from './lead'
import type { VisaRisk } from './student'

export type AssessmentSourceType = 'chat' | 'document' | 'lead_form' | 'manual_review' | 'import'

export interface AiAssessment {
  id: string
  studentId: string | null
  leadId: string | null
  sourceType: AssessmentSourceType
  sourceId: string | null
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
  programmeLevel: string | null
  recommendedNextStep: string | null
  summaryForTeam: string
  housingNeeded: boolean | null
  profileCompleteness: number | null
  fieldsCollected: string[] | null
  fieldsMissing: string[] | null
  hardRuleFlags: Record<string, unknown> | null
  rawJson: Record<string, unknown> | null
  createdAt: string
}
