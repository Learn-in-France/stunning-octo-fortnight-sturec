# Data Model

PostgreSQL via Prisma ORM. Backend is source of truth for all data.

## Entity Relationship Overview

```
users (identity + role)
  ├── leads (pre-student funnel)
  │     └── converted_student_id → students
  ├── students (central operational entity)
  │     ├── stage_transitions (immutable audit log)
  │     ├── student_assignments (counsellor ownership history)
  │     ├── applications → programs → universities
  │     ├── documents (uploaded files, metadata in PG, files in GCS)
  │     ├── student_document_requirements (per-student checklist)
  │     ├── chat_sessions → chat_messages (private to student)
  │     ├── ai_assessments (structured scores, visible to team)
  │     ├── counsellor_notes (internal, append-only)
  │     ├── counsellor_activity_log (calls, follow-ups, meeting outcomes)
  │     ├── student_contacts (parent/guardian)
  │     ├── consent_events (auditable consent trail)
  │     ├── bookings (Cal.com synced)
  │     ├── notification_log
  │     └── mautic_sync_log
  └── catalog (admin-managed reference data)
        ├── universities
        ├── programs → program_intakes
        ├── eligibility_rules
        ├── visa_requirements
        └── campus_france_prep
```

## Core Tables

### users
All authenticated humans. Firebase UID links identity; role stored in PG.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| firebase_uid | string | Unique, from Firebase Auth |
| email | string | Unique |
| role | enum | student, counsellor, admin (enum for now, design for expansion) |
| first_name | string | |
| last_name | string | |
| phone | string | nullable |
| avatar_url | string | nullable |
| invited_by | uuid FK users | nullable (used for internal team invites only) |
| invited_at | timestamp | nullable (used for internal team invites only) |
| status | enum | active, invited, deactivated (`invited` is for internal team accounts, not cold-lead students) |
| created_at | timestamp | |
| updated_at | timestamp | |
| deleted_at | timestamp | nullable, soft delete |

### leads
Pre-student funnel. Created from website forms, AI chat, WhatsApp, ads, bulk import.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| email | string | |
| phone | string | nullable |
| first_name | string | |
| last_name | string | nullable |
| source | enum | marketing, university, referral, whatsapp, ads, manual |
| source_partner | string | nullable (university name if source=university) |
| status | enum | new, nurturing, qualified, disqualified, converted |
| qualification_score | integer | nullable, 0-100, backend-computed from AI component scores + hard rules |
| priority_level | enum | nullable, p1, p2, p3 (internal assignment priority) |
| profile_completeness | decimal | nullable, 0-1 |
| user_id | uuid FK users | nullable, linked for auth-first marketing leads; may be null for imported/manual leads |
| assigned_counsellor_id | uuid FK users | nullable |
| latest_ai_assessment_id | uuid FK ai_assessments | nullable |
| qualified_at | timestamp | nullable, set when lead first reaches qualified cutoff or is manually qualified |
| priority_updated_at | timestamp | nullable |
| created_by_user_id | uuid FK users | nullable, who created this lead (admin, counsellor, or system-created from authenticated student flow) |
| notes | text | nullable |
| mautic_contact_id | integer | nullable |
| converted_student_id | uuid FK students | nullable, set on conversion |
| created_at | timestamp | |
| updated_at | timestamp | |
| deleted_at | timestamp | nullable |

