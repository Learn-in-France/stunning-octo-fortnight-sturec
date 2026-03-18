import type { FastifyRequest, FastifyReply } from 'fastify'

import { verifyFirebaseToken } from '../../integrations/firebase/index.js'
import * as authService from './service.js'

export async function verify(request: FastifyRequest, reply: FastifyReply) {
  const user = await authService.verifyUser(
    await getDecodedToken(request, reply),
  )

  if (!user) {
    return reply.status(401).send({
      error: 'User not found. Please register first.',
      code: 'USER_NOT_FOUND',
    })
  }

  return reply.send(user)
}

export async function register(
  request: FastifyRequest<{ Body: { firstName?: string; lastName?: string } }>,
  reply: FastifyReply,
) {
  const decoded = await getDecodedToken(request, reply)
  const result = await authService.registerUser(decoded, request.body)

  if ('error' in result) {
    return reply.status(409).send({
      error: result.error,
      code: result.code,
    })
  }

  return reply.status(201).send(result.user)
}

export async function acceptInvite(request: FastifyRequest, reply: FastifyReply) {
  const decoded = await getDecodedToken(request, reply)
  const user = await authService.acceptInvite(decoded)

  if (!user) {
    return reply.status(404).send({
      error: 'No pending invite found for this email',
      code: 'INVITE_NOT_FOUND',
    })
  }

  return reply.send(user)
}

export async function getUserProfile(request: FastifyRequest, reply: FastifyReply) {
  const result = await authService.getUserProfile(request.user.id)
  if (!result) return reply.status(404).send({ error: 'User not found', code: 'USER_NOT_FOUND' })
  return reply.send(result)
}

export async function updateUserProfile(request: FastifyRequest, reply: FastifyReply) {
  const result = await authService.updateUserProfile(request.user.id, request.body as any)
  if (!result) return reply.status(404).send({ error: 'User not found', code: 'USER_NOT_FOUND' })
  return reply.send(result)
}

async function getDecodedToken(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.status(401).send({
      error: 'Missing or invalid authorization header',
      code: 'MISSING_TOKEN',
    })
    throw new Error('Missing token')
  }

  return verifyFirebaseToken(authHeader.slice(7))
}
