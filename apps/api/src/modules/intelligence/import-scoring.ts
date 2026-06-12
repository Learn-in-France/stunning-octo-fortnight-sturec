/**
 * Deterministic import-time scoring + gate pre-fill.
 *
 * Runs on every uploaded sheet row — no AI call, instant, explainable.
 * Produces the fit score (qualification_score), priority band, and the
 * 6Q gate pre-fill derived from whatever the sheet already told us
 * (programme, intake, countries, age, work experience).
 *
 * NOTE: fit score sorts the list; it does NOT predict conversion
 * (validated finding). Intent + gate drive the work queue.
 */

import type { GateInput } from './schema.js'

export interface ParsedImportRow {
  programme: string | null
  intakeYear: number | null
  countries: string | null
  age: number | null
  workExpYears: number | null
}

function firstField(row: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = row[k]
    if (v != null && String(v).trim() !== '') return String(v).trim()
  }
  // case-insensitive fallback
  const lower = Object.fromEntries(Object.entries(row).map(([k, v]) => [k.toLowerCase().replace(/[\s_-]/g, ''), v]))
  for (const k of keys) {
    const v = lower[k.toLowerCase().replace(/[\s_-]/g, '')]
    if (v != null && String(v).trim() !== '') return String(v).trim()
  }
  return null
}

export function parseImportRow(row: Record<string, unknown>): ParsedImportRow {
  const programme = firstField(row, ['programme', 'program', 'programmeInterest', 'programme_interest', 'course', 'targetProgramme'])
  const intakeRaw = firstField(row, ['intakeYear', 'intake', 'when_start', 'whenStart', 'target_intake', 'startYear', 'plans_to_start'])
  const intakeYear = intakeRaw ? Number((intakeRaw.match(/20\d\d/) || [])[0]) || null : null
  const countries = firstField(row, ['countries', 'countries_interest', 'countriesInterest', 'considering', 'regions', 'countriesOfInterest'])
  const ageRaw = firstField(row, ['age'])
  const age = ageRaw && /^\d{1,2}$/.test(ageRaw) ? Number(ageRaw) : null
  const weRaw = firstField(row, ['work_exp', 'workExp', 'workExperience', 'experience', 'yearsOfExperience'])
  let workExpYears: number | null = null
  if (weRaw) {
    const lower = weRaw.toLowerCase()
    if (/less than|fresher|^0|none|n\/a/.test(lower)) workExpYears = 0
    else if (/more than 15/.test(lower)) workExpYears = 16
    else {
      const m = lower.match(/(\d{1,2})/)
      workExpYears = m ? Number(m[1]) : null
    }
  }
  return { programme, intakeYear, countries, age, workExpYears }
}

export function matchProgramme(programme: string | null, activeProgrammes: string[]): boolean | null {
  if (!programme) return null
  const req = programme.toLowerCase()
  return activeProgrammes.some(
    (name) => name.toLowerCase() === req || name.toLowerCase().includes(req) || req.includes(name.toLowerCase()),
  )
}

export function franceRealFromCountries(countries: string | null): boolean | null {
  if (!countries) return null
  return /france|europe|\beu\b/i.test(countries)
}

export interface ImportScore {
  qualificationScore: number
  priorityLevel: 'p1' | 'p2' | 'p3'
  gate: GateInput
}

const CURRENT_CYCLE_MAX_YEAR = 2026

export function scoreImportRow(parsed: ParsedImportRow, activeProgrammes: string[]): ImportScore {
  const inPortfolio = matchProgramme(parsed.programme, activeProgrammes)
  const franceReal = franceRealFromCountries(parsed.countries)

  let score = 20 // base: a real, contactable enquiry
  // programme alignment
  if (inPortfolio === true) score += 25
  else if (parsed.programme) score += 5 // named something, off-portfolio or fuzzy
  else score += 10 // unknown — neutral
  // intake timing
  if (parsed.intakeYear != null) score += parsed.intakeYear <= CURRENT_CYCLE_MAX_YEAR ? 20 : 8
  else score += 10
  // France commitment
  if (franceReal === true) score += /france/i.test(parsed.countries || '') && !/,/.test(parsed.countries || '') ? 20 : 12
  else if (franceReal === false) score += 0
  else score += 8
  // age band (MiM/MSc sweet spot)
  if (parsed.age != null) score += parsed.age >= 21 && parsed.age <= 30 ? 10 : 4
  else score += 5
  // work experience (anything ≤7y fits MiM/MSc/MBA lanes)
  if (parsed.workExpYears != null) score += parsed.workExpYears <= 7 ? 5 : 2
  else score += 3

  const qualificationScore = Math.min(100, score)
  const priorityLevel = qualificationScore >= 70 ? 'p1' : qualificationScore >= 45 ? 'p2' : 'p3'

  return {
    qualificationScore,
    priorityLevel,
    gate: {
      programmeRequested: parsed.programme,
      programmeInPortfolio: inPortfolio,
      intakeYear: parsed.intakeYear,
      franceReal,
      // funding/english/contact unknown at import — stay null (no tag)
    },
  }
}
