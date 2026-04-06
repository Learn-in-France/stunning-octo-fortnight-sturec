/**
 * Notification Worker
 *
 * Processes notification jobs — creates NotificationLog records and
 * dispatches via the appropriate channel (email, WhatsApp, SMS).
 *
 * Triggers: stage changes, document verify/reject, booking events,
 * lead creation, counsellor assignment.
 *
 * See: docs/architecture/06-queues-and-workers.md
 */

import { Worker } from 'bullmq'
import { getRedisConnection } from '../lib/queue/connection.js'
import { buildIdempotencyKey, withIdempotency } from '../lib/queue/idempotency.js'
import type { NotificationJobData } from '../lib/queue/queues.js'
import prisma from '../lib/prisma.js'

export function startNotificationsWorker() {
  const worker = new Worker<NotificationJobData>(
    'notifications',
    async (job) => {
      const { recipientId, channel, templateKey, data } = job.data

      const idempotencyKey = buildIdempotencyKey('notifications', [
        recipientId,
        templateKey,
        data.triggeringActionId as string || job.id || '',
      ])

      const outcome = await withIdempotency(idempotencyKey, async () => {
        // Resolve recipient contact info
        // For non-UUID recipients (e.g. 'support-team'), use env-configured addresses
        const user = await resolveRecipient(recipientId)
        if (!user) return { status: 'skipped' as const, reason: 'Recipient not found' }

        const recipient = channel === 'email'
          ? user.email
          : user.phone || user.email

        // Create notification log entry
        const notification = await prisma.notificationLog.create({
          data: {
            userId: user.id ?? undefined,
            studentId: data.studentId as string | undefined,
            leadId: data.leadId as string | undefined,
            recipient,
            channel,
            provider: getProvider(channel),
            templateKey,
            payloadJson: data as any,
            status: 'pending',
          },
        })

        // Dispatch based on channel
        try {
          await dispatch(channel, recipient, templateKey, data, user)

          await prisma.notificationLog.update({
            where: { id: notification.id },
            data: { status: 'sent', sentAt: new Date() },
          })

          // Link campaign step to notification log and mark step as sent
          if (data.campaignStepId) {
            prisma.studentCampaignStep.update({
              where: { id: data.campaignStepId as string },
              data: { notificationLogId: notification.id, status: 'sent', sentAt: new Date() },
            }).catch(() => {}) // non-fatal if step doesn't exist
          }

          return { status: 'sent' as const, notificationId: notification.id }
        } catch (err) {
          await prisma.notificationLog.update({
            where: { id: notification.id },
            data: {
              status: 'failed',
              errorMessage: err instanceof Error ? err.message : String(err),
            },
          })

          // Mark campaign step as failed too
          if (data.campaignStepId) {
            prisma.studentCampaignStep.update({
              where: { id: data.campaignStepId as string },
              data: { status: 'failed', errorMessage: err instanceof Error ? err.message : String(err) },
            }).catch(() => {})
          }

          throw err // Let BullMQ retry
        }
      })

      if (outcome.skipped) {
        return { status: 'skipped', reason: 'Already processed' }
      }

      return outcome.result
    },
    {
      connection: getRedisConnection(),
      concurrency: 10,
    },
  )

  worker.on('completed', (job) => {
    console.log(`[notifications] Job ${job.id} completed`)
  })

  worker.on('failed', (job, err) => {
    console.error(`[notifications] Job ${job?.id} failed:`, err.message)
  })

  return worker
}

// ─── Channel dispatch ─────────────────────────────────────

function getProvider(channel: string): string {
  switch (channel) {
    case 'email': return 'sendgrid'
    case 'whatsapp': return 'sensy'
    case 'sms': return 'sensy'
    default: return 'unknown'
  }
}

async function dispatch(
  channel: string,
  recipient: string,
  templateKey: string,
  data: Record<string, unknown>,
  user: { firstName: string; lastName: string },
): Promise<void> {
  switch (channel) {
    case 'email':
      await sendEmail(recipient, templateKey, data, user)
      break
    case 'whatsapp':
      await sendWhatsApp(recipient, templateKey, data, user)
      break
    case 'sms':
      await sendSms(recipient, templateKey, data, user)
      break
    default:
      throw new Error(`Unsupported notification channel: ${channel}`)
  }
}

/**
 * Email dispatch via SendGrid or a compatible transactional email provider.
 */
async function sendEmail(
  to: string,
  templateKey: string,
  data: Record<string, unknown>,
  user: { firstName: string; lastName: string },
): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY
  if (!apiKey) {
    console.warn(`[notifications] SENDGRID_API_KEY not set, skipping email to ${to}`)
    return
  }

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: to, name: `${user.firstName} ${user.lastName}`.trim() }],
        dynamic_template_data: { ...data, firstName: user.firstName },
      }],
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'noreply@sturec.com',
        name: process.env.SENDGRID_FROM_NAME || 'STUREC',
      },
      template_id: templateKey,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`SendGrid error ${response.status}: ${body}`)
  }
}

/**
 * WhatsApp dispatch via Sensy.ai or a compatible WhatsApp Business API.
 */
async function sendWhatsApp(
  to: string,
  templateKey: string,
  data: Record<string, unknown>,
  _user: { firstName: string; lastName: string },
): Promise<void> {
  const apiKey = process.env.WHATSAPP_API_KEY
  const apiUrl = process.env.WHATSAPP_API_URL
  if (!apiKey || !apiUrl) {
    console.warn(`[notifications] WhatsApp API not configured, skipping message to ${to}`)
    return
  }

  const response = await fetch(`${apiUrl}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to,
      template: templateKey,
      data,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`WhatsApp API error ${response.status}: ${body}`)
  }
}

/**
 * SMS dispatch via Sensy.ai (same provider as WhatsApp).
 */
async function sendSms(
  to: string,
  templateKey: string,
  data: Record<string, unknown>,
  _user: { firstName: string; lastName: string },
): Promise<void> {
  const apiKey = process.env.SMS_API_KEY || process.env.WHATSAPP_API_KEY
  const apiUrl = process.env.SMS_API_URL || process.env.WHATSAPP_API_URL
  if (!apiKey || !apiUrl) {
    console.warn(`[notifications] SMS API not configured, skipping message to ${to}`)
    return
  }

  const response = await fetch(`${apiUrl}/sms`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to,
      template: templateKey,
      data,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`SMS API error ${response.status}: ${body}`)
  }
}

// ─── Recipient resolution ─────────────────────────────────

const SYSTEM_RECIPIENTS: Record<string, { id?: string; email: string; phone: string | null; firstName: string; lastName: string }> = {
  'support-team': {
    email: process.env.SUPPORT_EMAIL || 'info@learninfrance.com',
    phone: null,
    firstName: 'Support',
    lastName: 'Team',
  },
  'admin-team': {
    email: process.env.ADMIN_EMAIL || 'info@learninfrance.com',
    phone: null,
    firstName: 'Admin',
    lastName: 'Team',
  },
}

async function resolveRecipient(recipientId: string) {
  // Check for system/virtual recipients first
  const system = SYSTEM_RECIPIENTS[recipientId]
  if (system) return system

  // UUID recipient — look up user
  return prisma.user.findUnique({
    where: { id: recipientId },
    select: { id: true, email: true, phone: true, firstName: true, lastName: true },
  })
}
