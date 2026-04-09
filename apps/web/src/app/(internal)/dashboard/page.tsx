'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import api from '@/lib/api/client'
import { useAuth } from '@/providers/auth-provider'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardHeader, CardTitle, CardValue } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useAnalyticsOverview, useCounsellorAnalytics } from '@/features/analytics/hooks/use-analytics'
import { usePendingAssignments, useUpdateBooking, type BookingListItemView } from '@/features/bookings/hooks/use-bookings'
import { useCounsellorAgenda, useCompleteReminder, useDismissReminder } from '@/features/counsellor/hooks/use-counsellor'
import { useStudents } from '@/features/students/hooks/use-students'
import { STAGE_DISPLAY_NAMES } from '@sturec/shared'

export default function DashboardPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const { data: overview, isLoading } = useAnalyticsOverview({}, { enabled: isAdmin })
  const { data: pendingAssignments } = usePendingAssignments({ enabled: isAdmin })
  const { data: counsellors } = useCounsellorAnalytics({ enabled: isAdmin })
  const updateBooking = useUpdateBooking()
  const queryClient = useQueryClient()

  const greeting = getGreeting()
  const leads = overview?.data.leads
  const students = overview?.data.students
  const apps = overview?.data.applications
  const docs = overview?.data.documents
  const bookingStats = overview?.data.bookings

  const [selectedCounsellorByBooking, setSelectedCounsellorByBooking] = useState<Record<string, string>>({})
  const [assignmentReasonByBooking, setAssignmentReasonByBooking] = useState<Record<string, string>>({})

  const assignMutation = useMutation({
    mutationFn: async ({ booking, counsellorId }: { booking: BookingListItemView; counsellorId: string }) => {
      const reason = assignmentReasonByBooking[booking.id]?.trim() || undefined
      if (booking.studentId) {
        await api.post(`/students/${booking.studentId}/assign`, { counsellorId, reason })
      } else if (booking.leadId) {
        await api.post(`/leads/${booking.leadId}/assign`, { counsellorId })
      }

      await updateBooking.mutateAsync({
        id: booking.id,
        counsellorId,
        status: 'assigned',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics', 'overview'] })
      queryClient.invalidateQueries({ queryKey: ['analytics', 'counsellors'] })
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      setAssignmentReasonByBooking({})
    },
  })

  return (
    <div>
      <PageHeader
        title={`${greeting}, ${user?.firstName ?? 'there'}`}
        description="Here's what's happening with your pipeline today."
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="space-y-6">
          {!isAdmin && <CounsellorAgendaView />}
          {isAdmin && (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Assignment Queue</CardTitle>
                </CardHeader>
                {(pendingAssignments?.length ?? 0) === 0 ? (
                  <div className="rounded-2xl bg-surface-sunken/45 p-4 text-sm text-text-secondary">
                    No bookings are waiting for manual counsellor assignment right now.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(pendingAssignments ?? []).slice(0, 5).map((booking) => {
                      const selected = selectedCounsellorByBooking[booking.id] ?? ''
                      const entityLabel = booking.studentId
                        ? `Student booking • ${booking.studentId.slice(0, 8)}`
                        : `Lead booking • ${booking.leadId?.slice(0, 8) ?? 'unknown'}`

                      return (
                        <div key={booking.id} className="rounded-2xl border border-border bg-surface-sunken/35 p-4">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-text-primary">{entityLabel}</p>
                                <Badge variant="warning" dot>Awaiting assignment</Badge>
                              </div>
                              <p className="mt-1 text-xs font-mono text-text-muted">
                                {formatDateTime(booking.scheduledAt)}
                              </p>
                              {booking.notes && (
                                <p className="mt-2 text-xs leading-6 text-text-secondary whitespace-pre-line">
                                  {booking.notes}
                                </p>
                              )}
                            </div>

                            <div className="flex w-full flex-col gap-2 lg:max-w-xs">
                              <Select
                                options={(counsellors ?? []).map((c) => ({
                                  value: c.id,
                                  label: `${c.name} • ${c.assignedStudents} students / ${c.assignedLeads} leads`,
                                }))}
                                placeholder="Choose counsellor"
                                value={selected}
                                onChange={(e) => setSelectedCounsellorByBooking((prev) => ({
                                  ...prev,
                                  [booking.id]: e.target.value,
                                }))}
                              />
                              {booking.studentId && (
                                <Textarea
                                  rows={3}
                                  value={assignmentReasonByBooking[booking.id] ?? ''}
                                  onChange={(e) => setAssignmentReasonByBooking((prev) => ({
                                    ...prev,
                                    [booking.id]: e.target.value,
                                  }))}
                                  placeholder="Optional handoff note for the next counsellor"
                                />
                              )}
                              <Button
                                size="sm"
                                disabled={!selected || assignMutation.isPending}
                                onClick={() => assignMutation.mutate({ booking, counsellorId: selected })}
                              >
                                {assignMutation.isPending ? 'Assigning…' : 'Assign counsellor'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Counsellor Workload</CardTitle>
                </CardHeader>
                <div className="space-y-3">
                  {(counsellors ?? []).length === 0 ? (
                    <p className="text-sm text-text-muted">No counsellor workload data available yet.</p>
                  ) : (
                    (counsellors ?? []).map((counsellor) => (
                      <div key={counsellor.id} className="rounded-2xl border border-border bg-surface-sunken/35 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-text-primary">{counsellor.name}</p>
                            <p className="text-xs text-text-muted">{counsellor.email}</p>
                          </div>
                          <Badge variant={counsellor.overdueActions > 0 ? 'warning' : 'success'} dot>
                            {counsellor.overdueActions > 0 ? `${counsellor.overdueActions} overdue` : 'On track'}
                          </Badge>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                          <WorkloadPill label="Students" value={counsellor.assignedStudents} />
                          <WorkloadPill label="Leads" value={counsellor.assignedLeads} />
                          <WorkloadPill label="Activity" value={counsellor.activityCount} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle>Total Leads</CardTitle>
              </CardHeader>
              <CardValue>{leads?.total ?? 0}</CardValue>
              <p className="mt-1 text-xs text-text-muted">
                <span className="font-semibold text-score-high">{leads?.new ?? 0}</span> new in period
              </p>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Qualified Leads</CardTitle>
              </CardHeader>
              <CardValue>{leads?.qualified ?? 0}</CardValue>
              <p className="mt-1 text-xs text-text-muted">Ready for counsellor assignment</p>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Students</CardTitle>
              </CardHeader>
              <CardValue>{students?.active ?? 0}</CardValue>
              <p className="mt-1 text-xs text-text-muted">Across all stages</p>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pending Documents</CardTitle>
              </CardHeader>
              <CardValue className={docs?.pending ? 'text-score-low' : ''}>{docs?.pending ?? 0}</CardValue>
              <p className="mt-1 text-xs text-text-muted">Awaiting review</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Lead Pipeline</CardTitle>
              </CardHeader>
              <div className="space-y-3">
                {([
                  { key: 'new', label: 'New', color: 'bg-status-new' },
                  { key: 'qualified', label: 'Qualified', color: 'bg-status-qualified' },
                  { key: 'converted', label: 'Converted', color: 'bg-status-converted' },
                  { key: 'disqualified', label: 'Disqualified', color: 'bg-status-disqualified' },
                ] as const).map(({ key, label, color }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${color}`} />
                      <span className="text-sm text-text-secondary">{label}</span>
                    </div>
                    <span className="text-sm font-mono font-semibold text-text-primary">{leads?.[key] ?? 0}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bookings & Handoffs</CardTitle>
              </CardHeader>
              <div className="space-y-3">
                {[
                  { label: 'Awaiting assignment', value: bookingStats?.awaitingAssignment ?? 0, variant: 'warning' as const },
                  { label: 'Assigned', value: bookingStats?.assigned ?? 0, variant: 'info' as const },
                  { label: 'Scheduled', value: bookingStats?.scheduled ?? 0, variant: 'info' as const },
                  { label: 'Completed', value: bookingStats?.completed ?? 0, variant: 'success' as const },
                ].map(({ label, value, variant }) => (
                  <div key={label} className="flex items-center justify-between">
                    <Badge variant={variant} dot>{label}</Badge>
                    <span className="text-sm font-mono font-semibold text-text-primary">{value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Students by Stage</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {Object.entries(students?.byStage ?? {}).map(([stage, count]) => (
                <div key={stage} className="flex items-center justify-between rounded-lg bg-surface-sunken/50 p-3">
                  <span className="truncate pr-2 text-xs text-text-secondary">
                    {STAGE_DISPLAY_NAMES[stage as keyof typeof STAGE_DISPLAY_NAMES] ?? stage}
                  </span>
                  <span className="shrink-0 text-sm font-mono font-bold text-text-primary">{count}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Stale students across all counsellors */}
          <AdminStaleStudents />

          {/* Conversion funnel */}
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
            </CardHeader>
            <div className="space-y-3">
              {[
                { label: 'Leads', value: leads?.total ?? 0, color: 'bg-status-new' },
                { label: 'Qualified', value: leads?.qualified ?? 0, color: 'bg-status-qualified' },
                { label: 'Converted to Student', value: leads?.converted ?? 0, color: 'bg-status-converted' },
                { label: 'Active Students', value: students?.active ?? 0, color: 'bg-primary-500' },
                { label: 'Offers Received', value: apps?.offers ?? 0, color: 'bg-sky-500' },
                { label: 'Enrolled', value: apps?.enrolled ?? 0, color: 'bg-primary-700' },
              ].map(({ label, value, color }) => {
                const maxVal = leads?.total || 1
                const pct = Math.round((value / maxVal) * 100)
                return (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-text-secondary">{label}</span>
                      <span className="text-xs font-mono font-semibold text-text-primary">{value}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-surface-sunken overflow-hidden">
                      <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

function WorkloadPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white/70 px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.14em] text-text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-text-primary">{value}</p>
    </div>
  )
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
}

function CounsellorAgendaView() {
  const { user } = useAuth()
  const { data: agenda, isLoading } = useCounsellorAgenda()
  const { data: myStudents } = useStudents({
    counsellorId: user?.id,
    page: 1,
    limit: 1,
  }, {
    resolveCounsellorNames: false,
    currentUserId: user?.id,
  })
  const completeReminder = useCompleteReminder()
  const dismissReminder = useDismissReminder()

  if (isLoading) return <LoadingSpinner size="md" />

  const myCaseloadCount = myStudents?.total ?? 0
  const needsActionCount =
    (agenda?.todayMeetings?.length ?? 0) +
    (agenda?.overdueReminders?.length ?? 0) +
    (agenda?.docsWaitingReview?.length ?? 0)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>My Caseload</CardTitle>
          <Badge variant={needsActionCount > 0 ? 'warning' : 'success'} dot>
            {needsActionCount > 0 ? `${needsActionCount} actions due` : 'On track'}
          </Badge>
        </CardHeader>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <WorkloadPill label="My students" value={myCaseloadCount} />
          <WorkloadPill label="Meetings" value={agenda?.todayMeetings?.length ?? 0} />
          <WorkloadPill label="Overdue" value={agenda?.overdueReminders?.length ?? 0} />
          <WorkloadPill label="Docs" value={agenda?.docsWaitingReview?.length ?? 0} />
          <WorkloadPill label="Stale" value={agenda?.staleStudents?.length ?? 0} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/students" className="text-xs text-primary-600 hover:underline">
            Open students list
          </Link>
          <span className="text-xs text-text-muted">These are the students currently assigned to you.</span>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Today's meetings */}
      <Card>
        <CardHeader>
          <CardTitle>Today's meetings</CardTitle>
          <Badge variant="primary">{agenda?.todayMeetings?.length ?? 0}</Badge>
        </CardHeader>
        {(agenda?.todayMeetings ?? []).length === 0 ? (
          <p className="text-sm text-text-muted">No meetings scheduled for today.</p>
        ) : (
          <div className="space-y-3">
            {agenda!.todayMeetings.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg bg-surface-sunken/50 p-3">
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {new Date(m.scheduledAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {m.student && (
                    <Link href={`/students/${m.student.id}`} className="text-xs text-primary-600 hover:underline">
                      View student
                    </Link>
                  )}
                </div>
                <Badge variant={m.status === 'assigned' ? 'info' : 'muted'} dot>{m.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Overdue follow-ups */}
      <Card>
        <CardHeader>
          <CardTitle>Overdue follow-ups</CardTitle>
          {(agenda?.overdueReminders?.length ?? 0) > 0 && (
            <Badge variant="danger">{agenda!.overdueReminders.length}</Badge>
          )}
        </CardHeader>
        {(agenda?.overdueReminders ?? []).length === 0 ? (
          <p className="text-sm text-text-muted">No overdue follow-ups. You're on track.</p>
        ) : (
          <div className="space-y-3">
            {agenda!.overdueReminders.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg bg-rose-50 p-3">
                <div>
                  <p className="text-sm font-semibold text-text-primary">{r.title}</p>
                  <p className="text-xs text-text-muted">Due {new Date(r.dueAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</p>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => completeReminder.mutate(r.id)}
                    disabled={completeReminder.isPending}
                  >
                    Done
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => dismissReminder.mutate(r.id)}
                    disabled={dismissReminder.isPending}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Docs waiting review */}
      <Card>
        <CardHeader>
          <CardTitle>Documents to review</CardTitle>
          <Badge variant="muted">{agenda?.docsWaitingReview?.length ?? 0}</Badge>
        </CardHeader>
        {(agenda?.docsWaitingReview ?? []).length === 0 ? (
          <p className="text-sm text-text-muted">No shared documents waiting for review.</p>
        ) : (
          <div className="space-y-3">
            {agenda!.docsWaitingReview.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-lg bg-surface-sunken/50 p-3">
                <div>
                  <p className="text-sm font-semibold text-text-primary">{d.filename}</p>
                  <p className="text-xs text-text-muted capitalize">{d.type.replace(/_/g, ' ')}</p>
                </div>
                <Link href={`/students/${d.studentId}`} className="text-xs text-primary-600 hover:underline">
                  View
                </Link>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Stale students */}
      <Card>
        <CardHeader>
          <CardTitle>Stale students</CardTitle>
          {(agenda?.staleStudents?.length ?? 0) > 0 && (
            <Badge variant="warning">{agenda!.staleStudents.length}</Badge>
          )}
        </CardHeader>
        {(agenda?.staleStudents ?? []).length === 0 ? (
          <p className="text-sm text-text-muted">All students have recent activity.</p>
        ) : (
          <div className="space-y-3">
            {agenda!.staleStudents.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg bg-amber-50 p-3">
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {STAGE_DISPLAY_NAMES[s.stage as keyof typeof STAGE_DISPLAY_NAMES] ?? s.stage}
                  </p>
                  <p className="text-xs text-text-muted">
                    Last activity {Math.round((Date.now() - new Date(s.updatedAt).getTime()) / (1000 * 60 * 60 * 24))}d ago
                  </p>
                </div>
                <Link href={`/students/${s.id}`} className="text-xs text-primary-600 hover:underline">
                  View
                </Link>
              </div>
            ))}
          </div>
        )}
      </Card>
      </div>
    </div>
  )
}

function AdminStaleStudents() {
  // Use the counsellor agenda endpoint since admin can also access it
  const { data: agenda } = useCounsellorAgenda()

  // Admin sees stale students across the system — the agenda query
  // for admin returns all students (not scoped to one counsellor)
  const staleStudents = agenda?.staleStudents ?? []

  if (staleStudents.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stale Students</CardTitle>
        <Badge variant="warning">{staleStudents.length}</Badge>
      </CardHeader>
      <p className="text-xs text-text-muted mb-3">Students with no activity for 14+ days</p>
      <div className="space-y-2">
        {staleStudents.map((s) => (
          <div key={s.id} className="flex items-center justify-between rounded-lg bg-amber-50 p-3">
            <div>
              <p className="text-sm font-semibold text-text-primary">
                {STAGE_DISPLAY_NAMES[s.stage as keyof typeof STAGE_DISPLAY_NAMES] ?? s.stage}
              </p>
              <p className="text-xs text-text-muted">
                Last activity {Math.round((Date.now() - new Date(s.updatedAt).getTime()) / (1000 * 60 * 60 * 24))}d ago
              </p>
            </div>
            <Link href={`/students/${s.id}`} className="text-xs text-primary-600 hover:underline">
              View
            </Link>
          </div>
        ))}
      </div>
    </Card>
  )
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}
