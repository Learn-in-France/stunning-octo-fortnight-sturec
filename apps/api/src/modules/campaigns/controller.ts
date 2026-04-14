import type { FastifyRequest, FastifyReply } from 'fastify'
import * as campaignService from './service.js'

// ─── Admin: Templates ───────────────────────────────────────

export async function listTemplates(request: FastifyRequest, reply: FastifyReply) {
  const { phaseKey } = request.query as { phaseKey?: string }
  const templates = await campaignService.listTemplates(phaseKey)
  return reply.send(templates)
}

export async function createTemplate(request: FastifyRequest, reply: FastifyReply) {
  const template = await campaignService.createTemplate(request.body as any)
  return reply.status(201).send(template)
}

export async function updateTemplate(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const template = await campaignService.updateTemplate(request.params.id, request.body as any)
  return reply.send(template)
}

// ─── Admin: Packs ───────────────────────────────────────────

export async function listPacks(request: FastifyRequest, reply: FastifyReply) {
  const { phaseKey } = request.query as { phaseKey?: string }
  const packs = await campaignService.listPacks(phaseKey)
  return reply.send(packs)
}

export async function createPack(request: FastifyRequest, reply: FastifyReply) {
  const pack = await campaignService.createPack(request.body as any)
  return reply.status(201).send(pack)
}

export async function updatePack(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const pack = await campaignService.updatePack(request.params.id, request.body as any)
  return reply.send(pack)
}

// ─── Counsellor: Student Campaigns ──────────────────────────

export async function listStudentCampaigns(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const campaigns = await campaignService.listStudentCampaigns(request.params.id, request.user)
  if (!campaigns) return reply.code(404).send({ error: 'Student not found', code: 'NOT_FOUND' })
  return reply.send(campaigns)
}

export async function startCampaign(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const { packId } = request.body as { packId: string }
  const campaign = await campaignService.startCampaign({
    studentId: request.params.id,
    counsellorId: request.user.id,
    packId,
    user: request.user,
  })
  if (!campaign) return reply.code(404).send({ error: 'Student not found', code: 'NOT_FOUND' })
  return reply.status(201).send(campaign)
}

export async function sendStep(
  request: FastifyRequest<{ Params: { id: string; campaignId: string } }>,
  reply: FastifyReply,
) {
  const { stepId } = request.body as { stepId: string }
  const result = await campaignService.sendStep(stepId, request.params.id, request.user)
  if (!result) return reply.code(404).send({ error: 'Step not found', code: 'NOT_FOUND' })
  return reply.send(result)
}

export async function sendAll(
  request: FastifyRequest<{ Params: { id: string; campaignId: string } }>,
  reply: FastifyReply,
) {
  const results = await campaignService.sendAllDue(request.params.campaignId, request.params.id, request.user)
  if (!results) return reply.code(404).send({ error: 'Campaign not found', code: 'NOT_FOUND' })
  return reply.send(results)
}

export async function pauseCampaign(
  request: FastifyRequest<{ Params: { id: string; campaignId: string } }>,
  reply: FastifyReply,
) {
  const result = await campaignService.pauseCampaign(request.params.campaignId, request.params.id, request.user)
  if (!result) return reply.code(404).send({ error: 'Campaign not found', code: 'NOT_FOUND' })
  return reply.send(result)
}

export async function resumeCampaign(
  request: FastifyRequest<{ Params: { id: string; campaignId: string } }>,
  reply: FastifyReply,
) {
  const result = await campaignService.resumeCampaign(request.params.campaignId, request.params.id, request.user)
  if (!result) return reply.code(404).send({ error: 'Campaign not found', code: 'NOT_FOUND' })
  return reply.send(result)
}

export async function updateMode(
  request: FastifyRequest<{ Params: { id: string; campaignId: string } }>,
  reply: FastifyReply,
) {
  const { mode } = request.body as { mode: string }
  const result = await campaignService.updateCampaignMode(request.params.campaignId, mode, request.params.id, request.user)
  if (!result) return reply.code(404).send({ error: 'Campaign not found', code: 'NOT_FOUND' })
  return reply.send(result)
}

export async function getCampaignHistory(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const history = await campaignService.getCampaignHistory(request.params.id, request.user)
  if (!history) return reply.code(404).send({ error: 'Student not found', code: 'NOT_FOUND' })
  return reply.send(history)
}
