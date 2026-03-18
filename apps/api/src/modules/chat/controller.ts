import type { FastifyRequest, FastifyReply } from 'fastify'
import * as chatService from './service.js'

export async function listSessions(request: FastifyRequest, reply: FastifyReply) {
  const sessions = await chatService.listSessions(request.user.id)
  return reply.send(sessions)
}

export async function getSession(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const session = await chatService.getSession(request.params.id, request.user.id)
  if (!session) return reply.code(404).send({ error: 'Session not found', code: 'NOT_FOUND' })
  return reply.send(session)
}

export async function startSession(request: FastifyRequest, reply: FastifyReply) {
  const session = await chatService.startSession(
    request.user.id,
    request.user.email,
    request.user.firstName,
    request.user.lastName,
  )
  return reply.code(201).send(session)
}

export async function endSession(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const session = await chatService.endSession(request.params.id, request.user.id)
  if (!session) return reply.code(404).send({ error: 'Session not found', code: 'NOT_FOUND' })
  return reply.send(session)
}

export async function getMessages(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const messages = await chatService.getMessages(request.params.id, request.user.id)
  if (!messages) return reply.code(404).send({ error: 'Session not found', code: 'NOT_FOUND' })
  return reply.send(messages)
}

export async function sendMessage(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const { content } = request.body as { content: string }
  const result = await chatService.sendMessage(request.params.id, request.user.id, content)
  if (!result) return reply.code(404).send({ error: 'Session not found or not active', code: 'NOT_FOUND' })
  return reply.send(result)
}
