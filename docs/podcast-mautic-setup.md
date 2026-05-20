# Podcast — Mautic setup

Steps to wire the `/podcast` page into Mautic for engagement tracking, email
capture, and downstream automation.

## 1. Environment variables — ALREADY SET on Railway (2026-05-19)

```
NEXT_PUBLIC_MAUTIC_URL=https://mautic.learninfrance.com
NEXT_PUBLIC_MAUTIC_PODCAST_FORM_ID=3
```

Locally add the same two lines to `apps/web/.env.local` for parity.

## 2. Mautic form — ALREADY CREATED via API (id = 3)

- **Form id**: 3
- **Alias**: `podcast_subscriber`
- **Fields**: `email` (required), `origin_episode` (hidden)
- **Actions on submit**: adds tag `podcast-subscriber` (id 12), +10 points

The email gate (`apps/web/src/app/(public)/podcast/email-gate.tsx`) posts to:
`POST https://mautic.learninfrance.com/form/submit?formId=3`

## 3. Mautic segments — ALREADY CREATED via API (2026-05-19)

Built from the custom-pageview URLs that the `<EpisodePlayer>` fires.

| Segment id | Name                          | Filter                                                |
|-----------|-------------------------------|--------------------------------------------------------|
| **10**    | `Podcast — listener`          | hit_url LIKE `%/podcast/%`                            |
| **11**    | `Podcast — engaged (≥30s)`    | hit_url LIKE `%/podcast/%/engaged%`                   |
| **12**    | `Podcast — completed (≥75%)`  | hit_url LIKE `%/podcast/%/completed%`                 |
| **13**    | `Podcast — subscriber`        | Tag IN [12] (the `podcast-subscriber` tag)            |

How the events arrive: the player calls `sendMauticEvent('/podcast/<slug>/<event>')`
which fires a Mautic pageview. Segment filters then match on those virtual URLs.

## 4. Mautic campaigns — BUILD MANUALLY in the UI (10 min each)

The campaign-events API is fragile — Mautic's drag-and-drop builder generates
the right event graph. Build these two campaigns in
`mautic.learninfrance.com → Campaigns → New`.

### Campaign A — Engaged → WhatsApp + counsellor ping
- **Trigger**: contact joins segment `Podcast — engaged (≥30s)`
- **Step 1**: Wait 15 minutes (avoid duplicate-fires from one session)
- **Step 2**: Send WhatsApp via the existing Sturec WhatsApp queue (POST to
  `https://api.learninfrance.com/api/v1/integrations/whatsapp/queue`)
  - Template: `podcast_engaged_followup` (to be created in WhatsApp Business)
- **Step 3**: Decision — if the same contact then joins `Podcast — completed`
  within 24 h, move them to Campaign B.

### Campaign B — Completed → call queue
- **Trigger**: contact joins segment `Podcast — completed`
- **Step 1**: Add tag `call-queue` (Sturec's mautic-sync.worker syncs this back
  to the Sturec lead and the counsellor dashboard shows it)
- **Step 2**: Email the counsellor team a one-line summary of which episode the
  contact completed.

## 5. Pre-filled emails from existing Mautic email campaigns

When you send the next Mautic email to existing contacts, point the CTA at:

```
https://learninfrance.com/podcast?mtc={contactfield=id}&utm_source=mautic&utm_campaign=podcast-launch
```

The `?mtc={id}` param does two things on the page:
1. **Identifies the visitor** to the Mautic tracker so all engagement events
   attribute to the right contact.
2. **Skips the email gate entirely** — the gate's `onUnlock` fires immediately
   when `mtc` is present.

## 6. Sanity check before launch

- [ ] Visit `/podcast` in an incognito window. EP 1 plays without gate.
- [ ] Click EP 2 — email gate shows. Submit. Page unlocks. Refresh — gate
      stays dismissed (cookie persisted).
- [ ] Visit `/podcast?mtc=999` — no gate appears on any episode.
- [ ] Watch EP 1 for 35 seconds. Check Mautic → Contacts → your test contact
      → Timeline. You should see pageviews for `/podcast/.../started` and
      `/podcast/.../engaged`.
- [ ] Test contact lands in the `Podcast — engaged` segment within a minute.
