/**
 * Lead Routing Worker
 *
 * Triggered after AI assessment completion. Computes final qualification
 * score, sets priority level, updates lead status to qualified/nurturing.
 * Emits downstream Mautic sync and notification side effects.
 *
 * See: docs/architecture/06-queues-and-workers.md
 */

import { Worker } from 'bullmq'
import { getRedisConnection } from '../lib/queue/connection.js'
import { buildIdempotencyKey, withIdempotency } from '../lib/queue/idempotency.js'
import { getMauticSyncQueue, getNotificationsQueue } from '../lib/queue/queues.js'
import type { LeadRoutingJobData } from '../lib/queue/queues.js'
import prisma from '../lib/prisma.js'

export function startLeadRoutingWorker() {
  const worker = new Worker<LeadRoutingJobData>(
    'lead-routing',
    async (job) => {
      const { leadId, assessmentId } = job.data

      const idempotencyKey = buildIdempotencyKey('lead-routing', [
        leadId,
        assessmentId,
      ])

      const outcome = await withIdempotency(idempotencyKey, async () => {
        // Get the assessment
        const assessment = await prisma.aiAssessment.findFirst({
          where: { id: assessmentId },
        })
        if (!assessment) return { status: 'skipped' as const, reason: 'Assessment not found' }

        const qualScore = assessment.qualificationScore ?? 0

        // Determine lead status based on qualification score
        const newStatus = qualScore >= 80 ? 'qualified' : 'nurturing'

        // Update lead
        await prisma.lead.update({
          where: { id: leadId },
          data: {
            status: newStatus as any,
            qualificationScore: qualScore,
            priorityLevel: assessment.priorityLevel,
            profileCompleteness: assessment.profileCompleteness
              ? Number(assessment.profileCompleteness)
              : undefined,
            ...(newStatus === 'qualified' && { qualifiedAt: new Date() }),
          },
        })

        // Emit Mautic sync for the lead update
        getMauticSyncQueue().add('lead-qualified', {
          entityType: 'lead',
          entityId: leadId,
          eventType: 'contact_updated',
          triggeringActionId: assessmentId,
        }).catch((err) => console.error('[lead-routing] Failed to enqueue Mautic sync:', err))

        // If qualified, notify assigned counsellor (if any)
        if (newStatus === 'qualified') {
          const lead = await prisma.lead.findUnique({
            where: { id: leadId },
            select: { assignedCounsellorId: true, firstName: true, email: true },
          })
          if (lead?.assignedCounsellorId) {
            getNotificationsQueue().add('lead-qualified', {
              recipientId: lead.assignedCounsellorId,
              channel: 'email',
              templateKey: 'lead_qualified',
              data: {
                leadId,
                leadName: lead.firstName,
                leadEmail: lead.email,
                qualificationScore: qualScore,
                triggeringActionId: assessmentId,
              },
            }).catch((err) => console.error('[lead-routing] Failed to enqueue notification:', err))
          }
        }

        return { status: 'completed' as const, leadId, newStatus }
      })

      if (outcome.skipped) {
        return { status: 'skipped', reason: 'Already processed' }
      }
      return outcome.result
    },
    {
      connection: getRedisConnection(),
      concurrency: 3,
    },
  )

  worker.on('completed', (job) => {
    console.log(`[lead-routing] Job ${job.id} completed`)
  })

  worker.on('failed', (job, err) => {
    console.error(`[lead-routing] Job ${job?.id} failed:`, err.message)
  })

  return worker
}
