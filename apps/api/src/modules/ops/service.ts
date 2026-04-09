/**
 * Ops service — queue stats + integration health + alerts + audit.
 *
 * Admin-only operational visibility endpoints.
 * See: docs/architecture/06-queues-and-workers.md (Monitoring section)
 */

import {
  getAiProcessingQueue,
  getLeadRoutingQueue,
  getNotificationsQueue,
  getMauticSyncQueue,
  getDocumentsQueue,
  getImportsQueue,
  getWebhooksQueue,
} from '../../lib/queue/index.js'
import { pingFirebase } from '../../integrations/firebase/index.js'
import { pingGroq } from '../../integrations/groq/index.js'
import { pingGcs } from '../../integrations/gcs/index.js'
import { pingBrevo } from '../../integrations/brevo/index.js'

const QUEUE_GETTERS = {
  'ai-processing': getAiProcessingQueue,
  'lead-routing': getLeadRoutingQueue,
  notifications: getNotificationsQueue,
  'mautic-sync': getMauticSyncQueue,
  documents: getDocumentsQueue,
  imports: getImportsQueue,
  webhooks: getWebhooksQueue,
} as const

export type QueueName = keyof typeof QUEUE_GETTERS

export async function getQueueStats() {
  const results = await Promise.all(
    Object.entries(QUEUE_GETTERS).map(async ([name, getQueue]) => {
      try {
        const queue = getQueue()
        const counts = await queue.getJobCounts(
          'waiting', 'active', 'completed', 'failed', 'delayed',
        )
        return {
          name,
          ...counts,
          isPaused: await queue.isPaused(),
        }
      } catch (err) {
        return {
          name,
          error: (err as Error).message,
          waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0,
          isPaused: false,
        }
      }
    }),
  )
  return results
}

export async function getQueueDetail(queueName: QueueName) {
  const getQueue = QUEUE_GETTERS[queueName]
  if (!getQueue) return null

  const queue = getQueue()
  const [counts, failed, waiting] = await Promise.all([
    queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed'),
    queue.getFailed(0, 9),
    queue.getWaiting(0, 9),
  ])

  return {
    name: queueName,
    ...counts,
    isPaused: await queue.isPaused(),
    recentFailed: failed.map((job) => ({
      id: job.id,
      name: job.name,
      failedReason: job.failedReason,
      attemptsMade: job.attemptsMade,
      timestamp: job.timestamp,
    })),
    nextWaiting: waiting.map((job) => ({
      id: job.id,
      name: job.name,
      timestamp: job.timestamp,
    })),
  }
}

export async function retryFailedJobs(queueName: QueueName): Promise<number> {
  const getQueue = QUEUE_GETTERS[queueName]
  if (!getQueue) return 0

  const queue = getQueue()
  const failed = await queue.getFailed(0, 99)
  let retried = 0
  for (const job of failed) {
    await job.retry()
    retried++
  }
  return retried
}

export async function retrySingleJob(queueName: QueueName, jobId: string): Promise<boolean> {
  const getQueue = QUEUE_GETTERS[queueName]
  if (!getQueue) return false

  const queue = getQueue()
  const job = await queue.getJob(jobId)
  if (!job || (await job.getState()) !== 'failed') return false

  await job.retry()
  return true
}

export async function pauseQueue(queueName: QueueName): Promise<boolean> {
  const getQueue = QUEUE_GETTERS[queueName]
  if (!getQueue) return false

  const queue = getQueue()
  await queue.pause()
  return true
}

export async function resumeQueue(queueName: QueueName): Promise<boolean> {
  const getQueue = QUEUE_GETTERS[queueName]
  if (!getQueue) return false

  const queue = getQueue()
  await queue.resume()
  return true
}

