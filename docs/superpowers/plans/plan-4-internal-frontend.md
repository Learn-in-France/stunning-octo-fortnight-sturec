# Plan 4: Internal Frontend

Internal app shell, auth guards, dashboard, catalog CRUD UI, leads, students, applications, assignments, AI snapshot, activity log.

**Depends on:** Plans 1-3 (full backend)
**Blocks:** Plans 5-7

---

## Step 1: Frontend Foundation

### 1.1 API client — `apps/web/src/lib/api/client.ts`
- Axios or fetch wrapper with base URL from env
- Automatically attaches Firebase ID token to Authorization header
- Response interceptor: handle 401 (redirect to login), parse error shape
- Typed request/response helpers using shared schemas

### 1.2 Firebase auth — `apps/web/src/lib/auth/firebase.ts`
- Initialize Firebase client SDK (NEXT_PUBLIC_FIREBASE_* env vars)
- Export: `signInWithGoogle()`, `signInWithEmail(email, password)`, `signUp(email, password)`, `signOut()`, `onAuthStateChanged()`, `getIdToken()`

### 1.3 Auth provider — `apps/web/src/providers/auth-provider.tsx`
- React context: `{ user, loading, signIn, signOut }`
- On Firebase auth state change:
  1. Get ID token
  2. Call `POST /auth/verify` to get app user (role, etc.)
  3. If 401 USER_NOT_FOUND and new Firebase user → call `POST /auth/register`
  4. Set user in context
- Loading state during auth resolution

### 1.4 React Query setup — `apps/web/src/providers/query-provider.tsx`
- QueryClientProvider with default options (staleTime: 30s, retry: 1)

### 1.5 Route guards
- `apps/web/src/lib/guards/auth-guard.tsx` — redirects to /auth/login if not authenticated
- `apps/web/src/lib/guards/role-guard.tsx` — redirects to appropriate surface if wrong role
- Internal guard: requires role = counsellor or admin
- Student guard: requires role = student

### 1.6 Root providers — `apps/web/src/providers/index.tsx`
- Compose: QueryProvider → AuthProvider → children

**Done when:** Firebase auth works, API client attaches tokens, route guards protect internal/student routes.

---

## Step 2: Internal Layout & Navigation

### 2.1 Internal layout — `apps/web/src/app/(internal)/layout.tsx`
- Auth guard (counsellor or admin)
- Persistent sidebar + top bar
- Sidebar navigation (role-aware):
  - Dashboard (all)
  - Leads (all)
  - Students (all)
  - Applications (all)
  - Bookings (all)
  - Analytics (all — content differs by role)
  - Catalog (admin: CRUD, counsellor: read-only links)
  - Team (admin only)
  - Settings (all)

### 2.2 UI components — `apps/web/src/components/ui/`
- `button.tsx` — primary, secondary, danger, ghost variants, loading state
- `input.tsx` — text, email, number, with label and error display
- `select.tsx` — single select with options
- `textarea.tsx`
- `modal.tsx` — overlay dialog with close
- `table.tsx` — sortable columns, pagination controls
- `badge.tsx` — colored status/stage badges
- `card.tsx` — content container
- `tabs.tsx` — tabbed content panels
- `dropdown-menu.tsx` — action menus
- `toast.tsx` — success/error notifications
- `search-input.tsx` — debounced search with icon
- `pagination.tsx` — page controls tied to API pagination
- `empty-state.tsx` — icon + message + action CTA
- `loading-spinner.tsx`
- `date-picker.tsx` — date input

### 2.3 Layout components — `apps/web/src/components/layout/`
- `sidebar.tsx` — collapsible, role-aware nav items, active state
- `topbar.tsx` — search, notifications bell (placeholder), user menu (profile, sign out)
- `page-header.tsx` — title, breadcrumbs, action buttons

### 2.4 Shared components — `apps/web/src/components/shared/`
- `data-table.tsx` — wraps table + pagination + empty state + loading
- `filter-bar.tsx` — horizontal filter chips/selects
- `status-badge.tsx` — maps lead status / student stage / doc status to colored badges
- `stage-badge.tsx` — student stage with display name and color
- `timeline.tsx` — vertical timeline component for event histories
- `confirm-dialog.tsx` — "Are you sure?" modal

**Done when:** Internal layout renders with sidebar, all UI primitives built, navigation works with role-based visibility.

---

## Step 3: Dashboard

### 3.1 `apps/web/src/app/(internal)/dashboard/page.tsx`
- Feature: `apps/web/src/features/dashboard/`

**Admin dashboard cards:**
- New leads today / this week
- Leads awaiting assignment
- Students by stage (horizontal bar or pipeline view)
- Overdue follow-ups (from counsellor_activity_log.next_action_due_at)
- Recent activity feed (last 10 events across system)

**Counsellor dashboard cards:**
- My assigned leads (count + "View" link)
- My assigned students (count by stage)
- Overdue follow-ups (own)
- Next actions due today