### students
Central operational entity. Created only when a lead is converted via `POST /leads/:id/convert`. Both marketing and university leads enter as lead records first — the student lifecycle begins at conversion.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid FK users | 1:1 with user where role=student |
| reference_code | string | Unique, human-readable (STU-2026-00128) |
| source | enum | marketing, university, referral, manual |
| source_partner | string | nullable |
| stage | enum | See Stage Enum Reference below |
| stage_updated_at | timestamp | |
| -- Academic profile | | |
| degree_level | string | nullable |
| bachelor_degree | string | nullable |
| gpa | decimal | nullable |
| graduation_year | integer | nullable |
| work_experience_years | integer | nullable |
| study_gap_years | integer | nullable |
| -- Language | | |
| english_test_type | enum | ielts, toefl, duolingo, none, nullable |
| english_score | decimal | nullable |
| -- Preferences | | |
| budget_min | integer | nullable |
| budget_max | integer | nullable |
| funding_route | string | nullable |
| preferred_city | string | nullable |
| preferred_intake | string | nullable |
| housing_needed | boolean | nullable |
| -- Scores | | |
| academic_fit_score | integer | nullable, 1-10 |
| financial_readiness_score | integer | nullable, 1-10 |
| visa_risk | enum | low, medium, high, nullable |
| overall_readiness_score | integer | nullable, 1-10 |
| latest_ai_assessment_id | uuid FK ai_assessments | nullable |
| last_assessed_at | timestamp | nullable |
| -- Assignment | | |
| assigned_counsellor_id | uuid FK users | nullable |
| assigned_at | timestamp | nullable |
| -- Mautic | | |
| mautic_contact_id | integer | nullable |
| mautic_synced_at | timestamp | nullable |
| -- Consent | | |
| whatsapp_consent | boolean | default false |
| email_consent | boolean | default false |
| parent_involvement | boolean | default false |
| -- Meta | | |
| created_at | timestamp | |
| updated_at | timestamp | |
| deleted_at | timestamp | nullable |

### stage_transitions
Immutable audit log. Every stage change creates a row.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| student_id | uuid FK students | |
| from_stage | enum | nullable (first stage) |
| to_stage | enum | |
| changed_by_user_id | uuid FK users | nullable |
| changed_by_type | enum | user, system, automation |
| reason_code | string | e.g. docs_completed, ai_scored_ready, manual_override |
| reason_note | text | nullable, free text |
| timestamp | timestamp | |

### student_assignments
Counsellor ownership history.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| student_id | uuid FK students | |
| counsellor_id | uuid FK users | |
| assigned_by | uuid FK users | |
| assigned_at | timestamp | |
| unassigned_at | timestamp | nullable |
| reason | text | nullable |

### applications
Many-to-many: student applies to multiple programs.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| student_id | uuid FK students | |
| program_id | uuid FK programs | |
| intake_id | uuid FK program_intakes | nullable |
| status | enum | draft, submitted, offer, rejected, enrolled |
| submitted_at | timestamp | nullable |
| decision_at | timestamp | nullable |
| offer_letter_document_id | uuid FK documents | nullable |
| notes | text | nullable |
| created_by | uuid FK users | who created this application |
| updated_by | uuid FK users | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

### chat_sessions
Firebase auth required before chat. Every session has a known user from the start.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid FK users | Required. The authenticated user who started the chat. |
| lead_id | uuid FK leads | Required. Backend creates or reuses the lead before opening the chat session. |
| student_id | uuid FK students | nullable. Set after lead conversion. |
| started_at | timestamp | |
| ended_at | timestamp | nullable |
| status | enum | active, completed |

### chat_messages
PRIVATE to student. Never exposed to counsellors/admins.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| session_id | uuid FK chat_sessions | |
| role | enum | user, assistant, system |
| content | text | |
| timestamp | timestamp | |

### ai_assessments
Structured AI output. This is what counsellors see — NOT chat transcripts.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| student_id | uuid FK students | nullable |
| lead_id | uuid FK leads | nullable |
| source_type | enum | chat, document, lead_form, manual_review, import |
| source_id | string | nullable (e.g. chat_session_id) |
| academic_fit_score | integer | nullable, 1-10 |
| financial_readiness_score | integer | nullable, 1-10 |
| language_readiness_score | integer | nullable, 1-10 |
| motivation_clarity_score | integer | nullable, 1-10 |
| timeline_urgency_score | integer | nullable, 1-10 |
| document_readiness_score | integer | nullable, 1-10 |
| visa_complexity_score | integer | nullable, 1-10 (higher = more complex/risky for ops) |
| visa_risk | enum | low, medium, high, nullable |
| overall_readiness_score | integer | nullable, 1-10 |
| qualification_score | integer | nullable, 0-100, backend-computed and persisted with the assessment |
| priority_level | enum | nullable, p1, p2, p3 |
| recommended_disposition | string | nullable, e.g. assign_priority_queue, request_more_info, nurture, manual_review |
| programme_level | string | nullable |
| recommended_next_step | string | nullable |
| summary_for_team | text | One-line summary for counsellor view |
| housing_needed | boolean | nullable |
| profile_completeness | decimal | nullable, 0-1 |
| fields_collected | json | nullable |
| fields_missing | json | nullable |
| hard_rule_flags | json | nullable, missing required fields / disqualifying conditions / urgency overrides |
| raw_json | json | Full AI output preserved |
| created_at | timestamp | |

