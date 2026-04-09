/**
 * In-code transactional email template registry.
 *
 * Notifications worker dispatches emails by a semantic `templateKey`
 * (e.g. 'booking_created', 'stage_changed'). Each key maps to a
 * render function that returns { subject, html, text } given the
 * notification data payload plus the recipient's first name. Unknown
 * keys fall back to a generic notification shell so a missing
 * registration never loses an email — it just looks generic.
 *
 * Every template uses the same branded wrapper:
 *   - navy header strip with "LEARN IN FRANCE"
 *   - cream body
 *   - optional red CTA button
 *   - small footer
 *
 * Keep templates short, clear, and never push urgency.
 */

export interface EmailRenderResult {
  subject: string
  html: string
  text: string
}

export interface EmailRenderContext {
  recipientFirstName: string
  data: Record<string, unknown>
}

type TemplateRenderer = (ctx: EmailRenderContext) => EmailRenderResult

// ─── Branded shell ───────────────────────────────────────────

function shell(args: {
  preheader: string
  heading: string
  bodyHtml: string
  ctaLabel?: string
  ctaUrl?: string
}): string {
  const cta =
    args.ctaLabel && args.ctaUrl
      ? `<div style="margin:32px 0 8px 0;">
           <a href="${escapeAttr(args.ctaUrl)}"
              style="display:inline-block;background:#c8102e;color:#ffffff;
                     text-decoration:none;padding:12px 24px;border-radius:999px;
                     font-family:Georgia,serif;font-size:14px;font-weight:600;
                     letter-spacing:0.01em;">
             ${escapeHtml(args.ctaLabel)}
           </a>
         </div>`
      : ''

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${escapeHtml(args.heading)}</title>
  </head>
  <body style="margin:0;padding:0;background:#faf6ee;font-family:Georgia,'Times New Roman',serif;color:#0a1629;">
    <div style="display:none;opacity:0;max-height:0;overflow:hidden;">${escapeHtml(args.preheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#faf6ee;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="520" cellspacing="0" cellpadding="0"
                 style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;
                        box-shadow:0 20px 60px rgba(10,22,41,0.08);">
            <tr>
              <td style="background:#0a1629;padding:20px 28px;color:#ffffff;
                         font-family:Georgia,serif;letter-spacing:0.08em;">
                <span style="font-size:18px;font-weight:700;">L</span><span style="font-size:18px;font-weight:700;color:#c8102e;">I</span><span style="font-size:18px;font-weight:700;">F</span>
                <span style="display:inline-block;margin-left:10px;font-size:11px;text-transform:uppercase;letter-spacing:0.18em;color:rgba(255,255,255,0.7);">
                  Learn in <span style="color:#c8102e;">France</span>
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 28px 8px 28px;">
                <h1 style="margin:0;font-family:Georgia,serif;font-size:22px;font-weight:700;color:#0a1629;">
                  ${escapeHtml(args.heading)}
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 28px 28px 28px;font-size:14px;line-height:22px;color:#334155;">
                ${args.bodyHtml}
                ${cta}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px;background:#faf6ee;font-size:11px;color:#94a3b8;text-align:center;">
                You're receiving this because you have a Learn in France account.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function escapeHtml(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeAttr(v: unknown): string {
  return escapeHtml(v)
}

function plainText(lines: string[]): string {
  return lines.filter(Boolean).join('\n')
}

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback
}

// ─── Template registry ───────────────────────────────────────

const templates: Record<string, TemplateRenderer> = {
  team_invite: ({ recipientFirstName, data }) => {
    const inviteUrl = str(data.inviteUrl, 'https://learninfrance.com/auth/invite')
    const inviterName = str(data.inviterName, 'The Learn in France team')
    const heading = 'You have been invited to Learn in France'
    const body = `
      <p>Hi ${escapeHtml(recipientFirstName) || 'there'},</p>
      <p>${escapeHtml(inviterName)} has invited you to join the Learn in France
         internal workspace. Click the button below to set up your account.</p>
      <p style="font-size:12px;color:#94a3b8;">This link expires in 7 days.</p>
    `
    return {
      subject: 'You have been invited to Learn in France',
      html: shell({
        preheader: 'Accept your invitation to Learn in France',
        heading,
        bodyHtml: body,
        ctaLabel: 'Accept invitation',
        ctaUrl: inviteUrl,
      }),
      text: plainText([
        `Hi ${recipientFirstName || 'there'},`,
        '',
        `${inviterName} has invited you to join the Learn in France workspace.`,
        '',
        `Accept your invitation: ${inviteUrl}`,
        '',
        'This link expires in 7 days.',
      ]),
    }
  },

  booking_created: ({ recipientFirstName, data }) => {
    const scheduledAt = str(data.scheduledAt, 'the scheduled time')
    const heading = 'Your counsellor session is booked'
    const body = `
      <p>Hi ${escapeHtml(recipientFirstName) || 'there'},</p>
      <p>Your counsellor session is confirmed for <strong>${escapeHtml(scheduledAt)}</strong>.</p>
      <p>We'll send a reminder before the session. If you need to reschedule,
         log in to your portal.</p>
    `
    return {
      subject: 'Your counsellor session is booked',
      html: shell({
        preheader: `Session confirmed for ${scheduledAt}`,
        heading,
        bodyHtml: body,
        ctaLabel: 'Open your portal',
        ctaUrl: str(data.portalUrl, 'https://learninfrance.com/portal'),
      }),
      text: plainText([
        `Hi ${recipientFirstName || 'there'},`,
        '',
        `Your counsellor session is confirmed for ${scheduledAt}.`,
        '',
        'We will send a reminder before the session. If you need to',
        'reschedule, log in to your portal.',
      ]),
    }
  },

  stage_changed: ({ recipientFirstName, data }) => {
    const toStage = str(data.toStage, 'a new stage')
    const heading = 'Your application progressed'
    const body = `
      <p>Hi ${escapeHtml(recipientFirstName) || 'there'},</p>
      <p>Your application has moved to <strong>${escapeHtml(toStage)}</strong>.
         Log in to your portal to see what happens next.</p>
    `
    return {
      subject: 'Your application progressed',
      html: shell({
        preheader: `Now at: ${toStage}`,
        heading,
        bodyHtml: body,
        ctaLabel: 'Open your portal',
        ctaUrl: str(data.portalUrl, 'https://learninfrance.com/portal'),
      }),
      text: plainText([
        `Hi ${recipientFirstName || 'there'},`,
        '',
        `Your application has moved to ${toStage}.`,
        'Log in to your portal to see what happens next.',
      ]),
    }
  },

  document_verified: ({ recipientFirstName, data }) => {
    const docType = str(data.documentType, 'a document')
    return {
      subject: 'A document was verified',
      html: shell({
        preheader: 'Document verified',
        heading: 'A document was verified',
        bodyHtml: `
          <p>Hi ${escapeHtml(recipientFirstName) || 'there'},</p>
          <p>Your <strong>${escapeHtml(docType)}</strong> has been verified.</p>
        `,
        ctaLabel: 'View in portal',
        ctaUrl: str(data.portalUrl, 'https://learninfrance.com/portal/documents'),
      }),
      text: plainText([
        `Hi ${recipientFirstName || 'there'},`,
        '',
        `Your ${docType} has been verified.`,
      ]),
    }
  },

  document_rejected: ({ recipientFirstName, data }) => {
    const docType = str(data.documentType, 'a document')
    const reason = str(data.reason, 'Please check the portal for details.')
    return {
      subject: 'A document needs another look',
      html: shell({
        preheader: 'Document needs another look',
        heading: 'A document needs another look',
        bodyHtml: `
          <p>Hi ${escapeHtml(recipientFirstName) || 'there'},</p>
          <p>Your <strong>${escapeHtml(docType)}</strong> was not accepted.</p>
          <p><em>${escapeHtml(reason)}</em></p>
        `,
        ctaLabel: 'Upload again',
        ctaUrl: str(data.portalUrl, 'https://learninfrance.com/portal/documents'),
      }),
      text: plainText([
        `Hi ${recipientFirstName || 'there'},`,
        '',
        `Your ${docType} was not accepted.`,
        reason,
      ]),
    }
  },

  student_assigned: ({ recipientFirstName, data }) => {
    const studentName = str(data.studentName, 'a new student')
    return {
      subject: `New student assigned: ${studentName}`,
      html: shell({
        preheader: `${studentName} has been assigned to you`,
        heading: 'New student assigned',
        bodyHtml: `
          <p>Hi ${escapeHtml(recipientFirstName) || 'there'},</p>
          <p><strong>${escapeHtml(studentName)}</strong> has been assigned to you.</p>
        `,
        ctaLabel: 'Open student',
        ctaUrl: str(data.studentUrl, 'https://learninfrance.com/students'),
      }),
      text: plainText([
        `Hi ${recipientFirstName || 'there'},`,
        '',
        `${studentName} has been assigned to you.`,
      ]),
    }
  },

  support_request: ({ recipientFirstName, data }) => {
    const subjectLine = str(data.subject, 'New support request')
    const message = str(data.message, '')
    return {
      subject: `Support request: ${subjectLine}`,
      html: shell({
        preheader: 'New support request',
        heading: 'New support request',
        bodyHtml: `
          <p>Hi ${escapeHtml(recipientFirstName) || 'there'},</p>
          <p><strong>${escapeHtml(subjectLine)}</strong></p>
          <p>${escapeHtml(message)}</p>
        `,
      }),
      text: plainText([
        `Hi ${recipientFirstName || 'there'},`,
        '',
        subjectLine,
        '',
        message,
      ]),
    }
  },
}

// ─── Public renderer ─────────────────────────────────────────

/**
 * Render a transactional email for a given semantic templateKey.
 * Unknown keys fall back to a generic notification shell so the
 * queue keeps flowing — the recipient still gets something useful.
 */
export function renderEmailTemplate(
  templateKey: string,
  ctx: EmailRenderContext,
): EmailRenderResult {
  const renderer = templates[templateKey]
  if (renderer) return renderer(ctx)
  return renderFallback(templateKey, ctx)
}

function renderFallback(
  templateKey: string,
  { recipientFirstName, data }: EmailRenderContext,
): EmailRenderResult {
  const title = str(data.title, 'A notification from Learn in France')
  const message = str(
    data.message,
    "You have a new update on your Learn in France account. Log in to your portal for the full details.",
  )
  return {
    subject: title,
    html: shell({
      preheader: title,
      heading: title,
      bodyHtml: `
        <p>Hi ${escapeHtml(recipientFirstName) || 'there'},</p>
        <p>${escapeHtml(message)}</p>
        <p style="font-size:11px;color:#94a3b8;">Template: ${escapeHtml(templateKey)}</p>
      `,
      ctaLabel: 'Open your portal',
      ctaUrl: str(data.portalUrl, 'https://learninfrance.com/portal'),
    }),
    text: plainText([
      `Hi ${recipientFirstName || 'there'},`,
      '',
      message,
    ]),
  }
}
