import type { FastifyRequest, FastifyReply } from 'fastify'
import * as applicationService from './service.js'

type ReqWithQuery<Q = unknown> = FastifyRequest & { parsedQuery: Q }

export async function listStudentApplications(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const apps = await applicationService.listStudentApplications(request.params.id, request.user)
  if (!apps) return reply.status(404).send({ error: 'Student not found', code: 'STUDENT_NOT_FOUND' })
  return reply.send(apps)
}

export async function listAllApplications(request: FastifyRequest, reply: FastifyReply) {
  const result = await applicationService.listAllApplications(
    (request as ReqWithQuery).parsedQuery as any,
  )
  return reply.send(result)
}

export async function createApplication(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const app = await applicationService.createApplication(
    request.params.id,
    request.body as any,
    request.user.id,
    request.user,
  )
  return reply.status(201).send(app)
}

export async function updateApplicationStatus(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const { status } = request.body as { status: string }
  const app = await applicationService.updateApplicationStatus(request.params.id, status, request.user)
  if (!app) return reply.status(404).send({ error: 'Application not found', code: 'NOT_FOUND' })
  return reply.send(app)
}
