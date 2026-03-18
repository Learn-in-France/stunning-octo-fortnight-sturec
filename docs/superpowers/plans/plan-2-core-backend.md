# Plan 2: Core Backend

Catalog CRUD, leads, students, applications, documents, activity logging, assignments, notes, contacts, consent, lead conversion.

**Depends on:** Plan 1 (Foundation)
**Blocks:** Plans 3-7

---

## Step 1: Catalog Module

### 1.1 `apps/api/src/modules/catalog/`
Module pattern: routes, controller, service, repository, schema, types.

**Universities CRUD:**
- `GET /catalog/universities` — paginated, filterable (search, city, country, active, partner_status)
- `POST /catalog/universities` — admin only, Zod validated
- `PATCH /catalog/universities/:id` — admin only
- `DELETE /catalog/universities/:id` — admin only, soft toggle (set active=false)

**Programs CRUD:**
- `GET /catalog/programs` — paginated, filterable (universityId, degreeLevel, fieldOfStudy, language, tuitionMin, tuitionMax, active, search)
- `POST /catalog/programs` — admin only, universityId must exist
- `PATCH /catalog/programs/:id` — admin only
- `DELETE /catalog/programs/:id` — admin only

**Program Intakes:**
- `POST /catalog/programs/:id/intakes` — admin only
- `PATCH /catalog/intakes/:id` — admin only
- `DELETE /catalog/intakes/:id` — admin only

**Eligibility Rules:**
- `GET /catalog/eligibility-rules` — filterable (programId, field, ruleScope)
- `POST /catalog/eligibility-rules` — admin only
- `PATCH /catalog/eligibility-rules/:id` — admin only
- `DELETE /catalog/eligibility-rules/:id` — admin only

**Visa Requirements:**
- `GET /catalog/visa-requirements` — filterable (documentType, countrySpecific, stageApplicable)
- `POST /catalog/visa-requirements` — admin only
- `PATCH /catalog/visa-requirements/:id` — admin only
- `DELETE /catalog/visa-requirements/:id` — admin only

**Campus France Prep:**
- `GET /catalog/campus-france-prep` — filterable (category, active)
- `POST /catalog/campus-france-prep` — admin only
- `PATCH /catalog/campus-france-prep/:id` — admin only
- `DELETE /catalog/campus-france-prep/:id` — admin only

### 1.2 Public catalog routes
- `GET /public/programs` — no auth, active only, subset of fields (no audit fields), filterable (degree, field, city, intake, tuitionRange)
- `GET /public/programs/:id` — no auth, active only, includes university info and intakes
- `GET /public/universities` — no auth, active only, subset of fields
- `GET /public/universities/:id` — no auth, active only

### 1.3 Validation schemas
- `packages/shared/src/validation/catalog.ts` — create/update schemas for each entity
- Query filter schemas for list endpoints

### 1.4 Tests
- CRUD operations for each entity
- RBAC: counsellor can read, cannot write
- Public endpoints return only active records with subset of fields
- Pagination works correctly

**Done when:** All 6 catalog entities have full CRUD, public endpoints serve active data, RBAC enforced.

---

## Step 2: Leads Module

### 2.1 `apps/api/src/modules/leads/`

**POST /leads** (student/counsellor/admin)
- Creates lead record
- If request.user.role === 'student': sets user_id = request.user.id, source defaults to 'marketing'
- If counsellor/admin: sets created_by_user_id = request.user.id, source as specified
- Emits `mautic-sync` job (lead creation)
- Emits `notifications` job if assigned

**GET /leads** (counsellor: assigned only, admin: all)
- Paginated with filters: status, source, assignedCounsellorId, priorityLevel, qualificationMin, qualificationMax, readyForAssignment, search (name/email), createdAfter, createdBefore
- Counsellor filter: `WHERE assigned_counsellor_id = request.user.id`

**GET /leads/:id** (counsellor: assigned, admin: any)
- Full lead detail including latest AI assessment summary, qualification score, priority level, profile completeness, and recommended disposition

**PATCH /leads/:id** (counsellor/admin)
- Update lead fields (email, phone, first_name, last_name, notes, source_partner)
- Cannot change status via PATCH (use dedicated endpoints)

