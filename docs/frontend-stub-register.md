# Frontend Stub Register

Every fixture-backed hook, inline-mock page, or shell page is listed here. Replace stubs domain-by-domain as Lane 1 delivers endpoints.

## Hooks

| Hook | Current | Replace With | DTO | Blocked By | Status |
|------|---------|--------------|-----|------------|--------|
| `useLeads` | live API | GET /leads | `LeadListItem` | — | live |
| `useLead` | live API | GET /leads/:id + GET /leads/:id/ai-assessments + GET /leads/:id/activities | `LeadDetail`, `AiAssessmentSummary`, `ActivityLogItem` | — | live |
| `useLeadStats` | live API | GET /analytics/overview (select leads) | `AnalyticsOverview['data']['leads']` | — | live |
| `useStudents` | live API | GET /students | `StudentListItem` | — | live |
| `useStudent` | live API | GET /students/:id | `StudentDetail` | — | live |
| `useStudentStats` | live API | GET /analytics/overview (select students) | `AnalyticsOverview['data']['students']` | — | live |
| `useAnalyticsOverview` | live API | GET /analytics/overview | `AnalyticsOverview` | — | live |
| `usePipelineMetrics` | live API | GET /analytics/pipeline | `PipelineMetrics` | — | live |
| `useCounsellorAnalytics` | live API | GET /analytics/counsellors | `CounsellorAnalyticsItem[]` | — | live |
| `useCounsellorAnalyticsDetail` | live API | GET /analytics/counsellors/:id | `CounsellorAnalyticsDetail` | — | live |
| `useStudentAnalytics` | live API | GET /analytics/students | `StudentAnalyticsItem[]` | — | live |
| `useStudentAnalyticsDetail` | live API | GET /analytics/students/:id | `StudentAnalyticsDetail` | — | live |
| `useBookings` | live API | GET /bookings | `BookingListItem` | — | live |
| `useCreateBooking` | live API | POST /bookings | `BookingListItem` | — | live |
| `useUpdateBooking` | live API | PATCH /bookings/:id | `BookingListItem` | — | live |
| `useTeamMembers` | live API | GET /team | `TeamMemberItem` | — | live |
| `useApplications` | live API | GET /applications | `ApplicationListItem` | — | live |
| `useStudentApplications` | live API | GET /students/:id/applications | `ApplicationListItem` | — | live |
| `useStudentDocuments` | live API | GET /students/:id/documents | `DocumentListItem` | — | live |
| `useStudentRequirements` | live API | GET /students/:id/document-requirements | `DocumentRequirementItem` | — | live |
| `useVerifyDocument` | live API | POST /documents/:id/verify | — | — | live |
| `useRejectDocument` | live API | POST /documents/:id/reject | — | — | live |
| `useUniversities` | live API | GET /catalog/universities | `UniversityItem` | — | live |
| `usePrograms` | live API | GET /catalog/programs | `ProgramItem` | — | live |
| `useIntakes` | live API | GET /catalog/programs/:id/intakes | `ProgramIntakeItem` | — | live (program-scoped) |
| `useVisaRequirements` | live API | GET /catalog/visa-requirements | `VisaRequirement` | — | live |
| `useEligibilityRules` | live API | GET /catalog/eligibility-rules | `EligibilityRule` | — | live |
| `useCampusFrancePreps` | live API | GET /catalog/campus-france-prep | `CampusFrancePrep` | — | live |
| `useStudentProgress` | live API | GET /students/me/progress | `StudentProgress` | — | live |
| `useStudentProfile` | live API | GET /students/me | `StudentOwnProfile` | — | live |
| `useStudentPortalApplications` | live API | GET /students/me/applications | `ApplicationListItem[]` | — | live |
| `useStudentPortalDocuments` | live API | GET /students/me/documents | `DocumentListItem[]` | — | live |
| `useStudentPortalRequirements` | live API | GET /students/me/requirements | `DocumentRequirementItem[]` | — | live |
| `useStudentPortalBookings` | live API | GET /students/me/bookings | `BookingListItem[]` | — | live |
| `useStudentPortalNotifications` | live API | GET /students/me/notifications | `NotificationItem[]` | — | live |
| `useStudentPortalApplication` | live API | GET /students/me/applications/:id | `ApplicationListItem` | — | live |
| `useUpdateProfile` | live API | PATCH /students/me | `StudentOwnProfile` | — | live |
| `useNotificationPreferences` | live API | GET /students/me/notification-preferences | `NotificationPreferences` | — | live |
| `useUpdateNotificationPreferences` | live API | PATCH /students/me/notification-preferences | `NotificationPreferences` | — | live |
| `useSubmitSupportRequest` | live API | POST /students/me/support | `SupportRequestResponse` | — | live |
| `useUserProfile` | live API | GET /users/me | `AuthUserResponse` | — | live |
| `useUpdateUserProfile` | live API | PATCH /users/me | `AuthUserResponse` | — | live |
| `useChatSessions` | live API | GET /chat/sessions | `ChatSessionItem[]` | — | live |
| `useChatMessages` | live API | GET /chat/sessions/:id/messages | `ChatMessageItem[]` | — | live |
| `useStartSession` | live API | POST /chat/sessions | `ChatSessionItem` | — | live |
| `useSendMessage` | live API | POST /chat/sessions/:id/messages | `ChatMessageResponse` | — | live |
| `useEndSession` | live API | POST /chat/sessions/:id/end | `ChatSessionItem` | — | live |
| `useDocumentUpload` | live API | POST /students/:id/documents/upload-url + complete | `UploadUrlResponse` | — | live |

