/**
 * Deterministic qualification scoring.
 *
 * The AI provides component signals (1-10 scores). This module computes:
 * - qualification_score (0-100)
 * - priority_level (p1, p2, p3)
 * - overall_readiness_score (1-10)
 *
 * See: docs/architecture/05-ai-chat-design.md § Backend Decision Layer
 */

export interface ComponentScores {
  academicFitScore: number | null
  financialReadinessScore: number | null
  languageReadinessScore: number | null
  motivationClarityScore: number | null
  timelineUrgencyScore: number | null
  documentReadinessScore: number | null
  visaComplexityScore: number | null
}

export interface QualificationResult {
  qualificationScore: number
  priorityLevel: 'p1' | 'p2' | 'p3'
  overallReadinessScore: number
}

const WEIGHTS = {
  academicFitScore: 0.25,
  financialReadinessScore: 0.20,
  languageReadinessScore: 0.15,
  motivationClarityScore: 0.10,
  timelineUrgencyScore: 0.10,
  documentReadinessScore: 0.10,
  visaComplexityScore: 0.10, // inverted: (10 - score)
}

export function computeQualification(
  scores: ComponentScores,
  context?: {
    profileCompleteness?: number | null
    fieldsMissing?: string[] | null
  },
): QualificationResult {
  // Default null scores to 5 (neutral)
  const s = {
    academicFitScore: scores.academicFitScore ?? 5,
    financialReadinessScore: scores.financialReadinessScore ?? 5,
    languageReadinessScore: scores.languageReadinessScore ?? 5,
    motivationClarityScore: scores.motivationClarityScore ?? 5,
    timelineUrgencyScore: scores.timelineUrgencyScore ?? 5,
    documentReadinessScore: scores.documentReadinessScore ?? 5,
    visaComplexityScore: scores.visaComplexityScore ?? 5,
  }

  const weightedScore =
    s.academicFitScore * WEIGHTS.academicFitScore +
    s.financialReadinessScore * WEIGHTS.financialReadinessScore +
    s.languageReadinessScore * WEIGHTS.languageReadinessScore +
    s.motivationClarityScore * WEIGHTS.motivationClarityScore +
    s.timelineUrgencyScore * WEIGHTS.timelineUrgencyScore +
    s.documentReadinessScore * WEIGHTS.documentReadinessScore +
    (10 - s.visaComplexityScore) * WEIGHTS.visaComplexityScore

  let qualificationScore = Math.round(weightedScore * 10)

  // Hard rule caps
  const missing = context?.fieldsMissing ?? []
  const criticalMissing = ['preferred_intake', 'funding_route', 'budget'].some((f) =>
    missing.includes(f),
  )
  if (criticalMissing) {
    qualificationScore = Math.min(qualificationScore, 59)
  }

  // Clamp to 0-100
  qualificationScore = Math.max(0, Math.min(100, qualificationScore))

  // Priority level
  let priorityLevel: 'p1' | 'p2' | 'p3'
  if (qualificationScore >= 80) {
    priorityLevel = 'p1'
  } else if (qualificationScore >= 60) {
    priorityLevel = 'p2'
  } else {
    priorityLevel = 'p3'
  }

  // Timeline urgency bump: if urgent AND score >= 60, raise one band
  if (s.timelineUrgencyScore >= 8 && qualificationScore >= 60) {
    if (priorityLevel === 'p2') priorityLevel = 'p1'
    else if (priorityLevel === 'p3') priorityLevel = 'p2'
  }

  // Overall readiness: simple average of available scores
  const allScores = [
    s.academicFitScore,
    s.financialReadinessScore,
    s.languageReadinessScore,
    s.motivationClarityScore,
    s.documentReadinessScore,
  ]
  const overallReadinessScore = Math.round(
    allScores.reduce((sum, v) => sum + v, 0) / allScores.length,
  )

  return { qualificationScore, priorityLevel, overallReadinessScore }
}
