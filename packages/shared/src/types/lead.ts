export type LeadSource = 'marketing' | 'university' | 'referral' | 'whatsapp' | 'ads' | 'manual'

export type LeadStatus = 'new' | 'nurturing' | 'qualified' | 'disqualified' | 'converted'

export type PriorityLevel = 'p1' | 'p2' | 'p3'

export interface Lead {
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
  isPartnerHotLead: boolean
  needsIntakeCompletion: boolean
  userId: string | null
  assignedCounsellorId: string | null
  latestAiAssessmentId: string | null
  qualifiedAt: string | null
  priorityUpdatedAt: string | null
  createdByUserId: string | null
  notes: string | null
  mauticContactId: number | null
  convertedStudentId: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}
