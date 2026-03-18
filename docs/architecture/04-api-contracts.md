# API Contracts

Fastify REST API. All routes prefixed with `/api/v1`.

## Global Conventions

### Authentication
- Most routes require Firebase token in `Authorization: Bearer <token>` header
- Middleware: Firebase token → lookup user in PG → attach user + role to request
- RBAC checked per route

**Routes that do NOT require authentication:**
- `GET /public/programs`, `GET /public/programs/:id` — public catalog browsing
- `GET /public/universities`, `GET /public/universities/:id` — public catalog browsing
- `POST /webhooks/calcom`, `POST /webhooks/whatsapp`, `POST /webhooks/mautic` — webhook receivers (verified by provider-specific secrets, not Firebase)

**All other routes require Firebase auth**, including chat and lead creation. Students must sign in (Google or email+password) before using the AI chat or submitting forms. This ensures every interaction has a known identity from the start.

### RBAC Rules
- **student**: own data only (own profile, own docs, own chat, own applications)
- **counsellor**: assigned leads and students only. Cannot see other counsellors' assignments. Can see catalog data (read-only). Analytics access is limited to pipeline/funnel views, not admin performance dashboards.
- **admin**: everything. Full catalog write access. Team management. All analytics.

### Pagination
Paginated list endpoints support:
```
?page=1&limit=20&sortBy=created_at&sortOrder=desc
```

Response shape for paginated endpoints:
```json
{
  "items": [],
  "page": 1,
  "limit": 20,
  "total": 124
}
```

### Error Format
```json
{
  "error": "Human-readable message",
  "code": "LEAD_ALREADY_CONVERTED",
  "details": {}
}
```
Frontend uses `code` for logic, `error` for display. Never rely on error text for branching.

### Validation
Zod schemas in `packages/shared/src/validation/`. Validated on both frontend (forms) and backend (middleware).

---

## Auth Module

| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| POST | /auth/verify | Firebase token | any | Verify token, return app user + role |
| POST | /auth/register | Firebase token | none (new student/public user) | Create or link a student-facing app user record on first Firebase sign-in and link matching leads by email |
| POST | /auth/accept-invite | Firebase token | none (invited) | Team member accepts invite, links Firebase UID |
| GET | /users/me | yes | any | Current authenticated user profile |
| PATCH | /users/me | yes | any | Update current authenticated user's account fields (`firstName`, `lastName`, `phone`) |

## Team / Access Module

| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| GET | /team | yes | admin | List team members |
| POST | /team/invite | yes | admin | Invite team member (creates pending user) |
| PATCH | /team/:id | yes | admin | Update role / deactivate |
| GET | /team/:id/assignments | yes | admin | View counsellor assignment history |

## Leads Module

| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| POST | /leads | yes | student/counsellor/admin | Create lead (authenticated form, manual team entry, or internal orchestration) |
| GET | /leads | yes | counsellor (assigned), admin (all) | List leads with filters, qualification score, and priority |
| GET | /leads/:id | yes | counsellor/admin | Lead detail with internal qualification block |
| PATCH | /leads/:id | yes | counsellor/admin | Update lead fields |
| POST | /leads/:id/convert | yes | counsellor/admin | Convert lead → student |
| POST | /leads/:id/disqualify | yes | counsellor/admin | Mark disqualified with reason |
| POST | /leads/:id/assign | yes | admin | Assign counsellor to lead |
| GET | /leads/:id/timeline | yes | counsellor/admin | Lead event history |
| GET | /leads/:id/ai-assessments | yes | counsellor/admin | List AI assessments for this lead (including import-based batch assessments) |
| GET | /leads/:id/ai-assessments/:assessmentId | yes | counsellor/admin | Single AI assessment detail for this lead |
| GET | /leads/:id/activities | yes | counsellor/admin | List logged counsellor activities for this lead |
| POST | /leads/:id/activities | yes | counsellor/admin | Log counsellor call/follow-up/outreach activity for this lead |