export async function getJobDetail(queueName: QueueName, jobId: string) {
  const getQueue = QUEUE_GETTERS[queueName]
  if (!getQueue) return null

  const queue = getQueue()
  const job = await queue.getJob(jobId)
  if (!job) return null

  return {
    id: job.id,
    name: job.name,
    data: job.data,
    state: await job.getState(),
    attemptsMade: job.attemptsMade,
    failedReason: job.failedReason,
    stacktrace: job.stacktrace,
    timestamp: job.timestamp,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
  }
}

// ─── Integration Health ──────────────────────────────────────

async function safeFind<T>(fn: () => Promise<T>): Promise<T | null> {
  try { return await fn() } catch { return null }
}

async function pingMautic(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const baseUrl = process.env.MAUTIC_API_URL
  const user = process.env.MAUTIC_API_USER
  const password = process.env.MAUTIC_API_PASSWORD
  if (!baseUrl || !user || !password) {
    return { ok: false, latencyMs: 0, error: 'Missing credentials' }
  }
  const start = Date.now()
  try {
    const response = await fetch(`${baseUrl}/api/contacts?limit=1`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    })
    const latencyMs = Date.now() - start
    if (!response.ok) {
      return { ok: false, latencyMs, error: `HTTP ${response.status}` }
    }
    return { ok: true, latencyMs }
  } catch (err) {
    return { ok: false, latencyMs: Date.now() - start, error: (err as Error).message }
  }
}

