/**
 * Campaign Scheduler Worker
 *
 * Runs on a recurring interval to pick up due StudentCampaignStep rows
 * (status=scheduled, scheduledFor <= now, parent campaign active + automated)
 * and enqueues them through the existing notifications worker.
 *
 * This worker does NOT send directly — it delegates to the notifications queue
 * so all delivery goes through the same audit path.
 *
 * See: docs/workflow-spec-v1.md Phase 7
 */

import { processDueSteps } from '../modules/campaigns/service.js'

let intervalHandle: ReturnType<typeof setInterval> | null = null

const POLL_INTERVAL_MS = 60_000 // 1 minute

export function startCampaignSchedulerWorker() {
  console.log('[campaign-scheduler] Starting scheduler (poll every 60s)')

  // Run immediately on start
  runSchedulerTick()

  // Then poll on interval
  intervalHandle = setInterval(runSchedulerTick, POLL_INTERVAL_MS)

  return {
    stop() {
      if (intervalHandle) {
        clearInterval(intervalHandle)
        intervalHandle = null
      }
      console.log('[campaign-scheduler] Stopped')
    },
  }
}

async function runSchedulerTick() {
  try {
    const processed = await processDueSteps()
    if (processed > 0) {
      console.log(`[campaign-scheduler] Processed ${processed} due step(s)`)
    }
  } catch (err) {
    console.error('[campaign-scheduler] Tick failed:', err instanceof Error ? err.message : err)
  }
}
