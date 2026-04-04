'use client'

import { useState } from 'react'

import { PageHeader } from '@/components/layout/page-header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Modal } from '@/components/ui/modal'
import { Tabs } from '@/components/ui/tabs'
import { RoleGuard } from '@/lib/guards/role-guard'
import { useToast } from '@/providers/toast-provider'
import { Table } from '@/components/ui/table'
import { Pagination } from '@/components/ui/pagination'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { EmptyState } from '@/components/ui/empty-state'
import {
  useCampaignTemplates,
  useCreateCampaignTemplate,
  useCampaignPacks,
  useCreateCampaignPack,
} from '@/features/campaigns/hooks/use-campaigns'
import {
  useQueueStats,
  useQueueDetail,
  useJobDetail,
  useRetryAllFailed,
  useRetrySingleJob,
  usePauseQueue,
  useResumeQueue,
  useIntegrationHealth,
  useNotificationHistory,
  useMauticSyncHistory,
  useWebhookHistory,
  useAuditHistory,
  useAlerts,
  type QueueStat,
  type FailedJob,
  type IntegrationCheck,
  type NotificationHistoryItem,
  type MauticSyncHistoryItem,
  type WebhookHistoryItem,
  type AuditHistoryItem,
  type Alert,
} from '@/features/ops/hooks/use-ops'

// ─── Queue overview cards ───────────────────────────────────────

