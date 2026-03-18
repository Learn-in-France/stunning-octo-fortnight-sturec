'use client'

import { useState } from 'react'

import type { BookingStatus } from '@sturec/shared'
import { PageHeader } from '@/components/layout/page-header'
import { FilterBar } from '@/components/shared/filter-bar'
import { Table, type Column } from '@/components/ui/table'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useBookings, type BookingListItemView } from '@/features/bookings/hooks/use-bookings'

const STATUS_VARIANTS: Record<BookingStatus, 'muted' | 'info' | 'warning' | 'success' | 'danger'> = {
  scheduled: 'info',
  completed: 'success',
  cancelled: 'muted',
  no_show: 'danger',
}

const STATUS_LABELS: Record<BookingStatus, string> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
}

export default function BookingsPage() {
  const [status, setStatus] = useState<BookingStatus | ''>('')

  const { data: bookings, isLoading } = useBookings({ status })

  const columns: Column<BookingListItemView>[] = [
    {
      key: 'counsellor',
      header: 'Counsellor',
      render: (row) => (
        <span className="text-sm font-medium text-text-primary">{row.counsellorName}</span>
      ),
    },
    {
      key: 'scheduledAt',
      header: 'Scheduled',
      render: (row) => (
        <span className="text-xs text-text-secondary font-mono">{formatDateTime(row.scheduledAt)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={STATUS_VARIANTS[row.status]} dot>
          {STATUS_LABELS[row.status]}
        </Badge>
      ),
    },
    {
      key: 'notes',
      header: 'Notes',
      render: (row) => row.notes ? (
        <span className="text-xs text-text-secondary truncate block max-w-xs">{row.notes}</span>
      ) : (
        <span className="text-xs text-text-muted">—</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (row) => (
        <span className="text-xs text-text-muted font-mono">{formatDate(row.createdAt)}</span>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Bookings"
        description="Manage counsellor booking sessions and consultations."
        badge={bookings ? <Badge variant="muted">{bookings.length} total</Badge> : null}
      />

      <FilterBar
        search=""
        onSearchChange={() => {}}
        searchPlaceholder=""
      >
        <Select
          options={[
            { value: '', label: 'All statuses' },
            { value: 'scheduled', label: 'Scheduled' },
            { value: 'completed', label: 'Completed' },
            { value: 'cancelled', label: 'Cancelled' },
            { value: 'no_show', label: 'No Show' },
          ]}
          value={status}
          onChange={(e) => setStatus(e.target.value as BookingStatus | '')}
          className="w-36"
        />
      </FilterBar>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : !bookings?.length ? (
        <EmptyState
          title="No bookings found"
          description={status ? 'Try adjusting your filters.' : 'Bookings will appear here as counsellors schedule consultations.'}
          icon={
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect x="6" y="10" width="36" height="32" rx="4" stroke="currentColor" strokeWidth="2" />
              <path d="M6 20h36" stroke="currentColor" strokeWidth="2" />
              <path d="M16 6v8M32 6v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <circle cx="24" cy="30" r="4" stroke="currentColor" strokeWidth="2" />
            </svg>
          }
        />
      ) : (
        <div className="bg-surface-raised rounded-xl border border-border overflow-hidden">
          <Table
            columns={columns}
            data={bookings}
            rowKey={(row) => row.id}
          />
        </div>
      )}
    </div>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
}
