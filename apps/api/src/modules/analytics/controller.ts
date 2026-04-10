import type { FastifyRequest, FastifyReply } from 'fastify'
import * as analyticsService from './service.js'

type ReqWithQuery<Q = unknown> = FastifyRequest & { parsedQuery: Q }
type ReqWithParams<P = unknown> = FastifyRequest & { params: P }

export async function getOverview(request: FastifyRequest, reply: FastifyReply) {
  const query = (request as ReqWithQuery).parsedQuery as { from?: string; to?: string }
  const result = await analyticsService.getOverview(query.from, query.to)
  return reply.send(result)
}

export async function getMyOverview(request: FastifyRequest, reply: FastifyReply) {
  const query = (request as ReqWithQuery).parsedQuery as { from?: string; to?: string }
  const result = await analyticsService.getCounsellorOverview(request.user.id, query.from, query.to)
  return reply.send(result)
}

export async function listPendingAssignments(_request: FastifyRequest, reply: FastifyReply) {
  const result = await analyticsService.getPendingAssignments()
  return reply.send(result)
}

export async function getPipeline(request: FastifyRequest, reply: FastifyReply) {
  const query = (request as ReqWithQuery).parsedQuery as { from?: string; to?: string }
  const result = await analyticsService.getPipeline(query.from, query.to)
  return reply.send(result)
}

export async function listCounsellors(_request: FastifyRequest, reply: FastifyReply) {
  const result = await analyticsService.listCounsellors()
  return reply.send(result)
}

export async function getCounsellorDetail(request: FastifyRequest, reply: FastifyReply) {
  const { id } = (request as ReqWithParams<{ id: string }>).params
  const query = (request as ReqWithQuery).parsedQuery as { from?: string; to?: string }
  const result = await analyticsService.getCounsellorDetail(id, query.from, query.to)
  if (!result) return reply.code(404).send({ error: 'Counsellor not found' })
  return reply.send(result)
}

export async function listStudentAnalytics(_request: FastifyRequest, reply: FastifyReply) {
  const result = await analyticsService.listStudentAnalytics()
  return reply.send(result)
}

export async function getStudentAnalyticsDetail(request: FastifyRequest, reply: FastifyReply) {
  const { id } = (request as ReqWithParams<{ id: string }>).params
  const query = (request as ReqWithQuery).parsedQuery as { from?: string; to?: string }
  const result = await analyticsService.getStudentAnalyticsDetail(id, query.from, query.to)
  if (!result) return reply.code(404).send({ error: 'Student not found' })
  return reply.send(result)
}