### documents
File metadata in PG. Actual files in Google Cloud Storage. No uniqueness constraint on (student_id, type) — multiple versions allowed.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| student_id | uuid FK students | |
| uploaded_by | uuid FK users | |
| type | enum | passport, transcript, sop, financial_proof, accommodation, offer_letter, other |
| filename | string | |
| gcs_path | string | |
| mime_type | string | |
| size_bytes | integer | |
| status | enum | pending_upload, pending, verified, rejected |
| is_current | boolean | default true |
| replaces_document_id | uuid FK documents | nullable |
| verified_by | uuid FK users | nullable |
| verified_at | timestamp | nullable |
| notes | text | nullable |
| created_at | timestamp | |
| deleted_at | timestamp | nullable |

### student_document_requirements
Per-student checklist. Separate from uploaded documents.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| student_id | uuid FK students | |
| document_type | string | |
| requirement_source | enum | visa, admission, housing, custom |
| required | boolean | default true |
| status | enum | missing, requested, uploaded, verified, rejected, waived |
| notes | text | nullable |
| due_date | date | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

### counsellor_notes
Internal notes. Append-only preferred. Never shown to students.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| student_id | uuid FK students | |
| author_id | uuid FK users | |
| content | text | |
| note_type | enum | general, visa, academic, finance, risk |
| created_at | timestamp | |
| updated_at | timestamp | |

### counsellor_activity_log
Append-only operational activity log for counsellor work that is not fully visible from system events alone. Used for admin performance analytics and student/lead follow-up tracking.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| counsellor_id | uuid FK users | required, the counsellor whose activity is being recorded |
| lead_id | uuid FK leads | nullable, used for pre-conversion activity |
| student_id | uuid FK students | nullable, used for post-conversion activity |
| created_by_user_id | uuid FK users | who logged the activity (usually same as counsellor_id, but admin override allowed) |
| activity_type | enum | call, whatsapp, email, meeting, follow_up, status_update, other |
| channel | enum | phone, whatsapp, email, video, in_person, internal, other |
| direction | enum | outbound, inbound, internal |
| outcome | string | nullable, e.g. connected, no_answer, rescheduled, documents_requested |
| summary | text | nullable, concise human-entered summary |
| next_action_due_at | timestamp | nullable |
| duration_minutes | integer | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

Constraint notes:
- At least one of `lead_id` or `student_id` must be present.
- In normal flow, activity attaches to either a lead or a student, not both.

### student_contacts
Parent/guardian contact information.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| student_id | uuid FK students | |
| type | enum | parent, guardian, emergency |
| name | string | |
| relation | string | |
| email | string | nullable |
| phone | string | nullable |
| is_primary | boolean | default false |
| consent_to_contact | boolean | default false |
| created_at | timestamp | |

### consent_events
Auditable consent trail.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| student_id | uuid FK students | |
| consent_type | enum | whatsapp, email, parent_contact |
| granted | boolean | |
| source | enum | form, manual, import, webhook |
| captured_by_user_id | uuid FK users | nullable |
| created_at | timestamp | |

## Catalog Tables (Admin-Managed)

All catalog tables include `created_by`, `updated_by` audit fields.

### universities
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| name | string | |
| city | string | |
| country | string | default 'France' |
| website_url | string | nullable |
| partner_status | string | nullable |
| notes | text | nullable |
| active | boolean | default true |
| created_by | uuid FK users | |
| updated_by | uuid FK users | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

