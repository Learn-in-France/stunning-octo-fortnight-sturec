import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock firebase
vi.mock('../src/integrations/firebase/index.js', () => ({
  verifyFirebaseToken: vi.fn(),
  initFirebase: vi.fn(),
  AuthError: class AuthError extends Error {
    code: string
    statusCode: number
    constructor(message: string, code: string, statusCode: number) {
      super(message)
      this.name = 'AuthError'
      this.code = code
      this.statusCode = statusCode
    }
  },
}))

// Mock Groq integration
vi.mock('../src/integrations/groq/index.js', () => ({
  chatCompletion: vi.fn().mockResolvedValue({
    content: 'Hello! ```json\n{"summary_for_team":"test","options":null}\n```',
    usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
  }),
}))

// Mock GCS integration — use stable functions (not vi.fn) to survive restoreMocks
vi.mock('../src/integrations/gcs/index.js', () => ({
  generateSignedUploadUrl: () => 'https://storage.googleapis.com/test-upload-url',
  generateSignedDownloadUrl: () => 'https://storage.googleapis.com/test-download-url',
  getObjectMetadata: () => Promise.resolve({ size: 12345, contentType: 'application/pdf' }),
}))

// Mock queue modules (lazy-init, avoid Redis connections in tests)
// Use a stable add() implementation that won't be cleared by restoreMocks
const stableAdd = (..._args: any[]) => Promise.resolve({ id: 'test-job-id' })
vi.mock('../src/lib/queue/index.js', () => {
  const add = (..._args: any[]) => Promise.resolve({ id: 'test-job-id' })
  const jobCounts = () => Promise.resolve({ waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 })
  const getJobs = () => Promise.resolve([])
  const isPaused = () => Promise.resolve(false)
  const pause = () => Promise.resolve()
  const resume = () => Promise.resolve()
  const getJob = (id: string) => Promise.resolve(id === 'existing-job' ? {
    id: 'existing-job', name: 'test-job', data: { foo: 'bar' },
    getState: () => Promise.resolve('failed'),
    attemptsMade: 2, failedReason: 'test error', stacktrace: [],
    timestamp: Date.now(), processedOn: Date.now(), finishedOn: null,
    retry: () => Promise.resolve(),
  } : null)
  const q = () => ({ add, getJobCounts: jobCounts, getFailed: getJobs, getWaiting: getJobs, isPaused, pause, resume, getJob })
  return {
    getNotificationsQueue: q,
    getMauticSyncQueue: q,
    getDocumentsQueue: q,
    getAiProcessingQueue: q,
    getLeadRoutingQueue: q,
    getImportsQueue: q,
    getWebhooksQueue: q,
    getRedisConnection: () => ({ host: '127.0.0.1', port: 6379 }),
  }
})

// Mock Prisma with all models used by Phase 2 modules
vi.mock('../src/lib/prisma.js', () => {
  const m = () => ({
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    groupBy: vi.fn(),
    delete: vi.fn(),
  })
  return {
    default: {
      $queryRaw: (..._args: any[]) => Promise.resolve([{ '?column?': 1 }]),
      user: m(),
      lead: m(),
      student: m(),
      stageTransition: m(),
      studentAssignment: m(),
      counsellorNote: m(),
      counsellorActivityLog: m(),
      studentContact: m(),
      consentEvent: m(),
      aiAssessment: m(),
      application: m(),
      document: m(),
      studentDocumentRequirement: m(),
      university: m(),
      program: m(),
      programIntake: m(),
      visaRequirement: m(),
      eligibilityRule: m(),
      campusFrancePrep: m(),
      booking: m(),
      notificationLog: m(),
      meetingOutcomeLog: m(),
      counsellorReminder: m(),
      campaignTemplate: m(),
      campaignPack: m(),
      campaignPackStep: m(),
      studentCampaign: m(),
      studentCampaignStep: m(),
      chatSession: m(),
      chatMessage: m(),
      mauticSyncLog: m(),
      opsAuditLog: m(),
    },
  }
})

import { verifyFirebaseToken } from '../src/integrations/firebase/index.js'
import prisma from '../src/lib/prisma.js'
import { createFullTestApp, TEST_FIREBASE_TOKEN } from './helpers.js'

const mockVerify = verifyFirebaseToken as ReturnType<typeof vi.fn>
const db = prisma as any

// ─── Test users ──────────────────────────────────────────────

const ADMIN_USER: Record<string, any> = {
  id: '00000000-0000-0000-0000-000000000001',
  firebaseUid: 'fb-admin',
  email: 'admin@test.com',
  role: 'admin',
  firstName: 'Admin',
  lastName: 'User',
  phone: null,
  avatarUrl: null,
  status: 'active',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
}

const COUNSELLOR_USER: Record<string, any> = {
  id: '00000000-0000-0000-0000-000000000002',
  firebaseUid: 'fb-counsellor',
  email: 'counsellor@test.com',
  role: 'counsellor',
  firstName: 'Counsellor',
  lastName: 'User',
  phone: null,
  avatarUrl: null,
  status: 'active',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
}

const STUDENT_USER: Record<string, any> = {
  id: '00000000-0000-0000-0000-000000000003',
  firebaseUid: 'fb-student',
  email: 'student@test.com',
  role: 'student',
  firstName: 'Student',
  lastName: 'User',
  phone: null,
  avatarUrl: null,
  status: 'active',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
}

// ─── Helpers ─────────────────────────────────────────────────

function authAs(user: typeof ADMIN_USER) {
  mockVerify.mockResolvedValue({ uid: user.firebaseUid, email: user.email })
  db.user.findFirst.mockResolvedValue(user)
}

function authHeaders() {
  return { authorization: `Bearer ${TEST_FIREBASE_TOKEN}` }
}

// ─── Tests ───────────────────────────────────────────────────

