import type { FastifyRequest, FastifyReply } from 'fastify'

import { verifyFirebaseToken, AuthError } from '../integrations/firebase/index.js'
import prisma from '../lib/prisma.js'

export interface RequestUser {
  id: string
  firebaseUid: string
  email: string
  firstName: string
  lastName: string
  role: 'student' | 'counsellor' | 'admin'
  status: 'active' | 'invited' | 'deactivated'
}

declare module 'fastify' {
  interface FastifyRequest {
    user: RequestUser
  }
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({
      error: 'Missing or invalid authorization header',
      code: 'MISSING_TOKEN',
    })
  }

  const token = authHeader.slice(7)

  try {
    const decoded = await verifyFirebaseToken(token)

    const user = await prisma.user.findFirst({
      where: {
        firebaseUid: decoded.uid,
        deletedAt: null,
      },
      select: {
        id: true,
        firebaseUid: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    })

    if (!user) {
      return reply.status(401).send({
        error: 'User not found. Please register first.',
        code: 'USER_NOT_FOUND',
      })
    }

    if (user.status === 'deactivated') {
      return reply.status(403).send({
        error: 'Account has been deactivated',
        code: 'ACCOUNT_DEACTIVATED',
      })
    }

    request.user = user as RequestUser
  } catch (error) {
    if (error instanceof AuthError) {
      return reply.status(error.statusCode).send({
        error: error.message,
        code: error.code,
      })
    }
    return reply.status(401).send({
      error: 'Authentication failed',
      code: 'AUTH_FAILED',
    })
  }
}
