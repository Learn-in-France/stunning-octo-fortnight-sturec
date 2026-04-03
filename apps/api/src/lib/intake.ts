export const INTAKE_FIELD_KEYS = [
  'nationality',
  'education_level',
  'field_of_interest',
  'timeline',
  'budget_awareness',
  'language_level',
  'source',
] as const

export type IntakeFieldKey = (typeof INTAKE_FIELD_KEYS)[number]

export interface IntakeAssessmentLike {
  fieldsCollected?: unknown
}

function normalizeIntakeField(field: unknown): IntakeFieldKey | null {
  if (typeof field !== 'string') return null
  const normalized = field.trim().toLowerCase()
  return (INTAKE_FIELD_KEYS as readonly string[]).includes(normalized)
    ? (normalized as IntakeFieldKey)
    : null
}

export function deriveCumulativeIntakeCapture(assessments: IntakeAssessmentLike[]): {
  capturedFields: IntakeFieldKey[]
  missingFields: IntakeFieldKey[]
  bookingReady: boolean
} {
  const captured = new Set<IntakeFieldKey>()

  for (const assessment of assessments) {
    const fields = Array.isArray(assessment.fieldsCollected) ? assessment.fieldsCollected : []
    for (const field of fields) {
      const normalized = normalizeIntakeField(field)
      if (normalized) captured.add(normalized)
    }
  }

  const capturedFields = INTAKE_FIELD_KEYS.filter((field) => captured.has(field))
  const missingFields = INTAKE_FIELD_KEYS.filter((field) => !captured.has(field))

  return {
    capturedFields,
    missingFields,
    bookingReady: capturedFields.length >= 4,
  }
}
