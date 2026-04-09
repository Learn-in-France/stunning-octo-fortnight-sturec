/**
 * Brevo transactional email integration.
 *
 * Thin wrapper around Brevo's /v3/smtp/email endpoint. Sending is
 * driven by in-code HTML templates (see lib/email-templates.ts) so
 * the API owns the copy and styling instead of delegating to a
 * remote template editor. That keeps the transactional email path
 * diff-reviewable and testable.
 *
 * Configuration:
 *   BREVO_API_KEY        — required. If missing, the worker logs a
 *                          warning and skips the send so missing
 *                          credentials never break the job queue.
 *   BREVO_FROM_EMAIL     — optional, defaults to noreply@learninfrance.com
 *   BREVO_FROM_NAME      — optional, defaults to "Learn in France"
 */

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email'

export interface BrevoSendArgs {
  to: string
  toName?: string
  subject: string
  htmlContent: string
  textContent?: string
  replyTo?: { email: string; name?: string }
  tags?: string[]
}

export interface BrevoSendResult {
  sent: boolean
  skipped?: 'no_api_key'
  messageId?: string
}

export async function sendTransactionalEmail(
  args: BrevoSendArgs,
): Promise<BrevoSendResult> {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) {
    // Graceful degradation — surface a warning but don't fail the job.
    // Same pattern as the previous SendGrid path so the queue keeps
    // running in dev / staging where the key may be absent.
    console.warn(
      `[brevo] BREVO_API_KEY not set, skipping email to ${args.to}`,
    )
    return { sent: false, skipped: 'no_api_key' }
  }

  const body = {
    sender: {
      email: process.env.BREVO_FROM_EMAIL || 'noreply@learninfrance.com',
      name: process.env.BREVO_FROM_NAME || 'Learn in France',
    },
    to: [{ email: args.to, ...(args.toName ? { name: args.toName } : {}) }],
    subject: args.subject,
    htmlContent: args.htmlContent,
    ...(args.textContent ? { textContent: args.textContent } : {}),
    ...(args.replyTo ? { replyTo: args.replyTo } : {}),
    ...(args.tags && args.tags.length > 0 ? { tags: args.tags } : {}),
  }

  const response = await fetch(BREVO_ENDPOINT, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Brevo error ${response.status}: ${errorBody}`)
  }

  const json = (await response.json().catch(() => null)) as
    | { messageId?: string }
    | null
  return { sent: true, messageId: json?.messageId }
}

/** Simple health ping used by the ops /integrations endpoint. */
export async function pingBrevo(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) {
    return { ok: false, latencyMs: 0, error: 'BREVO_API_KEY not set' }
  }
  const start = Date.now()
  try {
    const response = await fetch('https://api.brevo.com/v3/account', {
      method: 'GET',
      headers: { 'api-key': apiKey, accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    })
    return {
      ok: response.ok,
      latencyMs: Date.now() - start,
      ...(response.ok ? {} : { error: `HTTP ${response.status}` }),
    }
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : 'unknown error',
    }
  }
}
