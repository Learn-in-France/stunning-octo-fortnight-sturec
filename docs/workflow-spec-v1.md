# STUREC Workflow Specification v1

## What We Are

Learn in France — a specialist student recruitment agency with a team on the ground in Dijon/Lyon, France. We help international students study in France through AI-powered screening and human counsellor guidance. Current partner: Burgundy School of Business (BSB). BSB pays commission per enrolled student.

## Core Principle

AI screens and qualifies. Humans guide and close. The student experience is consultative, never salesy.

---

## THE COMPLETE WORKFLOW

### Phase 1: Discovery (Public Site → Signup)

```
Student visits public site
  → Reads: Homepage (trust) → Why France (consideration) → Your Journey (process) → AI Advisor (conversion)
  → Clicks "Talk to AI advisor" → lands on /auth/register
  → Signs up with Google (auto-verified) or Email+Password (needs verification)
  → Email users: enter portal immediately but see persistent banner
    "Verify your email to unlock booking and document sharing"
    Blocked from: booking meeting, sharing documents, submitting profile data
  → Google users: full access immediately
  → Redirected to /portal
```

**What exists:** Public pages (done), auth pages (done), Firebase auth (done)
**What's missing:** Email verification gate with soft-block banner, persistent verification state check

---

### Phase 2: AI Intake (Portal → Chat)

```
Student lands on portal dashboard
  → Sees: welcome banner, "Talk to AI advisor" as primary action
  → Opens AI chat
  → AI is consultative and informative about France:
    - General guidance about studying in France
    - Process overview (Campus France, visa, timelines)
    - Broad eligibility discussion
    - NOT recommending specific universities or programs (that's counsellor's job)
  → AI naturally captures intake data through conversation:
    - Nationality / country of residence
    - Current education level
    - Field of interest
    - Timeline (when they want to start)
    - Budget awareness
    - English/French language level
    - "How did you hear about us?" (source tracking)
  → AI tracks capture completeness internally
  → When enough data captured (4 of 5 core fields), AI suggests booking:
    "I think you're ready to talk to a counsellor — would you like me to set that up?"
  → Booking is presented inline in the chat (Cal.com embed)
  → Student can also book from portal dashboard, but:
    If AI intake insufficient → short fallback intake form before Cal.com confirmation
```