### 3.2 API hooks
- Build the operational dashboard from existing Plan 2/3 endpoints and lightweight list/count queries:
  - `useLeads({ createdAfter, createdBefore, assignedCounsellorId })`
  - `useStudents({ assignedCounsellorId, stageUpdatedBefore })`
  - `useBookings({ counsellorId, status, dateRange })`
  - `useActivities({ assignedCounsellorId, overdueOnly })`
- Detailed analytics pages remain in Plan 7 and should not block the internal dashboard.

### 3.3 Tests (component-level)
- Dashboard renders for admin role
- Dashboard renders for counsellor role (fewer cards)
- Empty states shown when no data

**Done when:** Dashboard shows relevant metrics for admin and counsellor roles, with real data from API.

---

## Step 4: Catalog CRUD UI

### 4.1 `apps/web/src/app/(internal)/catalog/` pages
- Feature: `apps/web/src/features/catalog/`

**Universities page:**
- Data table with columns: name, city, country, partner status, active, actions
- Filters: search, city, active status
- Admin: create/edit modal, deactivate toggle
- Counsellor: read-only view

**Programs page:**
- Data table: name, university, degree level, field, tuition, language, active
- Filters: university, degree level, field, tuition range, active
- Admin: create/edit form (select university from dropdown), manage intakes inline
- Counsellor: read-only

**Intakes (nested under programs):**
- Inline table within program detail/edit
- Admin: add/edit/remove intakes

**Visa Requirements page:**
- Data table: title, document type, required, country specific, stage
- Admin: create/edit modal

**Eligibility Rules page:**
- Data table: rule name, program, field, operator, value
- Admin: create/edit modal with program selector

**Campus France Prep page:**
- Data table: title, category, sort order, active
- Admin: create/edit modal with rich text for content

### 4.2 Hooks (per entity)
- `useUniversities(filters)` — list
- `useCreateUniversity()`, `useUpdateUniversity()` — mutations
- Same pattern for programs, intakes, visa-requirements, eligibility-rules, campus-france-prep

### 4.3 Tests
- CRUD operations render forms and submit
- Counsellor sees read-only view
- Filters work

**Done when:** Admin can manage all 6 catalog entities through the UI. Counsellor has read-only access.

---

## Step 5: Leads UI

### 5.1 `apps/web/src/app/(internal)/leads/page.tsx` — List
- Feature: `apps/web/src/features/leads/`
- Data table with columns: priority, qualification score, name, email, source, status, assigned counsellor, created date
- Filters: status, source, assigned counsellor, priority level, qualification range, ready-for-assignment, search
- Row click → navigate to detail
- Admin: "Import" button → CSV upload modal
- Admin: bulk selection + assign counsellor, default sorted by `p1` → `p2` → `p3`

### 5.2 `apps/web/src/app/(internal)/leads/[id]/page.tsx` — Detail
- **Profile section:** name, email, phone, source, source_partner, status, qualification score, priority level, assigned counsellor
- **Qualification block:** component scores, profile_completeness, recommended_disposition, hard-rule flags if any
- **AI Snapshot section:** latest assessment summary_for_team, scores, profile_completeness, fields_missing
- **Actions panel:**
  - Assign counsellor (admin: dropdown selector)
  - Convert to student (with confirmation dialog)
  - Disqualify (with reason textarea)
  - Trigger AI re-assessment (admin)
- **Activity log section:**
  - List of counsellor activities (calls, follow-ups)
  - "Log activity" form: type, channel, direction, outcome, summary, next action due date
- **Timeline section:** chronological event list (creation, assignments, status changes, activities, AI assessments)

### 5.3 Import modal
- CSV file upload
- Preview parsed rows (first 5)
- Column mapping validation
- Submit → shows progress (batch_id tracking)

### 5.4 Hooks
- `useLeads(filters)`, `useLead(id)`, `useLeadTimeline(id)`, `useLeadActivities(id)`
- `useLeadAiAssessments(id)`
- `useConvertLead()`, `useDisqualifyLead()`, `useAssignLead()`
- `useImportLeads()`, `useLogLeadActivity()`

### 5.5 Tests
- List renders with filters
- Detail page shows all sections
- Convert action creates student
- Disqualify requires reason
- Activity logging form submits

**Done when:** Full lead management UI works — list, detail, assign, convert, disqualify, import, activity logging.

---

## Step 6: Students UI

### 6.1 `apps/web/src/app/(internal)/students/page.tsx` — List
- Feature: `apps/web/src/features/students/`
- Data table: reference code, name, stage, visa risk, readiness score, assigned counsellor, stage updated at
- Filters: stage, assigned counsellor, visa risk, readiness range, source, search
- Stage filter with colored badges
- Row click → detail

### 6.2 `apps/web/src/app/(internal)/students/[id]/page.tsx` — Tabbed Detail
Tabs based on architecture doc:

