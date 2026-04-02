/**
 * AI Processing Worker
 *
 * Handles:
 * - Chat session end → final assessment (sourceType='chat')
 * - Batch assessment of imported leads (sourceType='import')
 * - Form submission → initial lead assessment (sourceType='form_submission')
 * - Document upload → student reassessment (sourceType='document')
 * - Manual assessment triggers (sourceType='manual_review')
 *
 * After persisting an assessment, emits to lead-routing queue
 * so qualification/priority/status automation runs.
 *
 * See: docs/architecture/06-queues-and-workers.md
 */

import { Worker } from 'bullmq'
import { getRedisConnection } from '../lib/queue/connection.js'
import { buildIdempotencyKey, withIdempotency } from '../lib/queue/idempotency.js'
import { getLeadRoutingQueue } from '../lib/queue/queues.js'
import type { AiProcessingJobData } from '../lib/queue/queues.js'
import { assessImportedLead, assessStudent } from '../modules/chat/service.js'
import prisma from '../lib/prisma.js'

export function startAiProcessingWorker() {
  const worker = new Worker<AiProcessingJobData>(
    'ai-processing',
    async (job) => {
      const { entityType, entityId, sourceType, sourceId, profileData } = job.data

      const idempotencyKey = buildIdempotencyKey('ai-processing', [
        entityType,
        entityId,
        sourceType,
        sourceId,
      ])

      const outcome = await withIdempotency(idempotencyKey, async () => {
        switch (sourceType) {
          case 'import': {
            if (entityType !== 'lead' || !profileData) {
              return { status: 'skipped' as const, reason: 'Import requires lead + profileData' }
            }
            await assessImportedLead(entityId, profileData)
            return { status: 'completed' as const, entityId }
          }

          case 'chat': {
            // End-of-session assessment — call generateAssessment
            const { generateAssessment } = await import('../modules/chat/service.js')
            const session = await prisma.chatSession.findFirst({
              where: { id: sourceId },
              select: { leadId: true, studentId: true },
            })
            if (!session) return { status: 'skipped' as const, reason: 'Session not found' }

            await generateAssessment(sourceId, session.leadId, session.studentId)
            return { status: 'completed' as const, entityId }
          }

          case 'form_submission': {
            // New lead from form — assess with whatever data we have
            if (entityType !== 'lead') {
              return { status: 'skipped' as const, reason: 'Form submission only applies to leads' }
            }
            const lead = await prisma.lead.findUnique({
              where: { id: entityId },
              select: {
                firstName: true, lastName: true, email: true, phone: true,
                notes: true, source: true, sourcePartner: true,
              },
            })
            if (!lead) return { status: 'skipped' as const, reason: 'Lead not found' }
            await assessImportedLead(entityId, lead as Record<string, unknown>)
            return { status: 'completed' as const, entityId }
          }

          case 'document': {
            // Document upload triggers reassessment of the student
            if (entityType !== 'student') {
              return { status: 'skipped' as const, reason: 'Document assessment only applies to students' }
            }
            const student = await prisma.student.findUnique({
              where: { id: entityId },
              select: {
                id: true, source: true, sourcePartner: true, stage: true,
                userId: true,
              },
            })
            if (!student) return { status: 'skipped' as const, reason: 'Student not found' }
            await assessStudent(entityId, student as Record<string, unknown>, 'document', sourceId)
            return { status: 'completed' as const, entityId }
          }

          case 'booking': {
            // Booking triggers a counsellor handoff summary
            // Find the latest chat session for this entity and generate a full assessment
            const bookingEntity = entityType === 'student'
              ? await prisma.student.findUnique({ where: { id: entityId }, select: { userId: true } })
              : await prisma.lead.findUnique({ where: { id: entityId }, select: { userId: true } })
            if (!bookingEntity) return { status: 'skipped' as const, reason: 'Entity not found for booking summary' }

            // Find latest chat session for this user
            const latestSession = await prisma.chatSession.findFirst({
              where: { userId: bookingEntity.userId },
              orderBy: { startedAt: 'desc' },
              select: { id: true, leadId: true, studentId: true },
            })
            if (latestSession) {
              const { generateAssessment } = await import('../modules/chat/service.js')
              await generateAssessment(latestSession.id, latestSession.leadId, latestSession.studentId)
            } else {
              // No chat session — assess from profile data directly
              if (entityType === 'lead') {
                const lead = await prisma.lead.findUnique({
                  where: { id: entityId },
                  select: { firstName: true, lastName: true, email: true, phone: true, notes: true, source: true },
                })
                if (lead) await assessImportedLead(entityId, lead as Record<string, unknown>)
              }
            }
            return { status: 'completed' as const, entityId }
          }

          case 'manual_review': {
            // Manual trigger — works for both leads and students
            if (entityType === 'lead') {
              const lead = await prisma.lead.findUnique({
                where: { id: entityId },
                select: {
                  firstName: true, lastName: true, email: true, phone: true,
                  notes: true, source: true,
                },
              })
              if (!lead) return { status: 'skipped' as const, reason: 'Lead not found' }
              await assessImportedLead(entityId, lead as Record<string, unknown>)
              return { status: 'completed' as const, entityId }
            }
            if (entityType === 'student') {
              const student = await prisma.student.findUnique({
                where: { id: entityId },
                select: {
                  id: true, source: true, sourcePartner: true, stage: true,
                  userId: true,
                },
              })
              if (!student) return { status: 'skipped' as const, reason: 'Student not found' }
              await assessStudent(entityId, student as Record<string, unknown>, 'manual_review', sourceId)
              return { status: 'completed' as const, entityId }
            }
            return { status: 'skipped' as const, reason: `Unknown entity type: ${entityType}` }
          }

          default:
            return { status: 'skipped' as const, reason: `Source type '${sourceType}' not supported` }
        }
      })

      if (outcome.skipped) {
        return { status: 'skipped', reason: 'Already processed' }
      }

      const result = outcome.result

      // After assessment completes, emit lead-routing for leads
      if (result.status === 'completed' && (entityType === 'lead' || sourceType === 'chat')) {
        const leadId = entityType === 'lead' ? entityId : undefined
        // For chat sessions, resolve leadId from session
        let resolvedLeadId = leadId
        if (!resolvedLeadId && sourceType === 'chat') {
          const session = await prisma.chatSession.findFirst({
            where: { id: sourceId },
            select: { leadId: true },
          })
          resolvedLeadId = session?.leadId
        }

        if (resolvedLeadId) {
          // Find the latest assessment for this lead to get its ID
          const latestAssessment = await prisma.aiAssessment.findFirst({
            where: { leadId: resolvedLeadId },
            orderBy: { createdAt: 'desc' },
            select: { id: true },
          })

          if (latestAssessment) {
            getLeadRoutingQueue().add('route-lead', {
              leadId: resolvedLeadId,
              assessmentId: latestAssessment.id,
            }).catch((err) => console.error('[ai-processing] Failed to enqueue lead-routing:', err))
          }
        }
      }

      return result
    },
    {
      connection: getRedisConnection(),
      concurrency: 3,
      limiter: { max: 10, duration: 60_000 }, // Rate limit Groq calls
    },
  )

  worker.on('completed', (job) => {
    console.log(`[ai-processing] Job ${job.id} completed`)
  })

  worker.on('failed', (job, err) => {
    console.error(`[ai-processing] Job ${job?.id} failed:`, err.message)
  })

  return worker
}
