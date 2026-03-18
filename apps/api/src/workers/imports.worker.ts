/**
 * Imports Worker
 *
 * Processes bulk CSV/Excel lead import jobs. Runs at concurrency 1
 * to avoid overwhelming the database and Groq API.
 *
 * For each row: creates lead, chains ai-processing job for assessment.
 * Handles duplicates by email — skips rows where a lead already exists.
 *
 * See: docs/architecture/06-queues-and-workers.md
 */

import { Worker } from 'bullmq'
import { getRedisConnection } from '../lib/queue/connection.js'
import { buildIdempotencyKey, withIdempotency } from '../lib/queue/idempotency.js'
import { getAiProcessingQueue } from '../lib/queue/queues.js'
import type { ImportJobData } from '../lib/queue/queues.js'
import prisma from '../lib/prisma.js'

export function startImportsWorker() {
  const worker = new Worker<ImportJobData>(
    'imports',
    async (job) => {
      const { batchId, rows } = job.data

      const idempotencyKey = buildIdempotencyKey('imports', [batchId])

      const outcome = await withIdempotency(idempotencyKey, async () => {
        let created = 0
        let skipped = 0
        let errors = 0

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i]
          const rowKey = buildIdempotencyKey('imports', [batchId, String(i)])

          try {
            const rowOutcome = await withIdempotency(rowKey, async () => {
              const email = String(row.email || '').trim().toLowerCase()
              if (!email) return { status: 'skipped' as const }

              // Check for existing lead by email
              const existing = await prisma.lead.findFirst({
                where: { email, deletedAt: null },
              })
              if (existing) return { status: 'duplicate' as const }

              const firstName = String(row.firstName || row.first_name || 'Unknown')
              const lastName = row.lastName || row.last_name || undefined

              const lead = await prisma.lead.create({
                data: {
                  email,
                  firstName,
                  lastName: lastName ? String(lastName) : null,
                  phone: row.phone ? String(row.phone) : null,
                  source: 'university' as any,
                  sourcePartner: row.sourcePartner ? String(row.sourcePartner) : null,
                  status: 'new_lead',
                  notes: row.notes ? String(row.notes) : null,
                },
              })

              // Chain ai-processing for assessment
              getAiProcessingQueue().add(`import-assess-${lead.id}`, {
                entityType: 'lead',
                entityId: lead.id,
                sourceType: 'import',
                sourceId: batchId,
                profileData: row,
              }).catch((err) => console.error(`[imports] Failed to chain ai-processing for lead ${lead.id}:`, err))

              return { status: 'created' as const, leadId: lead.id }
            })

            if (rowOutcome.skipped) {
              skipped++ // Row already processed
            } else if (rowOutcome.result.status === 'duplicate') {
              skipped++
            } else if (rowOutcome.result.status === 'created') {
              created++
            } else {
              skipped++
            }
          } catch (err) {
            errors++
            console.error(`[imports] Row ${i} in batch ${batchId} failed:`, err)
          }
        }

        return { status: 'completed' as const, created, skipped, errors, total: rows.length }
      })

      if (outcome.skipped) {
        return { status: 'skipped', reason: 'Batch already processed' }
      }
      return outcome.result
    },
    {
      connection: getRedisConnection(),
      concurrency: 1,
    },
  )

  worker.on('completed', (job) => {
    console.log(`[imports] Job ${job.id} completed`)
  })

  worker.on('failed', (job, err) => {
    console.error(`[imports] Job ${job?.id} failed:`, err.message)
  })

  return worker
}
