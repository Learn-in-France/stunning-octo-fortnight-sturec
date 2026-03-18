# Queues & Workers

BullMQ on Redis. Same API codebase, started in worker mode via `worker.ts`.

Current implementation status:
- 7 queues are defined in code
- 7 workers are implemented and registered
- idempotency is implemented for all current workers
- webhook ingestion is queue-backed through a dedicated `webhooks` worker
- queue visibility and retry APIs exist under `/ops/*`
- custom queue admin UI is implemented at `/automations`
- Bull Board is not mounted

## Queue Definitions

| Queue | Purpose | Concurrency | Retry | Backoff |
|-------|---------|-------------|-------|---------|
| `mautic-sync` | Push data to Mautic, trigger campaigns | 5 | 3 attempts | Exponential |
| `ai-processing` | Generate AI assessments | 3 | 2 attempts | Fixed 5s |
| `notifications` | Send emails, WhatsApp | 10 | 3 attempts | Exponential |
| `documents` | Post-upload gap detection, requirement updates | 5 | 2 attempts | Fixed 3s |
| `lead-routing` | Compute qualification/priority queue and decide assignment vs nurture | 3 | 2 attempts | Fixed 3s |
| `imports` | Bulk CSV/Excel processing | 1 | 1 attempt | Manual retry |
| `webhooks` | Durable processing of Cal.com, WhatsApp, and Mautic webhook payloads | 5 | BullMQ default | Queue retry policy |

## Triggers

### mautic-sync
Implemented today:
- lead creation
- lead conversion
- student stage change
- lead qualification / priority update from `lead-routing`

Not yet exposed as an admin HTTP trigger surface.

### ai-processing
Implemented today:
- chat session end
- university lead import batch assessment
- new lead form submission
- document-triggered reassessment enqueue path
- manual review / conversion reassessment enqueue path

Known follow-up:
- student-specific reassessment handling still needs cleanup so document/conversion jobs persist against the correct entity model end to end

### notifications
Emitted by: lead creation, counsellor assignment, stage change, document verify/reject, booking events.

### documents
Emitted by: document upload complete, document verify, document reject.

### lead-routing
Implemented today:
- emitted by `ai-processing` after lead assessment persistence
- fed by chat/import/form submission assessment flows through `ai-processing`

Logic:
- Compute final `qualification_score` (`0-100`) from AI component scores plus hard rules
- Set `priority_level`:
  - `p1` → immediate admin assignment queue
  - `p2` → follow-up soon / request more info
  - `p3` → nurture or manual review
- Update lead status:
  - `qualified` when qualification cutoff is met
  - `nurturing` otherwise
- Emit Mautic/notification side effects based on the resulting disposition
- Counsellor assignment remains admin-driven in Phase 1; the worker prioritizes, it does not auto-assign by default

### imports
Emitted by: admin bulk import endpoint. Processes rows sequentially, creates leads, handles duplicates. After each lead is successfully created, chains an `ai-processing` job for batch profile assessment and gap analysis (see AI Chat Architecture doc, "AI for University Leads" section).

### webhooks
Emitted by: verified Cal.com, WhatsApp, and Mautic webhook receivers.

Processing model:
- controller verifies provider signature/secret
- controller enqueues raw payload to the `webhooks` queue
- `webhooks` worker performs provider-specific DB mutations/logging with idempotency

### analytics rollups (derived, not a dedicated queue in Phase 1)
Admin analytics is derived from core events (`stage_transitions`, `student_assignments`, `bookings`, `documents`, `applications`) plus `counsellor_activity_log`.
Phase 1 can compute these directly in read queries. If dashboards become slow, add async rollup jobs later without changing the source-of-truth tables.

## Idempotency

Every job uses a **stable idempotency key** — not timestamp-based (timestamps would make retries and duplicate events look unique, defeating the purpose).

**Key strategy per queue:**

| Queue | Idempotency Key | Rationale |
|-------|----------------|-----------|
| `mautic-sync` | `${entity_id}:${event_type}:${triggering_action_id}` | Same stage change or qualification update produces same key |
| `ai-processing` | `${entity_type}:${entity_id}:${source_type}:${source_id}` | Works for student chat/doc reassessment and lead import batch assessment |
| `notifications` | `${recipient}:${template_key}:${triggering_action_id}` | Same stage change doesn't send duplicate emails |
| `documents` | `${document_id}:${event_type}` | Same upload or verify event produces same key |
| `lead-routing` | `${lead_id}:${assessment_id}` | Same AI assessment doesn't recompute priority / queue placement twice |
| `imports` | `${import_batch_id}:${row_index}` | Same CSV row doesn't create duplicate leads |
| `webhooks` | Provider-specific payload identity (`bookingUid:event`, `from:timestamp`, `campaign:event:lead`) | Duplicate webhook delivery does not cause duplicate side effects |

`triggering_action_id` = the ID of the mutation that caused the job (e.g., `stage_transition.id`, `ai_assessment.id`, `document.id`). This is stable across retries.

Workers check a `processed_jobs` set in Redis (TTL 24h) before executing. If key exists, job is skipped. On successful completion, key is added to the set.

Implementation note:
- `imports` uses both a batch-level idempotency guard and per-row idempotency guards
- `ai-processing` uses `${entity_type}:${entity_id}:${source_type}:${source_id}`
- `lead-routing` uses `${lead_id}:${assessment_id}`

## Monitoring

Current state:
- worker completion/failure is logged
- `notification_log` provides delivery history for notifications
- `mautic_sync_log` provides outbound Mautic history
- `/ops/queues` and related admin endpoints expose queue/job stats, pause/resume, and retry controls
- `/ops/integrations` exposes dependency/config health plus recent success/failure metadata for supported providers
- `/ops/history/notifications`, `/ops/history/mautic`, and `/ops/history/webhooks` expose paginated operator history
- `/automations` provides the admin UI for queue health, job drilldown, history, and integration status

Not yet implemented:
- Bull Board mounted at an internal admin route
- richer operator tooling such as audit trails for queue actions, single-job pause/cancel controls, and alerting/escalation flows

Analytics dashboards should clearly distinguish between system-derived events and manually logged counsellor activity.