### programs
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| university_id | uuid FK universities | |
| name | string | |
| degree_level | string | |
| field_of_study | string | |
| language | string | default 'English' |
| duration_months | integer | |
| tuition_amount | integer | |
| tuition_currency | string | default 'EUR' |
| minimum_gpa | decimal | nullable |
| english_requirement_type | string | nullable |
| english_minimum_score | decimal | nullable |
| description | text | nullable |
| active | boolean | default true |
| created_by | uuid FK users | |
| updated_by | uuid FK users | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

### program_intakes
Normalized per-intake deadlines.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| program_id | uuid FK programs | |
| intake_name | string | e.g. "September 2026" |
| start_month | integer | |
| start_year | integer | |
| application_deadline | date | nullable |
| active | boolean | default true |
| created_by | uuid FK users | |
| updated_by | uuid FK users | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

### eligibility_rules
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| program_id | uuid FK programs | nullable (global if null) |
| rule_name | string | |
| field | string | |
| operator | string | gte, lte, eq, in, etc. |
| value | string | |
| value_type | enum | number, string, boolean, enum |
| rule_scope | string | nullable |
| description | text | nullable |
| created_by | uuid FK users | |
| updated_by | uuid FK users | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

### visa_requirements
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| title | string | |
| description | text | |
| document_type | string | |
| required | boolean | default true |
| country_specific | string | nullable |
| stage_applicable | string | nullable |
| sort_order | integer | |
| created_by | uuid FK users | |
| updated_by | uuid FK users | nullable |

### campus_france_prep
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| title | string | |
| content | text | |
| category | string | |
| sort_order | integer | |
| active | boolean | default true |
| created_by | uuid FK users | |
| updated_by | uuid FK users | nullable |

## Integration Tables

### mautic_sync_log
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| student_id | uuid FK students | nullable |
| lead_id | uuid FK leads | nullable |
| event_type | enum | contact_created, contact_updated, campaign_triggered |
| payload_hash | string | for idempotency |
| status | enum | pending, sent, failed, retrying |
| attempts | integer | default 0 |
| last_error | text | nullable |
| created_at | timestamp | |
| completed_at | timestamp | nullable |

### mautic_campaigns
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| mautic_campaign_id | integer | |
| name | string | |
| description | text | nullable |
| trigger_stage | string | nullable |
| auto_trigger | boolean | default false |
| active | boolean | default true |

### bookings
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| student_id | uuid FK students | nullable |
| lead_id | uuid FK leads | nullable |
| counsellor_id | uuid FK users | |
| calcom_event_id | string | nullable |
| scheduled_at | timestamp | |
| status | enum | scheduled, completed, cancelled, no_show |
| external_status | string | nullable, from Cal.com |
| last_synced_at | timestamp | nullable |
| notes | text | nullable |
| created_at | timestamp | |

### notification_log
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| student_id | uuid FK students | nullable |
| lead_id | uuid FK leads | nullable |
| recipient | string | email or phone |
| channel | enum | email, whatsapp, sms |
| provider | string | mautic, sensy, twilio, smtp, resend |
| template_key | string | |
| external_message_id | string | nullable |
| payload_json | json | nullable |
| status | enum | pending, sent, delivered, failed |
| error_message | text | nullable |
| sent_at | timestamp | nullable |
| delivered_at | timestamp | nullable |
| created_at | timestamp | |

## Stage Enum Reference

13 lifecycle stages. Transitions are generally forward, but admin can override to any stage with a reason.

