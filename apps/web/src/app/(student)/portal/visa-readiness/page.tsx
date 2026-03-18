'use client'

import Link from 'next/link'

import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StageBadge } from '@/components/shared/stage-badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { STAGE_DISPLAY_NAMES, STAGE_ORDER } from '@sturec/shared'
import type { RequirementStatus } from '@sturec/shared'
import {
  useStudentProgress,
  useStudentPortalRequirements,
} from '@/features/student-portal/hooks/use-student-portal'

// Student-friendly readiness levels derived from requirements + progress
type ReadinessLevel = 'on_track' | 'action_needed' | 'almost_there'

interface ReadinessCategory {
  label: string
  level: ReadinessLevel
  description: string
  actionHref: string | null
}

const LEVEL_CONFIG: Record<ReadinessLevel, { label: string; variant: 'success' | 'warning' | 'info' }> = {
  on_track: { label: 'On Track', variant: 'success' },
  action_needed: { label: 'Action Needed', variant: 'warning' },
  almost_there: { label: 'Almost There', variant: 'info' },
}

// Visa preparation steps derived from stage
const VISA_STEP_STAGES = [
  { label: 'University offer received', stage: 'offer_confirmed' },
  { label: 'Documents collected', stage: 'campus_france_readiness' },
  { label: 'Campus France registration', stage: 'campus_france_readiness' },
  { label: 'Campus France interview', stage: 'visa_file_readiness' },
  { label: 'Visa file assembled', stage: 'visa_file_readiness' },
  { label: 'Visa submitted', stage: 'visa_submitted' },
  { label: 'Visa decision received', stage: 'visa_decision' },
]

function deriveReadiness(
  progress: { applications: { offers: number }; documentChecklist: { completed: number; total: number }; visa: { status: string | null }; stage: string },
  reqsBySource: Record<string, { total: number; done: number }>,
): ReadinessCategory[] {
  const categories: ReadinessCategory[] = []

  // Offer / Admission
  if (progress.applications.offers > 0) {
    categories.push({
      label: 'Offer / Admission',
      level: 'on_track',
      description: `You have ${progress.applications.offers} offer${progress.applications.offers > 1 ? 's' : ''} received.`,
      actionHref: '/portal/applications',
    })
  } else {
    categories.push({
      label: 'Offer / Admission',
      level: 'action_needed',
      description: 'No offers received yet. Applications are in progress.',
      actionHref: '/portal/applications',
    })
  }

  // Document Preparation
  const { completed: docsCompleted, total: docsTotal } = progress.documentChecklist
  if (docsTotal === 0) {
    categories.push({
      label: 'Document Preparation',
      level: 'action_needed',
      description: 'No document requirements found yet.',
      actionHref: '/portal/documents',
    })
  } else if (docsCompleted === docsTotal) {
    categories.push({
      label: 'Document Preparation',
      level: 'on_track',
      description: `All ${docsTotal} required documents verified.`,
      actionHref: '/portal/documents',
    })
  } else if (docsCompleted >= docsTotal * 0.5) {
    categories.push({
      label: 'Document Preparation',
      level: 'almost_there',
      description: `${docsCompleted} of ${docsTotal} documents verified. Keep going!`,
      actionHref: '/portal/documents',
    })
  } else {
    categories.push({
      label: 'Document Preparation',
      level: 'action_needed',
      description: `${docsCompleted} of ${docsTotal} documents verified. Please upload remaining documents.`,
      actionHref: '/portal/documents',
    })
  }

  // Visa-source requirements
  const visaReqs = reqsBySource['visa'] ?? { total: 0, done: 0 }
  if (visaReqs.total > 0) {
    if (visaReqs.done === visaReqs.total) {
      categories.push({ label: 'Visa Requirements', level: 'on_track', description: 'All visa-required documents are ready.', actionHref: '/portal/checklist' })
    } else if (visaReqs.done >= visaReqs.total * 0.5) {
      categories.push({ label: 'Visa Requirements', level: 'almost_there', description: `${visaReqs.done} of ${visaReqs.total} visa documents ready.`, actionHref: '/portal/checklist' })
    } else {
      categories.push({ label: 'Visa Requirements', level: 'action_needed', description: `${visaReqs.done} of ${visaReqs.total} visa documents ready.`, actionHref: '/portal/checklist' })
    }
  }

  // Visa Application status
  if (progress.visa.status) {
    const statusLabel = progress.visa.status.replace(/_/g, ' ')
    categories.push({ label: 'Visa Application', level: progress.visa.status === 'approved' ? 'on_track' : 'almost_there', description: `Visa status: ${statusLabel}`, actionHref: null })
  } else {
    categories.push({ label: 'Visa Application', level: 'action_needed', description: 'Complete prior steps before submitting your visa application.', actionHref: null })
  }

  return categories
}