**Convert endpoint contract:**
- Returns: `{ action: "created" | "linked" | "already_converted" | "requires_user_account", student?: {...} }`
- Handles: duplicate detection, partial failure retry, idempotency
- For imported/manual leads without `lead.user_id`, returns `requires_user_account` until the student signs in and the lead is linked to a Firebase-backed user.

**Filters:** `?status=new&source=university&assignedCounsellorId=xxx&qualificationMin=80&qualificationMax=100&priorityLevel=p1&readyForAssignment=true&search=john`

Imported university leads can have `ai_assessments` before conversion. Counsellors should see the latest assessment summary directly in lead detail, without waiting for a student record to exist.

Lead list/detail responses should include an internal-only qualification block:
- `qualificationScore`
- `priorityLevel`
- `profileCompleteness`
- `recommendedDisposition`
- component scores from latest AI assessment

These values are for admin/counsellor use only and must never be exposed in student-facing responses.

## Students Module

| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| GET | /students | yes | counsellor (assigned), admin (all) | List with filters |
| GET | /students/:id | yes | student (own), counsellor (assigned), admin | Full profile |
| PATCH | /students/:id | yes | student (own limited fields), counsellor/admin | Update profile |
| GET | /students/:id/progress | yes | student (own), admin | Student-facing progress summary for portal analytics |
| POST | /students/:id/stage | yes | counsellor/admin | Change stage (creates transition) |
| GET | /students/:id/timeline | yes | counsellor/admin | Full stage + event history |
| POST | /students/:id/assign | yes | admin | Assign counsellor |
| GET | /students/:id/assignments | yes | admin | Assignment history |
| GET | /students/:id/notes | yes | counsellor/admin | List internal notes |
| POST | /students/:id/notes | yes | counsellor/admin | Add note |
| GET | /students/:id/activities | yes | counsellor/admin | List logged counsellor activities for this student |
| POST | /students/:id/activities | yes | counsellor/admin | Log counsellor call/follow-up/meeting activity for this student |
| GET | /students/:id/contacts | yes | student (own), counsellor/admin | Parent/guardian contacts |
| POST | /students/:id/contacts | yes | student (own), admin | Add contact |
| PATCH | /student-contacts/:id | yes | student (own), admin | Update contact |
| GET | /students/:id/consents | yes | student (own), admin | Consent history |
| POST | /students/:id/consents | yes | student (own), admin | Record consent event |

**Stage change request:**
```json
{
  "toStage": "campus_france_readiness",
  "reasonCode": "docs_completed",
  "reasonNote": "All required documents verified"
}
```

**Student progress response shape:**
```json
{
  "stage": "visa_file_readiness",
  "progressPercent": 68,
  "completedMilestones": ["Lead created", "Intake completed", "Qualified/routed"],
  "nextActions": ["Upload financial proof", "Prepare Campus France answers"],
  "documentChecklist": { "completed": 5, "total": 8 },
  "applications": { "total": 3, "offers": 1 },
  "visa": { "status": "preparing_file" }
}
```

This endpoint is safe for student display: no raw internal risk labels, no counsellor-only notes, no chat transcript content.

**Filters:** `?stage=visa_submitted&assignedCounsellorId=xxx&visaRisk=high&readinessMin=5&search=smith`

**Activity log request example:**
```json
{
  "activityType": "call",
  "channel": "phone",
  "direction": "outbound",
  "outcome": "connected",
  "summary": "Discussed missing financial proof and agreed next follow-up on Friday",
  "nextActionDueAt": "2026-03-20T10:00:00Z",
  "durationMinutes": 18
}
```

Activity logging is append-only. Use it for offline work the system cannot infer reliably on its own. Do not log routine platform-visible events such as stage changes, bookings, or document verification twice.

## Student Self-Service / Portal Module

