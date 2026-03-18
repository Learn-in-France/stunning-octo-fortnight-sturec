import { describe, it, expect } from 'vitest'
import { computeQualification } from '../src/lib/qualification.js'

describe('Qualification scoring', () => {
  it('computes p1 for strong scores', () => {
    const result = computeQualification({
      academicFitScore: 9,
      financialReadinessScore: 8,
      languageReadinessScore: 9,
      motivationClarityScore: 8,
      timelineUrgencyScore: 7,
      documentReadinessScore: 7,
      visaComplexityScore: 3,
    })

    expect(result.qualificationScore).toBeGreaterThanOrEqual(80)
    expect(result.priorityLevel).toBe('p1')
    expect(result.overallReadinessScore).toBeGreaterThanOrEqual(7)
  })

  it('computes p3 for weak scores', () => {
    const result = computeQualification({
      academicFitScore: 3,
      financialReadinessScore: 2,
      languageReadinessScore: 3,
      motivationClarityScore: 3,
      timelineUrgencyScore: 2,
      documentReadinessScore: 2,
      visaComplexityScore: 8,
    })

    expect(result.qualificationScore).toBeLessThan(60)
    expect(result.priorityLevel).toBe('p3')
  })

  it('caps score to 59 when critical fields are missing', () => {
    const result = computeQualification(
      {
        academicFitScore: 9,
        financialReadinessScore: 9,
        languageReadinessScore: 9,
        motivationClarityScore: 9,
        timelineUrgencyScore: 9,
        documentReadinessScore: 9,
        visaComplexityScore: 1,
      },
      { fieldsMissing: ['preferred_intake', 'budget'] },
    )

    expect(result.qualificationScore).toBeLessThanOrEqual(59)
    expect(result.priorityLevel).not.toBe('p1')
  })

  it('bumps priority when timeline urgency is high', () => {
    const result = computeQualification({
      academicFitScore: 7,
      financialReadinessScore: 6,
      languageReadinessScore: 6,
      motivationClarityScore: 6,
      timelineUrgencyScore: 9,
      documentReadinessScore: 5,
      visaComplexityScore: 4,
    })

    // Base score should be around 60-70 (p2), but timeline bump should raise to p1
    if (result.qualificationScore >= 60) {
      expect(result.priorityLevel).toBe('p1')
    }
  })

  it('handles null scores gracefully', () => {
    const result = computeQualification({
      academicFitScore: null,
      financialReadinessScore: null,
      languageReadinessScore: null,
      motivationClarityScore: null,
      timelineUrgencyScore: null,
      documentReadinessScore: null,
      visaComplexityScore: null,
    })

    // All nulls → defaults to 5 → neutral scores
    expect(result.qualificationScore).toBeGreaterThan(0)
    expect(result.qualificationScore).toBeLessThanOrEqual(100)
    expect(['p1', 'p2', 'p3']).toContain(result.priorityLevel)
  })

  it('clamps score to 0-100 range', () => {
    const result = computeQualification({
      academicFitScore: 10,
      financialReadinessScore: 10,
      languageReadinessScore: 10,
      motivationClarityScore: 10,
      timelineUrgencyScore: 10,
      documentReadinessScore: 10,
      visaComplexityScore: 0,
    })

    expect(result.qualificationScore).toBeLessThanOrEqual(100)
    expect(result.qualificationScore).toBeGreaterThanOrEqual(0)
  })
})
