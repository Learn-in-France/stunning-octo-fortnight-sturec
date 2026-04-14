'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { AuthGuard } from '@/lib/guards/auth-guard'
import { RoleGuard } from '@/lib/guards/role-guard'
import { useAuth } from '@/providers/auth-provider'
import {
  useStudentProfile,
  useStudentProgress,
} from '@/features/student-portal/hooks/use-student-portal'
import { BrandLogo } from '@/components/branding/brand-logo'
import { STAGE_STUDENT_LABELS } from '@sturec/shared'

// ─── Nav config ─────────────────────────────────────────────────
interface NavItem {
  label: string
  href: string
  icon: ReactNode
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/portal',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="1" y="1" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="10" y="1" width="7" height="4" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="1" y="10" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="10" y="7" width="7" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    label: 'AI Advisor',
    href: '/portal/chat',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M3 3H15C15.828 3 16.5 3.672 16.5 4.5V12C16.5 12.828 15.828 13.5 15 13.5H6L3 16.5V4.5C3 3.672 3.672 3 4.5 3H15" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M6.5 7.5H11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M6.5 10H9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Profile',
    href: '/portal/profile',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="5.5" r="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M2 15.5C2 12.186 4.686 9.5 8 9.5H10C13.314 9.5 16 12.186 16 15.5V16.5H2V15.5Z" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    label: 'Documents',
    href: '/portal/documents',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M10.5 1.5H4.5C3.672 1.5 3 2.172 3 3V15C3 15.828 3.672 16.5 4.5 16.5H13.5C14.328 16.5 15 15.828 15 15V6L10.5 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M10.5 1.5V6H15" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Bookings',
    href: '/portal/bookings',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="1.5" y="3" width="15" height="13.5" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M1.5 7.5H16.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5.25 1.5V4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M12.75 1.5V4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Notifications',
    href: '/portal/notifications',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M4.5 7C4.5 4.515 6.515 2.5 9 2.5C11.485 2.5 13.5 4.515 13.5 7V10.5L15 13H3L4.5 10.5V7Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M7.5 13V14C7.5 14.828 8.172 15.5 9 15.5C9.828 15.5 10.5 14.828 10.5 14V13" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
]

