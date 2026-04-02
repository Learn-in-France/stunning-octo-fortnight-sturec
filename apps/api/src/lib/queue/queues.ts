/**
 * Queue definitions.
 *
 * All queues defined centrally. Workers import queue references from here.
 * Producers (services) import and call `.add()`.
 *
 * See: docs/architecture/06-queues-and-workers.md
 */

import { Queue } from 'bullmq'
import { getRedisConnection } from './connection.js'

export interface AiProcessingJobData {
  entityType: 'lead' | 'student'
  entityId: string
  sourceType: 'chat' | 'document' | 'import' | 'manual_review' | 'form_submission' | 'booking'
  sourceId: string
  profileData?: Record<string, unknown>
}

export interface LeadRoutingJobData {
  leadId: string
  assessmentId: string
}

export interface NotificationJobData {
  recipientId: string
  channel: 'email' | 'whatsapp' | 'sms'
  templateKey: string
  data: Record<string, unknown>
}

export interface MauticSyncJobData {
  entityType: 'lead' | 'student'
  entityId: string
  eventType: string
  triggeringActionId: string
}

export interface DocumentJobData {
  documentId: string
  eventType: 'upload_complete' | 'verified' | 'rejected'
}

export interface ImportJobData {
  batchId: string
  rows: Record<string, unknown>[]
}

export interface WebhookJobData {
  provider: 'calcom' | 'whatsapp' | 'mautic'
  payload: Record<string, unknown>
}

// Lazy-init queues to avoid connection at import time
let _aiProcessing: Queue<AiProcessingJobData> | undefined
let _leadRouting: Queue<LeadRoutingJobData> | undefined
let _notifications: Queue<NotificationJobData> | undefined
let _mauticSync: Queue<MauticSyncJobData> | undefined
let _documents: Queue<DocumentJobData> | undefined
let _imports: Queue<ImportJobData> | undefined
let _webhooks: Queue<WebhookJobData> | undefined

function createQueue<T>(name: string): Queue<T> {
  return new Queue<T>(name, { connection: getRedisConnection() })
}

export function getAiProcessingQueue() {
  if (!_aiProcessing) _aiProcessing = createQueue<AiProcessingJobData>('ai-processing')
  return _aiProcessing
}

export function getLeadRoutingQueue() {
  if (!_leadRouting) _leadRouting = createQueue<LeadRoutingJobData>('lead-routing')
  return _leadRouting
}

export function getNotificationsQueue() {
  if (!_notifications) _notifications = createQueue<NotificationJobData>('notifications')
  return _notifications
}

export function getMauticSyncQueue() {
  if (!_mauticSync) _mauticSync = createQueue<MauticSyncJobData>('mautic-sync')
  return _mauticSync
}

export function getDocumentsQueue() {
  if (!_documents) _documents = createQueue<DocumentJobData>('documents')
  return _documents
}

export function getImportsQueue() {
  if (!_imports) _imports = createQueue<ImportJobData>('imports')
  return _imports
}

export function getWebhooksQueue() {
  if (!_webhooks) _webhooks = createQueue<WebhookJobData>('webhooks')
  return _webhooks
}