These routes are student-only convenience endpoints for the authenticated portal. They avoid requiring the frontend to know the current student record ID.

| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| GET | /students/me | yes | student | Own student profile |
| PATCH | /students/me | yes | student | Update own student-safe profile fields |
| GET | /students/me/progress | yes | student | Own progress summary for dashboard / analytics |
| GET | /students/me/applications | yes | student | Own applications list |
| GET | /students/me/applications/:id | yes | student | Own application detail |
| GET | /students/me/documents | yes | student | Own documents list |
| GET | /students/me/requirements | yes | student | Own document requirements/checklist |
| GET | /students/me/bookings | yes | student | Own bookings list |
| GET | /students/me/notifications | yes | student | Own notification history |
| POST | /students/me/support | yes | student | Submit support request |
| GET | /students/me/notification-preferences | yes | student | Read WhatsApp / email notification preferences |
| PATCH | /students/me/notification-preferences | yes | student | Update WhatsApp / email notification preferences |

`PATCH /students/me` is intentionally narrower than counsellor/admin profile editing. It only accepts student-safe fields such as academic background, preferences, budget, and similar self-service profile inputs.

`POST /students/me/support` returns a structured confirmation response and may still fall back to email handling in the frontend if the API call fails.

## Applications Module

| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| POST | /students/:id/applications | yes | counsellor/admin | Create application |
| GET | /students/:id/applications | yes | student (own), counsellor/admin | List student's applications |
| PATCH | /applications/:id | yes | counsellor/admin | Update status |
| GET | /applications | yes | admin | All applications with filters |

**Filters:** `?programId=xxx&universityId=xxx&status=offer&intakeId=xxx&studentId=xxx`

## Chat Module

| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| POST | /chat/sessions | yes | student | Start new chat session (Firebase auth required; creates or reuses lead first, then opens session) |
| GET | /chat/sessions | yes | student (own) | List past sessions |
| GET | /chat/sessions/:id | yes | student (own) | Session detail |
| POST | /chat/sessions/:id/messages | yes | student | Send message, get AI response |
| GET | /chat/sessions/:id/messages | yes | student (own only) | Get conversation history |
| POST | /chat/sessions/:id/end | yes | student | End session (triggers assessment) |

**Message request:**
```json
{ "content": "I studied BBA and have 7.5 GPA" }
```

**Message response:**
```json
{
  "message": {
    "role": "assistant",
    "content": "That's a great foundation! A 7.5 GPA opens up several MSc options in France...",
    "timestamp": "..."
  },
  "options": ["Explore programs", "Understand visa process", "Estimate living costs", "Speak with an advisor"]
}
```
Options are nullable — AI decides when to present them.

The chat API never returns internal qualification or priority fields to the student UI. Those values are persisted for internal workflows only.

## AI Module

Student AI routes are nested under students. Lead AI routes live under the Leads module because imported/manual leads can receive assessments before conversion.

| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| GET | /students/:id/ai-assessments | yes | counsellor/admin | List assessments for student |
| GET | /students/:id/ai-assessments/:assessmentId | yes | counsellor/admin | Single assessment detail |

## Documents Module

| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| POST | /students/:id/documents/upload-url | yes | student (own), counsellor/admin | Get signed GCS upload URL |
| POST | /students/:id/documents/complete | yes | student (own), counsellor/admin | Confirm upload, create metadata |
| GET | /students/:id/documents | yes | student (own), counsellor/admin | List documents |
| GET | /documents/:id/download | yes | student (own), counsellor/admin | Get signed download URL |
| POST | /documents/:id/verify | yes | counsellor/admin | Mark verified |
| POST | /documents/:id/reject | yes | counsellor/admin | Mark rejected with notes |
| DELETE | /documents/:id | yes | student (own), admin | Soft delete |
| GET | /students/:id/document-requirements | yes | student (own), counsellor/admin | Get checklist |
| POST | /students/:id/document-requirements | yes | counsellor/admin | Add custom requirement |
| PATCH | /document-requirements/:id | yes | counsellor/admin | Update status (waived, requested) |

