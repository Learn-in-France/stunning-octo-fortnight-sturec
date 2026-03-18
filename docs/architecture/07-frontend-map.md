# Frontend Map

Next.js 15 with App Router. Three product surfaces. Feature-based organization.

## Route Architecture

```
apps/web/src/app/
├── (public)/
│   ├── page.tsx                        # Homepage
│   ├── about/page.tsx
│   ├── study-in-france/page.tsx
│   ├── universities/page.tsx
│   ├── programs/page.tsx
│   ├── visa/page.tsx
│   ├── campus-france/page.tsx
│   ├── accommodation/page.tsx
│   ├── contact/page.tsx
│   ├── apply/page.tsx                  # Auth-gated lead form / advisor entry
│   ├── chat/page.tsx                   # Public chat landing with sign-in CTA (not anonymous chat)
│   ├── book/page.tsx                   # Book counselling
│   └── auth/
│       ├── login/page.tsx
│       ├── register/page.tsx
│       └── invite/page.tsx
│
├── (student)/
│   ├── layout.tsx                      # Student auth guard + nav
│   └── portal/
│       ├── page.tsx                    # Dashboard: stage, next action, checklist, apps
│       ├── analytics/page.tsx          # Student-facing progress analytics (milestones, checklist, applications)
│       ├── profile/page.tsx
│       ├── applications/page.tsx
│       ├── applications/[id]/page.tsx
│       ├── documents/page.tsx
│       ├── checklist/page.tsx          # Document requirements with upload CTAs
│       ├── chat/page.tsx               # Ongoing AI assistant
│       ├── bookings/page.tsx
│       ├── visa-readiness/page.tsx     # Student-friendly progress (no raw risk labels)
│       ├── notifications/page.tsx
│       └── support/page.tsx
│
└── (internal)/
    ├── layout.tsx                      # Internal auth guard + sidebar
    ├── dashboard/page.tsx              # Command center: new leads, overdue, stage counts
    ├── leads/page.tsx
    ├── leads/[id]/page.tsx             # Detail: profile, qualification block, AI snapshot, assignment, timeline, outreach
    ├── students/page.tsx
    ├── students/[id]/page.tsx          # Tabbed: overview, apps, docs, AI, timeline, notes, contacts, activity
    ├── applications/page.tsx
    ├── bookings/page.tsx
    ├── analytics/page.tsx              # Role-aware landing: counsellor -> pipeline, admin -> overview
    ├── analytics/pipeline/page.tsx
    ├── analytics/overview/page.tsx
    ├── analytics/counsellors/page.tsx
    ├── analytics/counsellors/[id]/page.tsx
    ├── analytics/students/page.tsx
    ├── analytics/students/[id]/page.tsx
    ├── catalog/
    │   ├── universities/page.tsx
    │   ├── programs/page.tsx
    │   ├── intakes/page.tsx
    │   ├── visa-requirements/page.tsx
    │   ├── eligibility-rules/page.tsx
    │   └── campus-france-prep/page.tsx
    ├── team/page.tsx
    ├── automations/page.tsx
    └── settings/page.tsx
```

## Layouts

### Public: top nav + CTA buttons + footer
### Student: left/top nav with progress card + quick actions + analytics/progress view
### Internal: persistent sidebar, role-aware menu, search, notifications, analytics section

## Data Fetching

- **Public pages**: server-rendered for SEO. Client components only for interactive bits (chat, forms, filters).
- **Student/internal**: authenticated app shell. Client-side data fetching with React Query. Server rendering only for initial auth/session shell.

## MVP Page Priority

### Phase 1
1. Public homepage
2. Programs page
3. Auth-gated advisor/apply entry
4. Auth (login/register/invite)
5. Internal dashboard
6. Leads list + detail
7. Students list + detail
8. Student AI chat
9. Student portal dashboard
10. Documents + checklist page
11. Student-facing analytics/progress view

### Phase 2
1. Applications pages
2. Internal analytics (pipeline + overview + counsellors + students)
3. Team page
4. Catalog CRUD pages

### Phase 3
1. Automations visibility
2. Notifications center
3. Timeline unification
4. Visa readiness UX

## 7 Most Important Screens

1. **Public homepage** — first impression, conversion entry
2. **Public programs page** — discovery, search, filters
3. **Advisor sign-in entry** — auth-gated AI-powered lead capture
4. **Internal leads list/detail** — counsellor daily workflow
5. **Internal student detail** — tabbed operational view
6. **Student portal dashboard / analytics** — student's central command
7. **Student checklist page** — drives document completion

## Role Access Map

| Surface | Visitor | Student | Counsellor | Admin |
|---------|---------|---------|------------|-------|
| Public marketing | yes | yes | yes | yes |
| Public chat landing / sign-in CTA | yes | yes | no | no |
| Student portal | no | own data | no | no |
| Internal dashboard | no | no | assigned | all |
| Catalog CRUD | no | no | read | read/write |
| Team management | no | no | no | yes |
| Pipeline analytics | no | no | yes | yes |
| Admin analytics workspace | no | no | no | yes |
| Student analytics/progress | no | own data | no | no |

Internal lead views should surface:
- priority badge (`P1`, `P2`, `P3`)
- qualification score
- profile completeness
- component score breakdown from latest AI assessment

None of these internal qualification signals should appear anywhere in the student surface.
