import { z } from 'zod'
import type {
  ChatSessionItem,
  ChatMessageItem,
  ChatMessageResponse,
  ChatIntakeCheckResponse,
} from '@sturec/shared'

import * as repo from './repository.js'
import { chatCompletion, type GroqMessage } from '../../integrations/groq/index.js'
import {
  ADVISOR_SYSTEM_PROMPT,
  CHAT_TURN_ASSESSMENT_PROMPT,
  buildProfileMemory,
} from '../../integrations/groq/prompts.js'
import { computeQualification } from '../../lib/qualification.js'
import { deriveCumulativeIntakeCapture, type IntakeAssessmentLike } from '../../lib/intake.js'
import { getAiProcessingQueue } from '../../lib/queue/index.js'

// ─── Types ──────────────────────────────────────────────────

interface AiStructuredOutput {
  profile_completeness: number | null
  fields_collected: string[] | null
  fields_missing: string[] | null
  academic_fit_score: number | null
  financial_readiness_score: number | null
  language_readiness_score: number | null
  motivation_clarity_score: number | null
  timeline_urgency_score: number | null
  document_readiness_score: number | null
  visa_complexity_score: number | null
  visa_risk: string | null
  housing_needed: boolean | null
  recommended_next_step: string | null
  recommended_disposition: string | null
  summary_for_team: string
  lead_heat: string | null
  should_suggest_booking?: boolean
  options: string[] | null
}

const scoreFieldNames = [
  'academic_fit_score',
  'financial_readiness_score',
  'language_readiness_score',
  'motivation_clarity_score',
  'timeline_urgency_score',
  'document_readiness_score',
  'visa_complexity_score',
] as const

type ScoreFieldName = (typeof scoreFieldNames)[number]

function normalizeScore(value: unknown): number | null {
  if (value == null || value === '') return null
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) return null
  const scaled = numeric >= 0 && numeric <= 1 ? numeric * 10 : numeric
  return Math.max(0, Math.min(10, Math.round(scaled)))
}

function normalizeProfileCompleteness(value: unknown): number | null {
  if (value == null || value === '') return null
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) return null
  const scaled = numeric > 1 && numeric <= 100 ? numeric / 100 : numeric
  return Math.max(0, Math.min(1, Number(scaled.toFixed(2))))
}

function normalizeStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null
  const items = value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
  return items.length ? items : []
}

function normalizeVisaRisk(value: unknown): 'low' | 'medium' | 'high' | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase()
  return normalized === 'low' || normalized === 'medium' || normalized === 'high' ? normalized : null
}

function normalizeLeadHeat(value: unknown): 'hot' | 'warm' | 'cold' | 'needs_follow_up' | null {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'hot' || normalized === 'warm' || normalized === 'cold' || normalized === 'needs_follow_up') {
      return normalized as 'hot' | 'warm' | 'cold' | 'needs_follow_up'
    }
    return null
  }

  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) return null
  if (numeric >= 0 && numeric <= 1) {
    if (numeric >= 0.8) return 'hot'
    if (numeric >= 0.5) return 'warm'
    return 'cold'
  }
  if (numeric >= 8) return 'hot'
  if (numeric >= 5) return 'warm'
  return 'cold'
}

const assessmentBaseSchema = z.object({
  profile_completeness: z.unknown().nullable().optional(),
  fields_collected: z.unknown().nullable().optional(),
  fields_missing: z.unknown().nullable().optional(),
  academic_fit_score: z.unknown().nullable().optional(),
  financial_readiness_score: z.unknown().nullable().optional(),
  language_readiness_score: z.unknown().nullable().optional(),
  motivation_clarity_score: z.unknown().nullable().optional(),
  timeline_urgency_score: z.unknown().nullable().optional(),
  document_readiness_score: z.unknown().nullable().optional(),
  visa_complexity_score: z.unknown().nullable().optional(),
  visa_risk: z.unknown().nullable().optional(),
  housing_needed: z.union([z.boolean(), z.string(), z.number(), z.null()]).optional(),
  recommended_next_step: z.union([z.string(), z.null()]).optional(),
  recommended_disposition: z.union([z.string(), z.null()]).optional(),
  summary_for_team: z.union([z.string(), z.null()]).optional(),
  lead_heat: z.unknown().nullable().optional(),
  should_suggest_booking: z.union([z.boolean(), z.string(), z.number(), z.null()]).optional(),
  options: z.unknown().nullable().optional(),
})

