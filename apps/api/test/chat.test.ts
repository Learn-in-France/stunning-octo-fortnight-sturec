import { describe, it, expect, vi } from 'vitest'

vi.mock('../src/modules/chat/repository.js', () => ({
  findSessionById: () => Promise.resolve(null),
  findMessages: () => Promise.resolve([]),
  createMessage: () => Promise.resolve(null),
  findLatestAssessment: () => Promise.resolve(null),
  findAssessments: () => Promise.resolve([]),
  findRecentMessages: () => Promise.resolve([]),
  createAssessment: () => Promise.resolve(null),
  updateLeadScores: () => Promise.resolve(null),
  findLeadByUserId: () => Promise.resolve(null),
  findStudentByUserId: () => Promise.resolve(null),
  createLeadForChat: () => Promise.resolve(null),
  findSessionsByUser: () => Promise.resolve([]),
  findActiveSession: () => Promise.resolve(null),
  createSession: () => Promise.resolve(null),
  endSession: () => Promise.resolve(null),
}))

vi.mock('../src/integrations/groq/index.js', () => ({
  chatCompletion: () => Promise.resolve({ content: '', usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 } }),
}))

vi.mock('../src/integrations/groq/prompts.js', () => ({
  ADVISOR_SYSTEM_PROMPT: 'test',
  CHAT_TURN_ASSESSMENT_PROMPT: 'test-assessment',
  buildProfileMemory: () => '',
}))

vi.mock('../src/lib/qualification.js', () => ({
  computeQualification: () => ({
    overallReadinessScore: 5,
    qualificationScore: 50,
    priorityLevel: 'p3',
  }),
}))

vi.mock('../src/lib/queue/index.js', () => ({
  getAiProcessingQueue: () => ({ add: () => Promise.resolve({ id: 'job-1' }) }),
}))

import { parseAiResponse, normalizeAiStructuredOutput, shouldSuggestBookingFromStructured, shouldSuggestBookingFromAssessments } from '../src/modules/chat/service.js'

describe('chat response parsing', () => {
  it('strips fenced json blocks from visible text', () => {
    const raw = `France can be a strong option for business and engineering studies.\n\n\
\
\`\`\`json\n{"profile_completeness":0.71,"fields_collected":["nationality","education_level","field_of_interest","timeline","language_level"],"fields_missing":["budget_awareness","source"],"summary_for_team":"Strong start","lead_heat":"warm","should_suggest_booking":false,"options":["Tell me about the visa process"]}\n\`\`\``

    const parsed = parseAiResponse(raw)

    expect(parsed.text).toContain('France can be a strong option')
    expect(parsed.text).not.toContain('profile_completeness')
    expect(parsed.text).not.toContain('```json')
    expect(parsed.structured?.summary_for_team).toBe('Strong start')
  })

  it('strips malformed fenced json blocks instead of leaking them', () => {
    const raw = `Here is some guidance for studying in France.\n\n\`\`\`json\n{"profile_completeness":0.5,"fields_collected":["nationality"],\n\`\`\``

    const parsed = parseAiResponse(raw)

    expect(parsed.text).toBe('Here is some guidance for studying in France.')
    expect(parsed.structured).toBeNull()
  })

  it('strips trailing unfenced json assessment blocks from visible text', () => {
    const raw = `You should start by comparing public universities and grandes ecoles at a high level.\n{"profile_completeness":0.57,"fields_collected":["nationality","education_level","field_of_interest","timeline"],"fields_missing":["budget_awareness","language_level","source"],"summary_for_team":"Ready for handoff","lead_heat":"warm","should_suggest_booking":false,"options":null}`

    const parsed = parseAiResponse(raw)

    expect(parsed.text).toBe('You should start by comparing public universities and grandes ecoles at a high level.')
    expect(parsed.structured?.lead_heat).toBe('warm')
  })
})

describe('structured assessment normalization', () => {
  it('coerces float lead_heat and 0-1 score values into Prisma-safe assessment fields', () => {
    const normalized = normalizeAiStructuredOutput({
      profile_completeness: 0.57,
      fields_collected: ['nationality', 'education_level'],
      fields_missing: ['field_of_interest'],
      academic_fit_score: 0.8,
      financial_readiness_score: '0.6',
      language_readiness_score: 7,
      motivation_clarity_score: null,
      timeline_urgency_score: 0.4,
      document_readiness_score: '5',
      visa_complexity_score: 0.2,
      visa_risk: 'medium',
      housing_needed: 'true',
      recommended_next_step: 'continue_chat',
      recommended_disposition: 'request_more_info',
      summary_for_team: 'Useful handoff summary',
      lead_heat: 0.7,
      should_suggest_booking: 'true',
      options: ['Talk about visas'],
    })

    expect(normalized).toMatchObject({
      academic_fit_score: 8,
      financial_readiness_score: 6,
      language_readiness_score: 7,
      timeline_urgency_score: 4,
      document_readiness_score: 5,
      visa_complexity_score: 2,
      lead_heat: 'warm',
      housing_needed: true,
      should_suggest_booking: true,
    })
  })
})

describe('booking suggestion derivation', () => {
  it('returns true when at least four intake fields are captured even if model flag is false', () => {
    expect(shouldSuggestBookingFromStructured({
      profile_completeness: 0.57,
      fields_collected: ['nationality', 'education_level', 'field_of_interest', 'timeline'],
      fields_missing: ['budget_awareness', 'language_level', 'source'],
      academic_fit_score: null,
      financial_readiness_score: null,
      language_readiness_score: null,
      motivation_clarity_score: null,
      timeline_urgency_score: null,
      document_readiness_score: null,
      visa_complexity_score: null,
      visa_risk: null,
      housing_needed: null,
      recommended_next_step: 'suggest_booking',
      recommended_disposition: 'request_more_info',
      summary_for_team: 'Ready for booking',
      lead_heat: 'warm',
      should_suggest_booking: false,
      options: null,
    })).toBe(true)
  })

  it('returns false when fewer than four intake fields are captured', () => {
    expect(shouldSuggestBookingFromStructured({
      profile_completeness: 0.28,
      fields_collected: ['nationality', 'education_level', 'field_of_interest'],
      fields_missing: ['timeline', 'budget_awareness', 'language_level', 'source'],
      academic_fit_score: null,
      financial_readiness_score: null,
      language_readiness_score: null,
      motivation_clarity_score: null,
      timeline_urgency_score: null,
      document_readiness_score: null,
      visa_complexity_score: null,
      visa_risk: null,
      housing_needed: null,
      recommended_next_step: 'continue_chat',
      recommended_disposition: 'request_more_info',
      summary_for_team: 'Need more data',
      lead_heat: 'cold',
      should_suggest_booking: false,
      options: null,
    })).toBe(false)
  })

  it('returns true when four fields are only reached cumulatively across assessments', () => {
    expect(shouldSuggestBookingFromAssessments([
      { fieldsCollected: ['nationality'] },
      { fieldsCollected: ['education_level', 'field_of_interest'] },
      { fieldsCollected: ['timeline'] },
    ])).toBe(true)
  })
})
