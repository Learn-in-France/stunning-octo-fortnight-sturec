import { beforeEach, describe, expect, it, vi } from 'vitest'

const assessImportedLeadCalls: Array<[string, Record<string, unknown>]> = []
const assessStudentCalls: Array<[string, Record<string, unknown>, string, string]> = []
const generateAssessmentCalls: Array<[string, string, string | null]> = []

let capturedProcessor:
  | ((job: { id?: string; data: Record<string, unknown> }) => Promise<unknown>)
  | null = null

let leadFindUniqueImpl: (arg: any) => Promise<any> = async () => null
let studentFindUniqueImpl: (arg: any) => Promise<any> = async () => null
let chatSessionFindFirstImpl: (arg: any) => Promise<any> = async () => null
let aiAssessmentFindFirstImpl: (arg: any) => Promise<any> = async () => null
const leadRoutingAddCalls: any[] = []

vi.mock('bullmq', () => ({
  Worker: class MockWorker {
    constructor(
      _name: string,
      processor: (job: { id?: string; data: Record<string, unknown> }) => Promise<unknown>,
    ) {
      capturedProcessor = processor
    }

    on() {
      return this
    }
  },
}))

vi.mock('../src/modules/chat/service.js', () => ({
  assessImportedLead: (leadId: string, profileData: Record<string, unknown>) => {
    assessImportedLeadCalls.push([leadId, profileData])
    return Promise.resolve()
  },
  assessStudent: (
    studentId: string,
    profileData: Record<string, unknown>,
    sourceType: string,
    sourceId: string,
  ) => {
    assessStudentCalls.push([studentId, profileData, sourceType, sourceId])
    return Promise.resolve()
  },
  generateAssessment: (sessionId: string, leadId: string, studentId: string | null) => {
    generateAssessmentCalls.push([sessionId, leadId, studentId])
    return Promise.resolve()
  },
}))

vi.mock('../src/lib/prisma.js', () => ({
  default: {
    lead: {
      findUnique: (arg: any) => leadFindUniqueImpl(arg),
    },
    student: {
      findUnique: (arg: any) => studentFindUniqueImpl(arg),
    },
    chatSession: {
      findFirst: (arg: any) => chatSessionFindFirstImpl(arg),
    },
    aiAssessment: {
      findFirst: (arg: any) => aiAssessmentFindFirstImpl(arg),
    },
  },
}))

vi.mock('../src/lib/queue/connection.js', () => ({
  getRedisConnection: () => ({ host: '127.0.0.1', port: 6379 }),
}))

vi.mock('../src/lib/queue/idempotency.js', () => ({
  buildIdempotencyKey: (...parts: string[]) => parts.join(':'),
  withIdempotency: async (_key: string, handler: () => Promise<unknown>) => ({
    skipped: false as const,
    result: await handler(),
  }),
}))

vi.mock('../src/lib/queue/queues.js', async () => {
  const actual = await vi.importActual('../src/lib/queue/queues.js')
  return {
    ...actual,
    getLeadRoutingQueue: () => ({
      add: (name: string, payload: unknown) => {
        leadRoutingAddCalls.push({ name, payload })
        return Promise.resolve({ id: 'lead-route-job' })
      },
    }),
  }
})

import { startAiProcessingWorker } from '../src/workers/ai-processing.worker.js'

describe('AI processing worker booking summary paths', () => {
  beforeEach(() => {
    assessImportedLeadCalls.length = 0
    assessStudentCalls.length = 0
    generateAssessmentCalls.length = 0
    leadRoutingAddCalls.length = 0
    capturedProcessor = null

    leadFindUniqueImpl = async () => null
    studentFindUniqueImpl = async () => null
    chatSessionFindFirstImpl = async () => null
    aiAssessmentFindFirstImpl = async () => null
  })

  it('uses latest chat session when booking entity has prior chat', async () => {
    studentFindUniqueImpl = async (arg) => {
      if (arg.select?.userId) return { userId: 'user-1' }
      return null
    }

    let chatLookupCount = 0
    chatSessionFindFirstImpl = async () => {
      chatLookupCount += 1
      if (chatLookupCount === 1) {
        return {
          id: 'session-1',
          leadId: 'lead-1',
          studentId: 'student-1',
        }
      }
      return null
    }

    aiAssessmentFindFirstImpl = async () => ({ id: 'assessment-1' })

    startAiProcessingWorker()
    expect(capturedProcessor).toBeTruthy()

    await capturedProcessor!({
      id: 'job-1',
      data: {
        entityType: 'student',
        entityId: 'student-1',
        sourceType: 'booking',
        sourceId: 'booking-1',
      },
    })

    expect(generateAssessmentCalls).toEqual([['session-1', 'lead-1', 'student-1']])
    expect(assessImportedLeadCalls).toHaveLength(0)
    expect(assessStudentCalls).toHaveLength(0)
  })

  it('falls back to lead profile assessment when booking lead has no chat session', async () => {
    let leadLookupCount = 0
    leadFindUniqueImpl = async (arg) => {
      leadLookupCount += 1
      if (leadLookupCount === 1 && arg.select?.userId) return { userId: 'user-2' }
      return {
        firstName: 'Ava',
        lastName: 'Stone',
        email: 'ava@example.com',
        phone: '+33123456789',
        notes: 'Needs support',
        source: 'marketing',
      }
    }

    chatSessionFindFirstImpl = async () => null
    aiAssessmentFindFirstImpl = async () => ({ id: 'assessment-2' })

    startAiProcessingWorker()
    expect(capturedProcessor).toBeTruthy()

    await capturedProcessor!({
      id: 'job-2',
      data: {
        entityType: 'lead',
        entityId: 'lead-2',
        sourceType: 'booking',
        sourceId: 'booking-2',
      },
    })

    expect(assessImportedLeadCalls).toHaveLength(1)
    expect(assessImportedLeadCalls[0][0]).toBe('lead-2')
    expect(assessImportedLeadCalls[0][1]).toMatchObject({
      firstName: 'Ava',
      source: 'marketing',
    })
    expect(generateAssessmentCalls).toHaveLength(0)
    expect(assessStudentCalls).toHaveLength(0)
  })

  it('falls back to student profile assessment when booking student has no chat session', async () => {
    let studentLookupCount = 0
    studentFindUniqueImpl = async (arg) => {
      studentLookupCount += 1
      if (studentLookupCount === 1 && arg.select?.userId) return { userId: 'user-3' }
      return {
        id: 'student-3',
        source: 'form',
        sourcePartner: null,
        stage: 'qualified',
        userId: 'user-3',
      }
    }

    chatSessionFindFirstImpl = async () => null

    startAiProcessingWorker()
    expect(capturedProcessor).toBeTruthy()

    await capturedProcessor!({
      id: 'job-3',
      data: {
        entityType: 'student',
        entityId: 'student-3',
        sourceType: 'booking',
        sourceId: 'booking-3',
      },
    })

    expect(assessStudentCalls).toHaveLength(1)
    expect(assessStudentCalls[0][0]).toBe('student-3')
    expect(assessStudentCalls[0][2]).toBe('booking')
    expect(assessStudentCalls[0][3]).toBe('booking-3')
    expect(generateAssessmentCalls).toHaveLength(0)
    expect(assessImportedLeadCalls).toHaveLength(0)
  })
})
