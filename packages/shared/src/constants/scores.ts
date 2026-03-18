/** Routing thresholds for AI assessment scores */
export const HIGH_FIT = 7
export const MID_FIT = 4
export const COMPLETENESS_THRESHOLD = 0.8

/** Qualification score bands */
export const QUALIFICATION_QUALIFIED = 80
export const QUALIFICATION_FOLLOWUP = 60

/** Qualification score component weights (Phase 1) */
export const QUALIFICATION_WEIGHTS = {
  academicFitScore: 0.25,
  financialReadinessScore: 0.20,
  languageReadinessScore: 0.15,
  motivationClarityScore: 0.10,
  timelineUrgencyScore: 0.10,
  documentReadinessScore: 0.10,
  visaComplexityScore: 0.10, // inverse contribution
} as const
