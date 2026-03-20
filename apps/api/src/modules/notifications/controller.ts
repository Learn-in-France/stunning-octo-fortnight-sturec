import type { FastifyRequest, FastifyReply } from 'fastify'

import * as notificationService from './service.js'

interface AuthedRequest extends FastifyRequest {
  userId: string
}

export async function getMyNotifications(request: FastifyRequest, reply: FastifyReply) {
  const { userId } = request as AuthedRequest
  const result = await notificationService.getNotifications(userId)
  return reply.send(result)
}

export async function markRead(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const { userId } = request as AuthedRequest
  await notificationService.markRead(request.params.id, userId)
  return reply.send({ ok: true })
}

export async function markAllRead(request: FastifyRequest, reply: FastifyReply) {
  const { userId } = request as AuthedRequest
  await notificationService.markAllRead(userId)
  return reply.send({ ok: true })
}
