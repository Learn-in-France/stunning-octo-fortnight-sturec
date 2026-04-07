# Mautic + Brevo Email Integration Setup

## Overview

Learn in France uses Mautic as the CRM for campaign orchestration and Brevo (formerly Sendinblue) as the email delivery provider. STUREC is the source of truth — Mautic executes campaigns downstream.

## Architecture

```
STUREC (learninfrance.com)
  → Counsellor triggers campaign from student detail
  → STUREC enqueues mautic_campaign_trigger job
  → Mautic sync worker calls Mautic API
  → Mautic sends email via Brevo API
  → Delivery tracked in STUREC + Mautic
```

## Mautic Access

- **URL:** https://mautic.learninfrance.com
- **Admin:** admin / Sturec@Adm1n2026!
- **Railway URL:** https://mautic-production-4e95.up.railway.app
- **API:** Enabled with HTTP Basic Auth

## Brevo Configuration

### SMTP (blocked by Railway)
Railway blocks outbound SMTP ports (587, 465, 2525). SMTP relay cannot be used from Railway-hosted Mautic.

### API Transport (working)
Installed `symfony/brevo-mailer` v7.4.0 via composer on the Mautic Railway container.

**DSN:** `brevo+api://API_KEY@default`

**Brevo Credentials:**
- Login: a7431d001@smtp-brevo.com
- API Key: xkeysib-0f305e5c... (stored in Mautic config)
- SMTP Key: bskoE1qvlONyuQY (not used — SMTP blocked)

### Installation Steps
1. SSH into Mautic Railway container: `railway link --project mautic && railway service mautic && railway ssh`
2. Install Brevo transport: `composer require symfony/brevo-mailer`
3. Clear cache: `php bin/console cache:clear --no-interaction --env=prod`
4. In Mautic UI → Settings → Configuration → Email Settings → Email DSN:
   - Scheme: `brevo+api`
   - Host: `default`
   - User: Brevo API key
   - Password: (empty)
   - Port: (empty)
5. Set "Name to send mail as": `Learn in France`
6. Set "E-mail address to send mail from": `info@learninfrance.com`

### DKIM / Domain Authentication
- Brevo code TXT record: ✅ Verified
- DKIM 1 (CNAME `brevo1._domainkey`): ❌ Railway doesn't support multiple CNAMEs — needs Cloudflare DNS
- DKIM 2 (CNAME `brevo2._domainkey`): ❌ Same limitation
- DMARC TXT record: ✅ Added

**To complete DKIM:** Move DNS to Cloudflare (free) and add the two CNAME records. Emails will deliver without DKIM but may have lower trust scores.

## Mautic Setup — What's Configured

### Stages (13)
Mirrors the STUREC student pipeline:
| ID | Name | Weight |
|----|------|--------|
| 1 | Lead Created | 10 |
| 2 | Intake Completed | 20 |
| 3 | Qualified | 30 |
| 4 | Counsellor Consultation | 40 |
| 5 | Application Started | 50 |
| 6 | Offer Confirmed | 60 |
| 7 | Campus France Readiness | 70 |
| 8 | Visa File Readiness | 80 |
| 9 | Visa Submitted | 90 |
| 10 | Visa Decision | 100 |
| 11 | Arrival Onboarding | 110 |
| 12 | Arrived in France | 120 |
| 13 | Alumni | 130 |

### Segments (6)
| ID | Name | Purpose |
|----|------|---------|
| 1 | Phase 1 - Onboarding | New leads and intake stage |
| 2 | Phase 2 - Application | Consultation through offer |
| 3 | Phase 3 - Campus France & Visa | CF readiness through visa decision |
| 4 | Phase 4 - Pre-departure | Preparing to travel |
| 5 | Phase 5 - Arrival | Arrived in France |
| 6 | All Active Students | All pipeline students |

### Email Templates (13)
All branded with Learn in France design system (navy header, white body, red CTA, cream background).

| ID | Name | Phase | Delay |
|----|------|-------|-------|
| 1 | Welcome to Learn in France | Onboarding | 0d |
| 2 | Profile Completion Reminder | Onboarding | 2d |
| 3 | Counsellor Introduction | Onboarding | 5d |
| 4 | Application Tips | Application | 0d |
| 5 | Application Deadline Reminder | Application | 5d |
| 6 | Offer Received Congratulations | Application | 10d |
| 7 | Campus France Guide | CF & Visa | 0d |
| 8 | Visa Documents Checklist | CF & Visa | 3d |
| 9 | Visa Interview Preparation | CF & Visa | 7d |
| 10 | Pre-departure Logistics | Pre-departure | 0d |
| 11 | Housing and Banking Guide | Pre-departure | 3d |
| 12 | Welcome to France | Arrival | 0d |
| 13 | Settling In Check-in | Arrival | 14d |

### Campaigns (5)
| ID | Name | Emails | Status |
|----|------|--------|--------|
| 1 | Phase 1 - Onboarding | 3 (0d, 2d, 3d) | Published |
| 2 | Phase 2 - Application | 3 (0d, 5d, 5d) | Published |
| 3 | Phase 3 - Campus France & Visa | 3 (0d, 3d, 4d) | Published |
| 4 | Phase 4 - Pre-departure | 2 (0d, 3d) | Published |
| 5 | Phase 5 - Arrival | 2 (0d, 14d) | Published |

## STUREC Campaign Templates (Production)

13 campaign templates created in STUREC admin pointing to Mautic campaign IDs.
5 campaign packs grouping templates into phase sequences.

All configured via production API at `sturecapi-production.up.railway.app`.

## STUREC → Mautic Integration

### Contact Sync
- `apps/api/src/integrations/mautic/index.ts` — createContact, updateContact, triggerCampaign
- `apps/api/src/workers/mautic-sync.worker.ts` — processes sync queue jobs
- Contacts synced on: lead creation, student conversion, stage changes

### Campaign Triggers
- `apps/api/src/modules/campaigns/service.ts` — `mautic_campaign_trigger` delivery mode
- Passes real `mauticCampaignId` to the worker
- Worker updates `StudentCampaignStep.status` to sent/failed after Mautic API call

### Webhook Callbacks
- `apps/api/src/modules/webhooks/routes.ts` — receives Mautic campaign event callbacks
- `apps/api/src/workers/webhooks.worker.ts` — processes inbound Mautic events

## Testing

### Direct Brevo API Test (confirmed working)
```bash
curl -X POST "https://api.brevo.com/v3/smtp/email" \
  -H "api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sender": {"name": "Learn in France", "email": "info@learninfrance.com"},
    "to": [{"email": "test@example.com"}],
    "subject": "Test",
    "htmlContent": "<p>Test email</p>"
  }'
```

### Mautic Test Email
Configuration → Email Settings → Send test email button.

## Troubleshooting

- **"Connection timed out" on SMTP:** Railway blocks SMTP ports. Use `brevo+api` transport.
- **"brevo+api scheme not supported":** Run `composer require symfony/brevo-mailer` + clear cache.
- **"User is not set":** Put the API key in the User field, not Password.
- **No Mautic sync activity:** Worker service must be running on Railway.
- **DKIM failing:** Move DNS to Cloudflare to add CNAME records for `brevo1._domainkey` and `brevo2._domainkey`.