**POST /leads/:id/convert** (counsellor/admin)
- Full conversion flow per data model doc:
  1. Validate lead not already converted → return `already_converted` if so
  2. Validate lead has user_id → return `requires_user_account` if not
  3. Create student record: copy fields, set stage=lead_created, generate reference_code (STU-YYYY-NNNNN)
  4. Set lead.converted_student_id, lead.status=converted
  5. Transfer chat sessions: update chat_sessions where lead_id to also set student_id
  6. Copy latest AI assessment scores to student profile fields
  7. Create stage_transition record (null → lead_created, changed_by_type=user)
  8. Emit `mautic-sync` job
- Returns `{ action, student }` per API contract
- Reference code generation: `STU-{year}-{zero-padded sequential number}`

**POST /leads/:id/disqualify** (counsellor/admin)
- Set status=disqualified
- Requires reason in body
- Emit `mautic-sync` job

**POST /leads/:id/assign** (admin only)
- Set assigned_counsellor_id
- Admin workflow should default to assigning from the highest-priority queue first (`p1` → `p2` → `p3`)
- Emit `notifications` job (counsellor assignment notification)

**GET /leads/:id/timeline** (counsellor/admin)
- Aggregated event history: creation, status changes, assignments, AI assessments, activities
- Sorted by timestamp descending

**GET /leads/:id/ai-assessments** (counsellor/admin)
- List AI assessments for this lead
- Includes import-based batch assessments

**GET /leads/:id/ai-assessments/:assessmentId** (counsellor/admin)
- Single assessment detail

**POST /leads/:id/ai-assessments/trigger** (admin only)
- Manually trigger AI re-assessment
- Emits `ai-processing` job

**GET /leads/:id/activities** (counsellor/admin)
- List counsellor activity logs for this lead

**POST /leads/:id/activities** (counsellor/admin)
- Log counsellor activity (call, follow-up, etc.)
- Validates at least summary or outcome provided
- Sets created_by_user_id = request.user.id

**POST /leads/import** (admin only)
- Accept CSV/Excel file
- Parse and validate rows
- Create import batch record
- Emit `imports` job with batch_id
- Return { batchId, rowCount }

### 2.2 Validation schemas
- `packages/shared/src/validation/leads.ts`:
  - createLeadSchema, updateLeadSchema, convertLeadSchema
  - disqualifyLeadSchema (requires reason)
  - assignLeadSchema (counsellorId)
  - importLeadSchema (file validation)
  - leadFiltersSchema
  - logActivitySchema

### 2.3 Tests
- Create lead as student (auto-links user_id)
- Create lead as admin (sets created_by)
- Convert lead (full flow: creates student, sets status, transfers chat sessions)
- Convert already-converted lead (returns already_converted)
- Convert lead without user_id (returns requires_user_account)
- Disqualify with reason
- Assign counsellor
- Counsellor can only see assigned leads
- Activity logging append-only
- Reference code generation uniqueness

**Done when:** Full lead lifecycle from creation through conversion works, RBAC enforced, timeline aggregates events.

---

## Step 3: Students Module

### 3.1 `apps/api/src/modules/students/`

**GET /students** (counsellor: assigned, admin: all)
- Paginated with filters: stage, assignedCounsellorId, visaRisk, readinessMin, readinessMax, source, search (name/email/referenceCode), stageUpdatedBefore (stale detection)

**GET /students/:id** (student: own, counsellor: assigned, admin: any)
- Full student profile
- Student role: own data only (no internal scores like visa_risk raw label)
- Counsellor/admin: full profile including scores and assessment summary

**PATCH /students/:id** (student: own limited fields, counsellor/admin: most fields)
- Student can update: phone, preferred_city, preferred_intake, housing_needed, budget range, english details
- Counsellor/admin can update: all profile fields except id, user_id, reference_code, created_at
- Cannot change stage via PATCH

**GET /students/:id/progress** (student: own, admin)
- Student-facing progress summary per API contract:
  - stage, progressPercent, completedMilestones, nextActions
  - documentChecklist { completed, total }
  - applications { total, offers }
  - visa { status }
- Safe for student display: no raw risk labels, no counsellor notes, no chat content

**POST /students/:id/stage** (counsellor/admin)
- Validate toStage is valid enum
- Create stage_transition record (from current stage)
- Update student.stage and student.stage_updated_at
- Emit jobs: `mautic-sync`, `notifications`, `documents` (requirement update check)
- Requires reasonCode, optional reasonNote

