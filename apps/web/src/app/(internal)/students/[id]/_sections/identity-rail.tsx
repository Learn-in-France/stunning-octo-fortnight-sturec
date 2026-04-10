'use client'

import type { StudentDetail } from '@sturec/shared'
import { STAGE_DISPLAY_NAMES, STAGE_ORDER } from '@sturec/shared'

import { Card } from '@/components/ui/card'
import { StageBadge } from '@/components/shared/stage-badge'
import { useStudentAssessments } from '@/features/students/hooks/use-students'
import { useStudentRequirements } from '@/features/documents/hooks/use-documents'
import { useCounsellorReminders } from '@/features/counsellor/hooks/use-counsellor'

interface IdentityRailProps {
  student: StudentDetail & { fullName: string; counsellorName: string }
  studentId: string
}

/**
 * Sticky left rail. The "who is this?" pane:
 * - identity (name, reference, stage chip)
 * - owner + lead heat
 * - 4 compact KPIs (readiness / completeness / blockers / follow-up due)
 * - compact vertical stage path
 *
 * Reads from the same hooks the Operational Summary uses, so React
 * Query dedupes the requests — no extra network cost.
 */
export function IdentityRail({ student, studentId }: IdentityRailProps) {
  const { data: assessments } = useStudentAssessments(studentId)
  const { data: requirements } = useStudentRequirements(studentId)
  const { data: reminders } = useCounsellorReminders()

  const latestAssessment = assessments?.[0]
  const pendingRequirements = (requirements?.items ?? []).filter(
    (r: { status: string }) => ['missing', 'requested', 'rejected'].includes(r.status),
  )
  const studentReminders = (reminders ?? []).filter(
    (r: { student: { id: string } | null; status: string }) =>
      r.student?.id === studentId && r.status === 'pending',
  )
  const nextReminder = studentReminders.sort(
    (a: { dueAt: string }, b: { dueAt: string }) =>
      new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime(),
  )[0]
  const isFollowUpOverdue =
    !!nextReminder && new Date(nextReminder.dueAt).getTime() < Date.now()

  const initials =
    `${student.firstName?.[0] ?? ''}${student.lastName?.[0] ?? ''}`.toUpperCase() || '·'

  const readinessValue =
    latestAssessment?.overallReadinessScore != null
      ? `${latestAssessment.overallReadinessScore}/100`
      : '—'
  const completenessValue =
    latestAssessment?.profileCompleteness != null
      ? `${Math.round(Number(latestAssessment.profileCompleteness) * 100)}%`
      : '—'
  const blockerValue =
    pendingRequirements.length > 0 ? `${pendingRequirements.length} open` : 'Clear'
  const followUpValue = nextReminder
    ? new Date(nextReminder.dueAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
      })
    : 'None set'

  const stageIndex = STAGE_ORDER.indexOf(student.stage)

  return (
    <Card className="space-y-5">
      {/* Identity */}
      <div className="flex items-start gap-3">
        <div
          aria-hidden
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700"
        >
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text-primary">{student.fullName}</p>
          <p className="mt-0.5 truncate font-mono text-[11px] text-text-muted">
            {student.referenceCode}
          </p>
          <div className="mt-2">
            <StageBadge stage={student.stage} />
          </div>
        </div>
      </div>

      <div className="border-t border-border" />

      {/* Owner + heat */}
      <div className="space-y-3">
        <RailRow label="Owner" value={student.counsellorName} />
        <RailRow
          label="Lead heat"
          value={
            latestAssessment?.leadHeat
              ? latestAssessment.leadHeat.replace(/_/g, ' ')
              : 'Not assessed'
          }
        />
      </div>

      <div className="border-t border-border" />

      {/* KPIs — single column so labels never wrap and values have room */}
      <div className="space-y-1.5">
        <KpiRow label="Readiness" value={readinessValue} />
        <KpiRow label="Completeness" value={completenessValue} />
        <KpiRow
          label="Doc blockers"
          value={blockerValue}
          tone={pendingRequirements.length > 0 ? 'warning' : 'neutral'}
        />
        <KpiRow
          label="Follow-up"
          value={followUpValue}
          tone={isFollowUpOverdue ? 'danger' : 'neutral'}
        />
      </div>

      <div className="border-t border-border" />

      {/* Stage path — vertical on xl, compact horizontal dots below xl */}
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
          Stage path
        </p>

        {/* Horizontal compact bar (below xl) */}
        <div className="xl:hidden">
          <div className="flex items-center gap-0.5">
            {STAGE_ORDER.map((stage, idx) => {
              const isCurrent = idx === stageIndex
              const isPast = idx < stageIndex
              return (
                <div
                  key={stage}
                  title={STAGE_DISPLAY_NAMES[stage]}
                  className={`h-1.5 flex-1 rounded-full ${
                    isCurrent
                      ? 'bg-primary-600'
                      : isPast
                        ? 'bg-primary-300'
                        : 'bg-border'
                  }`}
                />
              )
            })}
          </div>
          <p className="mt-1.5 text-[10px] text-text-secondary">
            {STAGE_DISPLAY_NAMES[STAGE_ORDER[stageIndex]]} ({stageIndex + 1}/{STAGE_ORDER.length})
          </p>
        </div>

        {/* Full vertical list (xl only) */}
        <ol className="hidden xl:block space-y-1.5">
          {STAGE_ORDER.map((stage, idx) => {
            const isCurrent = idx === stageIndex
            const isPast = idx < stageIndex
            return (
              <li
                key={stage}
                className="flex items-center gap-2"
                aria-current={isCurrent ? 'step' : undefined}
              >
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    isCurrent
                      ? 'bg-primary-600'
                      : isPast
                        ? 'bg-primary-300'
                        : 'bg-border'
                  }`}
                />
                <span
                  className={`truncate text-[11px] ${
                    isCurrent
                      ? 'font-semibold text-text-primary'
                      : isPast
                        ? 'text-text-secondary'
                        : 'text-text-muted'
                  }`}
                >
                  {STAGE_DISPLAY_NAMES[stage]}
                </span>
              </li>
            )
          })}
        </ol>
      </div>
    </Card>
  )
}

function RailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-text-primary capitalize">{value}</p>
    </div>
  )
}

function KpiRow({
  label,
  value,
  tone = 'neutral',
}: {
  label: string
  value: string
  tone?: 'neutral' | 'warning' | 'danger'
}) {
  // One label/value pair per row. Label sits on the left, value on the right
  // (right-aligned). Tone only colours the value pill so the row reads cleanly.
  const valueToneClasses =
    tone === 'danger'
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : tone === 'warning'
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-surface-sunken/60 text-text-primary border-border'
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] text-text-muted">{label}</span>
      <span
        className={`max-w-[60%] truncate rounded-md border px-2 py-0.5 text-xs font-semibold ${valueToneClasses}`}
      >
        {value}
      </span>
    </div>
  )
}
