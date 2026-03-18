# Plan 6: External Integrations

Mautic, Cal.com, WhatsApp/Sensy, email sending, webhook processing, sync logs, campaign triggers.

**Depends on:** Plans 1-5
**Blocks:** Plan 7

---

## Step 1: Mautic Integration

### 1.1 Mautic API client — `apps/api/src/integrations/mautic/index.ts`
- OAuth2 client credentials flow with MAUTIC_URL, MAUTIC_CLIENT_ID, MAUTIC_CLIENT_SECRET
- Token caching and refresh
- Export methods:
  - `createContact(data)` — POST /api/contacts/new
  - `updateContact(mauticId, data)` — PATCH /api/contacts/{id}/edit
  - `addContactToSegment(mauticId, segmentId)` — POST /api/segments/{id}/contact/{contactId}/add
  - `triggerCampaign(contactId, campaignId)` — POST /api/campaigns/{id}/contact/{contactId}/add
  - `getContact(mauticId)` — GET /api/contacts/{id}
- Error handling: rate limits, auth failures, network errors
- All methods return typed responses

### 1.2 Mautic sync module — `apps/api/src/modules/mautic/`

**POST /students/:id/mautic/sync** (admin)
- Manual sync trigger
- Emits `mautic-sync` job

**GET /students/:id/mautic/sync-log** (admin)
- Returns sync history from mautic_sync_log

**POST /students/:id/mautic/campaigns/:campaignId/trigger** (admin)
- Trigger specific Mautic campaign for this student
- Validates campaign exists in mautic_campaigns table
- Emits `mautic-sync` job with event_type=campaign_triggered

**POST /webhooks/mautic** (webhook secret verification)
- Implement the webhook receiver and processing flow in this plan:
  - Campaign completion events → log to notification_log
  - Email open/click events → update sync_log

### 1.3 Update `mautic-sync` worker
Replace placeholder from Plan 3 with real Mautic calls:

**contact_created event:**
1. Map lead/student fields to Mautic contact fields
2. Call `createContact()`
3. Store returned `mautic_contact_id` on lead/student record
4. Update sync_log: status=sent

**contact_updated event:**
1. Fetch current Mautic contact
2. Diff with local data
3. Call `updateContact()` with changed fields
4. Update sync_log

**campaign_triggered event:**
1. Verify contact exists in Mautic (create if not)
2. Call `triggerCampaign()`
3. Update sync_log

**Field mapping:**
- email → email
- first_name → firstname
- last_name → lastname
- phone → phone
- stage → custom field (student_stage)
- qualification_score → custom field (lead_qualification_score) for pre-conversion leads
- priority_level → custom field (lead_priority_level) for pre-conversion leads
- overall_readiness_score → custom field (readiness_score) for converted students
- source → custom field (lead_source)
- visa_risk → custom field (visa_risk)
- Tags: source, stage, visa_risk level, priority level

### 1.4 Auto-trigger rules
Based on architecture doc:
- Lead creation → create Mautic contact
- Lead conversion → update Mautic contact, add to "converted" segment
- Stage change → update custom field, trigger stage-specific campaign if configured
- Qualification / priority update → update custom field
- `p1` / qualified lead routing → add to "qualified" segment
- `p2` / `p3` lead routing → add to appropriate nurture segment

### 1.5 Tests
- Mautic client: contact create/update/campaign trigger (mocked HTTP)
- Worker: processes each event type, creates sync log
- Idempotency: duplicate events don't create duplicate contacts
- Webhook: valid payload processed, invalid rejected

**Done when:** Mautic sync creates/updates contacts, triggers campaigns, logs all sync activity.

---

## Step 2: Cal.com Integration

### 2.1 Cal.com API client — `apps/api/src/integrations/calcom/index.ts`
- API key auth with CALCOM_API_KEY
- Export methods:
  - `createBooking(data)` — create a Cal.com booking event
  - `getBooking(eventId)` — get booking details
  - `cancelBooking(eventId, reason?)` — cancel event
  - `listAvailability(userId, dateRange)` — check counsellor availability
- Error handling and retry logic

### 2.2 Webhook processing
- Implement `POST /webhooks/calcom` verification, enqueueing, and processing in this plan:

**BOOKING_CREATED event:**
1. Extract booking details from webhook payload
2. Match to lead/student by email
3. Create or update booking record in PG
4. Set calcom_event_id
5. Emit `notifications` job (booking confirmation)

**BOOKING_RESCHEDULED event:**
1. Find booking by calcom_event_id
2. Update scheduled_at
3. Emit `notifications` job

**BOOKING_CANCELLED event:**
1. Find booking by calcom_event_id
2. Set status=cancelled
3. Emit `notifications` job

**MEETING_ENDED event:**
1. Find booking by calcom_event_id
2. Set status=completed

### 2.3 Booking creation flow (authenticated)
Update `POST /bookings` from Plan 3:
1. Create local booking record
2. Call Cal.com API to create event
3. Store calcom_event_id
4. Return booking with event details

### 2.4 Public booking flow
- `apps/web/src/app/(public)/book/page.tsx` redirects to or embeds Cal.com with pre-filled metadata when available
- Webhook handles the rest

### 2.5 Tests
- Cal.com client: create/cancel/get booking (mocked HTTP)
- Webhook events: each type creates/updates correct booking record
- Authenticated booking: creates local record + Cal.com event
- Public booking: webhook creates booking from scratch

**Done when:** Bookings sync bidirectionally with Cal.com, webhooks process correctly.

---

