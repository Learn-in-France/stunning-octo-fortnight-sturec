import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

import { authMiddleware } from '../../middleware/auth.js'
import { requireRole } from '../../middleware/rbac.js'
import { validateBody, validateParams } from '../../middleware/validation.js'
import * as ctrl from './controller.js'

const idParam = z.object({ id: z.string().uuid() })
const campaignIdParam = z.object({
  id: z.string().uuid(),
  campaignId: z.string().uuid(),
})

const createTemplateSchema = z.object({
  name: z.string().min(1),
  phaseKey: z.string().min(1),
  channel: z.enum(['email', 'whatsapp', 'sms']),
  deliveryMode: z.enum(['direct_email', 'direct_whatsapp', 'direct_sms', 'mautic_campaign_trigger']).optional(),
  templateKey: z.string().min(1),
  mauticCampaignId: z.number().optional(),
  subject: z.string().optional(),
  description: z.string().optional(),
  defaultDelayDays: z.number().int().min(0).optional(),
})

const createPackSchema = z.object({
  name: z.string().min(1),
  phaseKey: z.string().min(1),
  description: z.string().optional(),
  steps: z.array(z.object({
    templateId: z.string().uuid(),
    orderIndex: z.number().int().min(0),
    delayDays: z.number().int().min(0).optional(),
  })).min(1),
})

const startCampaignSchema = z.object({
  packId: z.string().uuid(),
})

const sendStepSchema = z.object({
  stepId: z.string().uuid(),
})

const updateModeSchema = z.object({
  mode: z.enum(['manual', 'automated']),
})

export async function campaignRoutes(server: FastifyInstance) {
  const adminOnly = [authMiddleware, requireRole('admin')]
  const counsellorOrAdmin = [authMiddleware, requireRole('admin', 'counsellor')]

  // ── Admin: Templates ──
  server.get('/campaign-templates', { preHandler: adminOnly, handler: ctrl.listTemplates })
  server.post('/campaign-templates', {
    preHandler: [...adminOnly, validateBody(createTemplateSchema)],
    handler: ctrl.createTemplate,
  })
  server.patch('/campaign-templates/:id', {
    preHandler: [...adminOnly, validateParams(idParam)],
    handler: ctrl.updateTemplate,
  })

  // ── Admin: Packs ──
  server.get('/campaign-packs', { preHandler: counsellorOrAdmin, handler: ctrl.listPacks })
  server.post('/campaign-packs', {
    preHandler: [...adminOnly, validateBody(createPackSchema)],
    handler: ctrl.createPack,
  })
  server.patch('/campaign-packs/:id', {
    preHandler: [...adminOnly, validateParams(idParam)],
    handler: ctrl.updatePack,
  })

  // ── Counsellor: Student campaigns ──
  server.get('/students/:id/campaigns', {
    preHandler: [...counsellorOrAdmin, validateParams(idParam)],
    handler: ctrl.listStudentCampaigns,
  })
  server.post('/students/:id/campaigns/start', {
    preHandler: [...counsellorOrAdmin, validateParams(idParam), validateBody(startCampaignSchema)],
    handler: ctrl.startCampaign,
  })
  server.post('/students/:id/campaigns/:campaignId/send-step', {
    preHandler: [...counsellorOrAdmin, validateParams(campaignIdParam), validateBody(sendStepSchema)],
    handler: ctrl.sendStep,
  })
  server.post('/students/:id/campaigns/:campaignId/send-all', {
    preHandler: [...counsellorOrAdmin, validateParams(campaignIdParam)],
    handler: ctrl.sendAll,
  })
  server.post('/students/:id/campaigns/:campaignId/pause', {
    preHandler: [...counsellorOrAdmin, validateParams(campaignIdParam)],
    handler: ctrl.pauseCampaign,
  })
  server.post('/students/:id/campaigns/:campaignId/resume', {
    preHandler: [...counsellorOrAdmin, validateParams(campaignIdParam)],
    handler: ctrl.resumeCampaign,
  })
  server.patch('/students/:id/campaigns/:campaignId/mode', {
    preHandler: [...counsellorOrAdmin, validateParams(campaignIdParam), validateBody(updateModeSchema)],
    handler: ctrl.updateMode,
  })

  // ── History ──
  server.get('/students/:id/campaign-history', {
    preHandler: [...counsellorOrAdmin, validateParams(idParam)],
    handler: ctrl.getCampaignHistory,
  })
}
