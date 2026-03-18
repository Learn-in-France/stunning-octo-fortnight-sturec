import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock our own firebase integration module
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

// Mock Prisma
vi.mock('../src/lib/prisma.js', () => ({
  default: {
    user: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    lead: {
      updateMany: vi.fn(),
    },
  },
}))

import { verifyFirebaseToken, AuthError } from '../src/integrations/firebase/index.js'
import prisma from '../src/lib/prisma.js'
import {
  createTestApp,
  TEST_FIREBASE_TOKEN,
  TEST_STUDENT,
  TEST_ADMIN,
} from './helpers.js'

const mockVerify = verifyFirebaseToken as ReturnType<typeof vi.fn>
const mockPrisma = prisma as unknown as {
  user: {
    findFirst: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }
  lead: {
    updateMany: ReturnType<typeof vi.fn>
  }
}

describe('Auth Module', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>

  beforeEach(async () => {
    app = await createTestApp()
    vi.clearAllMocks()
  })

  afterEach(async () => {
    await app.close()
  })

  describe('POST /api/v1/auth/verify', () => {
    it('returns user for valid token and existing user', async () => {
      const existingUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        firebaseUid: TEST_STUDENT.uid,
        email: TEST_STUDENT.email,
        role: 'student',
        firstName: 'Test',
        lastName: 'Student',
        phone: null,
        avatarUrl: null,
        status: 'active',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      }

      mockVerify.mockResolvedValue({ uid: TEST_STUDENT.uid, email: TEST_STUDENT.email })
      mockPrisma.user.findFirst.mockResolvedValue(existingUser)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/verify',
        headers: { authorization: `Bearer ${TEST_FIREBASE_TOKEN}` },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.id).toBe(existingUser.id)
      expect(body.email).toBe(TEST_STUDENT.email)
      expect(body.role).toBe('student')
    })

    it('returns 401 for unknown user', async () => {
      mockVerify.mockResolvedValue({ uid: TEST_STUDENT.uid, email: TEST_STUDENT.email })
      mockPrisma.user.findFirst.mockResolvedValue(null)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/verify',
        headers: { authorization: `Bearer ${TEST_FIREBASE_TOKEN}` },
      })

      expect(response.statusCode).toBe(401)
      const body = JSON.parse(response.body)
      expect(body.code).toBe('USER_NOT_FOUND')
    })

    it('returns 401 for missing token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/verify',
      })

      expect(response.statusCode).toBe(401)
      const body = JSON.parse(response.body)
      expect(body.code).toBe('MISSING_TOKEN')
    })

    it('returns 401 for invalid token', async () => {
      mockVerify.mockRejectedValue(new AuthError('Invalid token', 'INVALID_TOKEN', 401))

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/verify',
        headers: { authorization: `Bearer invalid-token` },
      })

      expect(response.statusCode).toBe(401)
      const body = JSON.parse(response.body)
      expect(body.code).toBe('INVALID_TOKEN')
    })
  })

  describe('POST /api/v1/auth/register', () => {
    it('creates new user with role=student', async () => {
      const newUser = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        firebaseUid: TEST_STUDENT.uid,
        email: TEST_STUDENT.email,
        role: 'student',
        firstName: 'Test',
        lastName: 'Student',
        phone: null,
        avatarUrl: null,
        status: 'active',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      }

      mockVerify.mockResolvedValue({
        uid: TEST_STUDENT.uid,
        email: TEST_STUDENT.email,
        name: 'Test Student',
      })
      // findByFirebaseUid → null, findInvitedUserByEmail → null, findUserByEmail → null
      mockPrisma.user.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
      mockPrisma.user.create.mockResolvedValue(newUser)
      mockPrisma.lead.updateMany.mockResolvedValue({ count: 0 })

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        headers: { authorization: `Bearer ${TEST_FIREBASE_TOKEN}` },
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body.role).toBe('student')
      expect(body.email).toBe(TEST_STUDENT.email)
    })

    it('is idempotent — returns existing user if already registered', async () => {
      const existingUser = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        firebaseUid: TEST_STUDENT.uid,
        email: TEST_STUDENT.email,
        role: 'student',
        firstName: 'Test',
        lastName: 'Student',
        phone: null,
        avatarUrl: null,
        status: 'active',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      }

      mockVerify.mockResolvedValue({ uid: TEST_STUDENT.uid, email: TEST_STUDENT.email })
      // findByFirebaseUid → existingUser (short-circuits)
      mockPrisma.user.findFirst.mockResolvedValue(existingUser)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        headers: { authorization: `Bearer ${TEST_FIREBASE_TOKEN}` },
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body.id).toBe(existingUser.id)
      expect(mockPrisma.user.create).not.toHaveBeenCalled()
    })

    it('links matching leads by email on registration', async () => {
      const newUser = {
        id: '550e8400-e29b-41d4-a716-446655440002',
        firebaseUid: TEST_STUDENT.uid,
        email: TEST_STUDENT.email,
        role: 'student',
        firstName: 'Test',
        lastName: 'Student',
        phone: null,
        avatarUrl: null,
        status: 'active',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      }

      mockVerify.mockResolvedValue({
        uid: TEST_STUDENT.uid,
        email: TEST_STUDENT.email,
        name: 'Test Student',
      })
      // findByFirebaseUid → null, findInvitedUserByEmail → null, findUserByEmail → null
      mockPrisma.user.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
      mockPrisma.user.create.mockResolvedValue(newUser)
      mockPrisma.lead.updateMany.mockResolvedValue({ count: 1 })

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        headers: { authorization: `Bearer ${TEST_FIREBASE_TOKEN}` },
      })

      expect(response.statusCode).toBe(201)
      expect(mockPrisma.lead.updateMany).toHaveBeenCalledWith({
        where: {
          email: TEST_STUDENT.email,
          userId: null,
          deletedAt: null,
        },
        data: {
          userId: newUser.id,
        },
      })
    })

    it('rejects register if a pending invite exists for this email', async () => {
      const invitedUser = {
        id: '550e8400-e29b-41d4-a716-446655440003',
        firebaseUid: '',
        email: TEST_ADMIN.email,
        role: 'admin',
        firstName: 'Invited',
        lastName: 'Admin',
        phone: null,
        avatarUrl: null,
        status: 'invited',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      }

      mockVerify.mockResolvedValue({ uid: TEST_ADMIN.uid, email: TEST_ADMIN.email })
      // findByFirebaseUid → null, findInvitedUserByEmail → invitedUser
      mockPrisma.user.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(invitedUser)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        headers: { authorization: `Bearer ${TEST_FIREBASE_TOKEN}` },
      })

      expect(response.statusCode).toBe(409)
      const body = JSON.parse(response.body)
      expect(body.code).toBe('USE_ACCEPT_INVITE')
      expect(mockPrisma.user.create).not.toHaveBeenCalled()
    })

    it('rejects register if email already has an account', async () => {
      const existingEmailUser = {
        id: '550e8400-e29b-41d4-a716-446655440004',
        firebaseUid: 'different-uid',
        email: TEST_STUDENT.email,
        role: 'counsellor',
        firstName: 'Existing',
        lastName: 'Counsellor',
        phone: null,
        avatarUrl: null,
        status: 'active',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      }

      mockVerify.mockResolvedValue({ uid: TEST_STUDENT.uid, email: TEST_STUDENT.email })
      // findByFirebaseUid → null, findInvitedUserByEmail → null, findUserByEmail → existingEmailUser
      mockPrisma.user.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(existingEmailUser)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        headers: { authorization: `Bearer ${TEST_FIREBASE_TOKEN}` },
      })

      expect(response.statusCode).toBe(409)
      const body = JSON.parse(response.body)
      expect(body.code).toBe('USE_VERIFY')
      expect(mockPrisma.user.create).not.toHaveBeenCalled()
    })
  })

  describe('POST /api/v1/auth/accept-invite', () => {
    it('links Firebase UID to invited user', async () => {
      const invitedUser = {
        id: '550e8400-e29b-41d4-a716-446655440003',
        firebaseUid: '',
        email: TEST_ADMIN.email,
        role: 'admin',
        firstName: 'Invited',
        lastName: 'Admin',
        phone: null,
        avatarUrl: null,
        status: 'invited',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      }

      const updatedUser = {
        ...invitedUser,
        firebaseUid: TEST_ADMIN.uid,
        status: 'active',
      }

      mockVerify.mockResolvedValue({ uid: TEST_ADMIN.uid, email: TEST_ADMIN.email })
      mockPrisma.user.findFirst.mockResolvedValue(invitedUser)
      mockPrisma.user.update.mockResolvedValue(updatedUser)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/accept-invite',
        headers: { authorization: `Bearer ${TEST_FIREBASE_TOKEN}` },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.status).toBe('active')
      expect(body.role).toBe('admin')
    })

    it('returns 404 if no pending invite exists', async () => {
      mockVerify.mockResolvedValue({ uid: TEST_ADMIN.uid, email: TEST_ADMIN.email })
      mockPrisma.user.findFirst.mockResolvedValue(null)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/accept-invite',
        headers: { authorization: `Bearer ${TEST_FIREBASE_TOKEN}` },
      })

      expect(response.statusCode).toBe(404)
      const body = JSON.parse(response.body)
      expect(body.code).toBe('INVITE_NOT_FOUND')
    })
  })
})