function QueueCard({
  queue,
  onSelect,
}: {
  queue: QueueStat
  onSelect: () => void
}) {
  const pause = usePauseQueue()
  const resume = useResumeQueue()
  const retryAll = useRetryAllFailed()
  const { addToast } = useToast()

  const hasIssues = queue.failed > 0 || queue.error
  const total = queue.waiting + queue.active + queue.delayed

  return (
    <Card className="cursor-pointer hover:border-primary-300 transition-colors" onClick={onSelect}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-text-primary font-display truncate">
              {queue.name}
            </h3>
            {queue.isPaused && <Badge variant="warning" dot>Paused</Badge>}
            {queue.error && <Badge variant="danger" dot>Error</Badge>}
          </div>
          {queue.error ? (
            <p className="text-xs text-rose-600 truncate">{queue.error}</p>
          ) : (
            <div className="flex items-center gap-3 text-xs text-text-muted">
              <span>{queue.active} active</span>
              <span>{queue.waiting} waiting</span>
              <span>{queue.delayed} delayed</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {queue.failed > 0 && (
            <Badge variant="danger" dot>
              {queue.failed} failed
            </Badge>
          )}
          {!hasIssues && total === 0 && (
            <Badge variant="success" dot>Idle</Badge>
          )}
          {!hasIssues && total > 0 && (
            <Badge variant="info" dot>Processing</Badge>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="mt-3 grid grid-cols-4 gap-2 pt-3 border-t border-border/60">
        <StatCell label="Completed" value={queue.completed} />
        <StatCell label="Failed" value={queue.failed} variant={queue.failed > 0 ? 'danger' : undefined} />
        <StatCell label="Waiting" value={queue.waiting} />
        <StatCell label="Active" value={queue.active} variant={queue.active > 0 ? 'info' : undefined} />
      </div>

      {/* Quick actions */}
      <div className="mt-3 flex items-center gap-2 pt-2 border-t border-border/60" onClick={(e) => e.stopPropagation()}>
        {queue.failed > 0 && (
          <Button
            variant="ghost"
            size="sm"
            loading={retryAll.isPending}
            onClick={() => {
              retryAll.mutate(queue.name, {
                onSuccess: (data) => addToast('success', `Retried ${(data as { retried: number }).retried} jobs in ${queue.name}`),
                onError: () => addToast('error', `Failed to retry jobs in ${queue.name}`),
              })
            }}
          >
            Retry all failed
          </Button>
        )}
        {queue.isPaused ? (
          <Button
            variant="ghost"
            size="sm"
            loading={resume.isPending}
            onClick={() => {
              resume.mutate(queue.name, {
                onSuccess: () => addToast('success', `Resumed ${queue.name}`),
                onError: () => addToast('error', `Failed to resume ${queue.name}`),
              })
            }}
          >
            Resume
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            loading={pause.isPending}
            onClick={() => {
              pause.mutate(queue.name, {
                onSuccess: () => addToast('success', `Paused ${queue.name}`),
                onError: () => addToast('error', `Failed to pause ${queue.name}`),
              })
            }}
          >
            Pause
          </Button>
        )}
      </div>
    </Card>
  )
}

function StatCell({
  label,
  value,
  variant,
}: {
  label: string
  value: number
  variant?: 'danger' | 'info'
}) {
  const colorMap = {
    danger: 'text-rose-600',
    info: 'text-sky-600',
  }
  return (
    <div className="text-center">
      <p className={`text-base font-bold font-display ${variant ? colorMap[variant] : 'text-text-primary'}`}>
        {value.toLocaleString()}
      </p>
      <p className="text-[10px] text-text-muted uppercase tracking-wider">{label}</p>
    </div>
  )
}

// ─── Queue detail modal ─────────────────────────────────────────

function QueueDetailModal({
  queueName,
  onClose,
}: {
  queueName: string
  onClose: () => void
}) {
  const { data: detail, isLoading } = useQueueDetail(queueName)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)

  if (isLoading || !detail) {
    return (
      <Modal open onClose={onClose} title={queueName} size="lg">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="md" />
        </div>
      </Modal>
    )
  }

  return (
    <Modal open onClose={onClose} title={queueName} size="lg">
      {selectedJobId ? (
        <JobDetailView
          queueName={queueName}
          jobId={selectedJobId}
          onBack={() => setSelectedJobId(null)}
        />
      ) : (
        <div className="space-y-5">
          {/* Counts summary */}
          <div className="grid grid-cols-5 gap-3">
            <StatCell label="Waiting" value={detail.waiting} />
            <StatCell label="Active" value={detail.active} variant={detail.active > 0 ? 'info' : undefined} />
            <StatCell label="Completed" value={detail.completed} />
            <StatCell label="Failed" value={detail.failed} variant={detail.failed > 0 ? 'danger' : undefined} />
            <StatCell label="Delayed" value={detail.delayed} />
          </div>

          {/* Failed jobs */}
          {detail.recentFailed.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                Recent Failed Jobs
              </h4>
              <div className="space-y-1.5">
                {detail.recentFailed.map((job) => (
                  <FailedJobRow
                    key={job.id}
                    job={job}
                    queueName={queueName}
                    onSelect={() => setSelectedJobId(job.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Waiting jobs */}
          {detail.nextWaiting.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                Next Waiting Jobs
              </h4>
              <div className="space-y-1">
                {detail.nextWaiting.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-sunken text-sm cursor-pointer hover:bg-surface-sunken/80"
                    onClick={() => setSelectedJobId(job.id)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-xs text-text-muted">#{job.id}</span>
                      <span className="text-text-primary truncate">{job.name}</span>
                    </div>
                    <span className="text-xs text-text-muted shrink-0">
                      {formatTimestamp(job.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {detail.recentFailed.length === 0 && detail.nextWaiting.length === 0 && (
            <p className="text-sm text-text-muted text-center py-4">No recent jobs to display.</p>
          )}
        </div>
      )}
    </Modal>
  )
}

function FailedJobRow({
  job,
  queueName,
  onSelect,
}: {
  job: FailedJob
  queueName: string
  onSelect: () => void
}) {
  const retrySingle = useRetrySingleJob()
  const { addToast } = useToast()

  return (
    <div className="flex items-start justify-between gap-3 px-3 py-2.5 rounded-lg bg-rose-50/50 border border-rose-100">
      <div className="min-w-0 cursor-pointer" onClick={onSelect}>
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-mono text-xs text-text-muted">#{job.id}</span>
          <span className="text-sm font-medium text-text-primary truncate">{job.name}</span>
          <Badge variant="muted">{job.attemptsMade} attempts</Badge>
        </div>
        <p className="text-xs text-rose-600 truncate">{job.failedReason}</p>
        <p className="text-[10px] text-text-muted mt-0.5">{formatTimestamp(job.timestamp)}</p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        loading={retrySingle.isPending}
        onClick={(e) => {
          e.stopPropagation()
          retrySingle.mutate(
            { queueName, jobId: job.id },
            {
              onSuccess: () => addToast('success', `Retried job #${job.id}`),
              onError: () => addToast('error', `Failed to retry job #${job.id}`),
            },
          )
        }}
      >
        Retry
      </Button>
    </div>
  )
}

// ─── Job detail drilldown ───────────────────────────────────────

function JobDetailView({
  queueName,
  jobId,
  onBack,
}: {
  queueName: string
  jobId: string
  onBack: () => void
}) {
  const { data: job, isLoading } = useJobDetail(queueName, jobId)
  const retrySingle = useRetrySingleJob()
  const { addToast } = useToast()

  if (isLoading || !job) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="md" />
      </div>
    )
  }

  const stateVariant: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'muted'> = {
    completed: 'success',
    failed: 'danger',
    active: 'info',
    waiting: 'warning',
    delayed: 'muted',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="text-text-muted hover:text-text-primary transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-text-primary font-display">Job #{job.id}</span>
        <Badge variant={stateVariant[job.state] ?? 'muted'}>{job.state}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <InfoField label="Name" value={job.name} />
        <InfoField label="Attempts" value={String(job.attemptsMade)} />
        <InfoField label="Created" value={formatTimestamp(job.timestamp)} />
        <InfoField label="Processed" value={job.processedOn ? formatTimestamp(job.processedOn) : '—'} />
        <InfoField label="Finished" value={job.finishedOn ? formatTimestamp(job.finishedOn) : '—'} />
      </div>

      {job.failedReason && (
        <div>
          <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">Error</p>
          <p className="text-sm text-rose-600 bg-rose-50/50 px-3 py-2 rounded-lg border border-rose-100">
            {job.failedReason}
          </p>
        </div>
      )}

      {job.stacktrace.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">Stack Trace</p>
          <pre className="text-xs text-text-secondary bg-surface-sunken px-3 py-2 rounded-lg overflow-x-auto max-h-48 overflow-y-auto font-mono whitespace-pre-wrap">
            {job.stacktrace.join('\n')}
          </pre>
        </div>
      )}

      <div>
        <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">Payload</p>
        <pre className="text-xs text-text-secondary bg-surface-sunken px-3 py-2 rounded-lg overflow-x-auto max-h-48 overflow-y-auto font-mono whitespace-pre-wrap">
          {JSON.stringify(job.data, null, 2)}
        </pre>
      </div>

      {job.state === 'failed' && (
        <div className="pt-2">
          <Button
            size="sm"
            loading={retrySingle.isPending}
            onClick={() => {
              retrySingle.mutate(
                { queueName, jobId },
                {
                  onSuccess: () => addToast('success', `Retried job #${jobId}`),
                  onError: () => addToast('error', `Failed to retry job #${jobId}`),
                },
              )
            }}
          >
            Retry this job
          </Button>
        </div>
      )}
    </div>
  )
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">{label}</p>
      <p className="text-sm text-text-primary font-mono">{value}</p>
    </div>
  )
}

// ─── Integration health section ─────────────────────────────────

function IntegrationHealthSection() {
  const { data, isLoading } = useIntegrationHealth()

  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-10">
          <LoadingSpinner size="md" />
        </div>
      </Card>
    )
  }

  if (!data) return null

  const infraChecks = data.checks.filter((c) => c.name === 'redis' || c.name === 'database')
  const serviceChecks = data.checks.filter((c) => c.name !== 'redis' && c.name !== 'database')

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-semibold text-text-primary font-display">System Status</h3>
        <Badge variant={data.status === 'healthy' ? 'success' : 'danger'} dot>
          {data.status === 'healthy' ? 'All systems operational' : 'Degraded'}
        </Badge>
      </div>

      {/* Infrastructure */}
      <Card>
        <CardHeader>
          <CardTitle>Infrastructure</CardTitle>
        </CardHeader>
        <div className="space-y-2">
          {infraChecks.map((check) => (
            <IntegrationRow key={check.name} check={check} />
          ))}
        </div>
      </Card>

      {/* External services */}
      <Card>
        <CardHeader>
          <CardTitle>External Services</CardTitle>
        </CardHeader>
        <div className="space-y-2">
          {serviceChecks.map((check) => (
            <IntegrationRow key={check.name} check={check} />
          ))}
        </div>
      </Card>
    </div>
  )
}

const SERVICE_LABELS: Record<string, { label: string; description: string }> = {
  redis: { label: 'Redis', description: 'Queue and cache backend' },
  database: { label: 'PostgreSQL', description: 'Primary data store' },
  firebase: { label: 'Firebase Auth', description: 'Identity and authentication' },
  groq: { label: 'Groq AI', description: 'LLM inference for AI advisor' },
  mautic: { label: 'Mautic', description: 'CRM sync (downstream only)' },
  gcs: { label: 'Google Cloud Storage', description: 'Document uploads' },
  calcom: { label: 'Cal.com', description: 'Booking integration' },
  whatsapp: { label: 'WhatsApp', description: 'Messaging integration' },
}

const LIVE_CHECKED_SERVICES = new Set(['redis', 'database'])

function IntegrationRow({ check }: { check: IntegrationCheck }) {
  const info = SERVICE_LABELS[check.name] ?? { label: check.name, description: '' }
  const isLiveCheck = LIVE_CHECKED_SERVICES.has(check.name)
  const okLabel = isLiveCheck ? 'Connected' : 'Configured'

  return (
    <div className="flex items-center justify-between gap-4 px-3 py-2.5 rounded-lg bg-surface-sunken">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-text-primary">{info.label}</p>
          {check.latencyMs !== undefined && (
            <span className="text-[10px] text-text-muted font-mono">{check.latencyMs}ms</span>
          )}
        </div>
        <p className="text-xs text-text-muted truncate">{info.description}</p>
        {(check.lastSuccess || check.lastError) && (
          <div className="flex items-center gap-3 mt-1">
            {check.lastSuccess && (
              <span className="text-[10px] text-emerald-600">
                Last OK: {formatDate(check.lastSuccess)}
              </span>
            )}
            {check.lastError && (
              <span className="text-[10px] text-rose-600" title={check.lastErrorMessage ?? undefined}>
                Last fail: {formatDate(check.lastError)}
              </span>
            )}
          </div>
        )}
        {check.error && (
          <p className="text-[10px] text-rose-600 mt-0.5">{check.error}</p>
        )}
      </div>
      <div className="shrink-0">
        <Badge variant={check.status === 'ok' ? 'success' : 'danger'} dot>
          {check.status === 'ok' ? okLabel : 'Error'}
        </Badge>
      </div>
    </div>
  )
}

// ─── History section ─────────────────────────────────────────────

const STATUS_VARIANT: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'muted'> = {
  delivered: 'success',
  sent: 'success',
  failed: 'danger',
  pending: 'warning',
  confirmed: 'success',
  cancelled: 'danger',
  active: 'info',
}

function NotificationHistoryTable() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useNotificationHistory(page)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <LoadingSpinner size="md" />
      </div>
    )
  }

  if (!data || data.items.length === 0) {
    return <p className="text-sm text-text-muted text-center py-8">No notification history.</p>
  }

  const columns = [
    {
      key: 'recipient',
      header: 'Recipient',
      render: (row: NotificationHistoryItem) => (
        <span className="font-mono text-xs">{row.recipient}</span>
      ),
    },
    {
      key: 'channel',
      header: 'Channel',
      render: (row: NotificationHistoryItem) => (
        <Badge variant="muted">{row.channel}</Badge>
      ),
    },
    {
      key: 'template',
      header: 'Template',
      render: (row: NotificationHistoryItem) => (
        <span className="text-xs text-text-secondary">{row.templateKey}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: NotificationHistoryItem) => (
        <Badge variant={STATUS_VARIANT[row.status] ?? 'muted'} dot>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'error',
      header: 'Error',
      render: (row: NotificationHistoryItem) => (
        <span className="text-xs text-rose-600 truncate max-w-[200px] block">
          {row.errorMessage ?? '—'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (row: NotificationHistoryItem) => (
        <span className="text-xs text-text-muted">{formatDate(row.createdAt)}</span>
      ),
    },
  ]

  return (
    <div>
      <Card>
        <Table columns={columns} data={data.items} rowKey={(r) => r.id} />
      </Card>
      <Pagination page={data.page} limit={data.limit} total={data.total} onPageChange={setPage} />
    </div>
  )
}

function MauticHistoryTable() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useMauticSyncHistory(page)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <LoadingSpinner size="md" />
      </div>
    )
  }

  if (!data || data.items.length === 0) {
    return <p className="text-sm text-text-muted text-center py-8">No Mautic sync history.</p>
  }

  const columns = [
    {
      key: 'eventType',
      header: 'Event',
      render: (row: MauticSyncHistoryItem) => (
        <span className="text-xs font-medium text-text-primary">{row.eventType}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: MauticSyncHistoryItem) => (
        <Badge variant={STATUS_VARIANT[row.status] ?? 'muted'} dot>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'attempts',
      header: 'Attempts',
      render: (row: MauticSyncHistoryItem) => (
        <span className="font-mono text-xs">{row.attempts}</span>
      ),
    },
    {
      key: 'error',
      header: 'Error',
      render: (row: MauticSyncHistoryItem) => (
        <span className="text-xs text-rose-600 truncate max-w-[200px] block">
          {row.lastError ?? '—'}
        </span>
      ),
    },
    {
      key: 'completedAt',
      header: 'Completed',
      render: (row: MauticSyncHistoryItem) => (
        <span className="text-xs text-text-muted">
          {row.completedAt ? formatDate(row.completedAt) : '—'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (row: MauticSyncHistoryItem) => (
        <span className="text-xs text-text-muted">{formatDate(row.createdAt)}</span>
      ),
    },
  ]

  return (
    <div>
      <Card>
        <Table columns={columns} data={data.items} rowKey={(r) => r.id} />
      </Card>
      <Pagination page={data.page} limit={data.limit} total={data.total} onPageChange={setPage} />
    </div>
  )
}

function WebhookHistoryTable() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useWebhookHistory(page)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <LoadingSpinner size="md" />
      </div>
    )
  }

  if (!data || data.items.length === 0) {
    return <p className="text-sm text-text-muted text-center py-8">No webhook history.</p>
  }

  const columns = [
    {
      key: 'calcomEventId',
      header: 'Cal.com Event',
      render: (row: WebhookHistoryItem) => (
        <span className="font-mono text-xs">{row.calcomEventId}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: WebhookHistoryItem) => (
        <Badge variant={STATUS_VARIANT[row.status] ?? 'muted'} dot>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'externalStatus',
      header: 'External',
      render: (row: WebhookHistoryItem) => (
        <span className="text-xs text-text-secondary">{row.externalStatus ?? '—'}</span>
      ),
    },
    {
      key: 'scheduledAt',
      header: 'Scheduled',
      render: (row: WebhookHistoryItem) => (
        <span className="text-xs text-text-muted">
          {row.scheduledAt ? formatDate(row.scheduledAt) : '—'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (row: WebhookHistoryItem) => (
        <span className="text-xs text-text-muted">{formatDate(row.createdAt)}</span>
      ),
    },
  ]

  return (
    <div>
      <Card>
        <Table columns={columns} data={data.items} rowKey={(r) => r.id} />
      </Card>
      <Pagination page={data.page} limit={data.limit} total={data.total} onPageChange={setPage} />
    </div>
  )
}

function AuditHistoryTable() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useAuditHistory(page)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <LoadingSpinner size="md" />
      </div>
    )
  }

  if (!data || data.items.length === 0) {
    return <p className="text-sm text-text-muted text-center py-8">No operator actions recorded.</p>
  }

  const ACTION_LABELS: Record<string, string> = {
    queue_pause: 'Paused queue',
    queue_resume: 'Resumed queue',
    retry_all: 'Retried all failed',
    retry_single: 'Retried job',
  }

  const columns = [
    {
      key: 'userEmail',
      header: 'Operator',
      render: (row: AuditHistoryItem) => (
        <span className="text-xs font-medium text-text-primary">{row.userEmail}</span>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (row: AuditHistoryItem) => (
        <Badge variant="muted">{ACTION_LABELS[row.action] ?? row.action}</Badge>
      ),
    },
    {
      key: 'target',
      header: 'Target',
      render: (row: AuditHistoryItem) => (
        <span className="font-mono text-xs text-text-secondary">{row.target}</span>
      ),
    },
    {
      key: 'metadata',
      header: 'Details',
      render: (row: AuditHistoryItem) => (
        <span className="text-xs text-text-muted">
          {row.metadata ? JSON.stringify(row.metadata) : '—'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'When',
      render: (row: AuditHistoryItem) => (
        <span className="text-xs text-text-muted">{formatDate(row.createdAt)}</span>
      ),
    },
  ]

  return (
    <div>
      <Card>
        <Table columns={columns} data={data.items} rowKey={(r) => r.id} />
      </Card>
      <Pagination page={data.page} limit={data.limit} total={data.total} onPageChange={setPage} />
    </div>
  )
}

function HistorySection() {
  const [activeTab, setActiveTab] = useState<'notifications' | 'mautic' | 'webhooks' | 'audit'>('notifications')

  return (
    <div className="space-y-4">
      <div className="flex gap-0 border-b border-border">
        {([
          { id: 'notifications' as const, label: 'Notifications' },
          { id: 'mautic' as const, label: 'Mautic Sync' },
          { id: 'webhooks' as const, label: 'Webhooks' },
          { id: 'audit' as const, label: 'Operator Actions' },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              relative px-4 py-2.5 text-sm font-medium whitespace-nowrap
              transition-colors duration-150 cursor-pointer
              ${activeTab === tab.id ? 'text-primary-700' : 'text-text-muted hover:text-text-secondary'}
            `}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-t-full" />
            )}
          </button>
        ))}
      </div>
      {activeTab === 'notifications' && <NotificationHistoryTable />}
      {activeTab === 'mautic' && <MauticHistoryTable />}
      {activeTab === 'webhooks' && <WebhookHistoryTable />}
      {activeTab === 'audit' && <AuditHistoryTable />}
    </div>
  )
}

// ─── Alerts banner ────────────────────────────────────────────────

const SEVERITY_STYLES: Record<string, { bg: string; border: string; icon: string }> = {
  critical: { bg: 'bg-rose-50', border: 'border-rose-200', icon: 'text-rose-600' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-600' },
  info: { bg: 'bg-sky-50', border: 'border-sky-200', icon: 'text-sky-600' },
}

function AlertsBanner() {
  const { data, isLoading } = useAlerts()

  if (isLoading || !data?.alerts?.length) return null

  return (
    <div className="space-y-2 mb-4">
      {data.alerts.map((alert: Alert, i: number) => {
        const style = SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.info
        return (
          <div
            key={`${alert.category}-${alert.title}-${i}`}
            className={`flex items-start gap-3 px-4 py-3 rounded-lg border ${style.bg} ${style.border}`}
          >
            <span className={`text-sm font-bold ${style.icon} shrink-0 mt-0.5`}>
              {alert.severity === 'critical' ? '!!' : alert.severity === 'warning' ? '!' : 'i'}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary">{alert.title}</p>
              <p className="text-xs text-text-muted">{alert.detail}</p>
            </div>
            <Badge
              variant={alert.severity === 'critical' ? 'danger' : alert.severity === 'warning' ? 'warning' : 'info'}
            >
              {alert.category}
            </Badge>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main page ──────────────────────────────────────────────────

function QueuesSection() {
  const { data, isLoading } = useQueueStats()
  const [selectedQueue, setSelectedQueue] = useState<string | null>(null)

  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-10">
          <LoadingSpinner size="md" />
        </div>
      </Card>
    )
  }

  const queues = data?.queues ?? []
  const totalFailed = queues.reduce((sum, q) => sum + q.failed, 0)
  const totalActive = queues.reduce((sum, q) => sum + q.active, 0)
  const pausedCount = queues.filter((q) => q.isPaused).length

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-text-muted">{queues.length} queues</span>
        {totalActive > 0 && (
          <Badge variant="info" dot>{totalActive} active</Badge>
        )}
        {totalFailed > 0 && (
          <Badge variant="danger" dot>{totalFailed} failed</Badge>
        )}
        {pausedCount > 0 && (
          <Badge variant="warning" dot>{pausedCount} paused</Badge>
        )}
        {totalFailed === 0 && totalActive === 0 && pausedCount === 0 && (
          <Badge variant="success" dot>All idle</Badge>
        )}
      </div>

      {/* Queue cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {queues.map((queue) => (
          <QueueCard
            key={queue.name}
            queue={queue}
            onSelect={() => setSelectedQueue(queue.name)}
          />
        ))}
      </div>

      {/* Detail modal */}
      {selectedQueue && (
        <QueueDetailModal
          queueName={selectedQueue}
          onClose={() => setSelectedQueue(null)}
        />
      )}
    </div>
  )
}

export default function AutomationsPage() {
  return (
    <RoleGuard allowed={['admin']}>
      <div>
        <PageHeader
          title="Automations"
          description="Queue health, job monitoring, and integration status."
        />

        <AlertsBanner />

        <Tabs
          items={[
            {
              id: 'queues',
              label: 'Queues',
              content: <QueuesSection />,
            },
            {
              id: 'integrations',
              label: 'Integrations',
              content: <IntegrationHealthSection />,
            },
            {
              id: 'templates',
              label: 'Campaign Templates',
              content: <CampaignTemplatesSection />,
            },
            {
              id: 'packs',
              label: 'Phase Packs',
              content: <CampaignPacksSection />,
            },
            {
              id: 'history',
              label: 'History',
              content: <HistorySection />,
            },
          ]}
        />
      </div>
    </RoleGuard>
  )
}

// ─── Campaign Templates Section ─────────────────────────────────

const PHASE_KEYS = [
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'application', label: 'Application' },
  { value: 'campus_france_visa', label: 'Campus France & Visa' },
  { value: 'pre_departure', label: 'Pre-departure' },
  { value: 'arrival', label: 'Arrival' },
]

const CHANNELS = [
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'sms', label: 'SMS' },
]

const DELIVERY_MODES = [
  { value: 'direct_email', label: 'Direct Email' },
  { value: 'direct_whatsapp', label: 'Direct WhatsApp' },
  { value: 'direct_sms', label: 'Direct SMS' },
  { value: 'mautic_campaign_trigger', label: 'Mautic Campaign' },
]

function CampaignTemplatesSection() {
  const { data: templates, isLoading } = useCampaignTemplates()
  const createTemplate = useCreateCampaignTemplate()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '', phaseKey: '', channel: 'email', deliveryMode: 'direct_email',
    templateKey: '', subject: '', description: '', defaultDelayDays: '0',
  })

  if (isLoading) return <div className="flex justify-center py-10"><LoadingSpinner size="md" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">
          {(templates ?? []).length} templates
        </h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add template'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Name" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Welcome Email" />
            <Select label="Phase" options={[{ value: '', label: 'Select phase...' }, ...PHASE_KEYS]}
              value={form.phaseKey}
              onChange={(e) => setForm({ ...form, phaseKey: e.target.value })} />
            <Select label="Channel" options={CHANNELS}
              value={form.channel}
              onChange={(e) => setForm({ ...form, channel: e.target.value })} />
            <Select label="Delivery Mode" options={DELIVERY_MODES}
              value={form.deliveryMode}
              onChange={(e) => setForm({ ...form, deliveryMode: e.target.value })} />
            <Input label="Template Key" value={form.templateKey}
              onChange={(e) => setForm({ ...form, templateKey: e.target.value })}
              placeholder="e.g. welcome_email_v1" />
            <Input label="Subject (optional)" value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            <Input label="Default Delay (days)" type="number" value={form.defaultDelayDays}
              onChange={(e) => setForm({ ...form, defaultDelayDays: e.target.value })} />
            <Input label="Description (optional)" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="mt-4">
            <Button size="sm" loading={createTemplate.isPending}
              disabled={!form.name || !form.phaseKey || !form.templateKey}
              onClick={() => {
                createTemplate.mutate({
                  name: form.name, phaseKey: form.phaseKey, channel: form.channel,
                  deliveryMode: form.deliveryMode, templateKey: form.templateKey,
                  subject: form.subject || undefined, description: form.description || undefined,
                  defaultDelayDays: parseInt(form.defaultDelayDays) || 0,
                }, {
                  onSuccess: () => {
                    setShowForm(false)
                    setForm({ name: '', phaseKey: '', channel: 'email', deliveryMode: 'direct_email',
                      templateKey: '', subject: '', description: '', defaultDelayDays: '0' })
                  },
                })
              }}
            >
              Create template
            </Button>
          </div>
        </Card>
      )}

      {(templates ?? []).length === 0 && !showForm ? (
        <EmptyState title="No campaign templates yet." description="Create templates that can be grouped into phase packs." />
      ) : (
        <div className="space-y-3">
          {(templates ?? []).map((t) => (
            <Card key={t.id} padding="sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-text-primary">{t.name}</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {t.phaseKey} · {t.channel} · {t.deliveryMode} · key: {t.templateKey}
                    {t.defaultDelayDays > 0 && ` · delay: ${t.defaultDelayDays}d`}
                  </p>
                </div>
                <Badge variant={t.active ? 'success' : 'muted'}>{t.active ? 'Active' : 'Inactive'}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function CampaignPacksSection() {
  const { data: packs, isLoading } = useCampaignPacks()
  const { data: templates } = useCampaignTemplates()
  const createPack = useCreateCampaignPack()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', phaseKey: '', description: '' })
  const [steps, setSteps] = useState<Array<{ templateId: string; delayDays: string }>>([])

  if (isLoading) return <div className="flex justify-center py-10"><LoadingSpinner size="md" /></div>

  const addStep = () => setSteps([...steps, { templateId: '', delayDays: '0' }])
  const removeStep = (idx: number) => setSteps(steps.filter((_, i) => i !== idx))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">
          {(packs ?? []).length} packs
        </h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Create pack'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Pack Name" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Onboarding Welcome Pack" />
            <Select label="Phase" options={[{ value: '', label: 'Select phase...' }, ...PHASE_KEYS]}
              value={form.phaseKey}
              onChange={(e) => setForm({ ...form, phaseKey: e.target.value })} />
            <Input label="Description (optional)" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="sm:col-span-2" />
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Steps</p>
              <Button size="sm" variant="ghost" onClick={addStep}>+ Add step</Button>
            </div>
            {steps.length === 0 ? (
              <p className="text-sm text-text-muted">No steps added. Click "+ Add step" to begin.</p>
            ) : (
              <div className="space-y-3">
                {steps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-3 rounded-lg bg-surface-sunken/50 p-3">
                    <span className="text-xs font-mono text-text-muted w-6">{idx + 1}</span>
                    <Select
                      options={[
                        { value: '', label: 'Select template...' },
                        ...(templates ?? []).map((t) => ({
                          value: t.id,
                          label: `${t.name} (${t.channel})`,
                        })),
                      ]}
                      value={step.templateId}
                      onChange={(e) => {
                        const updated = [...steps]
                        updated[idx] = { ...step, templateId: e.target.value }
                        setSteps(updated)
                      }}
                    />
                    <Input
                      placeholder="Delay days"
                      type="number"
                      value={step.delayDays}
                      onChange={(e) => {
                        const updated = [...steps]
                        updated[idx] = { ...step, delayDays: e.target.value }
                        setSteps(updated)
                      }}
                      className="w-24"
                    />
                    <Button size="sm" variant="ghost" onClick={() => removeStep(idx)}>Remove</Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4">
            <Button size="sm" loading={createPack.isPending}
              disabled={!form.name || !form.phaseKey || steps.length === 0 || steps.some((s) => !s.templateId)}
              onClick={() => {
                createPack.mutate({
                  name: form.name, phaseKey: form.phaseKey,
                  description: form.description || undefined,
                  steps: steps.map((s, idx) => ({
                    templateId: s.templateId,
                    orderIndex: idx,
                    delayDays: parseInt(s.delayDays) || 0,
                  })),
                }, {
                  onSuccess: () => {
                    setShowForm(false)
                    setForm({ name: '', phaseKey: '', description: '' })
                    setSteps([])
                  },
                })
              }}
            >
              Create pack
            </Button>
          </div>
        </Card>
      )}

      {(packs ?? []).length === 0 && !showForm ? (
        <EmptyState title="No campaign packs yet." description="Create templates first, then group them into packs." />
      ) : (
        <div className="space-y-4">
          {(packs ?? []).map((pack) => (
            <Card key={pack.id}>
              <CardHeader>
                <div>
                  <CardTitle>{pack.name}</CardTitle>
                  <p className="text-xs text-text-muted mt-0.5">{pack.phaseKey} · {pack.steps.length} steps</p>
                </div>
              </CardHeader>
              {pack.description && <p className="text-sm text-text-secondary mb-3">{pack.description}</p>}
              <div className="space-y-2">
                {pack.steps.map((step) => (
                  <div key={step.id} className="flex items-center justify-between rounded-lg bg-surface-sunken/50 p-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-text-muted w-6">{step.orderIndex + 1}</span>
                      <Badge variant={
                        step.template.channel === 'email' ? 'info' :
                        step.template.channel === 'whatsapp' ? 'success' : 'muted'
                      }>{step.template.channel}</Badge>
                      <span className="text-sm text-text-primary">{step.template.name}</span>
                    </div>
                    {step.delayDays > 0 && (
                      <span className="text-xs text-text-muted">+{step.delayDays}d delay</span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Helpers ────────────────────────────────────────────────────

function formatTimestamp(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60_000)

  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60_000)

  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}
