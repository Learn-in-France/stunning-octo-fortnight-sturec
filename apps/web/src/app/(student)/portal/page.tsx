'use client'

import Link from 'next/link'

import { useAuth } from '@/providers/auth-provider'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { STAGE_ORDER, STAGE_STUDENT_LABELS, STAGE_NEXT_STEP } from '@sturec/shared'
import { useStudentProgress } from '@/features/student-portal/hooks/use-student-portal'

export default function PortalPage() {
  const { user } = useAuth()
  const { data: progress, isLoading } = useStudentProgress()
  const greeting = getGreeting()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="rounded-[28px] bg-surface-sunken/50 p-8 animate-pulse">
          <div className="h-4 w-24 rounded bg-surface-sunken mb-4" />
          <div className="h-8 w-64 rounded bg-surface-sunken mb-3" />
          <div className="h-4 w-80 rounded bg-surface-sunken" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-[24px] bg-surface-sunken/30 p-5 animate-pulse h-28" />
          ))}
        </div>
      </div>
    )
  }

  const stage = progress?.stage as keyof typeof STAGE_STUDENT_LABELS | undefined
  const stageLabel = stage ? STAGE_STUDENT_LABELS[stage] : 'Getting started'
  const nextStep = stage ? STAGE_NEXT_STEP[stage] : STAGE_NEXT_STEP.lead_created
  const stageIndex = progress
    ? STAGE_ORDER.indexOf(progress.stage as (typeof STAGE_ORDER)[number])
    : 0
  const progressPercent = progress?.progressPercent ?? 0

  return (
    <div className="space-y-6">
      {/* ── Welcome banner ── */}
      <div className="rounded-[28px] bg-[linear-gradient(140deg,rgba(10,22,41,1),rgba(26,58,122,0.85),rgba(91,30,38,0.78))] p-6 text-white shadow-[0_24px_60px_rgba(10,22,41,0.22)] sm:p-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
          Student Portal
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] font-display">
          {greeting}, {user?.firstName ?? 'there'}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/72">
          {nextStep}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/portal/chat"
            className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-public-navy shadow-[0_16px_34px_rgba(255,255,255,0.18)] cursor-pointer transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Open AI Advisor
          </Link>
          <Link
            href="/portal/bookings"
            className="inline-flex items-center justify-center rounded-full border border-white/18 px-5 py-3 text-sm font-semibold text-white cursor-pointer transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Book counsellor session
          </Link>
        </div>
      </div>

      {/* ── Where you are ── */}
      <Card>
        <CardHeader>
          <CardTitle>Where you are</CardTitle>
          <Badge variant="primary">{stageLabel}</Badge>
        </CardHeader>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-2 rounded-full bg-surface-sunken overflow-hidden">
            <div
              className="h-2 rounded-full bg-primary-600 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-sm font-mono font-semibold text-text-primary shrink-0">
            Step {stageIndex + 1} of {STAGE_ORDER.length}
          </span>
        </div>
        <p className="mt-4 text-sm leading-7 text-text-secondary">
          {nextStep}
        </p>
      </Card>

      {/* ── Your counsellor ── */}
      <Card>
        <CardHeader>
          <CardTitle>Your counsellor</CardTitle>
        </CardHeader>
        {progress?.assignedCounsellorId ? (
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>person</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">Counsellor assigned</p>
              <p className="text-xs text-text-muted">Your counsellor will reach out to schedule a meeting.</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-sunken text-sm text-text-muted">
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>hourglass_top</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">Awaiting counsellor</p>
              <p className="text-xs text-text-muted">Talk to our AI advisor first — a counsellor will be assigned after your initial consultation.</p>
            </div>
          </div>
        )}
      </Card>

      {/* ── What we need from you ── */}
      {progress && progress.nextActions && progress.nextActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>What we need from you</CardTitle>
            <Badge variant="warning">{progress.nextActions.length}</Badge>
          </CardHeader>
          <div className="space-y-3">
            {progress.nextActions.map((action: string, i: number) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg bg-surface-sunken/50"
              >
                <div className="mt-0.5 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-amber-500 block" />
                </div>
                <p className="text-sm text-text-primary flex-1">{action}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── AI Advisor + Quick Links ── */}
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Link
          href="/portal/chat"
          className="group rounded-[24px] bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(232,238,246,0.92))] p-5 shadow-[0_18px_45px_rgba(10,22,41,0.08)] cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_55px_rgba(10,22,41,0.12)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">
                AI Advisor
              </p>
              <h2 className="mt-3 font-display text-2xl font-semibold tracking-[-0.03em] text-text-primary">
                Talk to the AI advisor
              </h2>
              <p className="mt-2 max-w-md text-sm leading-7 text-text-secondary">
                Get guidance on studying in France, understand the process, and prepare for your counsellor meeting.
              </p>
            </div>
            <span className="rounded-full bg-primary-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary-700">
              24/7
            </span>
          </div>
        </Link>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Documents', href: '/portal/documents', icon: 'folder_open' },
            { label: 'Bookings', href: '/portal/bookings', icon: 'calendar_month' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex flex-col items-center justify-center gap-2 rounded-[20px] border border-white/55 bg-[rgba(255,250,243,0.86)] p-4 text-sm font-medium text-text-primary shadow-[0_12px_28px_rgba(10,22,41,0.06)] cursor-pointer transition-all duration-200 hover:bg-white hover:shadow-[0_16px_40px_rgba(10,22,41,0.10)] hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
            >
              <span className="material-symbols-outlined text-primary-400 transition-colors group-hover:text-primary-600" style={{ fontSize: 22 }}>
                {link.icon}
              </span>
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}