| Enum Value | Display Name | Description | Typical Predecessor |
|------------|-------------|-------------|---------------------|
| `lead_created` | Lead Created | Initial record creation | — |
| `intake_completed` | Intake Completed | AI or manual intake done, profile collected | lead_created |
| `qualified` | Qualified / Routed | Scored and routed to counsellor or nurture | intake_completed |
| `counsellor_consultation` | Counsellor Consultation | Counsellor call scheduled or completed | qualified |
| `application_started` | Application Started | At least one application submitted | counsellor_consultation |
| `offer_confirmed` | Offer / Admission Confirmed | Offer received from university | application_started |
| `campus_france_readiness` | Campus France Readiness | Campus France interview prep complete | offer_confirmed |
| `visa_file_readiness` | Visa File Readiness | All visa documents ready | campus_france_readiness |
| `visa_submitted` | Visa Submitted | Visa application filed | visa_file_readiness |
| `visa_decision` | Visa Decision | Visa approved or rejected | visa_submitted |
| `arrival_onboarding` | Accommodation / Arrival Onboarding | Housing secured, arrival prep | visa_decision |
| `arrived_france` | Arrived in France | Student has arrived | arrival_onboarding |
| `alumni` | Alumni / Referral | Post-arrival, potential referral source | arrived_france |

Validation: backend enforces that `toStage` is a valid enum value. Admin can transition to any stage (with reason_code `manual_override`). Automated transitions follow the typical predecessor chain.

## Lead Conversion Strategy

When `POST /leads/:id/convert` is called:

1. **Lookup user**: The lead's `user_id` already points to a `users` record (because Firebase auth is required before chat/forms). Use that user.
2. **Create student record**: Copy relevant fields from lead + AI assessment. Set `source`, `source_partner`, initial `stage=lead_created`. Link to existing `users` record.
3. **Link lead**: Set `lead.converted_student_id = student.id`, `lead.status = converted`.
4. **Transfer chat sessions**: Update any `chat_sessions` where `lead_id = lead.id` to also set `student_id = student.id`. Keep `lead_id` for lineage.

For university import or manual leads without a Firebase-linked user yet:
1. **Do not create invited student users**: `users.status=invited` is reserved for internal team invite flow only.
2. **Keep the record as a lead** until the student signs in with Firebase.
3. **When the student signs in**: `POST /auth/register` can match the lead by email and populate `lead.user_id`.
4. **Conversion happens after account linkage**: once `lead.user_id` exists, `POST /leads/:id/convert` creates the student record normally.

Idempotency:
- If lead is already converted, return `{ action: "already_converted", student: {...} }`.
- If imported/manual lead has no linked `user_id` yet, conversion should fail with `requires_user_account` until the student signs in and the lead is linked.

## Chat Authentication Flow

Firebase auth is required before using the AI chat. No anonymous sessions.

1. **Student visits website** → sees chat CTA → prompted to sign in (Google or email+password).
2. **On first Firebase sign-in**: `POST /auth/register` creates `users` record with `firebase_uid`, `role=student`, `status=active`.
3. **Student starts chat**: `POST /chat/sessions` (auth required) → backend creates or reuses the lead first, then creates the session with both `user_id` and `lead_id` set.
4. **Chat proceeds**: AI profiles the student, collects data naturally, generates assessments.
5. **Session ends**: AI assessment saved, lead routing worker computes qualification, priority, and routing outcome.
6. **Conversion**: When counsellor converts the lead, student record is created and linked to the existing user — no invitation or deferred linking needed.

This eliminates: anonymous sessions, null user_id on chat sessions, deferred Firebase linking for marketing leads, and email-matching complexity.

## Public Booking Flow

Anonymous visitors can book via the public `/book` page:

1. **Frontend redirects to Cal.com** with pre-filled metadata (lead email, name if known).
2. **Cal.com webhook** fires to `POST /webhooks/calcom` with booking details.
3. **Backend creates booking record** with `lead_id` if email matches a lead, or creates a new lead from the booking metadata.
4. No direct `POST /bookings` call from unauthenticated frontend — Cal.com is the booking interface for public visitors.

Authenticated students and team members use `POST /bookings` which creates a Cal.com event via the integration.

## Enum Reference

### users.role
`student`, `counsellor`, `admin` (Prisma string enum, designed for future expansion)

### users.status
`active`, `invited`, `deactivated` (`invited` reserved for internal team member invite flow)

### leads.source
`marketing`, `university`, `referral`, `whatsapp`, `ads`, `manual`

### leads.status
`new`, `nurturing`, `qualified`, `disqualified`, `converted`

### leads.priority_level
`p1`, `p2`, `p3`

### students.stage
See Stage Enum Reference above.

