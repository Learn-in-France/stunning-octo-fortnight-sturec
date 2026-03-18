import type { FastifyRequest, FastifyReply } from 'fastify'

import * as opsService from './service.js'
import type { QueueName } from './service.js'

// ─── Audit helper ───────────────────────────────────────────

async function audit(request: FastifyRequest, action: string, target: string, metadata?: Record<string, unknown>) {
  try {
    const { default: prisma } = await import('../../lib/prisma.js')
    await prisma.opsAuditLog.create({
      data: {
        userId: request.user.id,
        userEmail: request.user.email,
        action,
        target,
        ...(metadata && { metadata: metadata as any }),
      },
    })
  } catch {
    // Non-blocking — never fail the request because audit logging broke
  }
}

// ─── Queue operations ───────────────────────────────────────

export async function getQueueStats(_request: FastifyRequest, reply: FastifyReply) {
  const stats = await opsService.getQueueStats()
  return reply.send({ queues: stats })
}

export async function getQueueDetail(request: FastifyRequest, reply: FastifyReply) {
  const { name } = request.params as { name: string }
  const detail = await opsService.getQueueDetail(name as QueueName)
  if (!detail) {
    return reply.code(404).send({ error: 'Queue not found', code: 'QUEUE_NOT_FOUND' })
  }
  return reply.send(detail)
}

export async function retryFailedJobs(request: FastifyRequest, reply: FastifyReply) {
  const { name } = request.params as { name: string }
  const count = await opsService.retryFailedJobs(name as QueueName)
  await audit(request, 'retry_all', name, { retried: count })
  return reply.send({ retried: count })
}

export async function retrySingleJob(request: FastifyRequest, reply: FastifyReply) {
  const { name, jobId } = request.params as { name: string; jobId: string }
  const ok = await opsService.retrySingleJob(name as QueueName, jobId)
  if (!ok) {
    return reply.code(404).send({ error: 'Job not found or not in failed state', code: 'JOB_NOT_FOUND' })
  }
  await audit(request, 'retry_single', `${name}/jobs/${jobId}`)
  return reply.send({ retried: true })
}

export async function pauseQueue(request: FastifyRequest, reply: FastifyReply) {
  const { name } = request.params as { name: string }
  const ok = await opsService.pauseQueue(name as QueueName)
  if (!ok) {
    return reply.code(404).send({ error: 'Queue not found', code: 'QUEUE_NOT_FOUND' })
  }
  await audit(request, 'queue_pause', name)
  return reply.send({ paused: true })
}

export async function resumeQueue(request: FastifyRequest, reply: FastifyReply) {
  const { name } = request.params as { name: string }
  const ok = await opsService.resumeQueue(name as QueueName)
  if (!ok) {
    return reply.code(404).send({ error: 'Queue not found', code: 'QUEUE_NOT_FOUND' })
  }
  await audit(request, 'queue_resume', name)
  return reply.send({ resumed: true })
}

export async function getJobDetail(request: FastifyRequest, reply: FastifyReply) {
  const { name, jobId } = request.params as { name: string; jobId: string }
  const detail = await opsService.getJobDetail(name as QueueName, jobId)
  if (!detail) {
    return reply.code(404).send({ error: 'Job not found', code: 'JOB_NOT_FOUND' })
  }
  return reply.send(detail)
}

// ─── Integration health ────────────────────────────────────

export async function getIntegrationHealth(_request: FastifyRequest, reply: FastifyReply) {
  const checks = await opsService.getIntegrationHealth()
  const allOk = checks.every((c) => c.status === 'ok')
  return reply.code(allOk ? 200 : 503).send({ status: allOk ? 'healthy' : 'degraded', checks })
}

// ─── Alerts ─────────────────────────────────────────────────

export async function getAlerts(_request: FastifyRequest, reply: FastifyReply) {
  const alerts = await opsService.getAlerts()
  return reply.send({ alerts })
}

// ─── History ────────────────────────────────────────────────

export async function getNotificationHistory(request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as { page?: string; limit?: string }
  const pagination = { page: parseInt(query.page || '1'), limit: parseInt(query.limit || '20') }
  const result = await opsService.getNotificationHistory(pagination)
  return reply.send(result)
}

export async function getMauticSyncHistory(request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as { page?: string; limit?: string }
  const pagination = { page: parseInt(query.page || '1'), limit: parseInt(query.limit || '20') }
  const result = await opsService.getMauticSyncHistory(pagination)
  return reply.send(result)
}

export async function getWebhookHistory(request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as { page?: string; limit?: string }
  const pagination = { page: parseInt(query.page || '1'), limit: parseInt(query.limit || '20') }
  const result = await opsService.getWebhookHistory(pagination)
  return reply.send(result)
}

export async function getAuditHistory(request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as { page?: string; limit?: string }
  const pagination = { page: parseInt(query.page || '1'), limit: parseInt(query.limit || '20') }
  const result = await opsService.getAuditHistory(pagination)
  return reply.send(result)
}