describe('Route-level smoke tests', () => {
  let app: Awaited<ReturnType<typeof createFullTestApp>>

  beforeEach(async () => {
    app = await createFullTestApp()
    vi.clearAllMocks()
  })

  afterEach(async () => {
    await app.close()
  })

  // ─── Auth gates ────────────────────────────────────────────

  describe('Auth gates (401 without token)', () => {
    const protectedRoutes = [
      ['GET', '/api/v1/leads'],
      ['GET', '/api/v1/students'],
      ['GET', '/api/v1/applications'],
      ['GET', '/api/v1/team'],
    ]

    it.each(protectedRoutes)('%s %s returns 401 without auth', async (method, url) => {
      const response = await app.inject({ method: method as any, url })
      expect(response.statusCode).toBe(401)
    })
  })

  // ─── RBAC gates ────────────────────────────────────────────

  describe('RBAC gates', () => {
    it('student cannot access GET /leads', async () => {
      authAs(STUDENT_USER)

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/leads',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(403)
    })

    it('student cannot access GET /team', async () => {
      authAs(STUDENT_USER)

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/team',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(403)
    })

    it('counsellor cannot access POST /team/invite', async () => {
      authAs(COUNSELLOR_USER)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/team/invite',
        headers: authHeaders(),
        payload: { email: 'new@test.com', firstName: 'New', lastName: 'User', role: 'counsellor' },
      })

      expect(response.statusCode).toBe(403)
    })

    it('student cannot access POST /students/:id/stage', async () => {
      authAs(STUDENT_USER)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/students/00000000-0000-0000-0000-000000000010/stage',
        headers: authHeaders(),
        payload: { toStage: 'qualified' },
      })

      expect(response.statusCode).toBe(403)
    })

    it('counsellor cannot access POST /students/:id/assign', async () => {
      authAs(COUNSELLOR_USER)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/students/00000000-0000-0000-0000-000000000010/assign',
        headers: authHeaders(),
        payload: { counsellorId: '00000000-0000-0000-0000-000000000002' },
      })

      expect(response.statusCode).toBe(403)
    })

    it('student cannot access GET /students/:id', async () => {
      authAs(STUDENT_USER)

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/students/00000000-0000-0000-0000-000000000010',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(403)
    })

    it('student cannot access generic student documents route', async () => {
      authAs(STUDENT_USER)

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/students/00000000-0000-0000-0000-000000000010/documents',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(403)
    })
  })

  // ─── Public catalog ────────────────────────────────────────

  describe('Public catalog (no auth)', () => {
    it('GET /public/universities returns 200', async () => {
      db.university.findMany.mockResolvedValue([])
      db.university.count.mockResolvedValue(0)

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/public/universities',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toHaveProperty('items')
      expect(body).toHaveProperty('total')
    })

    it('GET /public/programs returns 200', async () => {
      db.program.findMany.mockResolvedValue([])
      db.program.count.mockResolvedValue(0)

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/public/programs',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toHaveProperty('items')
    })
  })

  // ─── Leads ────────────────────────────────────────────────

  describe('Leads module', () => {
    it('GET /leads returns paginated list for admin', async () => {
      authAs(ADMIN_USER)
      db.lead.findMany.mockResolvedValue([])
      db.lead.count.mockResolvedValue(0)

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/leads',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toHaveProperty('items')
      expect(body).toHaveProperty('total', 0)
    })

    it('GET /students/:id/case-log returns aggregated internal trail', async () => {
      authAs(COUNSELLOR_USER)
      db.stageTransition.findMany.mockResolvedValue([
        {
          id: '00000000-0000-0000-0000-000000000401',
          fromStage: 'lead_created',
          toStage: 'qualified',
          changedByType: 'user',
          changedByUserId: COUNSELLOR_USER.id,
          reasonCode: 'meeting_outcome',
          reasonNote: 'Student is ready to move forward',
          timestamp: new Date('2026-04-01T10:00:00Z'),
          changedByUser: { firstName: 'Sarah', lastName: 'Counsellor' },
        },
      ])
      db.counsellorNote.findMany.mockResolvedValue([])
      db.counsellorActivityLog.findMany.mockResolvedValue([])
      db.meetingOutcomeLog.findMany.mockResolvedValue([])
      db.counsellorReminder.findMany.mockResolvedValue([])
      db.studentAssignment.findMany.mockResolvedValue([])

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/students/00000000-0000-0000-0000-000000000010/case-log',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toHaveLength(1)
      expect(body[0]).toMatchObject({
        kind: 'stage_change',
        status: 'qualified',
      })
    })

    it('POST /leads creates a lead', async () => {
      authAs(ADMIN_USER)

      const newLead = {
        id: '00000000-0000-0000-0000-000000000020',
        email: 'newlead@test.com',
        phone: null,
        firstName: 'New',
        lastName: 'Lead',
        source: 'manual',
        sourcePartner: null,
        status: 'new_lead',
        qualificationScore: null,
        priorityLevel: null,
        profileCompleteness: null,
        assignedCounsellorId: null,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        userId: null,
        notes: null,
        mauticContactId: null,
        convertedStudentId: null,
        qualifiedAt: null,
        priorityUpdatedAt: null,
        createdByUserId: ADMIN_USER.id,
        deletedAt: null,
      }

      db.lead.create.mockResolvedValue(newLead)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/leads',
        headers: authHeaders(),
        payload: {
          email: 'newlead@test.com',
          firstName: 'New',
          source: 'manual',
        },
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body.email).toBe('newlead@test.com')
    })
  })

  // ─── Students ──────────────────────────────────────────────

  describe('Students module', () => {
    it('GET /students returns paginated list for admin', async () => {
      authAs(ADMIN_USER)
      db.student.findMany.mockResolvedValue([])
      db.student.count.mockResolvedValue(0)

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/students',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toHaveProperty('items')
      expect(body).toHaveProperty('total', 0)
    })

    it('GET /students/:id returns 404 for missing student', async () => {
      authAs(ADMIN_USER)
      db.student.findFirst.mockResolvedValue(null)

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/students/00000000-0000-0000-0000-000000000010',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(404)
    })

    it('GET /students/:id/notes returns paginated notes', async () => {
      authAs(COUNSELLOR_USER)
      db.counsellorNote.findMany.mockResolvedValue([])
      db.counsellorNote.count.mockResolvedValue(0)

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/students/00000000-0000-0000-0000-000000000010/notes',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toHaveProperty('items')
      expect(body).toHaveProperty('total', 0)
    })

    it('GET /students/:id/contacts returns contacts list', async () => {
      authAs(ADMIN_USER)
      db.studentContact.findMany.mockResolvedValue([])

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/students/00000000-0000-0000-0000-000000000010/contacts',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.body)).toEqual([])
    })

    it('GET /students/:id/consents returns consents list', async () => {
      authAs(ADMIN_USER)
      db.consentEvent.findMany.mockResolvedValue([])

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/students/00000000-0000-0000-0000-000000000010/consents',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.body)).toEqual([])
    })
  })

  // ─── Applications ─────────────────────────────────────────

  describe('Applications module', () => {
    it('GET /students/:id/applications returns list', async () => {
      authAs(ADMIN_USER)
      db.application.findMany.mockResolvedValue([])

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/students/00000000-0000-0000-0000-000000000010/applications',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.body)).toEqual([])
    })

    it('GET /applications returns paginated list for admin', async () => {
      authAs(ADMIN_USER)
      db.application.findMany.mockResolvedValue([])
      db.application.count.mockResolvedValue(0)

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/applications',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toHaveProperty('items')
      expect(body).toHaveProperty('total', 0)
    })

    it('PATCH /applications/:id returns 404 for missing application', async () => {
      authAs(ADMIN_USER)
      db.application.findUnique.mockResolvedValue(null)

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/applications/00000000-0000-0000-0000-000000000010',
        headers: authHeaders(),
        payload: { status: 'submitted' },
      })

      expect(response.statusCode).toBe(404)
    })
  })

  // ─── Documents ─────────────────────────────────────────────

  describe('Documents module', () => {
    it('GET /students/:id/documents returns list', async () => {
      authAs(ADMIN_USER)
      db.document.findMany.mockResolvedValue([])

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/students/00000000-0000-0000-0000-000000000010/documents',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.body)).toEqual([])
    })

    it('POST /documents/:id/verify returns 404 for missing document', async () => {
      authAs(ADMIN_USER)
      db.document.findFirst.mockResolvedValue(null)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/documents/00000000-0000-0000-0000-000000000010/verify',
        headers: authHeaders(),
        payload: {},
      })

      expect(response.statusCode).toBe(404)
    })

    it('GET /students/:id/document-requirements returns list', async () => {
      authAs(ADMIN_USER)
      db.studentDocumentRequirement.findMany.mockResolvedValue([])

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/students/00000000-0000-0000-0000-000000000010/document-requirements',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.body)).toEqual([])
    })


    it('GET /students/:id/ai-assessments includes converted lead assessments', async () => {
      authAs(COUNSELLOR_USER)
      db.aiAssessment.findMany.mockResolvedValue([])

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/students/00000000-0000-0000-0000-000000000010/ai-assessments',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.body)).toEqual([])
      expect(db.aiAssessment.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { studentId: '00000000-0000-0000-0000-000000000010' },
            { lead: { convertedStudentId: '00000000-0000-0000-0000-000000000010' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
      })
    })
  })

  // ─── Team ──────────────────────────────────────────────────

  describe('Team module', () => {
    it('GET /team returns team list for admin', async () => {
      authAs(ADMIN_USER)
      db.user.findMany.mockResolvedValue([ADMIN_USER, COUNSELLOR_USER])

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/team',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toHaveLength(2)
      expect(body[0].email).toBe('admin@test.com')
    })

    it('POST /team/invite creates invited user', async () => {
      authAs(ADMIN_USER)

      const invitedUser = {
        id: '00000000-0000-0000-0000-000000000050',
        firebaseUid: 'pending_123',
        email: 'new@test.com',
        role: 'counsellor',
        firstName: 'New',
        lastName: 'Counsellor',
        phone: null,
        avatarUrl: null,
        status: 'invited',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      }

      db.user.create.mockResolvedValue(invitedUser)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/team/invite',
        headers: authHeaders(),
        payload: {
          email: 'new@test.com',
          firstName: 'New',
          lastName: 'Counsellor',
          role: 'counsellor',
        },
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body.email).toBe('new@test.com')
      expect(body.status).toBe('invited')
      expect(db.user.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          inviteTokenHash: expect.any(String),
          inviteTokenExpiresAt: expect.any(Date),
        }),
      }))
    })

    it('PATCH /team/:id updates team member', async () => {
      // Auth middleware uses findFirst for user lookup, then service uses it for team member
      mockVerify.mockResolvedValue({ uid: ADMIN_USER.firebaseUid, email: ADMIN_USER.email })
      db.user.findFirst
        .mockResolvedValueOnce(ADMIN_USER)       // auth middleware
        .mockResolvedValueOnce(COUNSELLOR_USER)  // team service lookup

      const updatedUser = { ...COUNSELLOR_USER, status: 'deactivated' }
      db.user.update.mockResolvedValue(updatedUser)

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/team/${COUNSELLOR_USER.id}`,
        headers: authHeaders(),
        payload: { status: 'deactivated' },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.status).toBe('deactivated')
    })
  })

  // ─── Validation gates ──────────────────────────────────────

  describe('Validation', () => {
    it('POST /leads rejects invalid payload', async () => {
      authAs(ADMIN_USER)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/leads',
        headers: authHeaders(),
        payload: { email: 'not-an-email' },
      })

      expect(response.statusCode).toBe(400)
    })

    it('GET /students/:id rejects non-UUID param', async () => {
      authAs(ADMIN_USER)

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/students/not-a-uuid',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(400)
    })

    it('POST /team/invite rejects student role', async () => {
      authAs(ADMIN_USER)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/team/invite',
        headers: authHeaders(),
        payload: {
          email: 'test@test.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'student',
        },
      })

      expect(response.statusCode).toBe(400)
    })
  })

  // ─── Bookings ──────────────────────────────────────────────

  describe('Bookings module', () => {
    it('GET /bookings returns list for admin', async () => {
      authAs(ADMIN_USER)
      db.booking.findMany.mockResolvedValue([])

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/bookings',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.body)).toEqual([])
    })

    it('POST /bookings creates a booking', async () => {
      authAs(ADMIN_USER)

      const newBooking = {
        id: '00000000-0000-0000-0000-000000000060',
        studentId: null,
        leadId: null,
        counsellorId: '00000000-0000-0000-0000-000000000002',
        scheduledAt: new Date('2026-04-01T10:00:00Z'),
        status: 'scheduled',
        notes: null,
        createdAt: new Date('2026-03-17'),
      }

      db.booking.create.mockResolvedValue(newBooking)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/bookings',
        headers: authHeaders(),
        payload: {
          counsellorId: '00000000-0000-0000-0000-000000000002',
          scheduledAt: '2026-04-01T10:00:00Z',
        },
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body.status).toBe('scheduled')
    })

    it('POST /bookings creates unassigned booking without counsellorId', async () => {
      authAs(ADMIN_USER)

      const newBooking = {
        id: '00000000-0000-0000-0000-000000000061',
        studentId: '00000000-0000-0000-0000-000000000010',
        leadId: null,
        counsellorId: null,
        scheduledAt: new Date('2026-04-01T10:00:00Z'),
        status: 'awaiting_assignment',
        source: 'portal',
        notes: null,
        createdAt: new Date('2026-03-17'),
      }

      db.booking.create.mockResolvedValue(newBooking)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/bookings',
        headers: authHeaders(),
        payload: {
          studentId: '00000000-0000-0000-0000-000000000010',
          scheduledAt: '2026-04-01T10:00:00Z',
          source: 'portal',
        },
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body.status).toBe('awaiting_assignment')
      expect(body.counsellorId).toBeNull()
    })

    it('POST /bookings for student ignores foreign IDs and uses authenticated student record', async () => {
      authAs(STUDENT_USER)
      db.student.findFirst.mockResolvedValue({
        id: '00000000-0000-0000-0000-000000000010',
        userId: STUDENT_USER.id,
        assignedCounsellorId: '00000000-0000-0000-0000-000000000002',
        deletedAt: null,
      })
      db.booking.create.mockResolvedValue({
        id: '00000000-0000-0000-0000-000000000062',
        studentId: '00000000-0000-0000-0000-000000000010',
        leadId: null,
        counsellorId: '00000000-0000-0000-0000-000000000002',
        scheduledAt: new Date('2026-04-01T10:00:00Z'),
        status: 'assigned',
        source: 'chat',
        notes: 'hello',
        createdAt: new Date('2026-03-17'),
      })

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/bookings',
        headers: authHeaders(),
        payload: {
          studentId: '00000000-0000-0000-0000-000000009999',
          leadId: '00000000-0000-0000-0000-000000008888',
          counsellorId: '00000000-0000-0000-0000-000000007777',
          scheduledAt: '2026-04-01T10:00:00Z',
          source: 'chat',
          notes: 'hello',
        },
      })

      expect(response.statusCode).toBe(201)
      expect(db.booking.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          studentId: '00000000-0000-0000-0000-000000000010',
          leadId: undefined,
          counsellorId: '00000000-0000-0000-0000-000000000002',
          source: 'chat',
          status: 'assigned',
        }),
      }))
    })

    it('PATCH /bookings/:id returns 404 for missing booking', async () => {
      authAs(ADMIN_USER)
      db.booking.findUnique.mockResolvedValue(null)

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/bookings/00000000-0000-0000-0000-000000000060',
        headers: authHeaders(),
        payload: { status: 'completed' },
      })

      expect(response.statusCode).toBe(404)
    })

    it('student cannot PATCH bookings', async () => {
      authAs(STUDENT_USER)

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/bookings/00000000-0000-0000-0000-000000000060',
        headers: authHeaders(),
        payload: { status: 'completed' },
      })

      expect(response.statusCode).toBe(403)
    })
  })

  // ─── Campaigns ─────────────────────────────────────────────

  describe('Campaigns module', () => {
    it('GET /campaign-templates returns list for admin', async () => {
      authAs(ADMIN_USER)
      db.campaignTemplate.findMany.mockResolvedValue([])

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/campaign-templates',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.body)).toEqual([])
    })

    it('POST /campaign-templates creates template for admin', async () => {
      authAs(ADMIN_USER)
      db.campaignTemplate.create.mockResolvedValue({
        id: '00000000-0000-0000-0000-0000000000a1',
        name: 'Welcome Email',
        phaseKey: 'onboarding',
        channel: 'email',
        deliveryMode: 'direct_email',
        templateKey: 'welcome_email',
        active: true,
        defaultDelayDays: 0,
      })

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/campaign-templates',
        headers: authHeaders(),
        payload: {
          name: 'Welcome Email',
          phaseKey: 'onboarding',
          channel: 'email',
          templateKey: 'welcome_email',
        },
      })

      expect(response.statusCode).toBe(201)
      expect(JSON.parse(response.body).name).toBe('Welcome Email')
    })

    it('student cannot access campaign templates', async () => {
      authAs(STUDENT_USER)

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/campaign-templates',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(403)
    })

    it('GET /campaign-packs returns packs for admin', async () => {
      authAs(ADMIN_USER)
      db.campaignPack.findMany.mockResolvedValue([])

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/campaign-packs',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(200)
    })

    it('GET /campaign-packs returns packs for counsellor', async () => {
      authAs(COUNSELLOR_USER)
      db.campaignPack.findMany.mockResolvedValue([])

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/campaign-packs',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(200)
    })

    it('GET /students/:id/campaigns returns campaigns for counsellor', async () => {
      authAs(COUNSELLOR_USER)
      db.studentCampaign.findMany.mockResolvedValue([])

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/students/00000000-0000-0000-0000-000000000010/campaigns',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(200)
    })

    it('POST /students/:id/campaigns/start starts campaign', async () => {
      authAs(COUNSELLOR_USER)
      db.campaignPack.findUnique.mockResolvedValue({
        id: '00000000-0000-0000-0000-0000000000b1',
        phaseKey: 'onboarding',
        steps: [{ templateId: '00000000-0000-0000-0000-0000000000a1', orderIndex: 0, delayDays: 0 }],
      })
      db.studentCampaign.create.mockResolvedValue({
        id: '00000000-0000-0000-0000-0000000000c1',
        studentId: '00000000-0000-0000-0000-000000000010',
        counsellorId: COUNSELLOR_USER.id,
        packId: '00000000-0000-0000-0000-0000000000b1',
        phaseKey: 'onboarding',
        mode: 'manual',
        status: 'active',
      })
      db.studentCampaignStep.createMany.mockResolvedValue({ count: 1 })
      db.studentCampaign.findUnique.mockResolvedValue({
        id: '00000000-0000-0000-0000-0000000000c1',
        status: 'active',
        mode: 'manual',
        pack: { name: 'Onboarding Pack' },
        steps: [],
      })

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/students/00000000-0000-0000-0000-000000000010/campaigns/start',
        headers: authHeaders(),
        payload: { packId: '00000000-0000-0000-0000-0000000000b1' },
      })

      expect(response.statusCode).toBe(201)
      expect(JSON.parse(response.body).status).toBe('active')
    })

    it('student cannot start campaigns', async () => {
      authAs(STUDENT_USER)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/students/00000000-0000-0000-0000-000000000010/campaigns/start',
        headers: authHeaders(),
        payload: { packId: '00000000-0000-0000-0000-0000000000b1' },
      })

      expect(response.statusCode).toBe(403)
    })

    it('POST /students/:id/campaigns/:campaignId/pause pauses campaign', async () => {
      authAs(COUNSELLOR_USER)
      db.studentCampaign.findUnique.mockResolvedValue({
        id: '00000000-0000-0000-0000-0000000000c1',
        studentId: '00000000-0000-0000-0000-000000000010',
        status: 'active',
      })
      db.studentCampaign.update.mockResolvedValue({
        id: '00000000-0000-0000-0000-0000000000c1',
        status: 'paused',
        pausedAt: new Date(),
      })

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/students/00000000-0000-0000-0000-000000000010/campaigns/00000000-0000-0000-0000-0000000000c1/pause',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.body).status).toBe('paused')
    })

    it('POST /students/:id/campaigns/:campaignId/resume resumes campaign', async () => {
      authAs(COUNSELLOR_USER)
      db.studentCampaign.findUnique.mockResolvedValue({
        id: '00000000-0000-0000-0000-0000000000c1',
        studentId: '00000000-0000-0000-0000-000000000010',
        status: 'paused',
      })
      db.studentCampaign.update.mockResolvedValue({
        id: '00000000-0000-0000-0000-0000000000c1',
        status: 'active',
      })

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/students/00000000-0000-0000-0000-000000000010/campaigns/00000000-0000-0000-0000-0000000000c1/resume',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.body).status).toBe('active')
    })

    it('PATCH /students/:id/campaigns/:campaignId/mode updates mode', async () => {
      authAs(COUNSELLOR_USER)
      db.studentCampaign.findUnique.mockResolvedValue({
        id: '00000000-0000-0000-0000-0000000000c1',
        studentId: '00000000-0000-0000-0000-000000000010',
        status: 'active',
        mode: 'manual',
        steps: [],
        pack: {},
      })
      db.studentCampaign.update.mockResolvedValue({
        id: '00000000-0000-0000-0000-0000000000c1',
        mode: 'automated',
      })

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/students/00000000-0000-0000-0000-000000000010/campaigns/00000000-0000-0000-0000-0000000000c1/mode',
        headers: authHeaders(),
        payload: { mode: 'automated' },
      })

      expect(response.statusCode).toBe(200)
    })

    it('GET /students/:id/campaign-history returns history', async () => {
      authAs(COUNSELLOR_USER)
      db.studentCampaignStep.findMany.mockResolvedValue([])

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/students/00000000-0000-0000-0000-000000000010/campaign-history',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.body)).toEqual([])
    })

    it('pause returns 404 for wrong studentId', async () => {
      authAs(COUNSELLOR_USER)
      db.studentCampaign.findUnique.mockResolvedValue({
        id: '00000000-0000-0000-0000-0000000000c1',
        studentId: '00000000-0000-0000-0000-999999999999',
        status: 'active',
      })

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/students/00000000-0000-0000-0000-000000000010/campaigns/00000000-0000-0000-0000-0000000000c1/pause',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(404)
    })
  })

  // ─── Counsellor ────────────────────────────────────────────

  describe('Counsellor module', () => {
    it('GET /counsellor/agenda returns agenda for counsellor', async () => {
      authAs(COUNSELLOR_USER)
      db.booking.findMany.mockResolvedValue([])
      db.counsellorReminder.findMany.mockResolvedValue([])
      db.document.findMany.mockResolvedValue([])
      db.student.findMany.mockResolvedValue([])

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/counsellor/agenda',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toHaveProperty('todayMeetings')
      expect(body).toHaveProperty('overdueReminders')
      expect(body).toHaveProperty('docsWaitingReview')
      expect(body).toHaveProperty('staleStudents')
    })

    it('POST /students/:studentId/meeting-outcome records outcome', async () => {
      authAs(COUNSELLOR_USER)
      db.meetingOutcomeLog.create.mockResolvedValue({
        id: '00000000-0000-0000-0000-000000000080',
        bookingId: '00000000-0000-0000-0000-000000000060',
        studentId: '00000000-0000-0000-0000-000000000010',
        counsellorId: COUNSELLOR_USER.id,
        outcome: 'qualified',
        nextAction: 'Submit transcripts',
        followUpDueAt: null,
        privateNote: null,
        studentVisibleNote: null,
        stageAfter: null,
        createdAt: new Date(),
      })

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/students/00000000-0000-0000-0000-000000000010/meeting-outcome',
        headers: authHeaders(),
        payload: {
          bookingId: '00000000-0000-0000-0000-000000000060',
          outcome: 'qualified',
          nextAction: 'Submit transcripts',
        },
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body.outcome).toBe('qualified')
      expect(body.nextAction).toBe('Submit transcripts')
    })

    it('GET /students/:studentId/meeting-outcomes returns list', async () => {
      authAs(COUNSELLOR_USER)
      db.meetingOutcomeLog.findMany.mockResolvedValue([])

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/students/00000000-0000-0000-0000-000000000010/meeting-outcomes',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.body)).toEqual([])
    })

    it('POST /counsellor/reminders creates a reminder', async () => {
      authAs(COUNSELLOR_USER)
      db.counsellorReminder.create.mockResolvedValue({
        id: '00000000-0000-0000-0000-000000000090',
        counsellorId: COUNSELLOR_USER.id,
        studentId: '00000000-0000-0000-0000-000000000010',
        title: 'Follow up on transcripts',
        dueAt: new Date('2026-04-10'),
        status: 'pending',
        source: 'manual',
        completedAt: null,
        createdAt: new Date(),
      })

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/counsellor/reminders',
        headers: authHeaders(),
        payload: {
          studentId: '00000000-0000-0000-0000-000000000010',
          title: 'Follow up on transcripts',
          dueAt: '2026-04-10T00:00:00.000Z',
        },
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body.title).toBe('Follow up on transcripts')
      expect(body.status).toBe('pending')
    })

    it('POST /counsellor/reminders/:id/complete marks reminder done', async () => {
      authAs(COUNSELLOR_USER)
      db.counsellorReminder.update.mockResolvedValue({
        id: '00000000-0000-0000-0000-000000000090',
        status: 'completed',
        completedAt: new Date(),
      })

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/counsellor/reminders/00000000-0000-0000-0000-000000000090/complete',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.status).toBe('completed')
    })

    it('POST /counsellor/reminders/:id/dismiss dismisses reminder', async () => {
      authAs(COUNSELLOR_USER)
      db.counsellorReminder.update.mockResolvedValue({
        id: '00000000-0000-0000-0000-000000000090',
        status: 'dismissed',
      })

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/counsellor/reminders/00000000-0000-0000-0000-000000000090/dismiss',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.status).toBe('dismissed')
    })

    it('student cannot access counsellor agenda', async () => {
      authAs(STUDENT_USER)

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/counsellor/agenda',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(403)
    })
  })

  // ─── Analytics ─────────────────────────────────────────────

  describe('Analytics module', () => {
    it('GET /analytics/overview returns data for admin', async () => {
      authAs(ADMIN_USER)
      db.lead.groupBy.mockResolvedValue([])
      db.lead.count.mockResolvedValue(0)
      db.student.groupBy.mockResolvedValue([])
      db.student.count.mockResolvedValue(0)
      db.application.groupBy.mockResolvedValue([])
      db.document.groupBy.mockResolvedValue([])
      db.booking.groupBy.mockResolvedValue([])

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/analytics/overview',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toHaveProperty('period')
      expect(body).toHaveProperty('data')
      expect(body.data).toHaveProperty('leads')
      expect(body.data).toHaveProperty('students')
      expect(body.data).toHaveProperty('applications')
    })

    it('GET /analytics/pipeline returns funnel for counsellor', async () => {
      authAs(COUNSELLOR_USER)
      db.student.groupBy.mockResolvedValue([])

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/analytics/pipeline',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toHaveProperty('data')
      expect(body.data).toHaveProperty('funnel')
      expect(body.data.funnel).toHaveLength(13) // 13 stages
    })

    it('student cannot access analytics', async () => {
      authAs(STUDENT_USER)

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/analytics/overview',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(403)
    })

    it('student cannot access pipeline', async () => {
      authAs(STUDENT_USER)

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/analytics/pipeline',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(403)
    })

    it('GET /analytics/counsellors returns list for admin', async () => {
      authAs(ADMIN_USER)
      db.user.findMany.mockResolvedValue([])

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/analytics/counsellors',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.body)).toEqual([])
    })

    it('student cannot access counsellor analytics', async () => {
      authAs(STUDENT_USER)

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/analytics/counsellors',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(403)
    })

    it('GET /analytics/counsellors/:id returns 404 for missing counsellor', async () => {
      authAs(ADMIN_USER)
      db.user.findFirst.mockResolvedValueOnce(ADMIN_USER) // auth
        .mockResolvedValueOnce(null) // counsellor lookup

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/analytics/counsellors/00000000-0000-0000-0000-000000000099',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(404)
    })

    it('GET /analytics/students returns list for counsellor', async () => {
      authAs(COUNSELLOR_USER)
      db.student.findMany.mockResolvedValue([])

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/analytics/students',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.body)).toEqual([])
    })

    it('student cannot access student analytics', async () => {
      authAs(STUDENT_USER)

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/analytics/students',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(403)
    })

    it('GET /analytics/students/:id returns 404 for missing student', async () => {
      authAs(ADMIN_USER)
      db.student.findFirst.mockResolvedValueOnce(null) // student lookup

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/analytics/students/00000000-0000-0000-0000-000000000099',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(404)
    })
  })

  // ─── Student Portal (/students/me) ──────────────────────────

  describe('Student portal module', () => {
    const STUDENT_RECORD = {
      id: '00000000-0000-0000-0000-000000000010',
      userId: STUDENT_USER.id,
      referenceCode: 'STU-2026-00001',
      source: 'marketing',
      stage: 'counsellor_consultation',
      stageUpdatedAt: new Date('2026-03-05'),
      assignedCounsellorId: null,
      overallReadinessScore: null,
      visaRisk: null,
      academicFitScore: null,
      financialReadinessScore: null,
      lastAssessedAt: null,
      assignedAt: null,
      degreeLevel: null,
      bachelorDegree: null,
      gpa: null,
      graduationYear: null,
      workExperienceYears: null,
      studyGapYears: null,
      englishTestType: null,
      englishScore: null,
      budgetMin: null,
      budgetMax: null,
      fundingRoute: null,
      preferredCity: null,
      preferredIntake: null,
      housingNeeded: null,
      sourcePartner: null,
      whatsappConsent: false,
      emailConsent: false,
      parentInvolvement: false,
      deletedAt: null,
      createdAt: new Date('2026-02-20'),
      updatedAt: new Date('2026-03-05'),
    }

    it('GET /students/me returns own profile for student', async () => {
      authAs(STUDENT_USER)
      db.student.findFirst.mockResolvedValue(STUDENT_RECORD)

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/students/me',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toHaveProperty('referenceCode')
      expect(body).toHaveProperty('stage')
    })

    it('GET /students/me returns 404 when student has no profile', async () => {
      authAs(STUDENT_USER)
      db.student.findFirst.mockResolvedValue(null)

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/students/me',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(404)
    })

    it('admin cannot access /students/me', async () => {
      authAs(ADMIN_USER)

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/students/me',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(403)
    })

    it('GET /students/me/progress returns cumulative intake capture for student', async () => {
      authAs(STUDENT_USER)
      db.student.findFirst.mockResolvedValue(STUDENT_RECORD)
      db.lead.findFirst.mockResolvedValue({ id: '00000000-0000-0000-0000-000000000020' })
      db.document.groupBy.mockResolvedValue([])
      db.studentDocumentRequirement.count.mockResolvedValue(0)
      db.application.groupBy.mockResolvedValue([])
      db.aiAssessment.findMany.mockResolvedValue([
        { fieldsCollected: ['language_level', 'source'] },
        { fieldsCollected: ['nationality', 'education_level', 'field_of_interest', 'timeline', 'budget_awareness'] },
      ])

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/students/me/progress',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toHaveProperty('stage')
      expect(body).toHaveProperty('progressPercent')
      expect(body).toHaveProperty('completedMilestones')
      expect(body).toHaveProperty('nextActions')
      expect(body.bookingReady).toBe(true)
      expect(body.intakeCapture).toEqual({
        captured: 7,
        total: 7,
        missing: [],
      })
    })

    it('GET /students/me/applications returns applications list', async () => {
      authAs(STUDENT_USER)
      db.student.findFirst.mockResolvedValue(STUDENT_RECORD)
      db.application.findMany.mockResolvedValue([])

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/students/me/applications',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.body)).toEqual([])
    })

    it('GET /students/me/documents returns documents list', async () => {
      authAs(STUDENT_USER)
      db.student.findFirst.mockResolvedValue(STUDENT_RECORD)
      db.document.findMany.mockResolvedValue([])

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/students/me/documents',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.body)).toEqual([])
    })

    it('POST /students/me/documents/upload-url creates a signed upload request', async () => {
      authAs(STUDENT_USER)
      db.student.findFirst.mockResolvedValue(STUDENT_RECORD)
      db.document.create.mockResolvedValue({
        id: '00000000-0000-0000-0000-000000000071',
        studentId: STUDENT_RECORD.id,
        uploadedBy: STUDENT_USER.id,
        type: 'passport',
        filename: 'passport.pdf',
        gcsPath: 'students/path/passport.pdf',
        status: 'pending_upload',
        createdAt: new Date(),
      })

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/students/me/documents/upload-url',
        headers: authHeaders(),
        payload: { type: 'passport', filename: 'passport.pdf' },
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body).toHaveProperty('uploadUrl')
      expect(body).toHaveProperty('documentId')
    })

    it('POST /students/me/documents/:id/share shares a document', async () => {
      authAs(STUDENT_USER)
      db.student.findFirst.mockResolvedValue({ ...STUDENT_RECORD, assignedCounsellorId: '00000000-0000-0000-0000-000000000002' })
      db.document.findFirst.mockResolvedValue({
        id: '00000000-0000-0000-0000-000000000070',
        studentId: STUDENT_RECORD.id,
        status: 'pending',
        sharedAt: null,
        sharedWithCounsellorId: null,
        revokedAt: null,
      })
      db.document.update.mockResolvedValue({
        id: '00000000-0000-0000-0000-000000000070',
        studentId: STUDENT_RECORD.id,
        type: 'passport',
        filename: 'passport.pdf',
        status: 'pending',
        isCurrent: true,
        sharedAt: new Date(),
        sharedWithCounsellorId: '00000000-0000-0000-0000-000000000002',
        revokedAt: null,
        createdAt: new Date(),
      })

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/students/me/documents/00000000-0000-0000-0000-000000000070/share',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.sharedAt).toBeTruthy()
      expect(body.sharedWithCounsellorId).toBe('00000000-0000-0000-0000-000000000002')
    })

    it('POST /students/me/documents/:id/share fails without assigned counsellor', async () => {
      authAs(STUDENT_USER)
      db.student.findFirst.mockResolvedValue({ ...STUDENT_RECORD, assignedCounsellorId: null })

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/students/me/documents/00000000-0000-0000-0000-000000000070/share',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(404)
    })

    it('POST /students/me/documents/:id/revoke revokes a shared document', async () => {
      authAs(STUDENT_USER)
      db.student.findFirst.mockResolvedValue(STUDENT_RECORD)
      db.document.findFirst.mockResolvedValue({
        id: '00000000-0000-0000-0000-000000000070',
        studentId: STUDENT_RECORD.id,
        status: 'pending',
        sharedAt: new Date(),
        sharedWithCounsellorId: '00000000-0000-0000-0000-000000000002',
        revokedAt: null,
      })
      db.document.update.mockResolvedValue({
        id: '00000000-0000-0000-0000-000000000070',
        studentId: STUDENT_RECORD.id,
        type: 'passport',
        filename: 'passport.pdf',
        status: 'pending',
        isCurrent: true,
        sharedAt: new Date(),
        sharedWithCounsellorId: '00000000-0000-0000-0000-000000000002',
        revokedAt: new Date(),
        createdAt: new Date(),
      })

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/students/me/documents/00000000-0000-0000-0000-000000000070/revoke',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.revokedAt).toBeTruthy()
    })

    it('GET /students/me/requirements returns requirements list', async () => {
      authAs(STUDENT_USER)
      db.student.findFirst.mockResolvedValue(STUDENT_RECORD)
      db.studentDocumentRequirement.findMany.mockResolvedValue([])

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/students/me/requirements',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.body)).toEqual([])
    })

    it('GET /students/me/bookings returns bookings list', async () => {
      authAs(STUDENT_USER)
      db.student.findFirst.mockResolvedValue(STUDENT_RECORD)
      db.booking.findMany.mockResolvedValue([])

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/students/me/bookings',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.body)).toEqual([])
    })

    it('GET /students/me/notifications returns notifications list', async () => {
      authAs(STUDENT_USER)
      db.student.findFirst.mockResolvedValue(STUDENT_RECORD)
      db.notificationLog.findMany.mockResolvedValue([])

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/students/me/notifications',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.body)).toEqual([])
    })

    it('PATCH /students/me updates own profile', async () => {
      authAs(STUDENT_USER)
      db.student.findFirst
        .mockResolvedValueOnce(STUDENT_RECORD) // find for update
        .mockResolvedValueOnce(STUDENT_RECORD) // re-fetch after update
      db.student.update.mockResolvedValue(STUDENT_RECORD)

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/students/me',
        headers: authHeaders(),
        payload: { preferredCity: 'Lyon' },
      })

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.body)).toHaveProperty('stage')
    })

    it('GET /students/me/applications/:id returns 404 for missing application', async () => {
      authAs(STUDENT_USER)
      db.student.findFirst.mockResolvedValue(STUDENT_RECORD)
      db.application.findFirst.mockResolvedValue(null)

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/students/me/applications/00000000-0000-0000-0000-000000000099',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(404)
    })

    it('counsellor cannot access /students/me', async () => {
      authAs(COUNSELLOR_USER)

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/students/me/progress',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(403)
    })
  })

  // ─── Internal notifications (/users/me/notifications) ───────

  describe('Internal notifications module', () => {
    it('GET /users/me/notifications returns items and unread count', async () => {
      authAs(COUNSELLOR_USER)
      db.notificationLog.findMany.mockResolvedValue([
        {
          id: '00000000-0000-0000-0000-000000000401',
          templateKey: 'lead_assigned',
          channel: 'email',
          status: 'sent',
          readAt: null,
          sentAt: new Date('2026-03-20T08:00:00.000Z'),
          createdAt: new Date('2026-03-20T07:55:00.000Z'),
          payloadJson: { leadId: 'lead-1' },
        },
      ])
      db.notificationLog.count.mockResolvedValue(1)

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users/me/notifications',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.body)).toEqual({
        items: [
          expect.objectContaining({
            id: '00000000-0000-0000-0000-000000000401',
            templateKey: 'lead_assigned',
            readAt: null,
          }),
        ],
        unreadCount: 1,
      })
      expect(db.notificationLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: COUNSELLOR_USER.id },
          take: 20,
        }),
      )
    })

    it('PATCH /users/me/notifications/:id/read marks one notification as read', async () => {
      authAs(COUNSELLOR_USER)
      db.notificationLog.updateMany.mockResolvedValue({ count: 1 })

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/users/me/notifications/00000000-0000-0000-0000-000000000401/read',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.body)).toEqual({ ok: true })
      expect(db.notificationLog.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: '00000000-0000-0000-0000-000000000401',
            userId: COUNSELLOR_USER.id,
          },
        }),
      )
    })

    it('PATCH /users/me/notifications/read-all marks all current user notifications as read', async () => {
      authAs(COUNSELLOR_USER)
      db.notificationLog.updateMany.mockResolvedValue({ count: 3 })

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/users/me/notifications/read-all',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.body)).toEqual({ ok: true })
      expect(db.notificationLog.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: COUNSELLOR_USER.id,
            readAt: null,
          },
        }),
      )
    })

    it('student can access GET /users/me/notifications for their own inbox', async () => {
      authAs(STUDENT_USER)
      db.notificationLog.findMany.mockResolvedValue([])
      db.notificationLog.count.mockResolvedValue(0)

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users/me/notifications',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.body)).toEqual({ items: [], unreadCount: 0 })
    })
  })

  // ─── Chat module ────────────────────────────────────────────

  describe('Chat module', () => {
    it('POST /chat/sessions creates session for student', async () => {
      authAs(STUDENT_USER)
      // Lead lookup returns existing lead
      db.lead.findFirst.mockResolvedValue({
        id: '00000000-0000-0000-0000-000000000020',
        userId: STUDENT_USER.id,
      })
      // No active session
      db.chatSession.findFirst.mockResolvedValueOnce(null) // active session check
        .mockResolvedValueOnce(null) // no student record
      db.chatSession.create.mockResolvedValue({
        id: '00000000-0000-0000-0000-000000000030',
        userId: STUDENT_USER.id,
        leadId: '00000000-0000-0000-0000-000000000020',
        studentId: null,
        startedAt: new Date(),
        endedAt: null,
        status: 'active',
      })

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/chat/sessions',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body).toHaveProperty('id')
      expect(body).toHaveProperty('status', 'active')
    })

    it('admin cannot access chat', async () => {
      authAs(ADMIN_USER)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/chat/sessions',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(403)
    })

    it('GET /chat/sessions returns sessions for student', async () => {
      authAs(STUDENT_USER)
      db.chatSession.findMany.mockResolvedValue([])

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/chat/sessions',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.body)).toEqual([])
    })

    it('GET /chat/sessions/:id returns 404 for missing session', async () => {
      authAs(STUDENT_USER)
      db.chatSession.findFirst.mockResolvedValue(null)

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/chat/sessions/00000000-0000-0000-0000-000000000030',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(404)
    })

    it('POST /chat/sessions/:id/messages rejects empty content', async () => {
      authAs(STUDENT_USER)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/chat/sessions/00000000-0000-0000-0000-000000000030/messages',
        headers: authHeaders(),
        payload: { content: '' },
      })

      expect(response.statusCode).toBe(400)
    })

    it('GET /chat/sessions/:id/messages returns 404 for wrong user', async () => {
      authAs(STUDENT_USER)
      db.chatSession.findFirst.mockResolvedValue({
        id: '00000000-0000-0000-0000-000000000030',
        userId: '00000000-0000-0000-0000-999999999999', // different user
        status: 'active',
      })

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/chat/sessions/00000000-0000-0000-0000-000000000030/messages',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(404)
    })
  })

  // ─── Webhook receivers ──────────────────────────────────────

  describe('Webhook module', () => {
    it('POST /webhooks/calcom rejects missing signature', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/webhooks/calcom',
        payload: { triggerEvent: 'BOOKING_CREATED', payload: {} },
      })

      // No CALCOM_WEBHOOK_SECRET set → 500
      expect(response.statusCode).toBe(500)
    })

    it('POST /webhooks/whatsapp rejects invalid token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/webhooks/whatsapp',
        headers: { 'x-webhook-secret': 'wrong-token' },
        payload: { from: '+1234567890', message: { text: 'hi' } },
      })

      // No WHATSAPP_WEBHOOK_SECRET set → 500
      expect(response.statusCode).toBe(500)
    })

    it('POST /webhooks/mautic rejects invalid token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/webhooks/mautic',
        headers: { 'x-mautic-webhook-secret': 'wrong-token' },
        payload: {},
      })

      // No MAUTIC_WEBHOOK_SECRET set → 500
      expect(response.statusCode).toBe(500)
    })

    it('GET /documents/:id/download returns signed URL', async () => {
      authAs(ADMIN_USER)
      db.document.findFirst.mockResolvedValue({
        id: '00000000-0000-0000-0000-000000000070',
        gcsPath: 'students/test/doc.pdf',
        studentId: '00000000-0000-0000-0000-000000000010',
        deletedAt: null,
      })

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/documents/00000000-0000-0000-0000-000000000070/download',
        headers: authHeaders(),
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toHaveProperty('downloadUrl')
      expect(body.downloadUrl).toContain('storage.googleapis.com')
    })
  })

  describe('Ops module', () => {
    it('GET /ops/queues requires admin role', async () => {
      authAs(COUNSELLOR_USER)
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/ops/queues',
        headers: authHeaders(),
      })
      expect(response.statusCode).toBe(403)
    })

    it('GET /ops/queues returns queue stats for admin', async () => {
      authAs(ADMIN_USER)
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/ops/queues',
        headers: authHeaders(),
      })
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.queues).toBeInstanceOf(Array)
      expect(body.queues.length).toBe(7)
      expect(body.queues[0]).toHaveProperty('name')
      expect(body.queues[0]).toHaveProperty('waiting')
      expect(body.queues[0]).toHaveProperty('active')
    })

    it('GET /ops/queues/:name returns detail for admin', async () => {
      authAs(ADMIN_USER)
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/ops/queues/ai-processing',
        headers: authHeaders(),
      })
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.name).toBe('ai-processing')
      expect(body).toHaveProperty('recentFailed')
      expect(body).toHaveProperty('nextWaiting')
    })

    it('GET /ops/queues/:name returns 404 for unknown queue', async () => {
      authAs(ADMIN_USER)
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/ops/queues/nonexistent',
        headers: authHeaders(),
      })
      expect(response.statusCode).toBe(404)
    })

    it('GET /ops/integrations returns health checks for admin', async () => {
      authAs(ADMIN_USER)
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/ops/integrations',
        headers: authHeaders(),
      })
      // May be 200 or 503 depending on env — just check structure
      const body = JSON.parse(response.body)
      expect(body).toHaveProperty('status')
      expect(body).toHaveProperty('checks')
      expect(body.checks).toBeInstanceOf(Array)
    })

    it('POST /ops/queues/:name/retry requires admin', async () => {
      authAs(COUNSELLOR_USER)
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/ops/queues/ai-processing/retry',
        headers: authHeaders(),
      })
      expect(response.statusCode).toBe(403)
    })

    it('POST /ops/queues/:name/pause pauses queue for admin', async () => {
      authAs(ADMIN_USER)
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/ops/queues/ai-processing/pause',
        headers: authHeaders(),
      })
      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.body)).toEqual({ paused: true })
    })

    it('POST /ops/queues/:name/pause returns 404 for unknown queue', async () => {
      authAs(ADMIN_USER)
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/ops/queues/nonexistent/pause',
        headers: authHeaders(),
      })
      expect(response.statusCode).toBe(404)
    })

    it('POST /ops/queues/:name/resume resumes queue for admin', async () => {
      authAs(ADMIN_USER)
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/ops/queues/ai-processing/resume',
        headers: authHeaders(),
      })
      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.body)).toEqual({ resumed: true })
    })

    it('GET /ops/queues/:name/jobs/:jobId returns job detail', async () => {
      authAs(ADMIN_USER)
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/ops/queues/ai-processing/jobs/existing-job',
        headers: authHeaders(),
      })
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.id).toBe('existing-job')
      expect(body).toHaveProperty('state')
      expect(body).toHaveProperty('attemptsMade')
    })

    it('GET /ops/queues/:name/jobs/:jobId returns 404 for missing job', async () => {
      authAs(ADMIN_USER)
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/ops/queues/ai-processing/jobs/nonexistent',
        headers: authHeaders(),
      })
      expect(response.statusCode).toBe(404)
    })

    it('POST /ops/queues/:name/jobs/:jobId/retry retries a failed job', async () => {
      authAs(ADMIN_USER)
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/ops/queues/ai-processing/jobs/existing-job/retry',
        headers: authHeaders(),
      })
      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.body)).toEqual({ retried: true })
    })

    it('POST /ops/queues/:name/jobs/:jobId/retry returns 404 for missing job', async () => {
      authAs(ADMIN_USER)
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/ops/queues/ai-processing/jobs/nonexistent/retry',
        headers: authHeaders(),
      })
      expect(response.statusCode).toBe(404)
    })

    it('POST /ops/queues/:name/pause requires admin', async () => {
      authAs(COUNSELLOR_USER)
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/ops/queues/ai-processing/pause',
        headers: authHeaders(),
      })
      expect(response.statusCode).toBe(403)
    })

    // ─── History endpoints ─────────────────────────────────────

    it('GET /ops/history/notifications returns paginated list for admin', async () => {
      authAs(ADMIN_USER)
      db.notificationLog.findMany.mockResolvedValue([
        { id: 'n1', recipient: 'user@test.com', channel: 'email', provider: 'sendgrid', templateKey: 'welcome', status: 'delivered', errorMessage: null, sentAt: new Date(), deliveredAt: new Date(), createdAt: new Date() },
      ])
      db.notificationLog.count.mockResolvedValue(1)

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/ops/history/notifications?page=1&limit=10',
        headers: authHeaders(),
      })
      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.items).toHaveLength(1)
      expect(body.total).toBe(1)
      expect(body.page).toBe(1)
      expect(body.limit).toBe(10)
    })

    it('GET /ops/history/notifications requires admin', async () => {
      authAs(COUNSELLOR_USER)
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/ops/history/notifications',
        headers: authHeaders(),
      })
      expect(response.statusCode).toBe(403)
    })

    it('GET /ops/history/mautic returns paginated list for admin', async () => {
      authAs(ADMIN_USER)
      db.mauticSyncLog.findMany.mockResolvedValue([
        { id: 'm1', eventType: 'lead_created', payloadHash: 'abc123', status: 'sent', attempts: 1, lastError: null, createdAt: new Date(), completedAt: new Date() },
      ])
      db.mauticSyncLog.count.mockResolvedValue(1)

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/ops/history/mautic?page=1&limit=5',
        headers: authHeaders(),
      })
      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.items).toHaveLength(1)
      expect(body.total).toBe(1)
      expect(body.limit).toBe(5)
    })

    it('GET /ops/history/mautic requires admin', async () => {
      authAs(COUNSELLOR_USER)
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/ops/history/mautic',
        headers: authHeaders(),
      })
      expect(response.statusCode).toBe(403)
    })

    it('GET /ops/history/webhooks returns paginated list for admin', async () => {
      authAs(ADMIN_USER)
      db.booking.findMany.mockResolvedValue([
        { id: 'b1', calcomEventId: 'cal-123', status: 'confirmed', externalStatus: 'active', scheduledAt: new Date(), lastSyncedAt: new Date(), createdAt: new Date() },
      ])
      db.booking.count.mockResolvedValue(1)

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/ops/history/webhooks?page=2&limit=10',
        headers: authHeaders(),
      })
      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.items).toHaveLength(1)
      expect(body.total).toBe(1)
      expect(body.page).toBe(2)
    })

    it('GET /ops/history/webhooks requires admin', async () => {
      authAs(COUNSELLOR_USER)
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/ops/history/webhooks',
        headers: authHeaders(),
      })
      expect(response.statusCode).toBe(403)
    })

    // ─── Audit history ─────────────────────────────────────────

    it('GET /ops/history/audit returns paginated audit log for admin', async () => {
      authAs(ADMIN_USER)
      db.opsAuditLog.findMany.mockResolvedValue([
        { id: 'a1', userEmail: 'admin@test.com', action: 'queue_pause', target: 'ai-processing', metadata: null, createdAt: new Date() },
      ])
      db.opsAuditLog.count.mockResolvedValue(1)

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/ops/history/audit?page=1&limit=10',
        headers: authHeaders(),
      })
      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.items).toHaveLength(1)
      expect(body.items[0].action).toBe('queue_pause')
      expect(body.total).toBe(1)
    })

    it('GET /ops/history/audit requires admin', async () => {
      authAs(COUNSELLOR_USER)
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/ops/history/audit',
        headers: authHeaders(),
      })
      expect(response.statusCode).toBe(403)
    })

    // ─── Audit logging on mutations ────────────────────────────

    it('POST /ops/queues/:name/pause creates audit log entry', async () => {
      authAs(ADMIN_USER)
      db.opsAuditLog.create.mockResolvedValue({ id: 'audit-1' })

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/ops/queues/ai-processing/pause',
        headers: authHeaders(),
      })
      expect(response.statusCode).toBe(200)
      expect(db.opsAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'queue_pause',
            target: 'ai-processing',
          }),
        }),
      )
    })

    it('POST /ops/queues/:name/resume creates audit log entry', async () => {
      authAs(ADMIN_USER)
      db.opsAuditLog.create.mockResolvedValue({ id: 'audit-2' })

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/ops/queues/ai-processing/resume',
        headers: authHeaders(),
      })
      expect(response.statusCode).toBe(200)
      expect(db.opsAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'queue_resume',
            target: 'ai-processing',
          }),
        }),
      )
    })

    it('POST /ops/queues/:name/retry creates audit log entry', async () => {
      authAs(ADMIN_USER)
      db.opsAuditLog.create.mockResolvedValue({ id: 'audit-3' })

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/ops/queues/ai-processing/retry',
        headers: authHeaders(),
      })
      expect(response.statusCode).toBe(200)
      expect(db.opsAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'retry_all',
            target: 'ai-processing',
          }),
        }),
      )
    })

    it('POST /ops/queues/:name/jobs/:jobId/retry creates audit log entry', async () => {
      authAs(ADMIN_USER)
      db.opsAuditLog.create.mockResolvedValue({ id: 'audit-4' })

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/ops/queues/ai-processing/jobs/existing-job/retry',
        headers: authHeaders(),
      })
      expect(response.statusCode).toBe(200)
      expect(db.opsAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'retry_single',
            target: 'ai-processing/jobs/existing-job',
          }),
        }),
      )
    })

    // ─── Alerts ─────────────────────────────────────────────────

    it('GET /ops/alerts returns alerts array for admin', async () => {
      authAs(ADMIN_USER)
      // Mock notification log count for failure alerts
      db.notificationLog.count.mockResolvedValue(0)
      db.mauticSyncLog.count.mockResolvedValue(0)

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/ops/alerts',
        headers: authHeaders(),
      })
      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body).toHaveProperty('alerts')
      expect(Array.isArray(body.alerts)).toBe(true)
    })

    it('GET /ops/alerts requires admin', async () => {
      authAs(COUNSELLOR_USER)
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/ops/alerts',
        headers: authHeaders(),
      })
      expect(response.statusCode).toBe(403)
    })
  })
})
