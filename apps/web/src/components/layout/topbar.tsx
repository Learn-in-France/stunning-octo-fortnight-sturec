'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { useAuth } from '@/providers/auth-provider'
import { DropdownMenu } from '@/components/ui/dropdown-menu'
import {
  useMyNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/features/notifications/hooks/use-notifications'

const TEMPLATE_LABELS: Record<string, string> = {
  lead_assigned: 'New lead assigned to you',
  lead_qualified: 'A lead was auto-qualified',
  student_assigned: 'New student assigned to you',
  stage_changed: 'Student stage changed',
  booking_created: 'New booking scheduled',
  document_uploaded: 'Document uploaded',
  document_verified: 'Document verified',
  document_rejected: 'Document rejected',
  support_request: 'New support request',
  inbound_message: 'Inbound message received',
}

function formatTimeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { data } = useMyNotifications()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()

  const unreadCount = data?.unreadCount ?? 0
  const items = data?.items ?? []

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-full bg-white/75 p-2 text-text-muted transition-colors hover:text-text-primary hover:bg-white"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path
            d="M4.5 7C4.5 4.515 6.515 2.5 9 2.5C11.485 2.5 13.5 4.515 13.5 7V10.5L15 13H3L4.5 10.5V7Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M7.5 13V14C7.5 14.828 8.172 15.5 9 15.5C9.828 15.5 10.5 14.828 10.5 14V13" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-border bg-white shadow-[0_12px_40px_rgba(0,0,0,0.10)] z-50">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold text-text-primary">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="text-xs text-primary-600 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-text-muted">
                No notifications yet
              </div>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (!item.readAt) markRead.mutate(item.id)
                  }}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-sunken/50 ${
                    !item.readAt ? 'bg-primary-50/40' : ''
                  }`}
                >
                  <div
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      !item.readAt ? 'bg-primary-600' : 'bg-transparent'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-text-primary leading-snug">
                      {TEMPLATE_LABELS[item.templateKey] ?? item.templateKey.replace(/_/g, ' ')}
                    </p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      {formatTimeAgo(item.createdAt)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function Topbar() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/45 bg-[rgba(255,250,243,0.78)] px-6 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        {/* Breadcrumb slot — pages inject via PageHeader */}
        <span className="hidden rounded-full bg-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-700 lg:inline-flex">
          Learn in France workspace
        </span>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />

        {/* User menu */}
        {user && (
          <DropdownMenu
            trigger={
              <div className="flex cursor-pointer items-center gap-2.5 rounded-full bg-white/78 py-1.5 pl-3 pr-2 transition-colors hover:bg-white">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </div>
                <span className="text-sm font-medium text-text-primary max-w-[120px] truncate">
                  {user.firstName}
                </span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-text-muted">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            }
            items={[
              {
                label: 'Settings',
                onClick: () => router.push('/settings'),
                icon: (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M7 1V2.5M7 11.5V13M1 7H2.5M11.5 7H13M2.6 2.6L3.7 3.7M10.3 10.3L11.4 11.4M2.6 11.4L3.7 10.3M10.3 3.7L11.4 2.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                ),
              },
              {
                label: 'Sign out',
                variant: 'danger',
                onClick: async () => {
                  await signOut()
                  router.push('/auth/login')
                },
                icon: (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M5 1.5H3C2.172 1.5 1.5 2.172 1.5 3V11C1.5 11.828 2.172 12.5 3 12.5H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    <path d="M9.5 9.5L12.5 7L9.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M5 7H12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                ),
              },
            ]}
          />
        )}
      </div>
    </header>
  )
}
