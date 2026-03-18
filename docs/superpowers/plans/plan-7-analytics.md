# Plan 7: Analytics

Pipeline, counsellor, student analytics, dashboards, student-facing progress, KPI definitions.

**Depends on:** Plans 2-6
**Blocks:** nothing

---

## Step 1: Analytics Module — Backend

### 1.1 `apps/api/src/modules/analytics/`
Module pattern: routes, controller, service, repository, schema, types.

All endpoints support `?from=YYYY-MM-DD&to=YYYY-MM-DD` date range filters.
Response shape: `{ data: {...}, period: { from, to } }`.

### 1.2 Overview endpoint — `GET /analytics/overview` (admin)
Executive dashboard data:

**Funnel metrics:**
- Total leads by status (new, nurturing, qualified, disqualified, converted)
- Lead creation volume by period (daily/weekly/monthly breakdown)
- Conversion rate: leads converted / total leads (by source)
- Lead qualification distribution by band (`80-100`, `60-79`, `<60`)
- Lead priority queue size by `p1`, `p2`, `p3`

**Pipeline health:**
- Students by stage (count per stage, for pipeline visualization)
- Average time-in-stage per stage
- Stalled students: students where `stage_updated_at` > threshold (e.g., 14 days same stage)

**Volume metrics:**
- New leads this period
- New students this period
- Applications submitted this period
- Documents uploaded/verified/rejected this period

**Overdue work:**
- Leads awaiting assignment (status=new, no assigned_counsellor_id)
- Unassigned `p1` leads
- Counsellor follow-ups overdue (counsellor_activity_log.next_action_due_at < now)
- Documents pending review (status=pending, uploaded > 48h ago)

**SLA metrics:**
- Average time from lead creation to first counsellor contact
- Average time from lead creation to conversion
- Average time from application to decision

### 1.3 Pipeline endpoint — `GET /analytics/pipeline` (counsellor/admin)
- Students by stage: count + list of student ids per stage
- Lead funnel: new → nurturing → qualified → converted with drop-off rates
- Lead priority queue: `p1`, `p2`, `p3` counts and assignment backlog
- For counsellor: filtered to own assigned students/leads
- For admin: all data

### 1.4 Counsellor analytics

**GET /analytics/counsellors** (admin)
Counsellor performance list:
- `counsellor_id`, name
- `active_leads_count` — assigned leads not converted/disqualified
- `active_students_count` — assigned students not alumni
- `first_response_time_avg` — time from lead assignment to first counsellor_activity_log entry for that lead
- `follow_up_cadence_avg` — average days between counsellor_activity_log entries per student/lead
- `logged_activities_count` — total activities in period, broken down by type
- `consultation_completion_rate` — students who reached counsellor_consultation stage / assigned students
- `conversion_rate` — leads converted / leads assigned
- `stage_progression_rate` — average stages advanced per student in period
- `overdue_next_actions_count` — counsellor_activity_log.next_action_due_at < now

**GET /analytics/counsellors/:id** (admin)
Single counsellor detail:
- All metrics from list view
- Activity timeline: recent activity_log entries
- Caseload breakdown: students by stage
- Lead pipeline: leads by status
- Response metrics: time distributions

### 1.5 Student analytics

**GET /analytics/students** (admin)
Student progression list:
- Student id, name, reference_code
- Current stage, days_in_current_stage
- Document checklist: completed/total count
- Application count and offer count
- Visa milestone progress (which visa stages completed)
- Last counsellor touchpoint (most recent counsellor_activity_log)
- Stalled risk indicator: true if no stage change or activity in > 14 days

**GET /analytics/students/:id** (admin)
Single student progress detail:
- Full stage history with timestamps and duration per stage
- Document completion timeline
- Application status history
- AI assessment score trend over time
- Counsellor interaction frequency
- Milestone achievement dates

### 1.6 Response time — `GET /analytics/response-time` (admin)
- Average first-response time by lead source
- Distribution: < 1hr, 1-4hr, 4-24hr, > 24hr
- Trend over time

### 1.7 Conversion analytics — `GET /analytics/conversion` (admin)
- Marketing lead conversion rate vs university lead conversion rate
- Conversion rate by source (marketing, university, referral, whatsapp, ads, manual)
- Average time to conversion by source
- Drop-off points: which status leads get stuck at