## Known Gaps (cross-cutting)

| Gap | Affects | Workaround | Resolves When |
|-----|---------|------------|---------------|
| ~~Counsellor name resolution~~ | ~~`useLeads`, `useLead`, `useStudents`, `useStudent`~~ | ~~Shows "Assigned"/"Unassigned" instead of name~~ | ~~Resolved: team-cache.ts fetches GET /team, builds name map~~ |
| ~~Student detail lacks firstName/lastName~~ | ~~`useStudent`~~ | ~~`fullName` falls back to `referenceCode`~~ | ~~Resolved: Lane 1 added fields to StudentDetail~~ |

## Analytics & Dashboard Pages

| Page | Current | Replace With | DTO | Blocked By | Status |
|------|---------|--------------|-----|------------|--------|
| `/dashboard` | live (useAnalyticsOverview) | GET /analytics/overview | `AnalyticsOverview` | — | live |
| `/analytics/overview` | live (useAnalyticsOverview) | GET /analytics/overview | `AnalyticsOverview` | — | live |
| `/analytics/pipeline` | live (usePipelineMetrics) | GET /analytics/pipeline | `PipelineMetrics` | — | live |
| `/analytics/counsellors` | live (useCounsellorAnalytics) | GET /analytics/counsellors | `CounsellorAnalyticsItem[]` | — | live |
| `/analytics/counsellors/[id]` | live (useCounsellorAnalyticsDetail) | GET /analytics/counsellors/:id | `CounsellorAnalyticsDetail` | — | live |
| `/analytics/students` | live (useStudentAnalytics) | GET /analytics/students | `StudentAnalyticsItem[]` | — | live |
| `/analytics/students/[id]` | live (useStudentAnalyticsDetail) | GET /analytics/students/:id | `StudentAnalyticsDetail` | — | live |

## Student Portal Pages

| Page | Current | Replace With | DTO | Blocked By | Status |
|------|---------|--------------|-----|------------|--------|
| `(student)/layout progress card` | live (useStudentProgress) | GET /students/me/progress | `StudentProgress` | — | live |
| `/portal` | live (useStudentProgress) | GET /students/me/progress | `StudentProgress` | — | live |
| `/portal/profile` | live (useStudentProfile) | GET /students/me | `StudentOwnProfile` | — | live |
| `/portal/applications` | live (useStudentPortalApplications) | GET /students/me/applications | `ApplicationListItem[]` | — | live |
| `/portal/documents` | live (useStudentPortalDocuments) | GET /students/me/documents | `DocumentListItem[]` | — | live |
| `/portal/checklist` | live (useStudentPortalRequirements) | GET /students/me/requirements | `DocumentRequirementItem[]` | — | live |
| `/portal/analytics` | live (useStudentProgress) | GET /students/me/progress | `StudentProgress` | — | live |
| `/portal/chat` | live (useChatSessions + useSendMessage) | POST /chat/sessions + GET /chat/sessions/:id/messages + POST /chat/sessions/:id/messages + POST /chat/sessions/:id/end | `ChatSessionItem`, `ChatMessageItem`, `ChatMessageResponse` | — | live |
| `/portal/applications/[id]` | live (useStudentPortalApplication) | GET /students/me/applications/:id | `ApplicationListItem` | — | live |
| `/portal/bookings` | live (useStudentPortalBookings) | GET /students/me/bookings | `BookingListItem[]` | — | live |
| `/portal/notifications` | live (useStudentPortalNotifications) | GET /students/me/notifications | `NotificationItem[]` | — | live |
| `/portal/visa-readiness` | live (useStudentProgress + useStudentPortalRequirements) | GET /students/me/progress + GET /students/me/requirements | `StudentProgress`, `DocumentRequirementItem[]` | — | live |
| `/portal/support` | live (useSubmitSupportRequest, mailto fallback on API failure) | POST /students/me/support | `SupportRequestResponse` | — | live |

