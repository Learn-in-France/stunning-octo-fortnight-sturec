# Plan 5: Public & Student Frontend

Marketing pages, programs discovery, auth-gated advisor entry, student portal, student AI chat, documents, checklist, progress analytics.

**Depends on:** Plans 1-4
**Blocks:** Plans 6-7

---

## Step 1: Public Layout & Navigation

### 1.1 Public layout — `apps/web/src/app/(public)/layout.tsx`
- Top navbar: logo, navigation links, sign-in / get-started CTA buttons
- Footer: links, contact info, social media placeholders
- Navigation items: Home, Study in France, Universities, Programs, Visa, Campus France, Accommodation, About, Contact
- CTA buttons change based on auth state (Sign In → Portal/Dashboard)

### 1.2 Shared public components
- `apps/web/src/features/public-home/components/`:
  - `hero-section.tsx` — main headline, subtitle, CTA buttons
  - `feature-card.tsx` — icon + title + description card
  - `testimonial-card.tsx` — placeholder for student testimonials
  - `stat-counter.tsx` — animated number display
  - `cta-banner.tsx` — full-width call-to-action section

**Done when:** Public layout renders with navigation and footer, responsive on mobile.

---

## Step 2: Public Marketing Pages

### 2.1 Homepage — `apps/web/src/app/(public)/page.tsx`
Server-rendered for SEO.
- Hero section: headline about studying in France, CTA "Talk to an AI Advisor" + "Browse Programs"
- How it works: 3-4 step visual (Sign in → Chat with AI → Get matched → Apply)
- Key stats: universities, programs, success rate (placeholder data)
- Featured programs section (server-fetch top 6 active programs)
- Testimonials section (placeholder)
- CTA banner: "Get started — it's free"

### 2.2 Study in France — `apps/web/src/app/(public)/study-in-france/page.tsx`
- Why France for higher education
- Cost of living overview
- Student life
- Work opportunities
- SEO-optimized static content

### 2.3 Universities — `apps/web/src/app/(public)/universities/page.tsx`
- Fetches `GET /public/universities`
- Card grid: name, city, partner status
- Search and city filter
- Click → university detail page (or expand card)

### 2.4 Programs — `apps/web/src/app/(public)/programs/page.tsx`
- Feature: `apps/web/src/features/public-home/programs/`
- Fetches `GET /public/programs`
- Filterable list: degree level, field of study, city, intake, tuition range
- Program cards: name, university, degree, field, tuition, language, intake dates
- Click → program detail page

### 2.5 Program detail — `apps/web/src/app/(public)/programs/[id]/page.tsx`
- Server-rendered for SEO
- Fetches `GET /public/programs/:id`
- Full program info: university, description, requirements, tuition, intakes, eligibility
- CTA: "Check your eligibility — talk to our AI advisor" (links to the advisor sign-in entry)

### 2.6 Visa — `apps/web/src/app/(public)/visa/page.tsx`
- Overview of France student visa process
- Document requirements (fetched from public catalog or static)
- Timeline and steps
- CTA to sign in for personalized guidance

### 2.7 Campus France — `apps/web/src/app/(public)/campus-france/page.tsx`
- What is Campus France, interview prep tips
- Content from campus_france_prep table (public subset)

### 2.8 Accommodation — `apps/web/src/app/(public)/accommodation/page.tsx`
- Housing options overview
- Cost ranges by city
- Tips for finding accommodation

### 2.9 About — `apps/web/src/app/(public)/about/page.tsx`
- Company mission
- Team (placeholder)

### 2.10 Contact — `apps/web/src/app/(public)/contact/page.tsx`
- Contact form (emails to admin, no backend endpoint needed now — can use mailto or form service)
- Office address, email, phone

### 2.11 Apply / Advisor entry — `apps/web/src/app/(public)/apply/page.tsx`
- Auth-gated: if not signed in, show sign-in CTA
- If signed in as student: redirect to student chat or portal
- Optional brief form for additional lead data before redirecting to chat
- If the brief form is submitted, create/update the authenticated lead before redirecting to the student chat flow

### 2.12 Book — `apps/web/src/app/(public)/book/page.tsx`
- Embeds Cal.com booking widget or redirects to Cal.com
- Pre-fills metadata if user is known

### 2.13 Public auth register — `apps/web/src/app/(public)/auth/register/page.tsx`
- Student-facing sign-up page for email+password and Google sign-in
- Copy aligned to advisor entry:
  - "Get matched to programs that fit your profile"
  - "Talk to an AI advisor who understands France admissions"
  - "Track your application journey from start to arrival"
