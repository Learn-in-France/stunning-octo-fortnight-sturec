'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import type { NotificationChannel } from '@sturec/shared'
import { useStudentPortalNotifications } from '@/features/student-portal/hooks/use-student-portal'

const CHANNEL_CONFIG: Record<NotificationChannel, { label: string; variant: 'info' | 'success' | 'muted' }> = {
  email: { label: 'Email', variant: 'info' },
  whatsapp: { label: 'WhatsApp', variant: 'success' },
  sms: { label: 'SMS', variant: 'muted' },
}

function timeAgo(iso: string): string {
  const now = new Date()
  const then = new Date(iso)
  const diffMs = now.getTime() - then.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function NotificationsPage() {
  const { data: notifications, isLoading } = useStudentPortalNotifications()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const items = notifications ?? []
  const pendingCount = items.filter((n) => n.status === 'pending').length

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary font-display tracking-tight">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Stay updated on your application progress and important actions.
          </p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="primary" dot>
            {pendingCount} pending
          </Badge>
        )}
      </div>

      {items.length === 0 ? (
        <Card padding="none">
          <EmptyState
            title="No notifications"
            description="You are all caught up. Notifications about your documents, applications, and bookings will appear here."
            icon={
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <path d="M10 16C10 11.029 14.029 7 19 7H21C25.971 7 30 11.029 30 16V24L33 29H7L10 24V16Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                <path d="M16 29V31C16 33.209 17.791 35 20 35C22.209 35 24 33.209 24 31V29" stroke="currentColor" strokeWidth="2" />
              </svg>
            }
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((notif) => {
            const channelConfig = CHANNEL_CONFIG[notif.channel]
            const isSent = notif.status === 'sent' || notif.status === 'delivered'
            const isPending = notif.status === 'pending'

            return (
              <Card key={notif.id} className={isSent ? 'opacity-75' : ''}>
                <div className="flex items-start gap-3">
                  {/* Status indicator */}
                  <div className="shrink-0 mt-1.5">
                    {isPending ? (
                      <span className="w-2 h-2 rounded-full bg-primary-600 block" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-transparent block" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-display ${isSent ? 'font-medium text-text-secondary' : 'font-semibold text-text-primary'}`}>
                        {notif.subject ?? 'Notification'}
                      </p>
                      <Badge variant={channelConfig.variant}>
                        {channelConfig.label}
                      </Badge>
                      {notif.status === 'failed' && (
                        <Badge variant="danger">Failed</Badge>
                      )}
                      <span className="text-[11px] text-text-muted ml-auto shrink-0">
                        {timeAgo(notif.sentAt ?? notif.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
