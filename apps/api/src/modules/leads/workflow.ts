import type { LeadSource, PriorityLevel } from '@sturec/shared'

const PARTNER_INTAKE_COMPLETENESS_THRESHOLD = 0.75

export function isTrustedUniversityPartnerLead(input: {
  source: LeadSource | string
  sourcePartner?: string | null
}) {
  return input.source === 'university' && !!input.sourcePartner
}

export function needsPartnerIntakeCompletion(input: {
  source: LeadSource | string
  sourcePartner?: string | null
  profileCompleteness?: number | null
}) {
  if (!isTrustedUniversityPartnerLead(input)) return false
  return (input.profileCompleteness ?? 0) < PARTNER_INTAKE_COMPLETENESS_THRESHOLD
}

export function deriveLeadRoutingDecision(input: {
  source: LeadSource | string
  sourcePartner?: string | null
  qualificationScore?: number | null
  priorityLevel?: PriorityLevel | null
  profileCompleteness?: number | null
}) {
  const isPartnerHotLead = isTrustedUniversityPartnerLead(input)
  const qualificationScore = Math.max(
    0,
    Math.min(
      100,
      isPartnerHotLead ? Math.max(input.qualificationScore ?? 0, 80) : (input.qualificationScore ?? 0),
    ),
  )
  const priorityLevel: PriorityLevel = isPartnerHotLead ? 'p1' : (input.priorityLevel ?? 'p3')
  const status = qualificationScore >= 80 ? 'qualified' : 'nurturing'

  return {
    qualificationScore,
    priorityLevel,
    status,
    isPartnerHotLead,
    needsIntakeCompletion: needsPartnerIntakeCompletion({
      source: input.source,
      sourcePartner: input.sourcePartner,
      profileCompleteness: input.profileCompleteness,
    }),
  }
}