**Overview tab:**
- Profile summary card (name, email, phone, reference code, source)
- Current stage with badge and stage_updated_at
- Scores card (academic fit, financial readiness, visa risk, overall readiness)
- Assigned counsellor with assignment date
- Quick actions: change stage, reassign, add note

**Applications tab:**
- List of applications with program name, university, status, dates
- "Create application" button → form with program/intake selector
- Status update actions per application

**Documents tab:**
- Document list with type, filename, status badge, uploaded date
- Upload button → two-step flow (get URL, upload, complete)
- Verify/reject actions (counsellor/admin)
- Requirements checklist below: type, requirement source, status, due date

**AI tab:**
- List of AI assessments sorted by date
- Each shows: source type, scores, summary_for_team, profile completeness
- Expandable raw_json for admin
- "Trigger re-assessment" button (admin)
- Gap analysis display (for imported leads): missing docs, missing fields, suggested actions, blockers

**Timeline tab:**
- Unified chronological view: stage transitions, assignments, document events, AI assessments, bookings, notes, activities
- Each entry: icon, type label, description, actor, timestamp
- Filter by event type

**Notes tab:**
- List of counsellor notes with type badge and author
- "Add note" form: type selector, content textarea

**Contacts tab:**
- Parent/guardian list
- Add/edit contact forms

**Activity tab:**
- Counsellor activity log
- "Log activity" form (same as leads)

### 6.3 Stage change modal
- Select target stage from enum
- Reason code input (predefined dropdown + custom option)
- Optional reason note
- Confirmation before submit

### 6.4 Hooks
- `useStudents(filters)`, `useStudent(id)`, `useStudentProgress(id)`
- `useStudentTimeline(id)`, `useStudentSummary(id)`
- `useStudentApplications(id)`, `useStudentDocuments(id)`
- `useStudentAiAssessments(id)`, `useStudentNotes(id)`
- `useStudentContacts(id)`, `useStudentActivities(id)`
- `useStudentConsents(id)`, `useStudentAssignments(id)`
- `useChangeStage()`, `useAssignStudent()`, `useAddNote()`, `useLogActivity()`

### 6.5 Tests
- List renders with stage badges
- Detail tabs render correctly
- Stage change creates transition
- Document verify/reject flow
- Note creation
- Activity logging

**Done when:** Full student management UI — list, tabbed detail with all 8 tabs, stage changes, document management, AI assessments, notes, timeline.

---

## Step 7: Applications UI

### 7.1 `apps/web/src/app/(internal)/applications/page.tsx`
- Feature: `apps/web/src/features/applications/`
- Admin-only global view
- Data table: student name, program, university, intake, status, submitted date, decision date
- Filters: program, university, status, intake, search

### 7.2 Application status actions
- Inline status change dropdown on each row
- Status transitions: draft → submitted → offer/rejected → enrolled

### 7.3 Hooks
- `useApplications(filters)`, `useUpdateApplication()`

**Done when:** Admin can view and manage all applications across students.

---

## Step 8: Bookings UI

### 8.1 `apps/web/src/app/(internal)/bookings/page.tsx`
- Feature: `apps/web/src/features/bookings/`
- Data table: student/lead name, counsellor, scheduled time, status
- Filters: counsellor, status, date range
- Status update actions (completed, cancelled, no_show)

### 8.2 Hooks
- `useBookings(filters)`, `useUpdateBooking()`

**Done when:** Internal team can view and manage bookings.

---

## Step 9: Shared Access Pages

### 9.1 `apps/web/src/app/(public)/auth/login/page.tsx`
- Email/password form
- "Sign in with Google" button
- On success: redirect based on role (student → portal, counsellor/admin → dashboard)

### 9.2 `apps/web/src/app/(public)/auth/invite/page.tsx`
- Invite acceptance page
- Pre-fills email from invite link
- Creates Firebase account then calls `POST /auth/accept-invite`

These are the minimum shared entry points needed for internal roles to access the workspace. Public student registration and the advisor sign-in funnel are delivered in Plan 5.

**Done when:** Login and invite acceptance work with Firebase + backend sync for internal team members.

---

## Acceptance Criteria

- [ ] Firebase auth: internal login and invite acceptance work
- [ ] API client: attaches tokens, handles errors
- [ ] Route guards: internal routes require counsellor/admin
- [ ] Internal layout: sidebar, topbar, role-aware navigation
- [ ] UI component library: all primitives built and consistent
- [ ] Dashboard: admin and counsellor views with real data
- [ ] Catalog: all 6 entities with CRUD (admin) and read-only (counsellor)
- [ ] Leads: list, detail, assign, convert, disqualify, import, activity log
- [ ] Students: list, 8-tab detail, stage change, docs, AI, notes, timeline, activities
- [ ] Applications: global list with status management
- [ ] Bookings: list with status management
- [ ] Shared access pages: login and invite acceptance
- [ ] All hooks use React Query with proper cache invalidation
- [ ] Loading and empty states throughout
- [ ] Error handling with toast notifications
