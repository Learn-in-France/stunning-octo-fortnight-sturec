'use client'

import { useState } from 'react'

import type { BookingStatus } from '@sturec/shared'
import { PageHeader } from '@/components/layout/page-header'
import { Table, type Column } from '@/components/ui/table'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useAuth } from '@/providers/auth-provider'
import { useBookings, useBookingStats, type BookingListItemView } from '@/features/bookings/hooks/use-bookings'

const STATUS_VARIANTS: Record<BookingStatus, 'muted' | 'info' | 'warning' | 'success' | 'danger'> = {
  awaiting_assignment: 'warning',
  assigned: 'info',
  scheduled: 'info',
  completed: 'success',
  cancelled: 'muted',
  no_show: 'danger',
}

const STATUS_LABELS: Record<BookingStatus, string> = {
  awaiting_assignment: 'Awaiting Assignment',
  assigned: 'Assigned',
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
}

export default function BookingsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [status, setStatus] = useState<BookingStatus | ''>('')

  const { data: bookings, isLoading } = useBookings({ status }, {
    resolveCounsellorNames: isAdmin,
    currentUserId: user?.id,
  })
  const { data: stats } = useBookingStats({ enabled: isAdmin })

  const hasFilters = !!status

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
        description={isAdmin
          ? 'Manage counsellor booking sessions and consultations.'
          : 'Review your consultation bookings and recent handoffs.'}
        badge={bookings ? <Badge variant="muted">{bookings.length} total</Badge> : null}
      />

      {/* Summary metrics */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-3">
          <MetricCard label="Scheduled" value={stats.scheduled} accent="bg-sky-500" />
          <MetricCard label="Completed" value={stats.completed} accent="bg-primary-500" />
          <MetricCard label="Total" value={stats.scheduled + stats.completed} />
        </div>
      )}

      {/* Filter panel */}
      <div className="rounded-2xl bg-white/50 border border-white/70 px-4 py-3 mb-5 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-3">
          <Select
            options={[
              { value: '', label: 'All statuses' },
              { value: 'awaiting_assignment', label: 'Awaiting Assignment' },
              { value: 'assigned', label: 'Assigned' },
              { value: 'scheduled', label: 'Scheduled' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
              { value: 'no_show', label: 'No Show' },
            ]}
            value={status}
            onChange={(e) => setStatus(e.target.value as BookingStatus | '')}
            className="w-36"
          />
          {hasFilters && (
            <button
              onClick={() => setStatus('')}
              className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Data table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : !bookings?.length ? (
        <div className="rounded-2xl bg-white/50 border border-white/70 backdrop-blur-sm">
          <EmptyState
            title="No bookings found"
            description={hasFilters
              ? 'No bookings match this status filter. Try selecting a different status.'
              : 'Bookings will appear here as counsellors schedule consultations with students and leads.'}
            icon={
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect x="6" y="10" width="36" height="32" rx="4" stroke="currentColor" strokeWidth="2" />
                <path d="M6 20h36" stroke="currentColor" strokeWidth="2" />
                <path d="M16 6v8M32 6v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="24" cy="30" r="4" stroke="currentColor" strokeWidth="2" />
              </svg>
            }
          />
        </div>
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

function MetricCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-2xl bg-white/60 border border-white/80 px-4 py-3.5 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-1">
        {accent && <span className={`h-2 w-2 rounded-full ${accent}`} />}
        <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-2xl font-bold font-display text-text-primary tracking-tight">{value}</p>
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
