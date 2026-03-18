import type { FastifyRequest, FastifyReply } from 'fastify'
import * as catalogService from './service.js'

type ReqWithQuery<Q = unknown> = FastifyRequest & { parsedQuery: Q }

// ─── Universities ─────────────────────────────────────────────

export async function listUniversities(request: FastifyRequest, reply: FastifyReply) {
  const result = await catalogService.listUniversities((request as ReqWithQuery).parsedQuery as any)
  return reply.send(result)
}

export async function getUniversity(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const uni = await catalogService.getUniversity(request.params.id)
  if (!uni) return reply.status(404).send({ error: 'University not found', code: 'NOT_FOUND' })
  return reply.send(uni)
}

export async function createUniversity(request: FastifyRequest, reply: FastifyReply) {
  const uni = await catalogService.createUniversity(request.body as any, request.user.id)
  return reply.status(201).send(uni)
}

export async function updateUniversity(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const uni = await catalogService.updateUniversity(request.params.id, request.body as any, request.user.id)
  return reply.send(uni)
}

// ─── Programs ─────────────────────────────────────────────────

export async function listPrograms(request: FastifyRequest, reply: FastifyReply) {
  const result = await catalogService.listPrograms((request as ReqWithQuery).parsedQuery as any)
  return reply.send(result)
}

export async function getProgram(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const program = await catalogService.getProgram(request.params.id)
  if (!program) return reply.status(404).send({ error: 'Program not found', code: 'NOT_FOUND' })
  return reply.send(program)
}

export async function createProgram(request: FastifyRequest, reply: FastifyReply) {
  const program = await catalogService.createProgram(request.body as any, request.user.id)
  return reply.status(201).send(program)
}

export async function updateProgram(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const program = await catalogService.updateProgram(request.params.id, request.body as any, request.user.id)
  return reply.send(program)
}

// ─── Program Intakes ──────────────────────────────────────────

export async function listIntakes(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const intakes = await catalogService.listIntakes(request.params.id)
  return reply.send(intakes)
}

export async function createIntake(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const intake = await catalogService.createIntake(request.params.id, request.body as any, request.user.id)
  return reply.status(201).send(intake)
}

export async function updateIntake(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const intake = await catalogService.updateIntake(request.params.id, request.body as any, request.user.id)
  return reply.send(intake)
}

// ─── Visa Requirements ───────────────────────────────────────

export async function listVisaRequirements(request: FastifyRequest, reply: FastifyReply) {
  const result = await catalogService.listVisaRequirements((request as ReqWithQuery).parsedQuery as any)
  return reply.send(result)
}

export async function getVisaRequirement(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const item = await catalogService.getVisaRequirement(request.params.id)
  if (!item) return reply.status(404).send({ error: 'Visa requirement not found', code: 'NOT_FOUND' })
  return reply.send(item)
}

export async function createVisaRequirement(request: FastifyRequest, reply: FastifyReply) {
  const item = await catalogService.createVisaRequirement(request.body as any, request.user.id)
  return reply.status(201).send(item)
}

export async function updateVisaRequirement(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const item = await catalogService.updateVisaRequirement(request.params.id, request.body as any, request.user.id)
  return reply.send(item)
}

// ─── Eligibility Rules ───────────────────────────────────────

export async function listEligibilityRules(request: FastifyRequest, reply: FastifyReply) {
  const result = await catalogService.listEligibilityRules((request as ReqWithQuery).parsedQuery as any)
  return reply.send(result)
}

export async function getEligibilityRule(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const item = await catalogService.getEligibilityRule(request.params.id)
  if (!item) return reply.status(404).send({ error: 'Eligibility rule not found', code: 'NOT_FOUND' })
  return reply.send(item)
}

export async function createEligibilityRule(request: FastifyRequest, reply: FastifyReply) {
  const item = await catalogService.createEligibilityRule(request.body as any, request.user.id)
  return reply.status(201).send(item)
}

export async function updateEligibilityRule(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const item = await catalogService.updateEligibilityRule(request.params.id, request.body as any, request.user.id)
  return reply.send(item)
}

// ─── Campus France Prep ──────────────────────────────────────

export async function listCampusFrancePreps(request: FastifyRequest, reply: FastifyReply) {
  const result = await catalogService.listCampusFrancePreps((request as ReqWithQuery).parsedQuery as any)
  return reply.send(result)
}

export async function getCampusFrancePrep(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const item = await catalogService.getCampusFrancePrep(request.params.id)
  if (!item) return reply.status(404).send({ error: 'Campus France prep item not found', code: 'NOT_FOUND' })
  return reply.send(item)
}

export async function createCampusFrancePrep(request: FastifyRequest, reply: FastifyReply) {
  const item = await catalogService.createCampusFrancePrep(request.body as any, request.user.id)
  return reply.status(201).send(item)
}

export async function updateCampusFrancePrep(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const item = await catalogService.updateCampusFrancePrep(request.params.id, request.body as any, request.user.id)
  return reply.send(item)
}

// ─── Public ──────────────────────────────────────────────────

export async function listPublicPrograms(request: FastifyRequest, reply: FastifyReply) {
  const result = await catalogService.listPublicPrograms((request as ReqWithQuery).parsedQuery as any)
  return reply.send(result)
}

export async function getPublicProgram(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const program = await catalogService.getProgram(request.params.id)
  if (!program || !program.active) return reply.status(404).send({ error: 'Program not found', code: 'NOT_FOUND' })
  return reply.send(program)
}

export async function listPublicUniversities(request: FastifyRequest, reply: FastifyReply) {
  const result = await catalogService.listPublicUniversities((request as ReqWithQuery).parsedQuery as any)
  return reply.send(result)
}

export async function getPublicUniversity(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const uni = await catalogService.getUniversity(request.params.id)
  if (!uni || !uni.active) return reply.status(404).send({ error: 'University not found', code: 'NOT_FOUND' })
  return reply.send(uni)
}
