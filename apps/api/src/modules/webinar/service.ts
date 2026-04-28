import * as repo from './repository.js'
import { INTAKE_LABELS, type RsvpInput } from './schema.js'
import { sendTransactionalEmail } from '../../integrations/brevo/index.js'
import * as mautic from '../../integrations/mautic/index.js'

export interface RsvpResult {
  status: 'created' | 'duplicate'
  leadId: string
}

export async function recordRsvp(input: RsvpInput): Promise<RsvpResult> {
  const email = input.email.trim().toLowerCase()

  // Idempotency: if same email already RSVP'd to this webinar, do not duplicate.
  const existing = await repo.findRsvpByEmail(email)
  if (existing) {
    return { status: 'duplicate', leadId: existing.id }
  }

  const intakeLabel = INTAKE_LABELS[input.intake]
  const notes = [
    `[Webinar May 11 2026 RSVP — ${new Date().toISOString().slice(0, 10)}]`,
    `Intake target: ${intakeLabel}`,
    input.programme ? `Programme: ${input.programme}` : null,
    input.city ? `City: ${input.city}` : null,
    input.mauticId ? `Mautic contact: ${input.mauticId}` : null,
    `Action: counsellor follow-up post-webinar`,
  ].filter(Boolean).join('\n')

  const lead = await repo.createRsvpLead({
    email,
    firstName: input.firstName.trim(),
    lastName: input.lastName?.trim() || null,
    phone: input.phone?.trim() || null,
    source: 'university',
    sourcePartner: repo.WEBINAR_SOURCE_PARTNER,
    status: 'nurturing',
    priorityLevel: 'p2',
    notes,
  })

  // Side effects (best-effort, do not block response)
  void tagMauticContact(input.mauticId, email)
  void sendConfirmationEmail(input, intakeLabel)

  return { status: 'created', leadId: lead.id }
}

async function tagMauticContact(mauticId: number | undefined, email: string) {
  try {
    let id = mauticId
    if (!id) {
      const found = await mautic.findContactByEmail(email)
      if (!found) return
      id = found.id
    }
    await mautic.updateContact(id, { tags: ['webinar-rsvp-confirmed'] })
  } catch (err) {
    console.warn('[webinar] mautic tag failed:', err instanceof Error ? err.message : err)
  }
}

async function sendConfirmationEmail(input: RsvpInput, intakeLabel: string) {
  try {
    const firstName = input.firstName.trim().split(/\s+/)[0]
    const html = buildConfirmationHtml(firstName, intakeLabel)
    await sendTransactionalEmail({
      to: input.email,
      toName: input.firstName,
      subject: `You're in — May 11 webinar confirmed, ${firstName}`,
      htmlContent: html,
      tags: ['webinar-2026-05-11', 'rsvp-confirmation'],
    })
  } catch (err) {
    console.warn('[webinar] confirmation email failed:', err instanceof Error ? err.message : err)
  }
}

function buildConfirmationHtml(firstName: string, intakeLabel: string): string {
  return `<!doctype html>
<html><body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f6f0e5;padding:24px;color:#0a1629">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;border:1px solid rgba(10,22,41,0.08)">
  <p style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#1a3a7a;margin:0 0 8px">You're in</p>
  <h1 style="font-size:24px;margin:0 0 16px">Seat confirmed for May 11, ${firstName}.</h1>
  <p style="font-size:15px;line-height:1.55;color:#415468;margin:0 0 16px">
    Sunday, 11 May 2026 · 6:00 PM IST · 45 min + 20 min Q&amp;A · Microsoft Teams
  </p>
  <div style="background:#f6f0e5;border-radius:12px;padding:16px;margin:16px 0">
    <p style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#1a3a7a;margin:0 0 8px">What happens next</p>
    <ul style="margin:0;padding-left:20px;font-size:14px;line-height:1.6;color:#0a1629">
      <li>Microsoft Teams join link arrives 24 hours before — by email and WhatsApp</li>
      <li>A Learn in France advisor will reach out after the session to discuss your scholarship eligibility and application timeline</li>
      <li>You told us your intake plan is <strong>${intakeLabel}</strong> — we&rsquo;ll tailor our follow-up to that</li>
    </ul>
  </div>
  <p style="font-size:14px;line-height:1.55;color:#415468;margin:16px 0 8px">
    Got a question for the panel? Just reply to this email — we&rsquo;ll try to cover it on the day.
  </p>
  <p style="font-size:13px;color:#5a6d7e;margin:24px 0 0">
    Learn in France &middot; <a href="https://learninfrance.com" style="color:#1a3a7a">learninfrance.com</a>
  </p>
</div>
</body></html>`
}