### english_test_type
`ielts`, `toefl`, `duolingo`, `none`

### visa_risk
`low`, `medium`, `high`

### documents.type
`passport`, `transcript`, `sop`, `financial_proof`, `accommodation`, `offer_letter`, `other`

### student_document_requirements.document_type
Uses the same enum as `documents.type` for standard requirements. Admin can also set custom string values for non-standard requirements (e.g., "parent_income_certificate"). The `requirement_source` field provides context.

### ai_assessments.source_type
`chat` (from chat session end), `document` (from document upload re-assessment), `lead_form` (from form submission), `manual_review` (admin-triggered re-assessment), `import` (from bulk CSV import with pre-existing scores)

### ai_assessments.recommended_disposition
`assign_priority_queue`, `request_more_info`, `nurture`, `manual_review`

### counsellor_activity_log.activity_type
`call`, `whatsapp`, `email`, `meeting`, `follow_up`, `status_update`, `other`

### counsellor_activity_log.channel
`phone`, `whatsapp`, `email`, `video`, `in_person`, `internal`, `other`

### counsellor_activity_log.direction
`outbound`, `inbound`, `internal`

### stage_transitions.changed_by_type
`user`, `system`, `automation`

### stage_transitions.reason_code examples
`docs_completed`, `student_no_response`, `ai_scored_ready`, `offer_received`, `visa_rejected`, `visa_approved`, `manual_override`, `counsellor_assigned`, `application_submitted`

### overall_readiness_score calculation
AI-determined from the structured output. The Groq model considers academic fit, financial readiness, visa risk, document completeness, and timeline alignment to produce a single 1-10 score. Not a formula — it's the AI's holistic assessment saved from the `raw_json` output.

### qualification_score calculation
Used for **lead qualification only**. The backend computes a `0-100` score from per-dimension AI signals plus hard business rules. The model provides the component scores; the backend owns the final score and cutoff logic.

Suggested weighting for Phase 1:
- academic_fit_score: 25%
- financial_readiness_score: 20%
- language_readiness_score: 15%
- motivation_clarity_score: 10%
- timeline_urgency_score: 10%
- document_readiness_score: 10%
- visa_complexity_score: 10% inverse contribution (higher complexity lowers the final score)

Hard rules can cap or override the weighted score, for example:
- missing target program / intake / funding clarity → cannot auto-qualify
- severe academic mismatch against target program → cap below qualified cutoff
- urgent intake with otherwise viable profile → may raise `priority_level` by one band without changing qualification cutoff

Suggested operational interpretation:
- `80-100` → qualified candidate for admin priority queue review
- `60-79` → promising but incomplete; follow up / request more info
- `<60` → nurture or manual review

`priority_level` is separate from `qualification_score`:
- `p1` = assign/review immediately
- `p2` = follow up soon
- `p3` = nurture / low urgency / manual review queue

## Language Support

Phase 1: English only. The AI system prompt, conversation, and all UI are in English. This targets the primary audience (Indian students applying to English-taught programs in France).

Future: French language support can be added by providing a bilingual system prompt and detecting the student's language from their first message. Llama 3.3 70B handles French well. This is a Phase 2 consideration.

## Key Schema Rules

1. Student is the central entity — everything hangs off it
2. Leads have `status` (new → nurturing → qualified → converted). Students have `stage` (13 lifecycle stages). The lifecycle starts ONLY after a lead is converted to a student. Leads do not have lifecycle stages.
3. Leads exist before students — conversion creates student record, preserves lineage
3. Chat messages are PRIVATE (student only). AI assessments are what team sees.
4. Stage transitions are immutable audit records (never updated, only appended)
5. Documents: metadata in PG, files in GCS. Multiple versions per type allowed.
6. All catalog tables have created_by/updated_by for audit
7. Soft delete (deleted_at) on core business tables: users, students, leads, documents
8. Counsellor notes are append-only with note_type classification
9. Counsellor activity logs are append-only and should capture only work the system cannot observe automatically
10. Lead qualification scores, priority levels, internal disposition recommendations, and visa complexity are internal operational fields and must never be exposed to students.