export function normalizeAiStructuredOutput(raw: unknown): AiStructuredOutput | null {
  const parsed = assessmentBaseSchema.safeParse(raw)
  if (!parsed.success) return null

  const data = parsed.data
  const normalizedScores = Object.fromEntries(
    scoreFieldNames.map((field) => [field, normalizeScore(data[field])]),
  ) as Record<ScoreFieldName, number | null>

  return {
    profile_completeness: normalizeProfileCompleteness(data.profile_completeness),
    fields_collected: normalizeStringArray(data.fields_collected),
    fields_missing: normalizeStringArray(data.fields_missing),
    academic_fit_score: normalizedScores.academic_fit_score,
    financial_readiness_score: normalizedScores.financial_readiness_score,
    language_readiness_score: normalizedScores.language_readiness_score,
    motivation_clarity_score: normalizedScores.motivation_clarity_score,
    timeline_urgency_score: normalizedScores.timeline_urgency_score,
    document_readiness_score: normalizedScores.document_readiness_score,
    visa_complexity_score: normalizedScores.visa_complexity_score,
    visa_risk: normalizeVisaRisk(data.visa_risk),
    housing_needed: typeof data.housing_needed === 'boolean'
      ? data.housing_needed
      : typeof data.housing_needed === 'string'
        ? data.housing_needed.trim().toLowerCase() === 'true'
        : typeof data.housing_needed === 'number'
          ? data.housing_needed > 0
          : null,
    recommended_next_step: typeof data.recommended_next_step === 'string' ? data.recommended_next_step : null,
    recommended_disposition: typeof data.recommended_disposition === 'string' ? data.recommended_disposition : null,
    summary_for_team: typeof data.summary_for_team === 'string' && data.summary_for_team.trim().length > 0
      ? data.summary_for_team.trim()
      : 'Assessment completed',
    lead_heat: normalizeLeadHeat(data.lead_heat),
    should_suggest_booking: typeof data.should_suggest_booking === 'boolean'
      ? data.should_suggest_booking
      : typeof data.should_suggest_booking === 'string'
        ? data.should_suggest_booking.trim().toLowerCase() === 'true'
        : typeof data.should_suggest_booking === 'number'
          ? data.should_suggest_booking >= 0.5
          : false,
    options: normalizeStringArray(data.options),
  }
}

// ─── Session Mappers ────────────────────────────────────────

function mapSession(session: {
  id: string
  status: string
  startedAt: Date
  endedAt: Date | null
}): ChatSessionItem {
  return {
    id: session.id,
    status: session.status as 'active' | 'completed',
    createdAt: session.startedAt.toISOString(),
    endedAt: session.endedAt?.toISOString() ?? null,
  }
}

function mapMessage(msg: {
  id: string
  role: string
  content: string
  timestamp: Date
}): ChatMessageItem {
  return {
    id: msg.id,
    role: msg.role as 'user' | 'assistant' | 'system',
    content: msg.content,
    timestamp: msg.timestamp.toISOString(),
  }
}

// ─── Sessions ───────────────────────────────────────────────

export async function listSessions(userId: string): Promise<ChatSessionItem[]> {
  const sessions = await repo.findSessionsByUser(userId)
  return sessions.map(mapSession)
}

export async function getSession(
  sessionId: string,
  userId: string,
): Promise<ChatSessionItem | null> {
  const session = await repo.findSessionById(sessionId)
  if (!session || session.userId !== userId) return null
  return mapSession(session)
}

export async function startSession(
  userId: string,
  email: string,
  firstName: string,
  lastName: string,
): Promise<ChatSessionItem> {
  // Check for existing active session
  const active = await repo.findActiveSession(userId)
  if (active) return mapSession(active)

  // Resolve or create lead
  let lead = await repo.findLeadByUserId(userId)
  if (!lead) {
    lead = await repo.createLeadForChat({ userId, email, firstName, lastName })
  }

  // Check if user is also a student
  const student = await repo.findStudentByUserId(userId)

  const session = await repo.createSession({
    userId,
    leadId: lead.id,
    studentId: student?.id ?? null,
  })

  return mapSession(session)
}

