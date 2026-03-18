import type {
  ChatSessionItem,
  ChatMessageItem,
  ChatMessageResponse,
} from '@sturec/shared'

import * as repo from './repository.js'
import { chatCompletion, type GroqMessage } from '../../integrations/groq/index.js'
import {
  ADVISOR_SYSTEM_PROMPT,
  buildProfileMemory,
  buildProgramContext,
} from '../../integrations/groq/prompts.js'
import { computeQualification } from '../../lib/qualification.js'
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
  should_recommend_programs?: boolean
  should_suggest_counsellor?: boolean
  options: string[] | null
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

  // Call Groq
  const result = await chatCompletion(messages, { temperature: 0.7, maxTokens: 2048 })

  // Parse structured output and conversation text
  const { text, structured } = parseAiResponse(result.content)

  // Save assistant message (clean text without JSON block)
  const assistantMsg = await repo.createMessage({
    sessionId,
    role: 'assistant',
    content: text,
  })

  // If structured output exists, save assessment and check for program recommendations
  if (structured) {
    await saveAssessmentFromStructured(structured, session.leadId, session.studentId, sessionId)

    // If AI indicates programs should be recommended, inject them on next turn
    if (structured.should_recommend_programs) {
      await injectProgramRecommendations(session)
    }
  }

  return {
    message: mapMessage(assistantMsg),
    options: structured?.options ?? null,
  }
}

// ─── AI Context Building ────────────────────────────────────

async function buildAiContext(session: {
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
  const recentMessages = await repo.findRecentMessages(session.leadId, 8)
  // Reverse because findRecentMessages returns DESC
  const ordered = recentMessages.reverse()
  for (const msg of ordered) {
    if (msg.role === 'user' || msg.role === 'assistant') {
      messages.push({ role: msg.role, content: msg.content })
    }
  }

  return messages
}

// ─── Response Parsing ───────────────────────────────────────

function parseAiResponse(raw: string): {
  text: string
  structured: AiStructuredOutput | null
} {
  // Extract JSON block from ```json ... ```
  const jsonMatch = raw.match(/```json\s*([\s\S]*?)```/)
  let structured: AiStructuredOutput | null = null
  let text = raw

  if (jsonMatch) {
    try {
      structured = JSON.parse(jsonMatch[1].trim())
    } catch {
      // If JSON parsing fails, keep structured as null
    }
    // Remove JSON block from visible text
    text = raw.replace(/```json[\s\S]*?```/, '').trim()
  }

  return { text, structured }
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
    summaryForTeam: output.summary_for_team,
    housingNeeded: output.housing_needed,
    profileCompleteness: output.profile_completeness,
    fieldsCollected: output.fields_collected ?? undefined,
    fieldsMissing: output.fields_missing ?? undefined,
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
  // Get all messages for a final assessment
  const messages = await repo.findMessages(sessionId)
  if (messages.length < 2) return // Not enough conversation

  // Build messages for assessment-only call
  const aiMessages: GroqMessage[] = [
    {
      role: 'system',
      content: `${ADVISOR_SYSTEM_PROMPT}\n\nThis is the end of the conversation. Produce ONLY the JSON assessment block — no conversation text. Wrap in \`\`\`json ... \`\`\`.`,
    },
  ]

  // Include last 8 messages
  const recent = messages.slice(-8)
  for (const msg of recent) {
    if (msg.role === 'user' || msg.role === 'assistant') {
      aiMessages.push({ role: msg.role, content: msg.content })
    }
  }

  try {
    const result = await chatCompletion(aiMessages, { temperature: 0.3, maxTokens: 1024 })
    const { structured } = parseAiResponse(result.content)
    if (structured) {
      await saveAssessmentFromStructured(structured, leadId, studentId, sessionId)
    }
  } catch {
    // Assessment generation failure is non-fatal — log but don't break session end
  }
}

// ─── Program Recommendations ────────────────────────────────

async function injectProgramRecommendations(session: {
  id: string
  leadId: string
  studentId: string | null
}) {
  // Get latest assessment for criteria
  const assessment = await repo.findLatestAssessment({
    studentId: session.studentId ?? undefined,
    leadId: session.leadId,
  })
  if (!assessment) return

  // Use the raw JSON to find student profile fields
  const raw = assessment.rawJson as Record<string, unknown> | null
  const fieldsCollected = (assessment.fieldsCollected ?? []) as string[]

  const criteria: { gpa?: number; englishScore?: number; budget?: number } = {}
  if (fieldsCollected.includes('gpa') && raw?.gpa) criteria.gpa = Number(raw.gpa)
  if (fieldsCollected.includes('english_score') && raw?.english_score) {
    criteria.englishScore = Number(raw.english_score)
  }
  if (fieldsCollected.includes('budget') && raw?.budget) {
    criteria.budget = Number(raw.budget)
  }

  const programs = await repo.findMatchingPrograms(criteria)
  if (programs.length === 0) return

  // Inject as system message for next AI turn
  const programContext = buildProgramContext(
    programs.map((p) => ({
      name: p.name,
      universityName: (p as any).university?.name ?? '',
      degreeLevel: p.degreeLevel,
      tuitionAmount: Number(p.tuitionAmount),
      tuitionCurrency: p.tuitionCurrency,
      durationMonths: p.durationMonths,
      language: p.language,
      minimumGpa: p.minimumGpa ? Number(p.minimumGpa) : null,
      englishMinimumScore: p.englishMinimumScore ? Number(p.englishMinimumScore) : null,
    })),
  )

  await repo.createMessage({
    sessionId: session.id,
    role: 'system',
    content: programContext,
  })
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

  let output: AiStructuredOutput
  try {
    output = JSON.parse(result.content)
  } catch {
    return // Non-fatal — batch assessment failure logged but doesn't block
  }

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
  sourceType: 'document' | 'manual_review',
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

  let output: AiStructuredOutput
  try {
    output = JSON.parse(result.content)
  } catch {
    return
  }

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