export async function getIntegrationHealth() {
  const { default: prisma } = await import('../../lib/prisma.js')
  const checks: Array<{
    name: string
    status: 'ok' | 'error'
    latencyMs?: number
    error?: string
    lastSuccess?: string | null
    lastError?: string | null
    lastErrorMessage?: string | null
  }> = []

  // Redis check (via queue ping)
  const redisStart = Date.now()
  try {
    const queue = getAiProcessingQueue()
    await queue.getJobCounts('waiting')
    checks.push({ name: 'redis', status: 'ok', latencyMs: Date.now() - redisStart })
  } catch (err) {
    checks.push({ name: 'redis', status: 'error', latencyMs: Date.now() - redisStart, error: (err as Error).message })
  }

  // Database check
  const dbStart = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.push({ name: 'database', status: 'ok', latencyMs: Date.now() - dbStart })
  } catch (err) {
    checks.push({ name: 'database', status: 'error', latencyMs: Date.now() - dbStart, error: (err as Error).message })
  }

  // Real liveness pings for all outbound integrations in parallel so
  // one slow check can't dominate the endpoint response time. Each
  // ping has its own 5s AbortSignal timeout internally. allSettled
  // guarantees a single ping throwing (e.g. a bad service account in
  // test env) can't break the whole health endpoint.
  type PingResult = { ok: boolean; latencyMs: number; error?: string }
  const safePing = async (fn: () => Promise<PingResult>): Promise<PingResult> => {
    try {
      return await fn()
    } catch (err) {
      return {
        ok: false,
        latencyMs: 0,
        error: err instanceof Error ? err.message : 'ping threw unexpectedly',
      }
    }
  }
  const [
    mauticPing,
    firebasePing,
    groqPing,
    gcsPing,
    brevoPing,
  ] = await Promise.all([
    safePing(pingMautic),
    safePing(pingFirebase),
    safePing(pingGroq),
    safePing(pingGcs),
    safePing(pingBrevo),
  ])

  // Fetch last-event timestamps from log tables in parallel
  const [
    lastMauticSuccess, lastMauticError,
    lastWebhookBooking,
    lastWhatsAppDelivery, lastWhatsAppError,
    lastEmailDelivery, lastEmailError,
  ] = await Promise.all([
    safeFind(() => prisma.mauticSyncLog.findFirst({ where: { status: 'sent' }, orderBy: { completedAt: 'desc' }, select: { completedAt: true } })),
    safeFind(() => prisma.mauticSyncLog.findFirst({ where: { status: 'failed' }, orderBy: { createdAt: 'desc' }, select: { createdAt: true, lastError: true } })),
    safeFind(() => prisma.booking.findFirst({ where: { calcomEventId: { not: null } }, orderBy: { createdAt: 'desc' }, select: { createdAt: true } })),
    safeFind(() => prisma.notificationLog.findFirst({ where: { status: 'delivered', channel: 'whatsapp' }, orderBy: { deliveredAt: 'desc' }, select: { deliveredAt: true, provider: true } })),
    safeFind(() => prisma.notificationLog.findFirst({ where: { status: 'failed', channel: 'whatsapp' }, orderBy: { createdAt: 'desc' }, select: { createdAt: true, errorMessage: true } })),
    safeFind(() => prisma.notificationLog.findFirst({ where: { status: 'delivered', channel: 'email' }, orderBy: { deliveredAt: 'desc' }, select: { deliveredAt: true } })),
    safeFind(() => prisma.notificationLog.findFirst({ where: { status: 'failed', channel: 'email' }, orderBy: { createdAt: 'desc' }, select: { createdAt: true, errorMessage: true } })),
  ])

  checks.push({
    name: 'mautic',
    status: mauticPing.ok ? 'ok' : 'error',
    ...(mauticPing.latencyMs > 0 && { latencyMs: mauticPing.latencyMs }),
    ...(!mauticPing.ok && { error: mauticPing.error ?? 'Connectivity check failed' }),
    lastSuccess: lastMauticSuccess?.completedAt?.toISOString() ?? null,
    lastError: lastMauticError?.createdAt?.toISOString() ?? null,
    lastErrorMessage: lastMauticError?.lastError ?? null,
  })

  checks.push({
    name: 'firebase',
    status: firebasePing.ok ? 'ok' : 'error',
    ...(firebasePing.latencyMs > 0 && { latencyMs: firebasePing.latencyMs }),
    ...(!firebasePing.ok && { error: firebasePing.error ?? 'Ping failed' }),
  })

  checks.push({
    name: 'groq',
    status: groqPing.ok ? 'ok' : 'error',
    ...(groqPing.latencyMs > 0 && { latencyMs: groqPing.latencyMs }),
    ...(!groqPing.ok && { error: groqPing.error ?? 'Ping failed' }),
  })

  checks.push({
    name: 'gcs',
    status: gcsPing.ok ? 'ok' : 'error',
    ...(gcsPing.latencyMs > 0 && { latencyMs: gcsPing.latencyMs }),
    ...(!gcsPing.ok && { error: gcsPing.error ?? 'Ping failed' }),
  })

  checks.push({
    name: 'brevo',
    status: brevoPing.ok ? 'ok' : 'error',
    ...(brevoPing.latencyMs > 0 && { latencyMs: brevoPing.latencyMs }),
    ...(!brevoPing.ok && { error: brevoPing.error ?? 'Ping failed' }),
    lastSuccess: lastEmailDelivery?.deliveredAt?.toISOString() ?? null,
    lastError: lastEmailError?.createdAt?.toISOString() ?? null,
    lastErrorMessage: lastEmailError?.errorMessage ?? null,
  })

  // Cal.com and WhatsApp are webhook-receive-only — there's no
  // outbound API to ping, so we keep the env-var + last-log approach
  // for those.
  const envChecks = [
    { name: 'calcom', vars: ['CALCOM_WEBHOOK_SECRET'] },
    { name: 'whatsapp', vars: ['WHATSAPP_WEBHOOK_SECRET'] },
  ]

  const logData: Record<string, { lastSuccess?: string | null; lastError?: string | null; lastErrorMessage?: string | null }> = {
    calcom: {
      lastSuccess: lastWebhookBooking?.createdAt?.toISOString() ?? null,
    },
    whatsapp: {
      lastSuccess: lastWhatsAppDelivery?.deliveredAt?.toISOString() ?? null,
      lastError: lastWhatsAppError?.createdAt?.toISOString() ?? null,
      lastErrorMessage: lastWhatsAppError?.errorMessage ?? null,
    },
  }

  for (const check of envChecks) {
    const missing = check.vars.filter((v) => !process.env[v])
    const timestamps = logData[check.name]
    checks.push({
      name: check.name,
      status: missing.length === 0 ? 'ok' : 'error',
      ...(missing.length > 0 && { error: `Missing env vars: ${missing.join(', ')}` }),
      ...timestamps,
    })
  }

  return checks
}