export async function endSession(
  sessionId: string,
  userId: string,
): Promise<ChatSessionItem | null> {
  const session = await repo.findSessionById(sessionId)
  if (!session || session.userId !== userId) return null
  if (session.status !== 'active') return mapSession(session)

  const ended = await repo.endSession(sessionId)

  // Enqueue final assessment async — keeps endSession fast, moves Groq call off request path
  getAiProcessingQueue().add('chat-end-assessment', {
    entityType: session.studentId ? 'student' : 'lead',
    entityId: session.studentId || session.leadId,
    sourceType: 'chat',
    sourceId: sessionId,
  }).catch((err) => console.error('[chat] Failed to enqueue end-session assessment:', err))

  return mapSession(ended)
}

// ─── Messages ───────────────────────────────────────────────

export async function getMessages(
  sessionId: string,
  userId: string,
): Promise<ChatMessageItem[] | null> {
  const session = await repo.findSessionById(sessionId)
  if (!session || session.userId !== userId) return null

  const messages = await repo.findMessages(sessionId)
  return messages.map(mapMessage)
}

export async function getIntakeCheck(
  userId: string,
  sessionId?: string,
): Promise<ChatIntakeCheckResponse> {
  let leadId: string | undefined
  let studentId: string | undefined

  if (sessionId) {
    const session = await repo.findSessionById(sessionId)
    if (session && session.userId === userId) {
      leadId = session.leadId
      studentId = session.studentId ?? undefined
    }
  }

  if (!leadId) {
    const [lead, student] = await Promise.all([
      repo.findLeadByUserId(userId),
      repo.findStudentByUserId(userId),
    ])
    leadId = lead?.id
    studentId = student?.id
  }

  if (!leadId && !studentId) {
    return {
      bookingReady: false,
      captured: 0,
      total: 7,
      missing: [
        'nationality',
        'education level',
        'field of interest',
        'timeline',
        'budget awareness',
        'language level',
        'source',
      ],
    }
  }

  const assessments = await repo.findAssessments({ studentId, leadId })
  const intakeCapture = deriveCumulativeIntakeCapture(assessments)

  return {
    bookingReady: intakeCapture.bookingReady,
    captured: intakeCapture.capturedFields.length,
    total: 7,
    missing: intakeCapture.missingFields.map((field) => field.replace(/_/g, ' ')),
  }
}

export async function sendMessage(
  sessionId: string,
  userId: string,
  content: string,
): Promise<ChatMessageResponse | null> {
  const session = await repo.findSessionById(sessionId)
  if (!session || session.userId !== userId) return null
  if (session.status !== 'active') return null

  // Save user message
  await repo.createMessage({ sessionId, role: 'user', content })

  // Build context for AI
  const messages = await buildAiContext(session)

  // Add current user message
  messages.push({ role: 'user', content })

  // Call Groq for the visible conversational reply only.
  const result = await chatCompletion(messages, { temperature: 0.7, maxTokens: 2048 })

  // Strip any accidental internal JSON from the visible assistant text.
  const { text } = parseAiResponse(result.content)

  // Save assistant message (clean text without JSON block)
  const assistantMsg = await repo.createMessage({
    sessionId,
    role: 'assistant',
    content: text,
  })

  let shouldSuggestBooking = false
  let options: string[] | null = null

  const structured = await requestStructuredAssessment(session)
  if (structured) {
    await saveAssessmentFromStructured(structured, session.leadId, session.studentId, sessionId)
    const assessments = await repo.findAssessments({
      studentId: session.studentId ?? undefined,
      leadId: session.leadId,
    })
    shouldSuggestBooking = shouldSuggestBookingFromAssessments(assessments)
    options = structured.options ?? null
  }

  return {
    message: mapMessage(assistantMsg),
    options,
    shouldSuggestBooking,
  }
}

// ─── AI Context Building ────────────────────────────────────

