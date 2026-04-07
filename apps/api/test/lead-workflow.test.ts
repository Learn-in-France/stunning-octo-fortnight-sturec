import { describe, expect, it } from 'vitest'

import { deriveLeadRoutingDecision, needsPartnerIntakeCompletion } from '../src/modules/leads/workflow.js'

describe('lead workflow partner overrides', () => {
  it('fast-tracks trusted university partner leads for outreach', () => {
    const decision = deriveLeadRoutingDecision({
      source: 'university',
      sourcePartner: 'IIT Delhi',
      qualificationScore: 52,
      priorityLevel: 'p3',
      profileCompleteness: 0.35,
    })

    expect(decision.isPartnerHotLead).toBe(true)
    expect(decision.qualificationScore).toBe(80)
    expect(decision.priorityLevel).toBe('p1')
    expect(decision.status).toBe('qualified')
    expect(decision.needsIntakeCompletion).toBe(true)
  })

  it('does not override non-partner leads', () => {
    const decision = deriveLeadRoutingDecision({
      source: 'marketing',
      sourcePartner: null,
      qualificationScore: 52,
      priorityLevel: 'p3',
      profileCompleteness: 0.35,
    })

    expect(decision.isPartnerHotLead).toBe(false)
    expect(decision.qualificationScore).toBe(52)
    expect(decision.priorityLevel).toBe('p3')
    expect(decision.status).toBe('nurturing')
    expect(decision.needsIntakeCompletion).toBe(false)
  })

  it('flags intake completion only for incomplete trusted partner leads', () => {
    expect(needsPartnerIntakeCompletion({
      source: 'university',
      sourcePartner: 'IIT Delhi',
      profileCompleteness: 0.6,
    })).toBe(true)

    expect(needsPartnerIntakeCompletion({
      source: 'university',
      sourcePartner: 'IIT Delhi',
      profileCompleteness: 0.9,
    })).toBe(false)
  })
})