export default function VisaReadinessPage() {
  const { data: progress, isLoading: loadingProgress } = useStudentProgress()
  const { data: requirements, isLoading: loadingReqs } = useStudentPortalRequirements()

  if (loadingProgress || loadingReqs) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!progress) {
    return (
      <div className="text-center py-20">
        <p className="text-text-muted">Could not load your progress.</p>
      </div>
    )
  }

  // Derive requirement stats by source
  const reqs = requirements ?? []
  const reqsBySource: Record<string, { total: number; done: number }> = {}
  for (const req of reqs) {
    if (!req.required) continue
    const src = req.requirementSource
    if (!reqsBySource[src]) reqsBySource[src] = { total: 0, done: 0 }
    reqsBySource[src].total++
    if (req.status === 'verified' || req.status === 'waived') reqsBySource[src].done++
  }

  const categories = deriveReadiness(progress, reqsBySource)
  const onTrackCount = categories.filter((c) => c.level === 'on_track').length
  const overallPercent = categories.length > 0 ? Math.round((onTrackCount / categories.length) * 100) : 0

  // Visa timeline from stage
  const stageIndex = STAGE_ORDER.indexOf(progress.stage as (typeof STAGE_ORDER)[number])
  const visaSteps = VISA_STEP_STAGES.map((step) => ({
    ...step,
    completed: STAGE_ORDER.indexOf(step.stage as (typeof STAGE_ORDER)[number]) <= stageIndex && stageIndex >= 0,
  }))
  const completedSteps = visaSteps.filter((s) => s.completed).length

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary font-display tracking-tight">
          Visa Readiness
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Your progress toward being visa-ready for studying in France.
        </p>
      </div>

      <div className="space-y-6">
        {/* Overview */}
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                Current Stage
              </p>
              <StageBadge stage={progress.stage} />
              <p className="text-xs text-text-muted mt-2">
                {STAGE_DISPLAY_NAMES[progress.stage as keyof typeof STAGE_DISPLAY_NAMES] ?? progress.stage}
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs text-text-muted mb-1">Readiness Score</p>
              <div className="flex items-center gap-3">
                <div className="w-32 h-2.5 rounded-full bg-surface-sunken overflow-hidden">
                  <div
                    className="h-2.5 rounded-full bg-primary-600 transition-all duration-500"
                    style={{ width: `${overallPercent}%` }}
                  />
                </div>
                <span className="text-sm font-mono font-semibold text-text-primary">
                  {overallPercent}%
                </span>
              </div>
              <p className="text-xs text-text-muted mt-1">
                {onTrackCount} of {categories.length} areas on track
              </p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Readiness categories */}
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-sm font-semibold text-text-primary font-display mb-1">
              Preparation Areas
            </h2>
            {categories.map((category) => {
              const config = LEVEL_CONFIG[category.level]
              return (
                <Card key={category.label}>
                  <div className="flex items-start gap-3">
                    {/* Status icon */}
                    <div className="shrink-0 mt-0.5">
                      {category.level === 'on_track' ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M3 7L6 10L11 4" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      ) : category.level === 'almost_there' ? (
                        <div className="w-6 h-6 rounded-full bg-sky-100 flex items-center justify-center">
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <circle cx="7" cy="7" r="5" stroke="#0284C7" strokeWidth="1.5" />
                            <path d="M7 4.5V7.5H9.5" stroke="#0284C7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M7 4V7.5" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
                            <circle cx="7" cy="10" r="0.75" fill="#D97706" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-text-primary font-display">
                          {category.label}
                        </p>
                        <Badge variant={config.variant} dot>
                          {config.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-text-muted mt-1 leading-relaxed">
                        {category.description}
                      </p>
                    </div>
                    {category.actionHref && category.level !== 'on_track' && (
                      <div className="shrink-0">
                        <Link href={category.actionHref}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Visa timeline */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Visa Journey</CardTitle>
              </CardHeader>
              <p className="text-xs text-text-muted mb-4">
                {completedSteps} of {visaSteps.length} steps completed
              </p>
              <div className="space-y-3">
                {visaSteps.map((step, idx) => {
                  const isLast = idx === visaSteps.length - 1
                  return (
                    <div key={idx} className="flex gap-3">
                      {/* Line + dot */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                            step.completed
                              ? 'bg-emerald-100'
                              : 'bg-gray-100'
                          }`}
                        >
                          {step.completed ? (
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                              <path d="M2 5L4 7L8 3" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-gray-300" />
                          )}
                        </div>
                        {!isLast && (
                          <div className={`w-px flex-1 min-h-[16px] ${step.completed ? 'bg-emerald-200' : 'bg-gray-200'}`} />
                        )}
                      </div>
                      <p
                        className={`text-xs pb-3 ${
                          step.completed ? 'text-text-secondary' : 'text-text-muted'
                        }`}
                      >
                        {step.label}
                      </p>
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Friendly tip */}
            <div className="mt-4 p-3 rounded-lg bg-primary-50 border border-primary-100">
              <p className="text-xs text-primary-800 font-medium mb-1">
                Tip
              </p>
              <p className="text-xs text-primary-700 leading-relaxed">
                Start gathering your documents early. The visa process typically takes 4-8 weeks, so having everything ready ahead of time helps avoid delays.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