// ─── Alerts ────────────────────────────────────────────────

interface Alert {
  severity: 'critical' | 'warning' | 'info'
  category: 'queue' | 'integration' | 'webhook'
  title: string
  detail: string
  timestamp: string
}

const ALERT_THRESHOLDS = {
  queueFailedCritical: 10,
  queueFailedWarning: 3,
  queueWaitingWarning: 50,
  integrationStaleHours: 24,
  recentFailureWindow: 60,  // minutes
  recentFailureThreshold: 5,
}

export async function getAlerts(): Promise<Alert[]> {
  const { default: prisma } = await import('../../lib/prisma.js')
  const alerts: Alert[] = []
  const now = new Date()

  // 1. Queue failure alerts
  try {
    const stats = await getQueueStats()
    for (const q of stats) {
      const failed = q.failed ?? 0
      const waiting = q.waiting ?? 0
      if (failed >= ALERT_THRESHOLDS.queueFailedCritical) {
        alerts.push({
          severity: 'critical',
          category: 'queue',
          title: `${q.name}: ${failed} failed jobs`,
          detail: `Queue has ${failed} failed jobs (threshold: ${ALERT_THRESHOLDS.queueFailedCritical})`,
          timestamp: now.toISOString(),
        })
      } else if (failed >= ALERT_THRESHOLDS.queueFailedWarning) {
        alerts.push({
          severity: 'warning',
          category: 'queue',
          title: `${q.name}: ${failed} failed jobs`,
          detail: `Queue has ${failed} failed jobs (threshold: ${ALERT_THRESHOLDS.queueFailedWarning})`,
          timestamp: now.toISOString(),
        })
      }
      if (waiting >= ALERT_THRESHOLDS.queueWaitingWarning) {
        alerts.push({
          severity: 'warning',
          category: 'queue',
          title: `${q.name}: ${waiting} waiting jobs`,
          detail: `Queue backlog is growing — ${waiting} jobs waiting`,
          timestamp: now.toISOString(),
        })
      }
      if (q.isPaused) {
        alerts.push({
          severity: 'info',
          category: 'queue',
          title: `${q.name}: paused`,
          detail: 'Queue is currently paused — jobs will not be processed',
          timestamp: now.toISOString(),
        })
      }
    }
  } catch { /* queue check failure is already visible in queue stats */ }

  // 2. Integration health alerts — stale last success
  try {
    const checks = await getIntegrationHealth()
    for (const check of checks) {
      if (check.status === 'error') {
        alerts.push({
          severity: check.name === 'redis' || check.name === 'database' ? 'critical' : 'warning',
          category: 'integration',
          title: `${check.name}: ${check.error ?? 'unhealthy'}`,
          detail: check.error ?? 'Service health check failed',
          timestamp: now.toISOString(),
        })
      }
      // Stale success alert for services with log data
      if (check.lastSuccess) {
        const lastOk = new Date(check.lastSuccess)
        const hoursAgo = (now.getTime() - lastOk.getTime()) / 3_600_000
        if (hoursAgo > ALERT_THRESHOLDS.integrationStaleHours) {
          alerts.push({
            severity: 'warning',
            category: 'integration',
            title: `${check.name}: no successful activity in ${Math.round(hoursAgo)}h`,
            detail: `Last success was ${check.lastSuccess}`,
            timestamp: now.toISOString(),
          })
        }
      }
    }
  } catch { /* graceful degradation */ }

  // 3. Repeated failure alerts — recent notification/sync failures
  try {
    const windowStart = new Date(now.getTime() - ALERT_THRESHOLDS.recentFailureWindow * 60_000)

    const [recentNotifFails, recentSyncFails] = await Promise.all([
      safeFind(() => prisma.notificationLog.count({
        where: { status: 'failed', createdAt: { gte: windowStart } },
      })),
      safeFind(() => prisma.mauticSyncLog.count({
        where: { status: 'failed', createdAt: { gte: windowStart } },
      })),
    ])

    if (recentNotifFails && recentNotifFails >= ALERT_THRESHOLDS.recentFailureThreshold) {
      alerts.push({
        severity: 'warning',
        category: 'webhook',
        title: `${recentNotifFails} notification failures in last ${ALERT_THRESHOLDS.recentFailureWindow}m`,
        detail: 'Notification delivery failure rate is elevated',
        timestamp: now.toISOString(),
      })
    }

    if (recentSyncFails && recentSyncFails >= ALERT_THRESHOLDS.recentFailureThreshold) {
      alerts.push({
        severity: 'warning',
        category: 'webhook',
        title: `${recentSyncFails} Mautic sync failures in last ${ALERT_THRESHOLDS.recentFailureWindow}m`,
        detail: 'CRM sync failure rate is elevated',
        timestamp: now.toISOString(),
      })
    }
  } catch { /* graceful degradation */ }

  return alerts
}