### 1.8 KPI dashboard — `GET /analytics/kpi` (admin)
Full KPI export:
- All metrics from overview, pipeline, response time, conversion
- Formatted for dashboard consumption
- Can also be exported as CSV/JSON

### 1.9 Validation schemas
- `packages/shared/src/validation/analytics.ts`:
  - analyticsDateRangeSchema ({ from, to })
  - Each endpoint's response schema

---

## Step 2: Analytics Repository

### 2.1 `apps/api/src/modules/analytics/repository.ts`
All analytics queries in one repository. Phase 1 computes from source tables directly (no rollup tables).

**Key queries:**

```
-- Students by stage
SELECT stage, COUNT(*) FROM students WHERE deleted_at IS NULL GROUP BY stage

-- Average time in stage
SELECT to_stage, AVG(EXTRACT(EPOCH FROM (next_transition.timestamp - st.timestamp)))
FROM stage_transitions st
LEFT JOIN LATERAL (
  SELECT timestamp FROM stage_transitions
  WHERE student_id = st.student_id AND timestamp > st.timestamp
  ORDER BY timestamp LIMIT 1
) next_transition ON true
GROUP BY to_stage

-- Stalled students
SELECT * FROM students
WHERE stage_updated_at < NOW() - INTERVAL '14 days'
AND stage NOT IN ('alumni', 'arrived_france')
AND deleted_at IS NULL

-- Counsellor first response time
SELECT sa.counsellor_id,
  AVG(EXTRACT(EPOCH FROM (MIN(cal.created_at) - sa.assigned_at)))
FROM student_assignments sa
JOIN counsellor_activity_log cal ON cal.counsellor_id = sa.counsellor_id
  AND (cal.student_id = sa.student_id OR cal.lead_id IN (...))
GROUP BY sa.counsellor_id

-- Lead conversion by source
SELECT source,
  COUNT(*) FILTER (WHERE status = 'converted') AS converted,
  COUNT(*) AS total
FROM leads WHERE deleted_at IS NULL
GROUP BY source
```

### 2.2 Performance considerations
- Add database indexes for analytics queries:
  - `students(stage, deleted_at)` — stage counts
  - `students(assigned_counsellor_id, stage)` — counsellor caseload
  - `students(stage_updated_at)` — stalled detection
  - `stage_transitions(student_id, timestamp)` — time in stage
  - `counsellor_activity_log(counsellor_id, created_at)` — activity metrics
  - `leads(source, status, deleted_at)` — conversion rates
  - `documents(student_id, status)` — checklist metrics
- If queries become slow (Phase 2): add async rollup jobs and materialized views

---

## Step 3: Internal Analytics Frontend

### 3.1 Analytics landing — `apps/web/src/app/(internal)/analytics/page.tsx`
- Role-aware redirect:
  - Counsellor → pipeline page
  - Admin → overview page

### 3.2 Overview page — `apps/web/src/app/(internal)/analytics/overview/page.tsx`
- Feature: `apps/web/src/features/analytics/`
- Admin only

**Charts/cards:**
- Funnel visualization: leads by status (horizontal bar or funnel chart)
- Pipeline: students by stage (stacked bar or pipeline view)
- Volume trend: leads/students/applications over time (line chart)
- Stalled students: count card with link to filtered student list
- Overdue work: summary cards (unassigned leads, overdue follow-ups, pending docs)
- SLA metrics: average times with trend indicators

### 3.3 Pipeline page — `apps/web/src/app/(internal)/analytics/pipeline/page.tsx`
- Counsellor and admin
- Stage pipeline visualization (kanban-style or horizontal bar)
- Click a stage → filtered student list
- Lead funnel with conversion rates between stages
- For counsellor: own pipeline only

### 3.4 Counsellors page — `apps/web/src/app/(internal)/analytics/counsellors/page.tsx`
- Admin only
- Performance table: each counsellor row with key metrics
- Sortable by any metric
- Color-coded: green (on track), yellow (attention), red (overdue)

### 3.5 Counsellor detail — `apps/web/src/app/(internal)/analytics/counsellors/[id]/page.tsx`
- Admin only
- KPI cards: caseload, response time, conversion rate, activity volume
- Activity timeline chart (activity count by day/week)
- Caseload breakdown: students by stage (pie or bar chart)
- Lead pipeline: leads by status
- Recent activity log entries

