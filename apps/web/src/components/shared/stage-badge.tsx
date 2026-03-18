import type { StudentStage } from '@sturec/shared'
import { STAGE_DISPLAY_NAMES, STAGE_ORDER } from '@sturec/shared'

const stageColors: Record<number, string> = {
  0: 'bg-blue-100 text-blue-700',      // lead_created
  1: 'bg-indigo-100 text-indigo-700',   // intake_completed
  2: 'bg-emerald-100 text-emerald-700', // qualified
  3: 'bg-teal-100 text-teal-700',       // counsellor_consultation
  4: 'bg-cyan-100 text-cyan-700',       // application_started
  5: 'bg-green-100 text-green-700',     // offer_confirmed
  6: 'bg-amber-100 text-amber-700',     // campus_france_readiness
  7: 'bg-orange-100 text-orange-700',   // visa_file_readiness
  8: 'bg-violet-100 text-violet-700',   // visa_submitted
  9: 'bg-purple-100 text-purple-700',   // visa_decision
  10: 'bg-rose-100 text-rose-700',      // arrival_onboarding
  11: 'bg-pink-100 text-pink-700',      // arrived_france
  12: 'bg-primary-100 text-primary-700', // alumni
}

export function StageBadge({ stage }: { stage: StudentStage }) {
  const index = STAGE_ORDER.indexOf(stage)
  const colors = stageColors[index] ?? 'bg-gray-100 text-gray-600'
  const label = STAGE_DISPLAY_NAMES[stage] ?? stage

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${colors}`}>
      {label}
    </span>
  )
}