**Two-step upload flow:**
1. `POST /students/:id/documents/upload-url` — creates a placeholder `documents` row with `status=pending_upload`, generates a signed GCS upload URL. Returns `{ uploadUrl, documentId, gcsPath }`.
2. Client uploads file directly to GCS using the signed URL.
3. `POST /students/:id/documents/complete` with `{ documentId }` — verifies the file exists in GCS, finalizes the placeholder row by setting `status=pending` (awaiting team review), populates `size_bytes` and `mime_type` from GCS metadata. If the file is not found in GCS, returns an error and the placeholder remains in `pending_upload` state (can be retried or cleaned up).

Cleanup: a scheduled job removes `pending_upload` documents older than 24h (upload was started but never completed).

## Catalog Module (Admin Only)

All CRUD follows same pattern. Admin role required for write ops. Read ops available to counsellors.

| Entity | Routes |
|--------|--------|
| Universities | `GET/POST /catalog/universities`, `GET/PATCH /catalog/universities/:id` |
| Programs | `GET/POST /catalog/programs`, `GET/PATCH /catalog/programs/:id` |
| Program Intakes | `GET/POST /catalog/programs/:id/intakes`, `PATCH /catalog/intakes/:id` |
| Visa Requirements | `GET/POST /catalog/visa-requirements`, `GET/PATCH /catalog/visa-requirements/:id` |
| Eligibility Rules | `GET/POST /catalog/eligibility-rules`, `GET/PATCH /catalog/eligibility-rules/:id` |
| Campus France Prep | `GET/POST /catalog/campus-france-prep`, `GET/PATCH /catalog/campus-france-prep/:id` |

### Public Catalog Routes (No Auth Required)

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | /public/programs | none | List active programs with filters (degree, field, city, intake, tuition range) |
| GET | /public/programs/:id | none | Single program detail (active only) |
| GET | /public/universities | none | List active partner universities |
| GET | /public/universities/:id | none | Single university detail (active only) |

These return a subset of fields (no internal notes, no audit fields). Filtered to `active=true` only.

## Scheduling Module

| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| POST | /bookings | yes | student/counsellor/admin | Create booking |
| GET | /bookings | yes | student (own), counsellor (own), admin (all) | List bookings |
| PATCH | /bookings/:id | yes | counsellor/admin | Update status |
| POST | /webhooks/calcom | webhook secret | — | Cal.com event updates |

## Notifications Module

| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| POST | /webhooks/whatsapp | webhook secret | — | Inbound WhatsApp messages |

Notifications are triggered as side effects of other actions (stage changes, document events, bookings). No general-purpose "send notification" endpoint exposed to frontend. Student history is exposed through `GET /students/me/notifications`. A broader internal notification-history endpoint is not yet exposed separately.

## Mautic Module

Outbound Mautic sync currently happens as an internal async side effect from lead/student lifecycle events. The only public HTTP surface today is the webhook receiver:

| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| POST | /webhooks/mautic | webhook secret | — | Mautic campaign event callbacks |

## Analytics Module

| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| GET | /analytics/overview | yes | admin | Executive dashboard: funnel, volume, conversion, SLA, overdue work |
| GET | /analytics/counsellors | yes | admin | Counsellor performance list: workload, activity, follow-up cadence, conversion |
| GET | /analytics/counsellors/:id | yes | admin | Single counsellor detail: activity timeline, caseload, stage progression, response metrics |
| GET | /analytics/students | yes | counsellor/admin | Student progression list: stage, time in stage, checklist progress, application and visa milestones |
| GET | /analytics/students/:id | yes | counsellor/admin | Single student progress detail for analytics view |
| GET | /analytics/pipeline | yes | counsellor/admin | Funnel metrics |

