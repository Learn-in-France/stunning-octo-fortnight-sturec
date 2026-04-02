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

/**
 * Student-facing stage labels — friendly, non-internal language.
 * Students never see "lead", "qualified", or "routed".
 */
export const STAGE_STUDENT_LABELS: Record<StudentStage, string> = {
  lead_created: 'Getting started',
  intake_completed: 'Profile reviewed',
  qualified: 'Matched with counsellor',
  counsellor_consultation: 'In consultation',
  application_started: 'Applications in progress',
  offer_confirmed: 'Offer received',
  campus_france_readiness: 'Campus France prep',
  visa_file_readiness: 'Visa preparation',
  visa_submitted: 'Visa submitted',
  visa_decision: 'Visa decision',
  arrival_onboarding: 'Preparing to arrive',
  arrived_france: 'Welcome to France',
  alumni: 'Alumni',
}

/**
 * Student-facing description of what happens next at each stage.
 */
export const STAGE_NEXT_STEP: Record<StudentStage, string> = {
  lead_created: 'Talk to our AI advisor to explore your options for studying in France.',
  intake_completed: 'Your profile is being reviewed. A counsellor will be assigned shortly.',
  qualified: 'Your counsellor will reach out to schedule an introductory meeting.',
  counsellor_consultation: 'Work with your counsellor to select programs and prepare applications.',
  application_started: 'Your applications are being prepared and submitted. Your counsellor will keep you updated.',
  offer_confirmed: 'Great news — you have an offer! Next step: Campus France registration.',
  campus_france_readiness: 'Complete your Campus France dossier and prepare for the interview.',
  visa_file_readiness: 'Gather your visa documents. Your counsellor will guide you through each requirement.',
  visa_submitted: 'Your visa application is being processed. No action needed from you right now.',
  visa_decision: 'Visa decision received. Your counsellor will discuss next steps with you.',
  arrival_onboarding: 'Prepare for your move — housing, banking, insurance. Our team in France is ready for you.',
  arrived_france: 'Welcome! Our team is here to help you settle in.',
  alumni: 'You are part of the Learn in France community.',
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