### 3.6 Students analytics — `apps/web/src/app/(internal)/analytics/students/page.tsx`
- Admin only
- Student progression table: each student with stage, days in stage, doc completion, stalled risk
- Sortable, filterable
- Risk indicators: red badge for stalled students

### 3.7 Student analytics detail — `apps/web/src/app/(internal)/analytics/students/[id]/page.tsx`
- Admin only
- Stage history timeline with durations
- Score trend over time (if multiple assessments)
- Document completion progress
- Application statuses
- Counsellor interaction log

### 3.8 Charting library
- Use a lightweight charting library (recharts, or chart.js via react-chartjs-2)
- Chart components:
  - `bar-chart.tsx` — horizontal/vertical bars
  - `line-chart.tsx` — time series
  - `funnel-chart.tsx` — conversion funnel
  - `pie-chart.tsx` — distribution
  - `pipeline-view.tsx` — stage-based pipeline visualization

### 3.9 Hooks
- `useOverview(dateRange)`, `usePipeline(dateRange)`
- `useCounsellorAnalytics(dateRange)`, `useCounsellorDetail(id, dateRange)`
- `useStudentAnalytics(dateRange)`, `useStudentAnalyticsDetail(id, dateRange)`
- `useResponseTime(dateRange)`, `useConversion(dateRange)`, `useKpi(dateRange)`

---

## Step 4: Update Student Portal Progress

### 4.1 Enhanced student progress — `apps/web/src/app/(student)/analytics/page.tsx`
Already created in Plan 5, now enrich with real analytics data:

- **Stage timeline:** visual journey through 13 stages with completed dates and current position
- **Milestones achieved:** list with dates
- **Document progress:** visual bar + list of requirements with status
- **Application tracker:** each application with status and university
- **Next recommended actions:** from AI assessment + checklist gaps
- **Time tracker:** how long in current stage and key milestone dates from the student's own journey

### 4.2 No sensitive internal data
- No visa_risk raw labels
- No counsellor performance data
- No other students' data
- No peer comparisons or cohort benchmarking in MVP
- Only own progress and actions

**Done when:** Student sees a comprehensive, encouraging progress view.

---

## Step 5: Date Range Controls & Export

### 5.1 Date range picker component
- `apps/web/src/components/shared/date-range-picker.tsx`
- Presets: Last 7 days, Last 30 days, Last 90 days, This month, Last month, Custom range
- Used on all analytics pages
- Updates URL query params for shareable links

### 5.2 Export functionality
- Admin can export KPI data as CSV
- `GET /analytics/kpi?format=csv` → returns CSV download
- Frontend: "Export" button on overview page

---

## Step 6: Tests

### 6.1 Backend analytics tests
- Overview endpoint: returns correct funnel counts
- Pipeline: students grouped by stage correctly
- Counsellor analytics: metrics calculated correctly
- Student analytics: stalled detection works
- Response time: correct calculation from activity logs
- Conversion: correct rates by source
- Date range filtering works
- Counsellor role sees only own pipeline data
- Admin sees all data

### 6.2 Frontend analytics tests
- Overview page renders charts with data
- Pipeline visualization shows stages
- Counsellor table renders and sorts
- Date range picker updates queries
- Role-based redirect works

**Done when:** All analytics endpoints return correct metrics, frontend renders charts, role-based access enforced.

---

## Acceptance Criteria

- [ ] Overview: funnel, pipeline, volume, stalled, overdue, SLA metrics
- [ ] Pipeline: stage visualization, lead funnel, role-filtered
- [ ] Counsellor analytics: performance list with all KPIs (caseload, response time, activity, conversion)
- [ ] Counsellor detail: activity timeline, caseload breakdown, recent activity
- [ ] Student analytics: progression list with stage, docs, stalled risk
- [ ] Student detail: stage history, score trend, doc progress, interactions
- [ ] Response time: by source, distribution, trend
- [ ] Conversion: by source, marketing vs university, drop-off points
- [ ] KPI endpoint: aggregated export with CSV option
- [ ] Date range filtering on all analytics endpoints
- [ ] Charts: bar, line, funnel, pie, pipeline visualization
- [ ] Student portal progress: enhanced with real analytics, no sensitive data
- [ ] Role access: admin sees all, counsellor sees own pipeline, student sees own progress
- [ ] Analytics queries perform adequately on seed data (indexes in place)
- [ ] All tests pass
