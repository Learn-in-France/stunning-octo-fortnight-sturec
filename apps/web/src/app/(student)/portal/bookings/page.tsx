'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import type { BookingListItem, BookingStatus } from '@sturec/shared'
import { useStudentPortalBookings } from '@/features/student-portal/hooks/use-student-portal'

const STATUS_CONFIG: Record<BookingStatus, { label: string; variant: 'info' | 'success' | 'danger' | 'warning' }> = {
  scheduled: { label: 'Upcoming', variant: 'info' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'danger' },
  no_show: { label: 'Missed', variant: 'warning' },
}

// Cal.com booking URL — configured via env or defaults to contact-based fallback
const CALCOM_BOOKING_URL = process.env.NEXT_PUBLIC_CALCOM_URL || null

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

function handleBookConsultation() {
  if (CALCOM_BOOKING_URL) {
    window.open(CALCOM_BOOKING_URL, '_blank', 'noopener,noreferrer')
  } else {
    // Fallback: navigate to chat for scheduling via AI advisor
    window.location.href = '/portal/chat'
  }
}

export default function BookingsPage() {
  const { data: bookings, isLoading } = useStudentPortalBookings()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const all = bookings ?? []
  const upcoming = all.filter((b) => b.status === 'scheduled')
  const past = all.filter((b) => b.status !== 'scheduled')

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary font-display tracking-tight">
            My Bookings
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Your counsellor consultations and scheduled meetings.
          </p>
        </div>
        <Button size="sm" onClick={handleBookConsultation}>
          Book Consultation
        </Button>
      </div>

      {all.length === 0 ? (
        <Card padding="none">
          <EmptyState
            title="No bookings yet"
            description={
              CALCOM_BOOKING_URL
                ? 'Schedule a consultation with your counsellor to discuss your study plan.'
                : 'Ask the AI advisor to help schedule a consultation with your counsellor.'
            }
            icon={
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <rect x="4" y="8" width="32" height="28" rx="4" stroke="currentColor" strokeWidth="2" />
                <path d="M4 16H36" stroke="currentColor" strokeWidth="2" />
                <path d="M12 4V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M28 4V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            }
            action={{
              label: CALCOM_BOOKING_URL ? 'Book a Consultation' : 'Chat with Advisor',
              onClick: handleBookConsultation,
            }}
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-text-primary font-display mb-3">
                Upcoming
              </h2>
              <div className="space-y-3">
                {upcoming.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            </div>
          )}

          {/* Past */}
          {past.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-text-muted font-display mb-3">
                Past Bookings
              </h2>
              <div className="space-y-3">
                {past.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function BookingCard({ booking }: { booking: BookingListItem }) {
  const config = STATUS_CONFIG[booking.status]

  return (
    <Card>
      <div className="flex items-start gap-4">
        {/* Calendar icon */}
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
            <p className="text-sm font-semibold text-text-primary font-display">
              Counsellor Consultation
            </p>
            <Badge variant={config.variant} dot>
              {config.label}
            </Badge>
          </div>
          <p className="text-xs text-text-muted mt-1 font-mono">
            {formatDateTime(booking.scheduledAt)}
          </p>
          {booking.notes && (
            <p className="text-xs text-text-secondary mt-1">{booking.notes}</p>
          )}
        </div>
      </div>
    </Card>
  )
}
