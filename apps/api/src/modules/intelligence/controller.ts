import type { FastifyRequest, FastifyReply } from 'fastify'
import * as svc from './service.js'
import type { GateInput, OutcomeInput, ManualEventInput, WorkQueueQuery } from './schema.js'

type ReqWithQuery<Q = unknown> = FastifyRequest & { parsedQuery: Q }

export async function getWorkQueue(request: FastifyRequest, reply: FastifyReply) {
  const result = await svc.getWorkQueue((request as ReqWithQuery).parsedQuery as WorkQueueQuery, request.user)
  return reply.send(result)
}

export async function applyGate(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const result = await svc.applyGate(request.params.id, request.body as GateInput, request.user)
  if (!result) return reply.status(404).send({ error: 'Lead not found', code: 'LEAD_NOT_FOUND' })
  return reply.send(result)
}

export async function recordOutcome(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const result = await svc.recordOutcome(request.params.id, request.body as OutcomeInput, request.user)
  if (!result) return reply.status(404).send({ error: 'Lead not found', code: 'LEAD_NOT_FOUND' })
  return reply.send(result)
}

export async function logManualEvent(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const result = await svc.logManualEvent(request.params.id, request.body as ManualEventInput, request.user)
  if (!result) return reply.status(404).send({ error: 'Lead not found', code: 'LEAD_NOT_FOUND' })
  return reply.send(result)
}

export async function getLeadTimeline(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const result = await svc.getLeadTimeline(request.params.id, request.user)
  if (!result) return reply.status(404).send({ error: 'Lead not found', code: 'LEAD_NOT_FOUND' })
  return reply.send({ events: result })
}

export async function getFunnel(_request: FastifyRequest, reply: FastifyReply) {
  const result = await svc.getFunnel()
  return reply.send(result)
}
