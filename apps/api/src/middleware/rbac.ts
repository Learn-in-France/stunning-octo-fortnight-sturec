import type { FastifyRequest, FastifyReply } from 'fastify'

import type { RequestUser } from './auth.js'

type UserRole = RequestUser['role']

export function requireRole(...roles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      })
    }

    if (!roles.includes(request.user.role)) {
      return reply.status(403).send({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
      })
    }
  }
}

export function requireOwnerOrRole(
  getOwnerId: (request: FastifyRequest) => string | Promise<string>,
  ...roles: UserRole[]
) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      })
    }

    // Admin/counsellor roles bypass ownership check
    if (roles.includes(request.user.role)) {
      return
    }

    const ownerId = await getOwnerId(request)
    if (request.user.id !== ownerId) {
      return reply.status(403).send({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
      })
    }
  }
}