async function buildAiContext(session: {
  id: string
  leadId: string
  studentId: string | null
}): Promise<GroqMessage[]> {
  const messages: GroqMessage[] = []

  // System prompt
  messages.push({ role: 'system', content: ADVISOR_SYSTEM_PROMPT })

  // Profile memory from latest assessment
  const latestAssessment = await repo.findLatestAssessment({
    studentId: session.studentId ?? undefined,
    leadId: session.leadId,
  })
  const profileMemory = buildProfileMemory(
    latestAssessment
      ? {
          profileCompleteness: latestAssessment.profileCompleteness
            ? Number(latestAssessment.profileCompleteness)
            : null,
          fieldsCollected: latestAssessment.fieldsCollected as string[] | null,
          fieldsMissing: latestAssessment.fieldsMissing as string[] | null,
          summaryForTeam: latestAssessment.summaryForTeam,
        }
      : null,
  )
  messages.push({ role: 'system', content: profileMemory })

  // Last 6-8 conversation messages
  const recentMessages = await repo.findRecentMessages(session.id, 8)
  // Reverse because findRecentMessages returns DESC
  const ordered = recentMessages.reverse()
  for (const msg of ordered) {
    if (msg.role === 'user' || msg.role === 'assistant') {
      messages.push({ role: msg.role, content: msg.content })
    }
  }

  return messages
}


async function buildAssessmentContext(session: {
  id: string
  leadId: string
  studentId: string | null
}): Promise<GroqMessage[]> {
  const latestAssessment = await repo.findLatestAssessment({
    studentId: session.studentId ?? undefined,
    leadId: session.leadId,
  })
  const profileMemory = buildProfileMemory(
    latestAssessment
      ? {
          profileCompleteness: latestAssessment.profileCompleteness
            ? Number(latestAssessment.profileCompleteness)
            : null,
          fieldsCollected: latestAssessment.fieldsCollected as string[] | null,
          fieldsMissing: latestAssessment.fieldsMissing as string[] | null,
          summaryForTeam: latestAssessment.summaryForTeam,
        }
      : null,
  )

  const recentMessages = await repo.findRecentMessages(session.id, 8)
  const ordered = recentMessages
    .reverse()
    .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
    .map((msg) => ({ role: msg.role as 'user' | 'assistant', content: msg.content }))

  return [
    { role: 'system', content: CHAT_TURN_ASSESSMENT_PROMPT },
    { role: 'system', content: profileMemory },
    { role: 'user', content: JSON.stringify({ recent_conversation: ordered }) },
  ]
}

async function requestStructuredAssessment(session: {
  id: string
  leadId: string
  studentId: string | null
}): Promise<AiStructuredOutput | null> {
  try {
    const assessmentMessages = await buildAssessmentContext(session)
    const result = await chatCompletion(assessmentMessages, {
      temperature: 0.2,
      maxTokens: 1024,
      jsonMode: true,
    })
    return parseStructuredAssessment(result.content)
  } catch {
    return null
  }
}

function parseStructuredAssessment(raw: string): AiStructuredOutput | null {
  try {
    return normalizeAiStructuredOutput(JSON.parse(raw))
  } catch {
    return normalizeAiStructuredOutput(parseAiResponse(raw).structured)
  }
}

// ─── Response Parsing ───────────────────────────────────────

export function parseAiResponse(raw: string): {
  text: string
  structured: AiStructuredOutput | null
} {
  let structured: AiStructuredOutput | null = null
  let text = raw

  // Strip any fenced internal JSON from visible text even if parsing fails.
  const fencedMatch = raw.match(/```json\s*([\s\S]*?)(?:```|$)/i)
  if (fencedMatch) {
    const candidate = fencedMatch[1].trim()
    try {
      structured = JSON.parse(candidate)
    } catch {
      // Malformed fenced JSON should still never leak to the student.
    }
    text = raw.replace(/```json[\s\S]*?(?:```|$)/i, '').trim()
  }

  // Fallback: strip a trailing unfenced assessment object if present.
  if (!structured) {
    const unfencedMatch = raw.match(/(\{[\s\S]*?"profile_completeness"[\s\S]*?\})\s*(?:—\s*)?$/)
    if (unfencedMatch) {
      try {
        structured = JSON.parse(unfencedMatch[1].trim())
      } catch {
        // Even malformed trailing JSON-like blocks are internal-only content.
      }
      text = raw.slice(0, unfencedMatch.index).replace(/\s*—\s*$/, '').trim()
    }
  }

  return { text, structured }
}

