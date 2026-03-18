import type { FastifyRequest, FastifyReply } from 'fastify'
import * as leadService from './service.js'

type ReqWithQuery<Q = unknown> = FastifyRequest & { parsedQuery: Q }

export async function listLeads(request: FastifyRequest, reply: FastifyReply) {
  const result = await leadService.listLeads(
    (request as ReqWithQuery).parsedQuery as any,
    request.user,
  )
  return reply.send(result)
}

export async function getLead(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const lead = await leadService.getLead(request.params.id)
  if (!lead) return reply.status(404).send({ error: 'Lead not found', code: 'LEAD_NOT_FOUND' })
  return reply.send(lead)
}

export async function createLead(request: FastifyRequest, reply: FastifyReply) {
  const lead = await leadService.createLead(request.body as any, request.user.id)
  return reply.status(201).send(lead)
}

export async function updateLead(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const lead = await leadService.updateLead(request.params.id, request.body as any)
  return reply.send(lead)
}

export async function assignLead(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const { counsellorId } = request.body as { counsellorId: string }
  const lead = await leadService.assignLead(request.params.id, counsellorId)
  return reply.send(lead)
}

export async function disqualifyLead(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const { reason } = request.body as { reason: string }
  const lead = await leadService.disqualifyLead(request.params.id, reason)
  return reply.send(lead)
}

export async function convertLead(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const result = await leadService.convertLead(request.params.id)
  if ('error' in result) {
    return reply.status(404).send(result)
  }
  return reply.send(result)
}

export async function listActivities(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const result = await leadService.listLeadActivities(
    request.params.id,
    (request as ReqWithQuery).parsedQuery as any,
  )
  return reply.send(result)
}

export async function createActivity(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const activity = await leadService.createLeadActivity(
    request.params.id,
    request.body as any,
    request.user.id,
  )
  if (!activity) return reply.status(404).send({ error: 'Lead not found', code: 'LEAD_NOT_FOUND' })
  return reply.status(201).send(activity)
}

export async function importLeads(request: FastifyRequest, reply: FastifyReply) {
  const { rows } = request.body as { rows: Record<string, unknown>[] }
  const result = await leadService.importLeads(rows)
  return reply.status(202).send(result)
}

export async function listAssessments(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const assessments = await leadService.listLeadAssessments(request.params.id)
  return reply.send(assessments)
}

export async function getAssessment(
  request: FastifyRequest<{ Params: { id: string; assessmentId: string } }>,
  reply: FastifyReply,
) {
  const assessment = await leadService.getLeadAssessment(request.params.id, request.params.assessmentId)
  if (!assessment) return reply.status(404).send({ error: 'Assessment not found', code: 'NOT_FOUND' })
  return reply.send(assessment)
}
