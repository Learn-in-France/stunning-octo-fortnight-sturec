import type { StudentStage } from '../types/student'

export const STAGE_ORDER: StudentStage[] = [
  'lead_created',
  'intake_completed',
  'qualified',
  'counsellor_consultation',
  'application_started',
  'offer_confirmed',
  'campus_france_readiness',
  'visa_file_readiness',
  'visa_submitted',
  'visa_decision',
  'arrival_onboarding',
  'arrived_france',
  'alumni',
]

export const STAGE_DISPLAY_NAMES: Record<StudentStage, string> = {
  lead_created: 'Lead Created',
  intake_completed: 'Intake Completed',
  qualified: 'Qualified / Routed',
  counsellor_consultation: 'Counsellor Consultation',
  application_started: 'Application Started',
  offer_confirmed: 'Offer / Admission Confirmed',
  campus_france_readiness: 'Campus France Readiness',
  visa_file_readiness: 'Visa File Readiness',
  visa_submitted: 'Visa Submitted',
  visa_decision: 'Visa Decision',
  arrival_onboarding: 'Accommodation / Arrival Onboarding',
  arrived_france: 'Arrived in France',
  alumni: 'Alumni / Referral',
}

export const STAGE_PREDECESSOR: Record<StudentStage, StudentStage | null> = {
  lead_created: null,
  intake_completed: 'lead_created',
  qualified: 'intake_completed',
  counsellor_consultation: 'qualified',
  application_started: 'counsellor_consultation',
  offer_confirmed: 'application_started',
  campus_france_readiness: 'offer_confirmed',
  visa_file_readiness: 'campus_france_readiness',
  visa_submitted: 'visa_file_readiness',
  visa_decision: 'visa_submitted',
  arrival_onboarding: 'visa_decision',
  arrived_france: 'arrival_onboarding',
  alumni: 'arrived_france',
}
