'use client'

import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'

import type { BookingListItem, BookingStatus } from '@sturec/shared'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useCreateBooking } from '@/features/bookings/hooks/use-bookings'
import { useStudentPortalBookings, useStudentProfile, useStudentProgress } from '@/features/student-portal/hooks/use-student-portal'

const STATUS_CONFIG: Record<BookingStatus, { label: string; variant: 'info' | 'success' | 'danger' | 'warning' }> = {
  awaiting_assignment: { label: 'Awaiting Assignment', variant: 'warning' },
  assigned: { label: 'Assigned', variant: 'info' },
  scheduled: { label: 'Scheduled', variant: 'info' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'danger' },
  no_show: { label: 'Missed', variant: 'warning' },
}

interface IntakeState {
  nationality: string
  currentEducation: string
  fieldOfInterest: string
  timeline: string
  budgetSignal: string
  languageLevel: string
  sourceDetail: string
}

const EMPTY_INTAKE: IntakeState = {
  nationality: '',
  currentEducation: '',
  fieldOfInterest: '',
  timeline: '',
  budgetSignal: '',
  languageLevel: '',
  sourceDetail: '',
}

export default function BookingsPage() {
  const searchParams = useSearchParams()
  const source = searchParams.get('source') === 'chat' ? 'chat' : 'portal'

  const { data: bookings, isLoading: loadingBookings } = useStudentPortalBookings()
  const { data: progress, isLoading: loadingProgress } = useStudentProgress()
  const { data: profile, isLoading: loadingProfile } = useStudentProfile()
  const createBooking = useCreateBooking()

  const [scheduledAt, setScheduledAt] = useState('')
  const [notes, setNotes] = useState('')
  const [intake, setIntake] = useState<IntakeState>(EMPTY_INTAKE)
  const [submittedId, setSubmittedId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const isLoading = loadingBookings || loadingProgress || loadingProfile
  const needsFallbackIntake = !(progress?.bookingReady ?? false)
  const incomingFromChat = source === 'chat'

  const hasCompleteFallbackIntake = useMemo(() => (
    Object.values(intake).every((value) => value.trim().length > 0)
  ), [intake])

  const upcoming = (bookings ?? []).filter((b) =>
    b.status === 'scheduled' || b.status === 'assigned' || b.status === 'awaiting_assignment',
  )
  const past = (bookings ?? []).filter((b) =>
    b.status !== 'scheduled' && b.status !== 'assigned' && b.status !== 'awaiting_assignment',
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!profile?.id) {
      setError('We could not load your student profile. Please refresh and try again.')
      return
    }

    if (!scheduledAt) {
      setError('Choose a preferred meeting time first.')
      return
    }

    if (needsFallbackIntake && !hasCompleteFallbackIntake) {
      setError('Complete the quick intake so your counsellor has enough context before the meeting.')
      return
    }

    const compiledNotes = [
      notes.trim() || null,
      needsFallbackIntake
        ? [
            'Fallback intake captured before booking:',
            `- Nationality / country of residence: ${intake.nationality}`,
            `- Current education level: ${intake.currentEducation}`,
            `- Field of interest: ${intake.fieldOfInterest}`,
            `- Timeline: ${intake.timeline}`,
            `- Budget awareness: ${intake.budgetSignal}`,
            `- Language level: ${intake.languageLevel}`,
            `- How they heard about us: ${intake.sourceDetail}`,
          ].join('\n')
        : null,
    ].filter(Boolean).join('\n\n')

    try {
      const booking = await createBooking.mutateAsync({
        scheduledAt: new Date(scheduledAt).toISOString(),
        notes: compiledNotes || undefined,
        source,
      }) as BookingListItem

      setSubmittedId(booking.id)
      setScheduledAt('')
      setNotes('')
      setIntake(EMPTY_INTAKE)
    } catch (err) {
      const apiError = err as { error?: string }
      setError(apiError.error ?? 'We could not submit your booking request. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary font-display tracking-tight">
            Book a counsellor session
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Move from AI guidance into a real human handoff with the context your counsellor needs.
          </p>
        </div>
        <Badge variant={needsFallbackIntake ? 'warning' : 'success'} dot>
          {needsFallbackIntake ? 'Intake needed' : 'Ready to book'}
        </Badge>
      </div>

      {incomingFromChat && (
        <Card>
          <CardHeader>
            <CardTitle>AI handoff ready</CardTitle>
          </CardHeader>
          <p className="text-sm leading-7 text-text-secondary">
            You are coming from the AI advisor. If the conversation already captured enough context, you can request a counsellor session immediately. Otherwise, complete the short intake below so the handoff stays useful.
          </p>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card>
          <CardHeader>
            <CardTitle>{needsFallbackIntake ? 'Complete your quick intake' : 'Request your meeting'}</CardTitle>
          </CardHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            {needsFallbackIntake && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
                <p className="text-sm font-semibold text-text-primary">
                  We still need a few essentials before the handoff.
                </p>
                <p className="mt-1 text-xs leading-6 text-text-secondary">
                  The AI has captured {progress?.intakeCapture.captured ?? 0} of 7 intake signals so far. Fill this once and your counsellor will receive a structured summary instead of a blank booking.
                </p>
                {!!progress?.intakeCapture.missing.length && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {progress.intakeCapture.missing.map((field) => (
                      <span key={field} className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-text-secondary shadow-sm">
                        {field}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {needsFallbackIntake && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Nationality / country" value={intake.nationality} onChange={(e) => setIntake((prev) => ({ ...prev, nationality: e.target.value }))} placeholder="e.g. India" />
                <Input label="Current education" value={intake.currentEducation} onChange={(e) => setIntake((prev) => ({ ...prev, currentEducation: e.target.value }))} placeholder="e.g. Final-year B.Tech" />
                <Input label="Field of interest" value={intake.fieldOfInterest} onChange={(e) => setIntake((prev) => ({ ...prev, fieldOfInterest: e.target.value }))} placeholder="e.g. Management, data, design" />
                <Input label="Target timeline" value={intake.timeline} onChange={(e) => setIntake((prev) => ({ ...prev, timeline: e.target.value }))} placeholder="e.g. Sept 2027 intake" />
                <Input label="Budget awareness" value={intake.budgetSignal} onChange={(e) => setIntake((prev) => ({ ...prev, budgetSignal: e.target.value }))} placeholder="e.g. €12k tuition + living costs" />
                <Input label="Language level" value={intake.languageLevel} onChange={(e) => setIntake((prev) => ({ ...prev, languageLevel: e.target.value }))} placeholder="e.g. IELTS 6.5, basic French" />
                <div className="sm:col-span-2">
                  <Input label="How did you hear about us?" value={intake.sourceDetail} onChange={(e) => setIntake((prev) => ({ ...prev, sourceDetail: e.target.value }))} placeholder="e.g. Instagram, referral, Google" />
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Preferred meeting time"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
              <div className="rounded-2xl border border-border bg-surface-sunken/35 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-text-muted">Assignment</p>
                <p className="mt-2 text-sm font-semibold text-text-primary">
                  {progress?.assignedCounsellorId ? 'Your counsellor will see this request.' : 'Admin will assign the right counsellor after you book.'}
                </p>
                <p className="mt-1 text-xs leading-6 text-text-secondary">
                  {progress?.assignedCounsellorId
                    ? 'Your existing counsellor context stays attached to this booking.'
                    : 'Your portal will show “Awaiting counsellor” until the assignment is complete.'}
                </p>
              </div>
            </div>

            <Textarea
              label="Anything your counsellor should know before the meeting?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Goals, blockers, application concerns, or questions you want covered in the first call."
              rows={4}
            />

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {submittedId && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                Your booking request is in. We saved the handoff context and {progress?.assignedCounsellorId ? 'your counsellor will see it shortly.' : 'the admin team will assign a counsellor next.'}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={createBooking.isPending}>
                {createBooking.isPending ? 'Submitting…' : 'Request counsellor session'}
              </Button>
              <p className="text-xs leading-6 text-text-muted">
                This creates the handoff request inside Learn in France so the counsellor has structured context before the meeting.
              </p>
            </div>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Booking readiness</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <div className="rounded-2xl bg-surface-sunken/45 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-text-muted">Captured so far</p>
              <p className="mt-2 text-3xl font-display font-semibold text-text-primary">
                {progress?.intakeCapture.captured ?? 0}
                <span className="text-base text-text-muted"> / {progress?.intakeCapture.total ?? 7}</span>
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">What happens next</p>
              <p className="mt-1 text-sm leading-7 text-text-secondary">
                Once you request the session, the system generates a counsellor-ready summary, classifies urgency, and keeps the handoff inside the app instead of relying on raw chat transcripts.
              </p>
            </div>
            {!!progress?.intakeCapture.missing.length && (
              <div>
                <p className="text-sm font-semibold text-text-primary">Still missing</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {progress.intakeCapture.missing.map((field) => (
                    <span key={field} className="rounded-full border border-border bg-surface-raised px-3 py-1 text-[11px] font-medium text-text-secondary">
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {bookings && bookings.length > 0 ? (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-text-primary font-display mb-3">Upcoming requests</h2>
              <div className="space-y-3">
                {upcoming.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-text-muted font-display mb-3">Past bookings</h2>
              <div className="space-y-3">
                {past.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <Card padding="none">
          <EmptyState
            title="No meetings requested yet"
            description="Your first counsellor session will appear here once you send the handoff request above."
          />
        </Card>
      )}
    </div>
  )
}

function BookingCard({ booking }: { booking: BookingListItem }) {
  const config = STATUS_CONFIG[booking.status]

  return (
    <Card>
      <div className="flex items-start gap-4">
        <div className="shrink-0 w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="1.5" y="3" width="15" height="13.5" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M1.5 7.5H16.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M5.25 1.5V4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M12.75 1.5V4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-text-primary font-display">Counsellor session</p>
            <Badge variant={config.variant} dot>
              {config.label}
            </Badge>
          </div>
          <p className="text-xs text-text-muted mt-1 font-mono">{formatDateTime(booking.scheduledAt)}</p>
          {booking.notes && (
            <p className="text-xs text-text-secondary mt-2 whitespace-pre-line">{booking.notes}</p>
          )}
        </div>
      </div>
    </Card>
  )
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }) + ' at ' + d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