**GET /students/:id/timeline** (counsellor/admin)
- Full event history: stage transitions, assignments, document events, AI assessments, activities, notes, bookings
- Sorted descending

**GET /students/:id/summary** (counsellor/admin)
- AI assessment snippets (latest scores, summary_for_team)
- Recent notes
- Document checklist status
- No chat transcripts

**POST /students/:id/assign** (admin only)
- Create student_assignment record (unassign previous if exists: set unassigned_at)
- Update student.assigned_counsellor_id, student.assigned_at
- Emit `notifications` job

**GET /students/:id/assignments** (admin)
- Assignment history for this student

**GET /students/:id/notes** (counsellor/admin)
- List counsellor notes, paginated, sorted by created_at desc

**POST /students/:id/notes** (counsellor/admin)
- Create note with note_type
- author_id = request.user.id

**GET /students/:id/activities** (counsellor/admin)
- List counsellor activity logs for this student

**POST /students/:id/activities** (counsellor/admin)
- Log counsellor activity
- Same validation as leads activity endpoint

**GET /students/:id/contacts** (student: own, counsellor/admin)
- List parent/guardian contacts

**POST /students/:id/contacts** (student: own, admin)
- Add contact

**PATCH /student-contacts/:id** (student: own, admin)
- Update contact

**GET /students/:id/consents** (student: own, admin)
- Consent history

**POST /students/:id/consents** (student: own, admin)
- Record consent event
- Update student boolean flags (whatsapp_consent, email_consent, parent_involvement)

### 3.2 Validation schemas
- `packages/shared/src/validation/students.ts`:
  - updateStudentSchema (different field sets by role)
  - changeStageSchema (toStage, reasonCode, reasonNote)
  - assignStudentSchema
  - createNoteSchema, createActivitySchema
  - createContactSchema, updateContactSchema
  - createConsentSchema
  - studentFiltersSchema

### 3.3 Tests
- Get student as student (own data, limited fields)
- Get student as counsellor (assigned only, full profile)
- Stage change creates transition record
- Stage change emits mautic-sync and notifications jobs
- Assign counsellor creates assignment history
- Progress endpoint returns safe student-facing data
- Notes are append-only
- Contacts CRUD
- Consent recording updates student flags

**Done when:** Full student lifecycle management works, stage transitions create audit records, RBAC enforced across all endpoints.

---

## Step 4: Applications Module

### 4.1 `apps/api/src/modules/applications/`

**POST /students/:id/applications** (counsellor/admin)
- Create application linking student to program (and optionally intake)
- Validates program exists and is active
- Sets created_by = request.user.id
- Default status = draft

**GET /students/:id/applications** (student: own, counsellor/admin)
- List applications for a student, include program + university info

**PATCH /applications/:id** (counsellor/admin)
- Update status (draft → submitted → offer/rejected → enrolled)
- Set submitted_at, decision_at as appropriate
- Link offer_letter_document_id if status=offer
- Emit `notifications` job on status changes
- Set updated_by = request.user.id

**GET /applications** (admin only)
- All applications with filters: programId, universityId, status, intakeId, studentId, search

### 4.2 Validation schemas
- `packages/shared/src/validation/applications.ts`

### 4.3 Tests
- Create application, update status through lifecycle
- Student can view own applications
- RBAC enforcement

**Done when:** Application lifecycle from draft to enrolled works, linked to programs and students.

---

## Step 5: Documents Module

### 5.1 Google Cloud Storage integration
- `apps/api/src/integrations/storage/index.ts`
- `generateSignedUploadUrl(path, contentType, maxSize)` — returns signed URL for direct upload
- `generateSignedDownloadUrl(path, expiresInMinutes)` — returns signed URL for download
- `checkFileExists(path)` — HEAD request to verify upload completed
- `getFileMetadata(path)` — returns size, content type from GCS

### 5.2 `apps/api/src/modules/documents/`

**POST /students/:id/documents/upload-url** (student: own, counsellor/admin)
- Create document record with status=pending_upload
- Generate GCS path: `students/{studentId}/documents/{documentId}/{filename}`
- Generate signed upload URL
- Return { uploadUrl, documentId, gcsPath }

