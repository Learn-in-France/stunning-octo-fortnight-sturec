import { describe, it, expect, vi, beforeEach } from 'vitest'

// Track calls to Prisma methods with stable (non-vi.fn) references
// so they survive restoreMocks: true
const assessmentCreateCalls: any[] = []
const leadUpdateCalls: any[] = []

// ─── Mock Groq ─────────────────────────────────────────────
vi.mock('../src/integrations/groq/index.js', () => ({
  chatCompletion: () => Promise.resolve({
    content: JSON.stringify({
      profile_completeness: 60,
      fields_collected: ['name', 'email'],
      fields_missing: ['gpa', 'budget'],
      academic_fit_score: 70,
      financial_readiness_score: 50,
      language_readiness_score: 80,
      motivation_clarity_score: 65,
      timeline_urgency_score: 40,
      document_readiness_score: 30,
      visa_complexity_score: 55,
      visa_risk: 'medium',
      housing_needed: null,
      recommended_next_step: 'collect documents',
      recommended_disposition: 'nurture',
      summary_for_team: 'Test assessment',
      options: null,
    }),
    usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
  }),
}))

vi.mock('../src/integrations/groq/prompts.js', () => ({
  BATCH_ASSESSMENT_PROMPT: 'test-prompt',
  ADVISOR_SYSTEM_PROMPT: 'test',
  buildProfileMemory: () => '',
  buildProgramContext: () => '',
}))

// ─── Mock Prisma ───────────────────────────────────────────
vi.mock('../src/lib/prisma.js', () => ({
  default: {
    aiAssessment: {
      create: (arg: any) => {
        assessmentCreateCalls.push(arg)
        return Promise.resolve({ id: 'assessment-1' })
      },
    },
    lead: {
      update: (arg: any) => {
        leadUpdateCalls.push(arg)
        return Promise.resolve({})
      },
    },
    student: { findUnique: () => Promise.resolve(null), findFirst: () => Promise.resolve(null) },
    chatSession: { findFirst: () => Promise.resolve(null), create: () => Promise.resolve({}), update: () => Promise.resolve({}) },
    chatMessage: { create: () => Promise.resolve({}), findMany: () => Promise.resolve([]) },
  },
}))

// ─── Mock queue ────────────────────────────────────────────
vi.mock('../src/lib/queue/index.js', () => {
  const add = () => Promise.resolve({ id: 'j' })
  return {
    getAiProcessingQueue: () => ({ add }),
    getLeadRoutingQueue: () => ({ add }),
    getNotificationsQueue: () => ({ add }),
    getMauticSyncQueue: () => ({ add }),
    getDocumentsQueue: () => ({ add }),
    getImportsQueue: () => ({ add }),
    getWebhooksQueue: () => ({ add }),
    getRedisConnection: () => ({ host: '127.0.0.1', port: 6379 }),
  }
})

import { assessImportedLead, assessStudent } from '../src/modules/chat/service.js'

describe('Assessment entity isolation', () => {
  beforeEach(() => {
    assessmentCreateCalls.length = 0
    leadUpdateCalls.length = 0
  })

  describe('assessImportedLead', () => {
    it('persists assessment with leadId and calls lead.update for scores', async () => {
      const leadId = 'lead-uuid-123'
      await assessImportedLead(leadId, { firstName: 'Test', email: 'a@b.com' })

      // Creates assessment with leadId
      expect(assessmentCreateCalls).toHaveLength(1)
      expect(assessmentCreateCalls[0].data.leadId).toBe(leadId)
      expect(assessmentCreateCalls[0].data).not.toHaveProperty('studentId')

      // Updates lead scores via lead.update
      expect(leadUpdateCalls).toHaveLength(1)
      expect(leadUpdateCalls[0].where.id).toBe(leadId)
    })
  })

  describe('assessStudent', () => {
    it('persists assessment with studentId, not leadId', async () => {
      const studentId = 'student-uuid-789'
      await assessStudent(studentId, { stage: 'lead_created' }, 'document', 'doc-1')

      expect(assessmentCreateCalls).toHaveLength(1)
      expect(assessmentCreateCalls[0].data.studentId).toBe(studentId)
      expect(assessmentCreateCalls[0].data).not.toHaveProperty('leadId')
    })

    it('does NOT call lead.update', async () => {
      await assessStudent('student-uuid-789', { stage: 'x' }, 'manual_review', 'lead-1')
      expect(leadUpdateCalls).toHaveLength(0)
    })

    it('sets correct sourceType on assessment', async () => {
      await assessStudent('student-1', {}, 'document', 'doc-1')
      expect(assessmentCreateCalls[0].data.sourceType).toBe('document')

      assessmentCreateCalls.length = 0

      await assessStudent('student-2', {}, 'manual_review', 'lead-1')
      expect(assessmentCreateCalls[0].data.sourceType).toBe('manual_review')
    })

    it('sets sourceId on assessment', async () => {
      await assessStudent('student-1', {}, 'document', 'doc-42')
      expect(assessmentCreateCalls[0].data.sourceId).toBe('doc-42')
    })
  })

  describe('no cross-wiring', () => {
    it('assessImportedLead never sets studentId', async () => {
      await assessImportedLead('lead-1', { firstName: 'A' })
      expect(assessmentCreateCalls[0].data).not.toHaveProperty('studentId')
    })

    it('assessStudent never sets leadId or calls lead.update', async () => {
      await assessStudent('student-1', {}, 'document', 'doc-1')
      expect(leadUpdateCalls).toHaveLength(0)
      expect(assessmentCreateCalls[0].data).not.toHaveProperty('leadId')
    })
  })
})