- After account creation, call `POST /auth/register`
- Redirect authenticated students to `/(student)/portal/chat` or `/(student)/portal`

**Done when:** All public pages render with content, programs page fetches real data, SEO-optimized with server rendering.

---

## Step 3: Auth-Gated AI Chat Entry

### 3.1 Chat landing — `apps/web/src/app/(public)/chat/page.tsx`
- Feature: `apps/web/src/features/public-chat/`
- NOT an anonymous chat page
- If not signed in:
  - Explains the AI advisor
  - CTAs from architecture doc: "Sign in to talk to your France study advisor", "Free, takes 10 seconds with Google sign-in"
  - Sign in buttons (Google + email)
- If signed in as student:
  - Redirect to `/(student)/portal/chat` (the actual chat interface)
- If signed in as counsellor/admin:
  - Redirect to internal dashboard

### 3.2 No anonymous chat
- This page is purely a marketing/auth entry point
- All actual chat happens in the authenticated student portal

### 3.3 Advisor-oriented auth experience
- Reuse shared login UI but adapt public copy for student acquisition
- If the user arrives from `/chat` or `/apply`, preserve redirect intent through auth
- Google sign-in should be the primary CTA, email+password secondary

**Done when:** Chat landing page shows sign-in CTA for visitors, redirects authenticated students to portal chat.

---

## Step 4: Student Portal Layout

### 4.1 Student layout — `apps/web/src/app/(student)/layout.tsx`
- Auth guard (role = student)
- Left nav or top nav with:
  - Portal (dashboard)
  - Chat (AI advisor)
  - Applications
  - Documents
  - Checklist
  - Profile
  - Bookings
  - Visa Readiness
  - Analytics / Progress
  - Notifications
  - Support
- Progress card in sidebar: current stage, completion percentage

### 4.2 Student-specific UI components
- `progress-bar.tsx` — stage progress visualization (13 stages, show completed/current/upcoming)
- `milestone-card.tsx` — completed milestone with date
- `next-action-card.tsx` — action item with CTA button
- `document-upload-card.tsx` — document type, status, upload button

**Done when:** Student layout renders with navigation, progress card, auth guard in place.

---

## Step 5: Student Portal Dashboard

### 5.1 `apps/web/src/app/(student)/portal/page.tsx`
- Feature: `apps/web/src/features/students/portal/`
- Calls `GET /students/me/progress`

**Cards/sections:**
- **Stage progress:** visual pipeline showing current stage, completed milestones, what's next
- **Next actions:** list from progress endpoint (e.g., "Upload financial proof", "Prepare Campus France answers")
- **Document checklist:** completed/total with link to checklist page
- **Applications:** total count with offers, link to applications page
- **Visa status:** current status indicator
- **Quick links:** Chat with advisor, Upload document, View applications

### 5.2 Hooks
- `useMyProgress()` — calls `GET /students/me/progress`
- `useMyStudent()` — calls `GET /students/me`

**Done when:** Student sees their personalized dashboard with progress, actions, and quick links.

---

## Step 6: Student AI Chat

### 6.1 `apps/web/src/app/(student)/portal/chat/page.tsx`
- Feature: `apps/web/src/features/public-chat/`

**Chat interface:**
- Message list: scrollable, auto-scroll on new message
- User messages (right-aligned) and assistant messages (left-aligned)
- Message input: textarea + send button
- Loading indicator while AI responds
- Interactive options: rendered as clickable buttons below AI messages when `options` is not null

**Session management:**
- On page load: check for active session (`GET /chat/sessions?status=active`)
  - If active session exists: load its messages
  - If no active session: create one (`POST /chat/sessions`)
- "End conversation" button → calls `POST /chat/sessions/:id/end`
- Past sessions list (sidebar or dropdown): click to view read-only history

**Message flow:**
1. User types message
2. Disable input, show loading
3. `POST /chat/sessions/:id/messages` with content
4. Receive AI response with optional options
5. Render response + options buttons
6. Re-enable input

**Options handling:**
- When AI returns options: render as buttons
- Click button → send that option text as next message

### 6.2 Hooks
- `useChatSessions()` — list sessions
- `useChatSession(id)` — session detail
- `useChatMessages(sessionId)` — message history
- `useSendMessage()` — mutation, returns AI response
- `useCreateSession()` — mutation
- `useEndSession()` — mutation

### 6.3 Tests
- Chat renders and sends messages
- AI response displays correctly
- Options render as buttons
- Session creation and ending work
- Past sessions viewable as read-only

