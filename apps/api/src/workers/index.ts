/**
 * Worker entry point.
 *
 * Started via `node --loader ts-node/esm src/workers/index.ts`
 * or as a separate Railway service in worker mode.
 */

import { startAiProcessingWorker } from './ai-processing.worker.js'
import { startLeadRoutingWorker } from './lead-routing.worker.js'
import { startNotificationsWorker } from './notifications.worker.js'
import { startDocumentsWorker } from './documents.worker.js'
import { startMauticSyncWorker } from './mautic-sync.worker.js'
import { startImportsWorker } from './imports.worker.js'
import { startWebhooksWorker } from './webhooks.worker.js'
import { closeIdempotencyRedis } from '../lib/queue/idempotency.js'

console.log('[workers] Starting worker processes...')

const aiWorker = startAiProcessingWorker()
const routingWorker = startLeadRoutingWorker()
const notificationsWorker = startNotificationsWorker()
const documentsWorker = startDocumentsWorker()
const mauticSyncWorker = startMauticSyncWorker()
const importsWorker = startImportsWorker()
const webhooksWorker = startWebhooksWorker()

console.log('[workers] All 7 workers started')

// Graceful shutdown
async function shutdown() {
  console.log('[workers] Shutting down...')
  await Promise.all([
    aiWorker.close(),
    routingWorker.close(),
    notificationsWorker.close(),
    documentsWorker.close(),
    mauticSyncWorker.close(),
    importsWorker.close(),
    webhooksWorker.close(),
    closeIdempotencyRedis(),
  ])
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
