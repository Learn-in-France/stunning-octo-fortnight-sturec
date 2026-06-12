'use client'

/**
 * Work Queue — the morning screen for the lead-intelligence experiment.
 * Ranked by intent (behavioral), filtered to no-disqualifier + current cycle.
 * Counsellors see only their assigned leads (scoped server-side); admins see all.
 * Actions come from the shared ActionStrip — same write-paths as the lead
 * detail page ("merge the decisions, not the screens").
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Pagination } from '@/components/ui/pagination'
import { Table, type Column } from '@/components/ui/table'
import { ActionStrip } from '@/features/intelligence/action-strip'
import { useWorkQueue, type WorkQueueItem } from '@/features/intelligence/hooks'

const PAGE_SIZE = 25

/** Same visual language as the Score chip on /leads */
function IntentScore({ value }: { value: number | null }) {
  const v = value ?? 0
  const color =
    v >= 15 ? 'text-score-high bg-score-high/10' :
    v > 0 ? 'text-score-mid bg-score-mid/10' :
    'text-score-low bg-score-low/10'
  return (
    <span className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-semibold font-mono ${color}`}>
      {v}
    </span>
  )
}

export default function WorkQueuePage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const { data, isLoading } = useWorkQueue({ limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE })

  const items = data?.items ?? []

  const columns: Column<WorkQueueItem>[] = [
    {
      key: 'intent',
      header: 'Intent',
      className: 'w-16',
      render: (row) => <IntentScore value={row.intentScore} />,
    },
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <div>
          <p className="font-medium text-text-primary">
            {row.firstName} {row.lastName ?? ''}
          </p>
          <p className="text-xs text-text-muted">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'programme',
      header: 'Programme',
      render: (row) => (
        <div className="max-w-[220px]">
          <p className="truncate text-xs text-text-secondary" title={row.programmeRequested ?? undefined}>
            {row.programmeRequested ?? <span className="text-text-muted">unknown</span>}
          </p>
          {row.programmeInPortfolio === false && <Badge variant="danger">not offered</Badge>}
        </div>
      ),
    },
    {
      key: 'intake',
      header: 'Intake',
      className: 'w-16',
      render: (row) => <span className="text-xs text-text-secondary">{row.intakeYear ?? '—'}</span>,
    },
    {
      key: 'source',
      header: 'Source',
      render: (row) => (
        <p className="max-w-[160px] truncate text-[11px] text-text-muted" title={row.sourcePartner ?? undefined}>
          {row.sourcePartner ?? '—'}
        </p>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => <ActionStrip lead={row} />,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Work Queue"
        description={`Ranked by intent · no disqualifiers · current cycle${data ? ` · ${data.total} leads` : ''}`}
      />

      {isLoading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <div className="bg-surface-raised rounded-xl border border-border">
          <EmptyState title="Queue is clear" description="No gated, current-cycle leads waiting." />
        </div>
      ) : (
        <>
          <div className="bg-surface-raised rounded-xl border border-border overflow-hidden">
            <Table
              columns={columns}
              data={items}
              rowKey={(row) => row.id}
              onRowClick={(row) => router.push(`/leads/${row.id}`)}
            />
          </div>
          <Pagination
            page={page}
            limit={PAGE_SIZE}
            total={data?.total ?? 0}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  )
}