export function shouldSuggestBookingFromStructured(structured: AiStructuredOutput | null): boolean {
  if (!structured) return false
  return deriveCumulativeIntakeCapture([{ fieldsCollected: structured.fields_collected }]).bookingReady
    || structured.should_suggest_booking === true
}

export function shouldSuggestBookingFromAssessments(assessments: IntakeAssessmentLike[]): boolean {
  return deriveCumulativeIntakeCapture(assessments).bookingReady
}

// ─── Assessment Persistence ─────────────────────────────────

async function saveAssessmentFromStructured(
  output: AiStructuredOutput,
  leadId: string,
  studentId: string | null,
  sourceId: string,
) {
  const qualification = computeQualification(
    {
      academicFitScore: output.academic_fit_score,
      financialReadinessScore: output.financial_readiness_score,
      languageReadinessScore: output.language_readiness_score,
      motivationClarityScore: output.motivation_clarity_score,
      timelineUrgencyScore: output.timeline_urgency_score,
      documentReadinessScore: output.document_readiness_score,
      visaComplexityScore: output.visa_complexity_score,
    },
    {
      profileCompleteness: output.profile_completeness,
      fieldsMissing: output.fields_missing,
    },
  )

  await repo.createAssessment({
    studentId,
    leadId,
    sourceType: 'chat',
    sourceId,
    academicFitScore: output.academic_fit_score,
    financialReadinessScore: output.financial_readiness_score,
    languageReadinessScore: output.language_readiness_score,
    motivationClarityScore: output.motivation_clarity_score,
    timelineUrgencyScore: output.timeline_urgency_score,
    documentReadinessScore: output.document_readiness_score,
    visaComplexityScore: output.visa_complexity_score,
    visaRisk: output.visa_risk as any,
    overallReadinessScore: qualification.overallReadinessScore,
    qualificationScore: qualification.qualificationScore,
    priorityLevel: qualification.priorityLevel as any,
    recommendedDisposition: output.recommended_disposition,
    recommendedNextStep: output.recommended_next_step,
    summaryForTeam: output.summary_for_team || 'Assessment completed',
    housingNeeded: output.housing_needed,
    profileCompleteness: output.profile_completeness,
    fieldsCollected: output.fields_collected ?? undefined,
    fieldsMissing: output.fields_missing ?? undefined,
    leadHeat: output.lead_heat,
    rawJson: output as any,
  })

  // Update lead with latest scores
  await repo.updateLeadScores(leadId, {
    qualificationScore: qualification.qualificationScore,
    priorityLevel: qualification.priorityLevel,
    profileCompleteness: output.profile_completeness,
  })
}

export async function generateAssessment(
  sessionId: string,
  leadId: string,
  studentId: string | null,
) {
  const messages = await repo.findMessages(sessionId)
  if (messages.length < 2) return

  const structured = await requestStructuredAssessment({ id: sessionId, leadId, studentId })
  if (!structured) return

  try {
    await saveAssessmentFromStructured(structured, leadId, studentId, sessionId)
  } catch {
    // Assessment generation failure is non-fatal — log but don't break session end
  }
}

// ─── Batch Assessment (imported leads) ──────────────────────

