# Plan 3: AI & Async Backend

Chat sessions, Groq integration, AI assessments, batch assessment, gap analysis, BullMQ worker implementations, idempotency.

**Depends on:** Plans 1-2
**Blocks:** Plans 4-7

---

## Step 1: Groq Integration

### 1.1 `apps/api/src/integrations/groq/index.ts`
- Initialize Groq client with GROQ_API_KEY
- Export `chatCompletion(messages: GroqMessage[], options?: { temperature?, maxTokens? })` — calls Groq API
- Model: `llama-3.3-70b-versatile`
- Default options: temperature=0.7, max_tokens=2048
- Error handling: rate limits (429 → retry with backoff), API errors, timeout (30s)
- Response typing for structured JSON output

### 1.2 `apps/api/src/integrations/groq/types.ts`
- `GroqMessage` type: { role: 'system' | 'user' | 'assistant', content: string }
- `AiStructuredOutput` type matching the JSON contract from architecture doc:
  ```
  profile_completeness, fields_collected, fields_missing,
  academic_fit_score, financial_readiness_score, language_readiness_score,
  motivation_clarity_score, timeline_urgency_score, document_readiness_score,
  visa_complexity_score, visa_risk, housing_needed, recommended_next_step,
  recommended_disposition, summary_for_team,
  should_recommend_programs, should_suggest_counsellor
  ```
- `GapAnalysisOutput` type:
  ```
  missing_documents, missing_profile_fields,
  suggested_next_actions, readiness_for_stage, blockers
  ```

---

## Step 2: Chat Module

