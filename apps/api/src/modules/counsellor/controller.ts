import type { FastifyRequest, FastifyReply } from 'fastify'
import * as counsellorService from './service.js'

export async function recordMeetingOutcome(
  request: FastifyRequest<{ Params: { studentId: string } }>,
  reply: FastifyReply,
) {
  const result = await counsellorService.recordMeetingOutcome(
    request.user,
    {
      ...(request.body as any),
      studentId: request.params.studentId,
    },
  )
  if (!result) return reply.status(404).send({ error: 'Student not found', code: 'STUDENT_NOT_FOUND' })
  return reply.status(201).send(result)
}

export async function getMeetingOutcomes(
  request: FastifyRequest<{ Params: { studentId: string } }>,
  reply: FastifyReply,
) {
  const outcomes = await counsellorService.getMeetingOutcomes(request.params.studentId, request.user)
  if (!outcomes) return reply.status(404).send({ error: 'Student not found', code: 'STUDENT_NOT_FOUND' })
  return reply.send(outcomes)
}

export async function getAgenda(request: FastifyRequest, reply: FastifyReply) {
  const agenda = await counsellorService.getAgenda(request.user.id)
  return reply.send(agenda)
}

export async function createReminder(request: FastifyRequest, reply: FastifyReply) {
  const result = await counsellorService.createReminder(
    request.user.id,
    request.body as any,
  )
  return reply.status(201).send(result)
}

export async function getReminders(
  request: FastifyRequest<{ Querystring: { status?: string } }>,
  reply: FastifyReply,
) {
  const reminders = await counsellorService.getReminders(
    request.user.id,
    (request.query as any).status,
  )
  return reply.send(reminders)
}

export async function completeReminder(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const result = await counsellorService.completeReminder(request.params.id)
  return reply.send(result)
}

export async function dismissReminder(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const result = await counsellorService.dismissReminder(request.params.id)
  return reply.send(result)
}