// ─── History ────────────────────────────────────────────────

export async function getNotificationHistory(pagination: { page: number; limit: number }) {
  const { default: prisma } = await import('../../lib/prisma.js')
  const skip = (pagination.page - 1) * pagination.limit

  const [items, total] = await Promise.all([
    prisma.notificationLog.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: pagination.limit,
      select: {
        id: true,
        recipient: true,
        channel: true,
        provider: true,
        templateKey: true,
        status: true,
        errorMessage: true,
        sentAt: true,
        deliveredAt: true,
        createdAt: true,
      },
    }),
    prisma.notificationLog.count(),
  ])

  return { items, total, page: pagination.page, limit: pagination.limit }
}

export async function getMauticSyncHistory(pagination: { page: number; limit: number }) {
  const { default: prisma } = await import('../../lib/prisma.js')
  const skip = (pagination.page - 1) * pagination.limit

  const [items, total] = await Promise.all([
    prisma.mauticSyncLog.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: pagination.limit,
      select: {
        id: true,
        eventType: true,
        payloadHash: true,
        status: true,
        attempts: true,
        lastError: true,
        createdAt: true,
        completedAt: true,
      },
    }),
    prisma.mauticSyncLog.count(),
  ])

  return { items, total, page: pagination.page, limit: pagination.limit }
}

export async function getWebhookHistory(pagination: { page: number; limit: number }) {
  const { default: prisma } = await import('../../lib/prisma.js')
  const skip = (pagination.page - 1) * pagination.limit

  const [items, total] = await Promise.all([
    prisma.booking.findMany({
      where: { calcomEventId: { not: null } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pagination.limit,
      select: {
        id: true,
        calcomEventId: true,
        status: true,
        externalStatus: true,
        scheduledAt: true,
        lastSyncedAt: true,
        createdAt: true,
      },
    }),
    prisma.booking.count({ where: { calcomEventId: { not: null } } }),
  ])

  return { items, total, page: pagination.page, limit: pagination.limit }
}

export async function getAuditHistory(pagination: { page: number; limit: number }) {
  const { default: prisma } = await import('../../lib/prisma.js')
  const skip = (pagination.page - 1) * pagination.limit

  const [items, total] = await Promise.all([
    prisma.opsAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: pagination.limit,
      select: {
        id: true,
        userEmail: true,
        action: true,
        target: true,
        metadata: true,
        createdAt: true,
      },
    }),
    prisma.opsAuditLog.count(),
  ])

  return { items, total, page: pagination.page, limit: pagination.limit }
}