**What exists:** Chat module + Groq (done), chat UI (done), assessment generation (done)
**What's missing:**
- AI prompt tuning (keep broad, don't recommend programs)
- Intake field tracking (5 core fields)
- Minimum intake check before booking
- Cal.com embed in chat flow
- Fallback intake form
- Inline booking suggestion from AI

---

### Phase 3: Booking → Handoff

```
Student books meeting (via AI suggestion or portal)
  → System generates AI summary containing:
    - Candidate profile summary (not transcript)
    - Qualification status: hot | warm | cold | needs_follow_up
    - Confidence score
    - Profile completeness percentage
    - France fit assessment
    - Study level / target intake
    - Budget signal
    - English readiness
    - Visa complexity/risk
    - Key blockers identified
    - Missing information
    - Recommended counsellor focus areas
    - Source ("How did you hear about us?")
  → System triggers:
    - Email alert to admin (info@learninfrance.com)
    - In-app alert on admin dashboard
    - Booking status = "Awaiting assignment"
  → Admin sees booking in "Pending Assignment" queue (top of dashboard)
  → Admin assigns counsellor manually (sees workload count per counsellor)
  → Student portal shows: "Your counsellor: Pending" → then counsellor card with name and contact
```

**What exists:** Bookings CRUD (done), AI assessment generation (done), assign counsellor endpoint (done), notifications worker (done)
**What's missing:**
- Assessment trigger on booking (not just chat end)
- Lead temperature + confidence scoring in assessment
- "Pending Assignment" admin queue UI
- Counsellor workload count in assignment UI
- "Your counsellor" card on student portal
- Source tracking field capture

---

### Phase 4: Counsellor Engagement

```
Counsellor gets assigned
  → Sees student in their dashboard
  → Opens meeting prep view (one screen):
    - AI summary + lead temperature
    - Student profile
    - Documents shared (if any)
    - Booking details
    - Previous notes (if any)
  → Conducts Cal.com meeting
  → After meeting, logs structured outcome:
    - Meeting outcome (dropdown: qualified, needs follow-up, not ready, disqualified)
    - Next action (free text)
    - Private note (counsellor + admin only)
    - Student-visible note (optional, e.g., "Please upload transcripts by Friday")
  → Updates student stage
  → Optionally triggers phase campaign
```

**What exists:** Student detail page (done), notes endpoints (done), stage change (done)
**What's missing:**
- Meeting prep view (one-screen consolidated)
- Structured post-meeting form (outcome, next action, private + student-visible notes)
- Student-visible note field (separate from private)

---

### Phase 5: Campaign Management

```
Counsellor manages student communications
  → Campaign packs grouped by phase:
    1. Onboarding (lead → qualified): Welcome, expectations, document prep
    2. Application (consultation → offer): Tips, deadlines, progress updates
    3. Campus France & Visa (campus_france → visa_decision): Step-by-step CF, visa docs, interview prep
    4. Pre-departure (arrival_onboarding): Housing, banking, packing
    5. Arrival (arrived_france): Welcome, orientation, local tips
  → Each pack has 3-5 templated messages (email + WhatsApp)
  → Counsellor controls:
    - Manual: send individual messages one by one
    - Bulk: send all at once
    - Auto: schedule with X-day gaps, pause/resume
    - Default is manual start, optional automation toggle per phase
  → Campaign UI shows:
    - Template name and preview
    - Channels: email / WhatsApp
    - Status: sent / scheduled / paused
    - Send now button
    - Auto-send after X days toggle
    - What has already been sent
```

**What exists:** Mautic integration (done), notification worker (done), automations page (exists but may not match this)
**What's missing:**
- Campaign template CRUD (admin creates templates)
- Per-student campaign management UI for counsellors
- Manual/auto toggle with scheduling
- Campaign send history per student

---

### Phase 6: Ongoing Management

```
Counsellor manages portfolio of students
  → Daily agenda view:
    - Today's meetings
    - Students needing follow-up
    - Documents waiting review
    - Campaign sends due
    - Deadlines approaching (application, Campus France, visa)
  → Student list by stage with stuck indicators:
    - "In consultation for 14+ days" = stale
    - "Application deadline in 5 days" = urgent
    - "Booked but unassigned" = needs admin action
  → Quick actions (one-click):
    - Move to next stage
    - Send specific template
    - Request a document
    - Add a note
    - Set follow-up reminder
  → Follow-up reminders:
    - "Remind me to follow up with Priya in 3 days about transcripts"
    - Shows in daily agenda
  → Multiple applications per student tracked separately
  → Admin sees everything counsellor sees + counsellor performance metrics
```

**What exists:** Analytics endpoints (done), student list (done), activities (done)
**What's missing:**
- Daily agenda view (doesn't exist)
- Follow-up reminder system
- Deadline tracking
- Quick action toolbar
- Stale student indicators
- Meeting prep consolidated view

---

### Phase 7: Document Management

```
Student optionally uploads documents
  → Upload to portal (GCS signed URLs)
  → Documents are PRIVATE by default
  → Student explicitly clicks "Share with counsellor"
  → Student can revoke access later
  → Tracking fields:
    - uploadedAt
    - sharedAt (null until shared)
    - sharedWithCounsellorId
    - revokedAt (null until revoked)
  → Counsellor sees only shared documents
  → Future: AI reads docs with permission → helps write SOP, letter of intent
```

**What exists:** Document upload + GCS signed URLs (done), verification workflow (done), requirements (done)
**What's missing:**
- Explicit share/revoke model (currently docs may be visible by default)
- Consent tracking fields (sharedAt, revokedAt)
- Share/revoke UI on student portal
- Counsellor-side filtered view (only shared docs)

---

## PERSONA VIEWS

### Student Portal — What They See

**Navigation (simplified):**
1. Dashboard — current stage, next action, counsellor card, booking status
2. Chat — AI advisor (available anytime, 24/7 support layer)
3. Profile — personal info form
4. Documents — upload, share, revoke
5. Bookings — upcoming and past meetings
6. Notifications — in-app alerts

**HIDE from student portal (not aligned with workflow):**
- ~~Applications~~ → Student doesn't create applications. Counsellor manages applications. Student sees application status ON their dashboard, not as a separate page.
- ~~Checklist~~ → Merge into dashboard as "What we need from you" section
- ~~Progress/Analytics~~ → Redundant with dashboard stage display
- ~~Visa Readiness~~ → Too detailed for student self-service. Counsellor manages this.
- ~~Support~~ → Replace with direct counsellor contact (after assignment) or simple email link (before assignment)

**Student dashboard shows:**
- Current stage (friendly name)
- "What we need from you" (pending items)
- "What happens next" (next stage description)
- Your counsellor card (after assignment) or "Awaiting counsellor" (before)
- Upcoming meetings
- Deadlines with dates
- Wait-state reassurance during visa processing
- Document sharing status

**Student-facing stage names:**
| Internal | Student sees |
|----------|-------------|
| lead_created | Getting started |
| intake_completed | Profile reviewed |
| qualified | Matched with counsellor |
| counsellor_consultation | In consultation |
| application_started | Applications in progress |
| offer_confirmed | Offer received |
| campus_france_readiness | Campus France prep |
| visa_file_readiness | Visa preparation |
| visa_submitted | Visa submitted |
| visa_decision | Visa decision |
| arrival_onboarding | Preparing to arrive |
| arrived_france | Welcome to France |
| alumni | Alumni |

**Student does NOT see:**
- Internal counsellor notes
- Lead temperature / heat labels
- Risk scores
- Admin comments
- Internal stage names

---

### Counsellor View — What They See

**Navigation:**
1. Dashboard — daily agenda, today's meetings, follow-ups due, stale students
2. Students — full student list by stage, filters, search
3. Student Detail — meeting prep view, timeline, notes, documents, campaigns
4. Bookings — their scheduled meetings
5. Notifications — assignments, alerts

**HIDE from counsellor view:**
- ~~Leads~~ → Counsellors don't manage raw leads. They get assigned qualified students.
- ~~Catalog~~ → Admin manages programs/universities
- ~~Team~~ → Admin only
- ~~Automations (system level)~~ → Counsellor sees per-student campaign controls, not system automations
- ~~Settings (system)~~ → Personal settings only
- ~~Analytics (system level)~~ → They see their own student metrics on their dashboard

**Counsellor dashboard shows:**
- Today's meetings (with meeting prep links)
- Students needing follow-up (overdue reminders)
- Documents waiting review
- Campaign sends due today
- Deadline alerts (applications, Campus France, visa)
- Stale students (no activity in X days)
- Quick stats: active students by stage

**Student detail (meeting prep) shows in ONE screen:**
- AI summary + lead temperature badge
- Student profile (nationality, education, field, timeline, budget)
- Shared documents
- Booking history
- Previous meeting notes
- Pending items for student
- Campaign status
- Stage with change button
- Quick actions toolbar

---

### Admin View — What They See

**Navigation:**
1. Dashboard — pending assignments, pipeline overview, system health
2. Leads — all leads, import, AI assessment scores
3. Students — all students across all counsellors
4. Applications — all applications, status tracking
5. Bookings — all bookings
6. Team — manage counsellors, see workload
7. Catalog — universities, programs, intakes, eligibility rules, visa requirements
8. Analytics — pipeline, counsellor performance, student progress, conversion rates
9. Automations — campaign templates, system queues, integration health
10. Settings — system configuration

**Admin dashboard shows:**
- "Pending Assignment" queue (booked but unassigned students) — TOP PRIORITY
- Pipeline funnel (students by stage)
- Counsellor workload (active students per counsellor)
- Recent bookings
- System alerts (failed jobs, integration errors)
- Stale students across all counsellors
- Conversion metrics (lead → student → enrolled)

**Admin sees everything counsellor sees PLUS:**
- Cross-counsellor views
- Counsellor performance metrics
- System-level automations
- Campaign template management
- Team management
- All internal notes and scores

---

---

## WORKFLOW LOCKS (Fixed Product Decisions)

These are non-negotiable before implementation:

1. AI is consultative, France-focused, and does NOT recommend specific programs in chat.
2. Booking is the conversion point from AI to human.
3. AI summary is generated for counsellor handoff, not raw transcript exposure.
4. Admin assigns counsellor manually first.
5. Campaigns are manual-first with optional automation.
6. Student sees filtered progress and pending items, not internal notes/scores.
7. Documents are private by default and explicitly shared by the student.
8. Email/password users are soft-gated until verified; Google users are treated as verified.

---

## CURRENT APP CONFLICTS (Migration Deltas)

These are implementation gaps between current app behavior and the workflow spec:

| Area | Current behavior | Target behavior | File |
|------|-----------------|----------------|------|
| Booking | Requires counsellorId at creation | Pre-assignment booking, admin assigns later | `apps/api/src/modules/bookings/service.ts:22` |
| AI chat | Can inject program recommendations | No program recommendations, broad France guidance | `apps/api/src/modules/chat/service.ts:186` |
| Student nav | 10 items including Applications, Checklist, Progress, Visa Readiness, Support | 6 items: Dashboard, Chat, Profile, Documents, Bookings, Notifications | `apps/web/src/app/(student)/layout.tsx:18` |
| Documents | Upload/status only, implicitly visible | Private by default, explicit share/revoke | `apps/web/src/app/(student)/portal/documents/page.tsx:39` |
| Email verification | Not enforced | Soft gate: block booking, doc sharing, handoff until verified | Auth module |
| Counsellor flow | Generic student detail page | Meeting prep view, daily agenda, follow-up reminders, campaign controls | Internal pages |
| Admin flow | No pending-assignment queue | Top-priority queue for booked/unassigned students | Dashboard |

---

## CURRENT UI ELEMENTS TO HIDE

### Student Portal — Simplify sidebar:
| Current nav item | Action | Reason |
|---|---|---|
| Applications | HIDE | Student doesn't manage applications. Show status on dashboard. |
| Checklist | HIDE | Merge "what we need from you" into dashboard |
| Progress | HIDE | Redundant with dashboard stage display |
| Visa Readiness | HIDE | Counsellor manages. Too detailed for self-service. |
| Support | REPLACE | Show counsellor contact after assignment, simple email link before |

**Student portal nav becomes:**
1. Dashboard
2. Chat
3. Profile
4. Documents
5. Bookings
6. Notifications

### Counsellor/Admin Internal — Remove or restrict:
| Current nav item | Action | Reason |
|---|---|---|
| Leads (counsellor) | HIDE for counsellor | Counsellors get assigned students, not raw leads |
| Catalog (counsellor) | HIDE for counsellor | Admin-only |
| Team (counsellor) | HIDE for counsellor | Admin-only |
| Settings (counsellor) | SHOW personal only | No system settings |

---

## IMPLEMENTATION PLAN

### Phase 0: Spec Freeze and Migration Map

**Goal:** Convert this spec into implementation-ready source of truth.

**Deliverables:**
- Freeze terminology: internal stage names, student-facing labels, booking statuses, lead heat labels, summary fields
- Workflow state machine diagram
- Required event triggers map
- Role permissions matrix
- Student-visible vs internal-only data matrix

**Clarifications locked:**
- Booking is allowed before full AI intake, but fallback intake form is required if minimum capture is missing
- Profile editing remains allowed pre-verification
- Booking, document sharing, and counsellor handoff are verification-gated
- AI summary generation occurs on booking confirmation

---

### Phase 1: Auth and Verification Gating

**Goal:** External users onboard smoothly, email verification enforced only where workflow needs trust.

**Backend:**
- Add verification-aware user payload on `/auth/verify` and `/users/me`
- Expose `emailVerified` from Firebase
- Server-side guards for: booking creation, document sharing, counsellor handoff actions

**Frontend:**
- Persistent verification banner in portal dashboard and profile
- Profile editing stays enabled
- Block with clear messaging: bookings, document sharing
- Resend verification CTA

**Acceptance:**
- Google users proceed normally
- Email/password users can enter portal but cannot book/share until verified

---

### Phase 2: AI Intake Aligned to Workflow

**Goal:** AI gathers France-intake context without recommending specific programs.

**Backend:**
- Remove program recommendation injection in `chat/service.ts:186`
- Update Groq prompts in `integrations/groq/prompts.ts`
- Add intake completeness calculation (7 fields: nationality, education, field, timeline, budget, language, source)
- Store intake completeness on chat session or assessment
- Add `POST /chat/intake-check` endpoint

**Frontend:**
- Booking suggestion UI in chat when minimum intake met (4 of 5 core fields)
- Fallback intake form when booking without sufficient AI capture

**Acceptance:**
- AI does not surface program/university recommendations
- AI can determine "ready to book" state
- Direct booking from dashboard requires fallback intake if capture insufficient

---

### Phase 3: Booking and Handoff Rewrite

**Goal:** Booking becomes the formal AI-to-human conversion point.

**Backend:**
- Rewrite booking creation — counsellor NOT required at creation
- Booking confirmation triggers:
  - AI summary generation with lead heat labels (hot/warm/cold/needs_follow_up)
  - Confidence score
  - Admin email + in-app alert
  - Booking status = `awaiting_assignment`
- Add `GET /admin/pending-assignments` endpoint

**Frontend:**
- Student portal: "Counsellor pending" → counsellor card after assignment
- Admin dashboard: pending-assignment queue at top with count badge
- Cal.com embed in chat + portal bookings page

**Acceptance:**
- Student can book without counsellor pre-selected
- Admin sees booked/unassigned queue
- Summary generated on booking, not exposed as transcript

---

### Phase 4: Student Portal Simplification

**Goal:** Student UI reflects workflow, not internal system structure.

**Nav changes in `apps/web/src/app/(student)/layout.tsx`:**
- Keep: Dashboard, Chat, Profile, Documents, Bookings, Notifications
- Remove: Applications, Checklist, Progress, Visa Readiness, Support

**Dashboard becomes primary operational center showing:**
- Where you are (current stage, friendly name)
- What we need from you (pending items)
- What happens next (next stage description)
- Your counsellor (card with name + contact, or "Awaiting counsellor")
- Upcoming meeting
- Deadlines with dates
- Wait-state reassurance during processing stages
- Document sharing status

**Acceptance:**
- Student portal feels like one guided process, not a mini back office
- Dashboard alone explains current status and next step

---

### Phase 5: Document Sharing and Consent

**Goal:** Uploaded docs are not implicitly shared.

**Database:**
- Extend documents: `shared_at`, `shared_with_counsellor_id`, `revoked_at`
- Optional consent event logging

**Backend:**
- `POST /students/me/documents/:id/share`
- `POST /students/me/documents/:id/revoke`
- Counsellor document queries only return shared documents

**Frontend:**
- Student: uploaded (private) → shared → revoked states
- Counsellor: sees only shared documents

**Acceptance:**
- Upload does not equal share
- Student can revoke later
- Counsellor never sees unshared documents

---

### Phase 6: Counsellor Operating Model

**Goal:** Counsellor works from meeting prep, follow-up, and stage progression.

**Backend:**
- Structured post-meeting outcome: outcome, next_action, private_note, student_visible_note
- `counsellor_reminders` table + endpoints
- `GET /counsellors/:id/agenda` endpoint
- Deadline and stale-student derivations

**Frontend — Counsellor dashboard:**
- Today's meetings (with prep links)
- Overdue follow-ups
- Documents waiting review
- Campaign sends due
- Deadline alerts
- Stale students
- Quick stats by stage

**Frontend — Student detail (meeting prep view):**
- AI summary + lead temperature badge
- Student profile
- Shared documents
- Booking history
- Previous meeting notes
- Pending student items
- Campaign status
- Stage control + quick actions

**Acceptance:**
- Counsellor does not need to jump across pages to prep and act
- Follow-up risk is visible
- Student-visible and private notes clearly separated

---

### Phase 7: Campaigns Per Phase

**Goal:** Manual-first counsellor communications with optional automation.

**Database:**
- `campaign_templates` (admin-managed)
- `student_campaigns` (per-student state)
- Message schedule/status records

**Campaign packs (5 phases):**
1. Onboarding (lead → qualified)
2. Application (consultation → offer)
3. Campus France & Visa (campus_france → visa_decision)
4. Pre-departure (arrival_onboarding)
5. Arrival (arrived_france)

**Counsellor controls:**
- Manual send per message
- Bulk send all
- Auto-send with X-day gaps
- Pause/resume
- History of what's been sent

**Acceptance:**
- No counsellor improvisation required
- Default is manual control
- Automation is visible and reversible

---

### Phase 8: Admin Dashboard Alignment

**Goal:** Admin sees pipeline, assignments, and workload as workflow control.

**Admin dashboard shows:**
- Pending assignments queue (TOP PRIORITY)
- Counsellor workload counts
- Recent bookings awaiting assignment
- Stale student alerts
- Pipeline by stage
- Conversion metrics

**Admin sees everything counsellor sees PLUS:**
- Cross-counsellor views
- Performance metrics
- Template management
- Team management
- System ops

---

## WHAT NOT TO BUILD YET

- Auto-assignment rules (need volume first)
- Fully automatic campaign triggering by stage
- AI document reading / SOP drafting
- Exposing raw AI transcripts to staff
- Student-visible risk/heat metrics
- Payment/billing flow
- Multi-university partner dashboards
- Parent/guardian views
- Language localization

---

## API ALIGNMENT NEEDED

### Existing endpoints that need modification:
1. `POST /chat/sessions/:id/messages` — AI prompt tuning, remove program recommendations
2. `POST /bookings` — Remove required counsellorId, trigger AI summary + admin alert
3. `GET /students/me/progress` — Add counsellor info, friendly stage names, pending items
4. `POST /students/:id/notes` — Add `visibleToStudent` boolean field

### New endpoints needed:
1. `GET /students/me/counsellor` — Student gets assigned counsellor info
2. `POST /chat/intake-check` — Check if minimum intake is met
3. `GET /counsellors/:id/agenda` — Daily agenda for counsellor
4. `POST /counsellors/:id/reminders` — Create follow-up reminder
5. `GET /admin/pending-assignments` — Booked but unassigned students
6. `POST /students/me/documents/:id/share` — Explicit document sharing
7. `POST /students/me/documents/:id/revoke` — Revoke document access
8. Campaign template CRUD endpoints
9. Per-student campaign management endpoints

### Database changes needed:
1. `counsellor_notes` — Add `visible_to_student` boolean
2. `documents` — Add `shared_at`, `shared_with_counsellor_id`, `revoked_at`
3. `chat_sessions` — Add intake completeness tracking fields
4. New table: `campaign_templates`
5. New table: `student_campaigns`
6. New table: `counsellor_reminders`

---

## SUCCESS CRITERIA

The app is workflow-aligned when ALL of this is true:

- Student can discover, sign up, and talk to AI without confusion
- Booking is the clean AI-to-human handoff event
- Admin assignment is visible and manageable
- Counsellor sees a structured prep view, not fragmented tabs
- Student sees only actionable progress, not internal process clutter
- Documents are explicitly shared, not implicitly exposed
- Campaigns support manual-first execution with optional automation
- Stage progression, notes, reminders, and pending items reflect real agency operations

---

## HIGH-IMPACT FILES

**Frontend:**
- `apps/web/src/app/(student)/portal/page.tsx`
- `apps/web/src/app/(student)/layout.tsx`
- `apps/web/src/app/(student)/portal/documents/page.tsx`
- `apps/web/src/app/(student)/portal/bookings/page.tsx`
- `apps/web/src/app/(student)/portal/chat/page.tsx`
- `apps/web/src/app/(internal)/students/[id]/page.tsx`
- `apps/web/src/app/(internal)/dashboard/page.tsx`
- `apps/web/src/app/(internal)/automations/page.tsx`

**Backend:**
- `apps/api/src/modules/chat/service.ts`
- `apps/api/src/modules/bookings/service.ts`
- `apps/api/src/modules/student-portal/service.ts`
- `apps/api/src/modules/students/service.ts`
- `apps/api/src/workers/notifications.worker.ts`
- `apps/api/prisma/schema.prisma`

**Shared:**
- `packages/shared/src/types/*`
- `packages/shared/src/validation/*`
