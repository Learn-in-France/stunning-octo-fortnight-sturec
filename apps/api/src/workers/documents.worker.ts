/**
 * Document Worker
 *
 * Handles post-document-event processing:
 * - upload_complete: Check for gap detection (missing requirements met)
 * - verified: Update requirement status, trigger notifications
 * - rejected: Update requirement status, trigger notifications
 *
 * See: docs/architecture/06-queues-and-workers.md
 */

import { Worker } from 'bullmq'
import { getRedisConnection } from '../lib/queue/connection.js'
import { buildIdempotencyKey, withIdempotency } from '../lib/queue/idempotency.js'
import type { DocumentJobData } from '../lib/queue/queues.js'
import { getNotificationsQueue, getAiProcessingQueue } from '../lib/queue/queues.js'
import prisma from '../lib/prisma.js'

export function startDocumentsWorker() {
  const worker = new Worker<DocumentJobData>(
    'documents',
    async (job) => {
      const { documentId, eventType } = job.data

      const idempotencyKey = buildIdempotencyKey('documents', [documentId, eventType])

      const outcome = await withIdempotency(idempotencyKey, async () => {
        const doc = await prisma.document.findUnique({
          where: { id: documentId },
          select: {
            id: true,
            studentId: true,
            type: true,
            status: true,
            filename: true,
          },
        })
        if (!doc) return { status: 'skipped' as const, reason: 'Document not found' }

        switch (eventType) {
          case 'upload_complete':
            return await handleUploadComplete(doc)
          case 'verified':
            return await handleVerified(doc)
          case 'rejected':
            return await handleRejected(doc)
          default:
            return { status: 'skipped' as const, reason: `Unknown event type: ${eventType}` }
        }
      })

      if (outcome.skipped) {
        return { status: 'skipped', reason: 'Already processed' }
      }
      return outcome.result
    },
    {
      connection: getRedisConnection(),
      concurrency: 5,
    },
  )

  worker.on('completed', (job) => {
    console.log(`[documents] Job ${job.id} completed`)
  })

  worker.on('failed', (job, err) => {
    console.error(`[documents] Job ${job?.id} failed:`, err.message)
  })

  return worker
}

// ─── Event handlers ────────────────────────────────────────

interface DocInfo {
  id: string
  studentId: string
  type: string
  status: string
  filename: string
}

/**
 * After upload completes, check if any pending requirements are now satisfied.
 */
async function handleUploadComplete(doc: DocInfo) {
  // Find matching pending requirements for this document type
  const matchingReqs = await prisma.studentDocumentRequirement.findMany({
    where: {
      studentId: doc.studentId,
      documentType: doc.type,
      status: 'missing',
    },
  })

  if (matchingReqs.length > 0) {
    // Mark the first matching requirement as uploaded
    await prisma.studentDocumentRequirement.update({
      where: { id: matchingReqs[0].id },
      data: { status: 'uploaded' as any },
    })
  }

  // Notify the student's counsellor about the new upload
  const student = await prisma.student.findUnique({
    where: { id: doc.studentId },
    select: { assignedCounsellorId: true },
  })

  if (student?.assignedCounsellorId) {
    await getNotificationsQueue().add('doc-upload-notification', {
      recipientId: student.assignedCounsellorId,
      channel: 'email',
      templateKey: 'document_uploaded',
      data: {
        studentId: doc.studentId,
        documentType: doc.type,
        filename: doc.filename,
        triggeringActionId: doc.id,
      },
    })
  }

  // Trigger AI reassessment based on the new document
  getAiProcessingQueue().add('document-upload-assessment', {
    entityType: 'student',
    entityId: doc.studentId,
    sourceType: 'document',
    sourceId: doc.id,
  }).catch((err) => console.error('[documents] Failed to enqueue AI assessment:', err))

  return { status: 'completed' as const, requirementsUpdated: matchingReqs.length }
}

/**
 * After verification, update requirement status and notify student.
 */
async function handleVerified(doc: DocInfo) {
  // Update matching requirement to verified
  const matchingReqs = await prisma.studentDocumentRequirement.findMany({
    where: {
      studentId: doc.studentId,
      documentType: doc.type,
      status: { in: ['missing', 'requested', 'uploaded'] as any[] },
    },
  })

  for (const req of matchingReqs) {
    await prisma.studentDocumentRequirement.update({
      where: { id: req.id },
      data: { status: 'verified' as any },
    })
  }

  // Notify student
  const student = await prisma.student.findUnique({
    where: { id: doc.studentId },
    select: { userId: true },
  })

  if (student) {
    await getNotificationsQueue().add('doc-verified-notification', {
      recipientId: student.userId,
      channel: 'email',
      templateKey: 'document_verified',
      data: {
        studentId: doc.studentId,
        documentType: doc.type,
        filename: doc.filename,
        triggeringActionId: doc.id,
      },
    })
  }

  return { status: 'completed' as const, requirementsUpdated: matchingReqs.length }
}

/**
 * After rejection, update requirement status and notify student with reason.
 */
async function handleRejected(doc: DocInfo) {
  // Reset matching requirement to pending
  const matchingReqs = await prisma.studentDocumentRequirement.findMany({
    where: {
      studentId: doc.studentId,
      documentType: doc.type,
      status: { in: ['uploaded'] as any[] },
    },
  })

  for (const req of matchingReqs) {
    await prisma.studentDocumentRequirement.update({
      where: { id: req.id },
      data: { status: 'pending' as any },
    })
  }

  // Notify student about rejection
  const student = await prisma.student.findUnique({
    where: { id: doc.studentId },
    select: { userId: true },
  })

  if (student) {
    await getNotificationsQueue().add('doc-rejected-notification', {
      recipientId: student.userId,
      channel: 'email',
      templateKey: 'document_rejected',
      data: {
        studentId: doc.studentId,
        documentType: doc.type,
        filename: doc.filename,
        triggeringActionId: doc.id,
      },
    })
  }

  return { status: 'completed' as const, requirementsReset: matchingReqs.length }
}