## Catalog Pages

| Page | Current | Replace With | DTO | Blocked By | Status |
|------|---------|--------------|-----|------------|--------|
| `/catalog/universities` | live (table + pagination) | GET /catalog/universities | `UniversityItem` | — | live |
| `/catalog/programs` | live (table + pagination) | GET /catalog/programs | `ProgramItem` | — | live |
| `/catalog/intakes` | live (program selector + table) | GET /catalog/programs/:id/intakes | `ProgramIntakeItem` | — | live (program-scoped) |
| `/catalog/visa-requirements` | live (table + pagination) | GET /catalog/visa-requirements | `VisaRequirement` | — | live |
| `/catalog/eligibility-rules` | live (table + pagination) | GET /catalog/eligibility-rules | `EligibilityRule` | — | live |
| `/catalog/campus-france-prep` | live (table + pagination) | GET /catalog/campus-france-prep | `CampusFrancePrep` | — | live |

## Other Shell Pages

| Page | Current | Replace With | DTO | Blocked By | Status |
|------|---------|--------------|-----|------------|--------|
| `/applications` | live (table + status filter + pagination) | GET /applications | `ApplicationListItem` | — | live |
| `/bookings` | live (table + status filter) | GET /bookings | `BookingListItem` | — | live |
| `/automations` | live (admin-only ops console: queues, job detail, retry, pause/resume, integrations, history) | `/ops/queues*` + `/ops/integrations` + `/ops/history/*` | `QueueStat`, `QueueDetail`, `JobDetail`, `IntegrationHealthResponse`, paginated history DTOs | — | live |
| `/settings` | live (admin-only account + integrations + system tabs) | GET/PATCH `/users/me` + GET `/ops/integrations` | `AuthUserResponse`, `IntegrationHealthResponse` | — | live |

## Auth

| Surface | Current | Replace With | DTO | Blocked By | Status |
|---------|---------|--------------|-----|------------|--------|
| Auth provider verify | live | POST /auth/verify | `AuthUserResponse` | Lane 1 Phase 1 | live |
| Auth invite accept | live | POST /auth/accept-invite | `AuthUserResponse` | Lane 1 Phase 1 | live |
| Auth register (student/public only) | live | POST /auth/register | `AuthUserResponse` | Lane 1 Phase 1 | live |

## Replacement Order

1. ~~catalog (Lane 1 Phase 2)~~ — done
2. ~~leads (Lane 1 Phase 2)~~ — done (list + detail + stats all live)
3. ~~students (Lane 1 Phase 2)~~ — done (list + detail + stats all live)
4. ~~team (Lane 1 Phase 2)~~ — done (live API + team-cache for counsellor name resolution)
5. ~~applications (Lane 1 Phase 2)~~ — done (global list page + student-scoped tab)
6. ~~documents (Lane 1 Phase 2)~~ — done (student detail tab with verify/reject actions)
7. ~~dashboard stats (Lane 1 Phase 3)~~ — done (useAnalyticsOverview → GET /analytics/overview)
8. ~~analytics overview + pipeline (Lane 1 Phase 3)~~ — done (live hooks)
9. ~~bookings (Lane 1 Phase 2)~~ — done (live table + status filter)
10. ~~analytics counsellors/students~~ — done (all 4 pages live)
11. ~~student portal (Lane 1 Phase 5)~~ — done (all pages live, document upload/profile edit/support wired, application detail page uses dedicated endpoint)
12. ~~student chat (Lane 1 Phase 4)~~ — done (full chat UI: sessions, messages, interactive options, end session)