export default function StudentLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()
  const { data: progress } = useStudentProgress()
  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
    refetch: refetchProfile,
  } = useStudentProfile()

  // Onboarding gate: if the student hasn't completed the contact-info
  // capture step, push them to /portal/onboarding before they can use
  // anything else in the portal. The onboarding page itself bypasses
  // the gate (otherwise we'd loop).
  useEffect(() => {
    if (!profile) return
    if (profile.onboardingCompletedAt !== null) return
    if (pathname === '/portal/onboarding') return
    router.replace('/portal/onboarding')
  }, [profile, pathname, router])

  // While onboarding is incomplete — or while the profile fetch is still
  // loading/errored — hide the full sidebar nav so the student can't
  // navigate to portal features that assume a complete profile. The only
  // escapes are the onboarding form and sign-out.
  const onboardingIncomplete =
    !profile || profile.onboardingCompletedAt === null
  const showEmailVerificationBanner =
    !onboardingIncomplete &&
    user?.role === 'student' &&
    user.emailVerified === false

  const stageName = progress
    ? (STAGE_STUDENT_LABELS[progress.stage as keyof typeof STAGE_STUDENT_LABELS] ?? progress.stage)
    : null

  function isActive(href: string) {
    if (href === '/portal') return pathname === '/portal'
    return pathname.startsWith(href + '/') || pathname === href
  }

  return (
    <AuthGuard>
      <RoleGuard allowed={['student']} redirectTo="/dashboard">
        <div className="internal-app-shell flex min-h-screen">
          {/* ── Mobile overlay ─────────────────────────────────── */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* ── Sidebar ────────────────────────────────────────── */}
          <aside
            className={`
              fixed top-0 left-0 bottom-0 z-50 flex w-[260px] flex-col bg-sidebar shadow-[16px_0_48px_rgba(10,22,41,0.22)]
              transition-transform duration-200
              lg:translate-x-0
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}
          >
            {/* Logo */}
            <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
              <BrandLogo href="/portal" variant="compact" inverse />
              {/* Mobile close */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="ml-auto p-1 rounded text-sidebar-text hover:text-sidebar-text-active lg:hidden"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M4.5 4.5L13.5 13.5M4.5 13.5L13.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Progress card — hidden during onboarding gate so it
                doesn't fight for attention with the form */}
            {!onboardingIncomplete && (
              <div className="mx-3 mt-4 rounded-2xl border border-sidebar-border bg-sidebar-hover/60 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-text/50 mb-2">
                  Your Progress
                </p>
                {progress ? (
                  <>
                    <p className="text-sm font-medium text-sidebar-text-active mb-1">
                      {stageName}
                    </p>
                    <div className="w-full h-1.5 rounded-full bg-sidebar-border overflow-hidden">
                      <div
                        className="h-1.5 rounded-full bg-sidebar-accent transition-all duration-500"
                        style={{ width: `${progress.progressPercent}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-sidebar-text mt-1 font-mono">
                      {progress.progressPercent}% complete
                    </p>
                  </>
                ) : (
                  <div className="h-10 flex items-center">
                    <p className="text-sm font-medium text-sidebar-text-active mb-1">Getting started</p>
                    <div className="w-full h-1.5 rounded-full bg-sidebar-border" />
                  </div>
                )}
              </div>
            )}

            {/* Navigation — hidden during onboarding gate so the student
                cannot navigate away mid-form and lose state. A short
                copy block tells them why the rest of the portal is
                locked until they finish. */}
            {onboardingIncomplete ? (
              <div className="mx-3 mt-4 flex-1 rounded-2xl border border-sidebar-border bg-sidebar-hover/40 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-text/60">
                  Getting started
                </p>
                <p className="mt-2 text-sm font-medium text-sidebar-text-active">
                  Please complete your profile
                </p>
              </div>
            ) : (
              <nav className="flex-1 overflow-y-auto py-4 px-3">
                <div className="space-y-0.5">
                  {NAV_ITEMS.map((item) => {
                    const active = isActive(item.href)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`
                          group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium
                          transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-accent
                          ${
                            active
                              ? 'bg-[linear-gradient(135deg,rgba(23,48,80,1),rgba(26,58,122,0.4))] text-sidebar-text-active shadow-[0_16px_30px_rgba(0,0,0,0.18)]'
                              : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active'
                          }
                        `}
                      >
                        <span
                          className={`shrink-0 transition-colors ${
                            active ? 'text-sidebar-accent' : 'text-sidebar-text group-hover:text-sidebar-text-active'
                          }`}
                        >
                          {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                        {active && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-accent" />
                        )}
                      </Link>
                    )
                  })}
                </div>
              </nav>
            )}

            {/* User card */}
            {user && (
              <div className="border-t border-sidebar-border p-4">
                <div className="flex items-center gap-3 rounded-2xl bg-white/4 p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-hover text-xs font-semibold text-sidebar-text-active">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-sidebar-text-active truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-[11px] text-sidebar-text truncate">Student</p>
                  </div>
                  <button
                    onClick={signOut}
                    className="p-1.5 rounded-lg text-sidebar-text hover:text-sidebar-text-active hover:bg-sidebar-hover transition-colors"
                    title="Sign out"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M5 1.5H3C2.172 1.5 1.5 2.172 1.5 3V11C1.5 11.828 2.172 12.5 3 12.5H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                      <path d="M9.5 9.5L12.5 7L9.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M5 7H12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </aside>

          {/* ── Main content ───────────────────────────────────── */}
          <div className="flex-1 lg:ml-[260px]">
            {/* Mobile topbar */}
            <header className="h-14 bg-surface-raised border-b border-border flex items-center justify-between px-4 sticky top-0 z-20 lg:hidden">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-sunken transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M3 5H17M3 10H17M3 15H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
              <BrandLogo href="/portal" variant="compact" />
              <div className="w-9" /> {/* spacer for centering */}
            </header>

            <main className="p-4 sm:p-6">
              {profileError && pathname !== '/portal/onboarding' && (
                <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                  <p className="text-sm font-semibold text-text-primary">
                    We couldn't load your profile
                  </p>
                  <p className="mt-1 text-sm leading-6 text-text-secondary">
                    Portal features are paused until we can fetch your profile. Check your connection and retry.
                  </p>
                  <button
                    onClick={() => { void refetchProfile() }}
                    className="mt-2 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700"
                  >
                    Retry
                  </button>
                </div>
              )}
              {profileLoading && !profile && !profileError && (
                <div className="mb-6 rounded-2xl border border-border bg-surface-sunken/40 px-4 py-3">
                  <p className="text-sm text-text-secondary">Loading your profile…</p>
                </div>
              )}
              {showEmailVerificationBanner && (
                <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-sm font-semibold text-text-primary">
                    Verify your email to unlock counsellor handoff actions
                  </p>
                  <p className="mt-1 text-sm leading-6 text-text-secondary">
                    You can keep exploring the portal, but booking a counsellor session and sharing documents stay locked until your email is verified in Firebase.
                  </p>
                </div>
              )}
              {children}
            </main>
          </div>
        </div>
      </RoleGuard>
    </AuthGuard>
  )
}