**Done when:** Student can chat with AI advisor, see responses with options, start and end sessions.

---

## Step 7: Student Documents & Checklist

### 7.1 Documents page — `apps/web/src/app/(student)/portal/documents/page.tsx`
- Feature: `apps/web/src/features/documents/`
- List own documents: type, filename, status badge, date
- Upload button per document type
- Upload flow:
  1. Select document type
  2. Choose file
  3. `POST /students/:id/documents/upload-url` → get signed URL
  4. Upload directly to GCS
  5. `POST /students/:id/documents/complete` → confirm
  6. Show success
- Download: click row → `GET /documents/:id/download` → open signed URL

### 7.2 Checklist page — `apps/web/src/app/(student)/portal/checklist/page.tsx`
- Fetches `GET /students/me/requirements`
- Visual checklist: requirement name, source, required/optional, status, due date
- Status badges: missing (red), requested (yellow), uploaded (blue), verified (green), rejected (red), waived (gray)
- Upload CTA next to each missing/requested/rejected item → opens upload modal
- Progress bar: X of Y requirements complete

### 7.3 Hooks
- `useMyDocuments()`, `useUploadDocument()`, `useCompleteUpload()`
- `useDocumentDownloadUrl(id)`
- `useMyDocumentRequirements()`

**Done when:** Student can upload documents, view checklist, track progress. Verified/rejected statuses visible.

---

## Step 8: Student Applications

### 8.1 `apps/web/src/app/(student)/portal/applications/page.tsx`
- Feature: `apps/web/src/features/applications/`
- List own applications: program name, university, intake, status, dates
- Status badges
- Read-only for student (counsellor creates/updates applications)
- View application detail: program info, status history

### 8.2 Hooks
- `useMyApplications()` — calls `GET /students/me/applications`

**Done when:** Student can view their applications and statuses.

---

## Step 9: Student Profile & Other Pages

### 9.1 Profile — `apps/web/src/app/(student)/portal/profile/page.tsx`
- View/edit own profile
- Editable fields: phone, preferred_city, preferred_intake, housing_needed, budget range, english test details
- Non-editable: name, email, reference code, stage

### 9.2 Bookings — `apps/web/src/app/(student)/portal/bookings/page.tsx`
- List own bookings with counsellor name, date, status
- "Book a session" CTA → link to Cal.com or booking flow

### 9.3 Visa Readiness — `apps/web/src/app/(student)/portal/visa-readiness/page.tsx`
- Student-friendly progress view
- No raw risk labels
- Milestone checklist for visa process
- Links to relevant documents needed

### 9.4 Analytics / Progress — `apps/web/src/app/(student)/portal/analytics/page.tsx`
- Calls `GET /students/me/progress`
- Visual stage progression timeline
- Milestones completed with dates
- Document completion progress
- Application status summary
- Next recommended actions

### 9.5 Notifications — `apps/web/src/app/(student)/portal/notifications/page.tsx`
- Calls `GET /students/me/notifications`
- Shows notification history with channel/status/subject metadata

### 9.6 Support — `apps/web/src/app/(student)/portal/support/page.tsx`
- Submits `POST /students/me/support`
- Shows confirmation state and fallback contact path if submission fails

The core completion criteria are portal dashboard, chat, documents, checklist, applications, profile, notifications, support, and progress analytics.

**Done when:** Core student portal pages render with own data, profile editable, and progress surfaces are usable end to end.

---

## Acceptance Criteria

- [ ] Public layout: navbar, footer, responsive
- [ ] Homepage: hero, how it works, featured programs, CTAs
- [ ] Programs page: filterable list from API, detail page with eligibility CTA
- [ ] Universities page: searchable grid from API
- [ ] Static pages: study in France, visa, campus France, accommodation, about, contact
- [ ] Public auth register page: student-facing sign-up with advisor value proposition
- [ ] Chat landing: sign-in CTA for visitors, redirect for authenticated users
- [ ] Book page: Cal.com embed or redirect
- [ ] Student layout: auth guard, navigation, progress card
- [ ] Student dashboard: progress, next actions, document checklist, applications, visa status
- [ ] AI chat: send messages, receive AI responses, interactive options, session management
- [ ] Documents: upload flow (signed URL → GCS → complete), download, list
- [ ] Checklist: requirement list with status, upload CTAs, progress bar
- [ ] Applications: read-only view for student
- [ ] Profile: editable student fields
- [ ] Analytics/progress: visual stage timeline, milestones, document completion
- [ ] All server-rendered pages have proper meta tags for SEO
