import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api/client'

// ─── Types ──────────────────────────────────────────────────────

export interface QueueStat {
  name: string
  waiting: number
  active: number
  completed: number
  failed: number
  delayed: number
  isPaused: boolean
  error?: string
}

export interface FailedJob {
  id: string
  name: string
  failedReason: string
  attemptsMade: number
  timestamp: number
}

export interface WaitingJob {
  id: string
  name: string
  timestamp: number
}

export interface QueueDetail extends QueueStat {
  recentFailed: FailedJob[]
  nextWaiting: WaitingJob[]
}

export interface JobDetail {
  id: string
  name: string
  data: Record<string, unknown>
  state: string
  attemptsMade: number
  failedReason: string | null
  stacktrace: string[]
  timestamp: number
  processedOn: number | null
  finishedOn: number | null
}

export interface IntegrationCheck {
  name: string
  status: 'ok' | 'error'
  latencyMs?: number
  error?: string
  lastSuccess?: string | null
  lastError?: string | null
  lastErrorMessage?: string | null
}

export interface IntegrationHealthResponse {
  status: 'healthy' | 'degraded'
  checks: IntegrationCheck[]
}

// ─── History types ─────────────────────────────────────────────

export interface NotificationHistoryItem {
  id: string
  recipient: string
  channel: string
  provider: string
  templateKey: string
  status: string
  errorMessage: string | null
  sentAt: string | null
  deliveredAt: string | null
  createdAt: string
}

export interface MauticSyncHistoryItem {
  id: string
  eventType: string
  payloadHash: string
  status: string
  attempts: number
  lastError: string | null
  createdAt: string
  completedAt: string | null
}

export interface WebhookHistoryItem {
  id: string
  calcomEventId: string
  status: string
  externalStatus: string | null
  scheduledAt: string | null
  lastSyncedAt: string | null
  createdAt: string
}

export interface AuditHistoryItem {
  id: string
  userEmail: string
  action: string
  target: string
  metadata: Record<string, unknown> | null
  createdAt: string
}

export interface Alert {
  severity: 'critical' | 'warning' | 'info'
  category: 'queue' | 'integration' | 'webhook'
  title: string
  detail: string
  timestamp: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
}

// ─── Queue hooks ────────────────────────────────────────────────

export function useQueueStats() {
  return useQuery({
    queryKey: ['ops', 'queues'],
    queryFn: () => api.get('/ops/queues') as unknown as { queues: QueueStat[] },
    refetchInterval: 10_000,
  })
}

export function useQueueDetail(name: string | null) {
  return useQuery({
    queryKey: ['ops', 'queues', name],
    queryFn: () => api.get(`/ops/queues/${name}`) as unknown as QueueDetail,
    enabled: !!name,
    refetchInterval: 5_000,
  })
}

export function useJobDetail(queueName: string | null, jobId: string | null) {
  return useQuery({
    queryKey: ['ops', 'queues', queueName, 'jobs', jobId],
    queryFn: () => api.get(`/ops/queues/${queueName}/jobs/${jobId}`) as unknown as JobDetail,
    enabled: !!queueName && !!jobId,
  })
}

export function useRetryAllFailed() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (queueName: string) =>
      api.post(`/ops/queues/${queueName}/retry`) as unknown as { retried: number },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ops', 'queues'] })
    },
  })
}

export function useRetrySingleJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ queueName, jobId }: { queueName: string; jobId: string }) =>
      api.post(`/ops/queues/${queueName}/jobs/${jobId}/retry`) as unknown as { retried: boolean },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ops', 'queues'] })
    },
  })
}

export function usePauseQueue() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (queueName: string) =>
      api.post(`/ops/queues/${queueName}/pause`) as unknown as { paused: boolean },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ops', 'queues'] })
    },
  })
}

export function useResumeQueue() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (queueName: string) =>
      api.post(`/ops/queues/${queueName}/resume`) as unknown as { resumed: boolean },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ops', 'queues'] })
    },
  })
}

// ─── Integration hooks ──────────────────────────────────────────

export function useIntegrationHealth() {
  return useQuery({
    queryKey: ['ops', 'integrations'],
    queryFn: () => api.get('/ops/integrations') as unknown as IntegrationHealthResponse,
    refetchInterval: 30_000,
  })
}

// ─── History hooks ─────────────────────────────────────────────

export function useNotificationHistory(page: number, limit = 20) {
  return useQuery({
    queryKey: ['ops', 'history', 'notifications', page, limit],
    queryFn: () =>
      api.get(`/ops/history/notifications?page=${page}&limit=${limit}`) as unknown as PaginatedResponse<NotificationHistoryItem>,
  })
}

export function useMauticSyncHistory(page: number, limit = 20) {
  return useQuery({
    queryKey: ['ops', 'history', 'mautic', page, limit],
    queryFn: () =>
      api.get(`/ops/history/mautic?page=${page}&limit=${limit}`) as unknown as PaginatedResponse<MauticSyncHistoryItem>,
  })
}

export function useWebhookHistory(page: number, limit = 20) {
  return useQuery({
    queryKey: ['ops', 'history', 'webhooks', page, limit],
    queryFn: () =>
      api.get(`/ops/history/webhooks?page=${page}&limit=${limit}`) as unknown as PaginatedResponse<WebhookHistoryItem>,
  })
}

export function useAuditHistory(page: number, limit = 20) {
  return useQuery({
    queryKey: ['ops', 'history', 'audit', page, limit],
    queryFn: () =>
      api.get(`/ops/history/audit?page=${page}&limit=${limit}`) as unknown as PaginatedResponse<AuditHistoryItem>,
  })
}

// ─── Alerts hooks ──────────────────────────────────────────────

export function useAlerts() {
  return useQuery({
    queryKey: ['ops', 'alerts'],
    queryFn: () => api.get('/ops/alerts') as unknown as { alerts: Alert[] },
    refetchInterval: 30_000,
  })
}