### 2.1 System prompt — `apps/api/src/modules/chat/prompts/system-prompt.ts`
- Personality: warm, supportive, knowledgeable academic advisor for France study
- Tone: neutral language, concise explanations, structured bullet points when listing
- Knowledge boundaries: only recommend from provided program data, never invent
- Phase guidance (soft, NOT enforced): background → goals → eligibility → recommendations → handoff
- Output contract: alongside natural response, output structured JSON block (wrapped in ```json markers)
- Handoff rules: only suggest counsellor when genuinely helpful, not as default
- Explicit: no urgency, no sales language, no pushing bookings
- English only (Phase 1)

### 2.2 Context builder — `apps/api/src/modules/chat/context.ts`
- `buildChatContext(session, recentMessages, latestAssessment?, programResults?)`:
  - `messages[0]` = system prompt (~500 tokens)
  - `messages[1]` = student_profile_memory (structured JSON from latest assessment, or empty if first message)
  - `messages[2]` = program results (if injected, optional)
  - `messages[3..N]` = last 6-8 conversation messages from chat_messages table
- Keeps total context manageable for Groq

### 2.3 AI response parser — `apps/api/src/modules/chat/parser.ts`
- Extract JSON block from AI response text (between ```json markers)
- Parse to `AiStructuredOutput`
- If parsing fails: log warning, continue with null structured output (don't break chat)
- Extract natural language response (everything outside JSON block)

### 2.4 `apps/api/src/modules/chat/`
Module pattern: routes, controller, service, repository, schema, types.

**POST /chat/sessions** (student only, Firebase auth required)
- Creates or reuses lead for this user:
  - Look up lead by user_id where status != converted && status != disqualified
  - If none exists: create lead with source=marketing, user_id=request.user.id
- Create chat_session with user_id, lead_id, status=active
- Return session with id

**GET /chat/sessions** (student: own only)
- List past sessions for this user
- Filter: status (active, completed)

**GET /chat/sessions/:id** (student: own only)
- Session detail (no messages in this endpoint)

**POST /chat/sessions/:id/messages** (student: own only)
- Core chat flow:
  1. Validate session is active and belongs to user
  2. Save user message to chat_messages
  3. Fetch last 6-8 messages from chat_messages for this session
  4. Fetch latest ai_assessment for this lead/student (for profile memory)
  5. Build context with `buildChatContext`
  6. Check if previous assessment had `should_recommend_programs=true`:
     - If yes: query programs matching collected profile fields
     - Inject program results into context
  7. Call Groq API
  8. Parse response: extract natural text + structured JSON
  9. Save assistant message to chat_messages
  10. If structured output parsed successfully:
      - Save/update ai_assessment (source_type=chat, source_id=session.id)
      - Compute final lead `qualification_score` and `priority_level` in backend
      - Update lead qualification fields from assessment
  11. Return { message: { role, content, timestamp }, options: [...] or null }
- Options: extracted from structured output `recommended_next_step` or from AI response patterns

**GET /chat/sessions/:id/messages** (student: own only)
- Return conversation history for this session
- NEVER exposed to counsellor/admin (privacy rule)

**POST /chat/sessions/:id/end** (student)
- Set session status=completed, ended_at=now
- Save final ai_assessment from last interaction
- Emit `ai-processing` job for final assessment refinement
- Emit `lead-routing` job with assessment data

### 2.5 Program recommendation query
- `apps/api/src/modules/chat/program-matcher.ts`
- Query programs where:
  - `minimum_gpa <= student_gpa` (if known)
  - `english_minimum_score <= student_score` (if known and test type matches)
  - `tuition_amount <= student_budget_max` (if known)
  - `active = true`
  - Intake matches preferred_intake (if known)
- Return top 5 matches with university info
- Format as context-injectable text for AI

### 2.6 Validation schemas
- `packages/shared/src/validation/chat.ts`:
  - createSessionResponseSchema
  - sendMessageSchema ({ content: string })
  - messageResponseSchema ({ message, options })

### 2.7 Tests
- Create session: creates/reuses lead
- Send message: saves messages, calls Groq, parses response
- Context building: correct message windowing (6-8 messages)
- Program recommendation injection
- End session: triggers assessment and routing jobs
- Privacy: counsellor/admin cannot access messages endpoint
- Structured output parsing: valid JSON, malformed JSON (graceful degradation)

**Done when:** Student can start a chat session, send messages, receive AI responses with structured assessment data, and end the session triggering downstream jobs.

---

## Step 3: AI Assessment Module

### 3.1 `apps/api/src/modules/ai/`
Module pattern: routes, controller, service, repository, schema, types.

**GET /students/:id/ai-assessments** (counsellor/admin)
- List assessments for student, sorted by created_at desc
- Include source_type for context

**GET /students/:id/ai-assessments/:assessmentId** (counsellor/admin)
- Single assessment detail including raw_json

**POST /students/:id/ai-assessments/trigger** (admin only)
- Manually trigger AI re-assessment
- Emits `ai-processing` job with source_type=manual_review

### 3.2 Assessment service
- `apps/api/src/modules/ai/assessment.service.ts`:
  - `createAssessmentFromChat(sessionId, structuredOutput)` — saves assessment from chat interaction
  - `createAssessmentFromImport(leadId, importedData)` — generates assessment for imported lead
  - `createAssessmentFromDocument(studentId, documentEvent)` — metadata-level re-scoring after document upload
  - `computeLeadQualification(structuredOutput)` — applies weightings + hard rules to compute `qualification_score` and `priority_level`
  - `updateStudentScores(studentId, assessment)` — propagates scores to student record

### 3.3 Batch assessment prompt
- `apps/api/src/modules/ai/prompts/batch-assessment-prompt.ts`
- For imported university leads: receives structured profile data (not chat)
- Produces same AiStructuredOutput
- Uses source_type=import

### 3.4 Gap analysis prompt
- `apps/api/src/modules/ai/prompts/gap-analysis-prompt.ts`
- Receives: imported profile + target program eligibility rules + visa requirements
- Produces GapAnalysisOutput:
  - missing_documents, missing_profile_fields
  - suggested_next_actions, readiness_for_stage, blockers

### 3.5 Tests
- Assessment from chat: correct fields saved
- Assessment from import: structured data input produces assessment
- Gap analysis: identifies missing documents and fields
- Admin manual trigger emits job
- Counsellor can view assessments but not trigger manually
- Score propagation to student record

**Done when:** AI assessments work for chat, import, document, and manual trigger sources. Counsellors see structured summaries, never transcripts.

---

## Step 4: Worker Implementations

Implement the real queue and worker logic for the async subsystems introduced in this plan.

### 4.1 `ai-processing` worker
- `apps/api/src/workers/ai-processing.worker.ts`
- Job types:
  - `chat_end`: Refine final assessment from chat session
  - `document_upload`: Metadata-level re-scoring (which doc types now exist)
  - `import_batch`: Generate batch assessment + gap analysis for imported lead
  - `manual_trigger`: Admin-triggered re-assessment
- Idempotency key: `${entity_type}:${entity_id}:${source_type}:${source_id}`
- For import_batch:
  1. Fetch lead profile data
  2. Fetch target program eligibility rules if applicable
  3. Call Groq with batch-assessment prompt
  4. Save ai_assessment with source_type=import
  5. Call Groq with gap-analysis prompt
  6. Save gap analysis to assessment raw_json
  7. Compute and persist final `qualification_score` / `priority_level`

### 4.2 `lead-routing` worker
- `apps/api/src/workers/lead-routing.worker.ts`
- Idempotency key: `${lead_id}:${assessment_id}`
- Logic per architecture doc:
  - Fetch latest assessment for lead
  - Compute/update `qualification_score` and `priority_level` if not already persisted
  - `p1`: mark lead for immediate admin assignment queue, emit notifications to internal ops if desired
  - `p2`: keep in follow-up queue / request-more-info state, emit nurture or reminder side effects
  - `p3`: long-term nurture or manual review flag
  - Counsellor assignment stays human/admin-driven in Phase 1

### 4.3 `mautic-sync` worker
- `apps/api/src/workers/mautic-sync.worker.ts`
- Idempotency key: `${entity_id}:${event_type}:${triggering_action_id}`
- For now: create sync log record, mark as pending
- Actual Mautic API calls deferred to Plan 6 (integration layer)
- Log payload hash for future idempotency
- Error handling: mark as failed, increment attempts

### 4.4 `notifications` worker
- `apps/api/src/workers/notifications.worker.ts`
- Idempotency key: `${recipient}:${template_key}:${triggering_action_id}`
- For now: create notification_log record, mark as pending
- Actual email/WhatsApp sending deferred to Plan 6
- Template key mapping to notification content

### 4.5 `documents` worker
- `apps/api/src/workers/documents.worker.ts`
- Idempotency key: `${document_id}:${event_type}`
- On upload complete:
  - Check student_document_requirements for matching type → update status to uploaded
  - Emit `ai-processing` job (document-triggered re-assessment) if student exists
- On verify:
  - Update requirement status to verified
  - Check if all required docs verified → could trigger stage readiness check
- On reject:
  - Update requirement status to rejected

### 4.6 `imports` worker
- `apps/api/src/workers/imports.worker.ts`
- Idempotency key: `${import_batch_id}:${row_index}`
- Concurrency: 1 (sequential processing)
- For each row:
  1. Validate row data
  2. Check for duplicate lead by email
  3. Create lead with source=university
  4. Chain `ai-processing` job with type=import_batch for this lead
- Track progress: processed_count, failed_count, errors array
- Single retry attempt, then manual retry for failures

### 4.7 Worker tests
- Each worker: process job → verify side effects
- Each worker: duplicate idempotency key → skip
- Each worker: error → proper failure handling and retry
- Import worker: duplicate email handling
- Lead routing: correct path for high/mid/low fit
- AI processing: correct Groq prompts sent per source type

**Done when:** All 6 workers process jobs correctly with idempotency, error handling, and retry logic.

---

## Step 5: Scheduling Module (Backend Only)

### 5.1 `apps/api/src/modules/scheduling/`

**POST /bookings** (student/counsellor/admin, authenticated)
- Create booking record
- Link to student or lead
- Allow internal/manual booking creation before external sync is wired

**GET /bookings** (student: own, counsellor: own, admin: all)
- Paginated list with filters

**PATCH /bookings/:id** (counsellor/admin)
- Update status (completed, cancelled, no_show)

Cal.com event creation and webhook ingestion remain in Plan 6 with the other external integrations.

### 5.2 Tests
- CRUD operations
- RBAC enforcement

**Done when:** Booking records can be created and managed through the backend API without external integration dependencies.

---

## Acceptance Criteria

- [ ] Groq integration: chat completions work, structured output parsed
- [ ] Chat sessions: create, send messages, receive AI responses, end session
- [ ] Context window: last 6-8 messages + system prompt + profile memory
- [ ] Program recommendations: injected into AI context when triggered
- [ ] AI assessments: created from chat, import, document, and manual trigger
- [ ] Batch assessment: imported leads get AI scoring from structured data
- [ ] Gap analysis: imported leads get missing docs/fields/actions list
- [ ] All 6 workers: process jobs with real logic (Mautic/notification sending deferred to Plan 6)
- [ ] Idempotency: every worker checks and marks processed jobs
- [ ] Lead routing: high → counsellor, mid → nurture, low → long-term
- [ ] Import worker: CSV rows → leads → chained AI assessment jobs
- [ ] Booking CRUD works without depending on Cal.com integration
- [ ] Chat privacy: messages endpoint only accessible by owning student
- [ ] All tests pass