Implemented date-range filtering today applies to `GET /analytics/overview`, `GET /analytics/pipeline`, `GET /analytics/counsellors/:id`, and `GET /analytics/students/:id` via `?from=2026-01-01&to=2026-03-31`. The list endpoints currently return the latest aggregate snapshot without explicit date-range validation.

Analytics derives metrics from:
- automatic system events: assignments, stage transitions, bookings, applications, document actions, AI assessments
- counsellor activity logs: calls, follow-ups, meeting outcomes, unreachable attempts, next-step commitments

**Counsellor analytics KPIs:**
- active caseload (`assigned leads`, `assigned students`)
- response to priority queue (`p1` assigned within SLA, `p2` follow-up backlog)
- first-response time
- follow-up cadence
- logged activity volume by channel/type
- consultation completion rate
- lead-to-student conversion rate
- student stage progression rate
- overdue next actions

**Student analytics KPIs:**
- current stage and days in stage
- document checklist completion percentage
- application count and outcomes
- visa milestone progress
- last counsellor touchpoint
- stalled-risk indicator (based on inactivity and overdue actions)

**Lead qualification / priority analytics KPIs:**
- lead count by `priority_level` (`p1`, `p2`, `p3`)
- qualification score distribution bands (`80-100`, `60-79`, `<60`)
- unassigned `p1` queue size
- time from `p1` creation to counsellor assignment
- conversion rate by qualification band

## Ops Module

Admin-only operational visibility APIs for queues and integration health.

| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| GET | /ops/queues | yes | admin | Queue summary for all registered queues (`waiting`, `active`, `completed`, `failed`, `delayed`, `isPaused`) |
| GET | /ops/queues/:name | yes | admin | Queue detail with counts, recent failed jobs, and next waiting jobs |
| POST | /ops/queues/:name/retry | yes | admin | Retry failed jobs in the target queue |
| POST | /ops/queues/:name/pause | yes | admin | Pause the target queue |
| POST | /ops/queues/:name/resume | yes | admin | Resume the target queue |
| GET | /ops/queues/:name/jobs/:jobId | yes | admin | Full job detail (`payload`, `stacktrace`, `state`, timestamps, attempts) |
| POST | /ops/queues/:name/jobs/:jobId/retry | yes | admin | Retry a single failed job |
| GET | /ops/integrations | yes | admin | Integration and dependency health summary (Redis/database connectivity plus provider configuration and recent success/failure metadata) |
| GET | /ops/history/notifications | yes | admin | Paginated notification delivery history from `notification_log` |
| GET | /ops/history/mautic | yes | admin | Paginated outbound Mautic sync history from `mautic_sync_log` |
| GET | /ops/history/webhooks | yes | admin | Paginated webhook-created booking history for Cal.com sync visibility |

Current queue names exposed by ops endpoints:
- `ai-processing`
- `lead-routing`
- `notifications`
- `mautic-sync`
- `documents`
- `imports`
- `webhooks`

Current ops UI coverage in the web app:
- `/automations` (admin-only): queue overview, queue detail drilldown, single/bulk retry, pause/resume, integration health, and history tabs
- `/settings` (admin-only): account settings plus live integrations and system status tabs

## Webhook Authentication

| Provider | Verification Method |
|----------|-------------------|
| Cal.com | HMAC-SHA256 signature in `x-cal-signature-256` header, verified against `CALCOM_WEBHOOK_SECRET` |
| WhatsApp / Sensy.ai | Shared secret token in query param or header, verified against `WHATSAPP_WEBHOOK_SECRET` |
| Mautic | Shared secret token in custom header, verified against `MAUTIC_WEBHOOK_SECRET` |

All webhook endpoints:
- Verify signature/secret before processing
- Enqueue the raw payload into the `webhooks` BullMQ queue after verification
- Return 200 after successful enqueue
- Log all received payloads for debugging
- Are processed idempotently in the `webhooks` worker