**POST /students/:id/documents/complete** (student: own, counsellor/admin)
- Verify file exists in GCS
- Update document: status=pending, populate size_bytes and mime_type from GCS metadata
- If replaces_document_id provided: set is_current=false on old doc
- Update student_document_requirements if matching type exists
- Emit `documents` job (gap detection, requirement status update)

**GET /students/:id/documents** (student: own, counsellor/admin)
- List documents, filterable by type, status, is_current
- Include requirement status if linked

**GET /documents/:id/download** (student: own doc, counsellor/admin)
- Generate signed download URL (15 min expiry)

**POST /documents/:id/verify** (counsellor/admin)
- Set status=verified, verified_by, verified_at
- Update linked requirement status
- Emit `documents` job, `notifications` job

**POST /documents/:id/reject** (counsellor/admin)
- Set status=rejected, notes with rejection reason
- Emit `notifications` job (student gets notified)

**DELETE /documents/:id** (student: own, admin)
- Soft delete (set deleted_at)

**GET /students/:id/document-requirements** (student: own, counsellor/admin)
- List checklist items with status

**POST /students/:id/document-requirements** (counsellor/admin)
- Add custom requirement

**PATCH /document-requirements/:id** (counsellor/admin)
- Update status (waived, requested, etc.)

### 5.3 Scheduled cleanup
- Add to worker: cron job that finds documents with status=pending_upload older than 24h and removes them

### 5.4 Validation schemas
- `packages/shared/src/validation/documents.ts`

### 5.5 Tests
- Two-step upload flow (get URL → complete)
- Verify/reject updates status and emits jobs
- Signed download URL generation
- Requirement checklist CRUD
- Cleanup of stale pending_upload docs
- RBAC: student can only access own docs

**Done when:** Full document lifecycle works including GCS integration, checklist tracking, verify/reject flow.

---

## Step 6: Shared Validation & Type Updates

### 6.1 Update `packages/shared`
- Ensure all validation schemas created in Steps 1-5 are properly exported from `packages/shared/src/validation/`
- Ensure all types align with Prisma generated types
- Add utility types: `CreateInput<T>`, `UpdateInput<T>`, `FilterParams<T>`

### 6.2 API response helpers
- `apps/api/src/lib/response.ts`:
  - `paginate<T>(items, total, page, limit)` — returns standard paginated response
  - `success<T>(data)` — wraps in consistent shape
  - `created<T>(data)` — 201 wrapper

**Done when:** All modules use shared validation, response shapes are consistent.

---

## Step 7: Integration Tests

### 7.1 Catalog integration tests
- Create university → create program → create intake → list via public endpoint
- RBAC: counsellor can read, cannot write

### 7.2 Lead lifecycle integration test
- Create lead → assign counsellor → log activity → convert to student
- Verify student record created correctly
- Verify lead status updated
- Verify reference code generated

### 7.3 Student lifecycle integration test
- Student created (from conversion) → update profile → change stage → add note → log activity
- Verify stage_transition records
- Verify timeline aggregation

### 7.4 Document lifecycle integration test
- Get upload URL → complete upload → verify → reject → re-upload
- Verify requirement checklist updates

### 7.5 Application lifecycle integration test
- Create application → submit → offer → enrolled
- Verify notifications emitted

**Done when:** All integration tests pass covering the core business flows.

---

## Acceptance Criteria

- [ ] All 6 catalog entities: full CRUD with RBAC
- [ ] Public catalog endpoints: active only, no auth, subset fields
- [ ] Leads: create, list, detail, update, assign, disqualify, convert, import
- [ ] Lead conversion: creates student, transfers chat sessions, generates reference code
- [ ] Students: full CRUD, stage changes with audit trail, assignment history
- [ ] Student progress endpoint: safe for student display
- [ ] Applications: CRUD with status lifecycle
- [ ] Documents: two-step upload, verify/reject, requirement checklist, GCS integration
- [ ] Notes: append-only with type classification
- [ ] Activity logging: append-only for counsellor offline work
- [ ] Contacts: CRUD for parent/guardian info
- [ ] Consent: recording with audit trail, updates student flags
- [ ] Timeline endpoints: aggregate events across entity types
- [ ] All mutations emit appropriate BullMQ jobs
- [ ] RBAC enforced on every endpoint (student=own, counsellor=assigned, admin=all)
- [ ] Pagination works on all list endpoints
- [ ] All tests pass