## Step 3: WhatsApp / Sensy Integration

### 3.1 WhatsApp API client — `apps/api/src/integrations/whatsapp/index.ts`
- Support both WhatsApp Business API and Sensy.ai
- Config: WHATSAPP_PROVIDER (whatsapp_api | sensy), WHATSAPP_API_KEY, WHATSAPP_API_URL
- Export methods:
  - `sendMessage(to, templateKey, params)` — send template message
  - `sendFreeformMessage(to, text)` — send text message
- Template mapping for notifications

### 3.2 Webhook processing
- Implement `POST /webhooks/whatsapp` verification, enqueueing, and inbound processing in this plan:
  - Log to notification_log with channel=whatsapp, direction=inbound
  - If message from known student/lead phone → update last contact timestamp
  - For Phase 1: log only, no auto-reply (counsellor handles manually)

### 3.3 Tests
- Send message: correct API call (mocked)
- Webhook: inbound message logged
- Provider abstraction: switch between WhatsApp API and Sensy.ai

**Done when:** WhatsApp messages can be sent via templates, inbound messages logged.

---

## Step 4: Email Integration

### 4.1 Email sender — `apps/api/src/integrations/email/index.ts`
- Provider-agnostic: support Resend, SES, or SMTP
- Config: EMAIL_PROVIDER, EMAIL_API_KEY, EMAIL_FROM
- Export methods:
  - `sendEmail(to, subject, htmlBody, textBody?)` — send single email
  - `sendTemplateEmail(to, templateKey, params)` — send from template
- Template rendering: simple variable substitution

### 4.2 Email templates — `apps/api/src/integrations/email/templates/`
- `team-invite.ts` — "You've been invited to STUREC"
- `counsellor-assignment.ts` — "New lead/student assigned to you"
- `document-verified.ts` — "Your document has been verified"
- `document-rejected.ts` — "Your document needs resubmission"
- `stage-change.ts` — "Your application status has been updated"
- `booking-confirmation.ts` — "Your counselling session is confirmed"
- `booking-cancelled.ts` — "Your session has been cancelled"
- Each template: subject, HTML body with variables, plain text fallback

### 4.3 Tests
- Email sent with correct template and params (mocked)
- Template rendering with variable substitution

**Done when:** Email sending works with templates, supports multiple providers.

---

## Step 5: Update Notifications Worker

### 5.1 Real notification sending
Update `notifications` worker from Plan 3:

1. Determine channel from notification type:
   - Stage changes → email (always) + WhatsApp (if consent)
   - Document events → email
   - Booking events → email + WhatsApp (if consent)
   - Team invites → email
   - Counsellor assignments → email (to counsellor)

2. For each channel:
   - Check consent (for student WhatsApp)
   - Call appropriate integration (email/whatsapp)
   - Update notification_log with sent status
   - On failure: update with error, mark for retry

3. Template key → template content mapping

### 5.2 Notification preferences
- Respect student consent flags (whatsapp_consent, email_consent)
- Internal notifications (to counsellors/admins): always email

### 5.3 Notification history endpoint
- Implement `GET /students/:id/notifications`
- Student sees own notification history only
- Counsellor/admin can view for operational debugging
- Response sourced from `notification_log`, newest first, filterable by channel and status

### 5.4 Tests
- Notification sent via correct channel
- Consent respected (no WhatsApp without consent)
- Failure logged and retried
- Idempotency maintained
- Notification history endpoint enforces RBAC and returns correct records

**Done when:** Notifications send real emails and WhatsApp messages based on event type and consent.

---

## Step 6: Sync Reliability

### 6.1 Mautic sync monitoring
- `GET /students/:id/mautic/sync-log` shows full history with status
- Current state: sync history is persisted in `mautic_sync_log`
- Current state: queue/job visibility and retry controls are available through the custom admin ops console (`/automations`) backed by `/ops/*`
- Payload hash prevents duplicate processing on retry

### 6.2 Webhook audit logging
- All webhook payloads stored in structured log with timestamp, provider, status
- Duplicate detection: payload hash check before processing

### 6.3 Integration health checks
- Add to `GET /health`:
  - Mautic: test OAuth token refresh
  - Redis: ping
  - Postgres: simple query
- These are internal health indicators, not exposed publicly

### 6.4 Tests
- Failed sync retries correctly
- Duplicate webhook payloads are idempotent
- Health check reports integration status

**Done when:** All integrations have retry logic, audit logging, and health visibility.

---

## Acceptance Criteria

- [ ] Mautic: contacts created/updated, campaigns triggered, sync log maintained
- [ ] Mautic: field mapping covers all relevant lead/student fields
- [ ] Mautic: auto-trigger rules fire on lead creation, conversion, stage change, qualification / priority update
- [ ] Cal.com: bookings created via API, webhook events processed (created, rescheduled, cancelled, completed)
- [ ] Cal.com: public booking flow via redirect + webhook
- [ ] WhatsApp: template messages sent, inbound messages logged
- [ ] Email: template-based sending with multiple provider support
- [x] Ops/admin visibility: queue/job monitoring and retry controls available through custom `/automations` UI backed by `/ops/*`
- [ ] Notifications worker: sends real emails/WhatsApp, respects consent, logs status
- [ ] Notification history endpoint: student and internal reads work with RBAC
- [ ] All webhooks: signature verification, idempotent processing, audit logging
- [ ] Sync reliability: retry logic, failure visibility, duplicate protection
- [ ] Health check: reports integration status
- [ ] All integration HTTP calls mocked in tests
- [ ] All tests pass
