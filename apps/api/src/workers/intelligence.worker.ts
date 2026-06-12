/**
 * Intelligence Worker — lead-intelligence experiment (2026-06).
 *
 * Jobs:
 *  - intent_recompute: recency-decayed weighted sum over lead_events
 *    → leads.intent_score. Per-lead (enqueued on new events) or full batch.
 *  - funnel_snapshot: weekly stage counts per acquisition source
 *    → funnel_snapshots (Monday 06:00 UTC, repeatable).
 *
 * Idempotent by construction: recompute is a pure function of lead_events;
 * snapshot upserts on (week_start, source_name, stage).
 */

import { Worker } from 'bullmq'
import { getRedisConnection } from '../lib/queue/connection.js'
import { getIntelligenceQueue, type IntelligenceJobData } from '../lib/queue/index.js'
import { recomputeIntent, snapshotFunnel } from '../modules/intelligence/repository.js'

function mondayOfCurrentWeek(): Date {
  const now = new Date()
  const day = now.getUTCDay() // 0=Sun
  const diff = (day + 6) % 7 // days since Monday
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diff))
  return monday
}

export function startIntelligenceWorker() {
  const worker = new Worker<IntelligenceJobData>(
    'intelligence',
    async (job) => {
      switch (job.data.task) {
        case 'intent_recompute': {
          const updated = await recomputeIntent(job.data.leadId)
          return { status: 'recomputed', leadsUpdated: updated }
        }
        case 'funnel_snapshot': {
          const written = await snapshotFunnel(mondayOfCurrentWeek())
          return { status: 'snapshotted', rowsWritten: written }
        }
        default:
          return { status: 'skipped', reason: `Unknown task` }
      }
    },
    {
      connection: getRedisConnection(),
      concurrency: 2,
    },
  )

  worker.on('failed', (job, err) => {
    console.error(`[intelligence] Job ${job?.id} failed:`, err.message)
  })

  // Register repeatable jobs (upsert — safe across restarts):
  // weekly funnel snapshot Mondays 06:00 UTC, nightly full intent refresh
  // 03:00 UTC (decay drifts scores down even without new events).
  void getIntelligenceQueue().upsertJobScheduler(
    'funnel-snapshot-weekly',
    { pattern: '0 6 * * 1' },
    { name: 'funnel-snapshot', data: { task: 'funnel_snapshot' } },
  )
  void getIntelligenceQueue().upsertJobScheduler(
    'intent-refresh-nightly',
    { pattern: '0 3 * * *' },
    { name: 'intent-refresh', data: { task: 'intent_recompute' } },
  )

  return worker
}