export async function assessImportedLead(
  leadId: string,
  profileData: Record<string, unknown>,
): Promise<void> {
  const { BATCH_ASSESSMENT_PROMPT } = await import('../../integrations/groq/prompts.js')

  const messages: GroqMessage[] = [
    { role: 'system', content: BATCH_ASSESSMENT_PROMPT },
    { role: 'user', content: JSON.stringify(profileData) },
  ]

  const result = await chatCompletion(messages, {
    temperature: 0.3,
    maxTokens: 1024,
    jsonMode: true,
  })

  let output: AiStructuredOutput | null = null
  try {
    output = normalizeAiStructuredOutput(JSON.parse(result.content))
  } catch {
    return // Non-fatal — batch assessment failure logged but doesn't block
  }
  if (!output) return // Non-fatal — batch assessment failure logged but doesn't block

  const qualification = computeQualification(
    {
      academicFitScore: output.academic_fit_score,
      financialReadinessScore: output.financial_readiness_score,
      languageReadinessScore: output.language_readiness_score,
      motivationClarityScore: output.motivation_clarity_score,
      timelineUrgencyScore: output.timeline_urgency_score,
      documentReadinessScore: output.document_readiness_score,
      visaComplexityScore: output.visa_complexity_score,
    },
    {
      profileCompleteness: output.profile_completeness,
      fieldsMissing: output.fields_missing,
    },
  )

  await repo.createAssessment({
    leadId,
    sourceType: 'import',
    academicFitScore: output.academic_fit_score,
    financialReadinessScore: output.financial_readiness_score,
    languageReadinessScore: output.language_readiness_score,
    motivationClarityScore: output.motivation_clarity_score,
    timelineUrgencyScore: output.timeline_urgency_score,
    documentReadinessScore: output.document_readiness_score,
    visaComplexityScore: output.visa_complexity_score,
    visaRisk: output.visa_risk as any,
    overallReadinessScore: qualification.overallReadinessScore,
    qualificationScore: qualification.qualificationScore,
    priorityLevel: qualification.priorityLevel as any,
    recommendedDisposition: output.recommended_disposition,
    summaryForTeam: output.summary_for_team || 'Batch assessment completed',
    profileCompleteness: output.profile_completeness,
    fieldsCollected: output.fields_collected ?? undefined,
    fieldsMissing: output.fields_missing ?? undefined,
    rawJson: output as any,
  })

  await repo.updateLeadScores(leadId, {
    qualificationScore: qualification.qualificationScore,
    priorityLevel: qualification.priorityLevel,
    profileCompleteness: output.profile_completeness,
  })
}

/**
 * Assess a student (document upload, conversion, etc.).
 * Persists assessment linked to studentId, not leadId.
 */
export async function assessStudent(
  studentId: string,
  profileData: Record<string, unknown>,
  sourceType: 'document' | 'manual_review' | 'booking',
  sourceId: string,
): Promise<void> {
  const { BATCH_ASSESSMENT_PROMPT } = await import('../../integrations/groq/prompts.js')

  const messages: GroqMessage[] = [
    { role: 'system', content: BATCH_ASSESSMENT_PROMPT },
    { role: 'user', content: JSON.stringify(profileData) },
  ]

  const result = await chatCompletion(messages, {
    temperature: 0.3,
    maxTokens: 1024,
    jsonMode: true,
  })

  let output: AiStructuredOutput | null = null
  try {
    output = normalizeAiStructuredOutput(JSON.parse(result.content))
  } catch {
    return
  }
  if (!output) return

  const qualification = computeQualification(
    {
      academicFitScore: output.academic_fit_score,
      financialReadinessScore: output.financial_readiness_score,
      languageReadinessScore: output.language_readiness_score,
      motivationClarityScore: output.motivation_clarity_score,
      timelineUrgencyScore: output.timeline_urgency_score,
      documentReadinessScore: output.document_readiness_score,
      visaComplexityScore: output.visa_complexity_score,
    },
    {
      profileCompleteness: output.profile_completeness,
      fieldsMissing: output.fields_missing,
    },
  )

  await repo.createAssessment({
    studentId,
    sourceType,
    sourceId,
    academicFitScore: output.academic_fit_score,
    financialReadinessScore: output.financial_readiness_score,
    languageReadinessScore: output.language_readiness_score,
    motivationClarityScore: output.motivation_clarity_score,
    timelineUrgencyScore: output.timeline_urgency_score,
    documentReadinessScore: output.document_readiness_score,
    visaComplexityScore: output.visa_complexity_score,
    visaRisk: output.visa_risk as any,
    overallReadinessScore: qualification.overallReadinessScore,
    qualificationScore: qualification.qualificationScore,
    priorityLevel: qualification.priorityLevel as any,
    recommendedDisposition: output.recommended_disposition,
    summaryForTeam: output.summary_for_team || 'Student assessment completed',
    profileCompleteness: output.profile_completeness,
    fieldsCollected: output.fields_collected ?? undefined,
    fieldsMissing: output.fields_missing ?? undefined,
    rawJson: output as any,
  })
}
