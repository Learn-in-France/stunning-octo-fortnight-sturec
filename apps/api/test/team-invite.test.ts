import { describe, it, expect, afterEach } from 'vitest'
import { buildInviteUrl } from '../src/modules/team/service.js'

describe('buildInviteUrl', () => {
  const previous = process.env.FRONTEND_URL

  afterEach(() => {
    if (previous === undefined) delete process.env.FRONTEND_URL
    else process.env.FRONTEND_URL = previous
  })

  it('uses the first CSV entry when FRONTEND_URL is a comma-separated list', () => {
    // Regression: FRONTEND_URL is a CSV of allowed CORS origins. The
    // old code used the raw value as a URL base, producing broken
    // URLs like "https://a.com,https://b.com/auth/invite?...".
    process.env.FRONTEND_URL =
      'https://learninfrance.com,https://sturecweb-production.up.railway.app'

    const url = buildInviteUrl({ token: 'abc123', email: 'a@b.com' })

    expect(url).toBe(
      'https://learninfrance.com/auth/invite?token=abc123&email=a%40b.com',
    )
    expect(url).not.toContain(',')
  })

  it('trims trailing slash from the first entry', () => {
    process.env.FRONTEND_URL = 'https://learninfrance.com/,https://other.com'
    const url = buildInviteUrl({ token: 't', email: 'a@b.com' })
    expect(url.startsWith('https://learninfrance.com/auth/invite?')).toBe(true)
  })

  it('falls back to localhost when FRONTEND_URL is unset', () => {
    delete process.env.FRONTEND_URL
    const url = buildInviteUrl({ token: 't', email: 'a@b.com' })
    expect(url.startsWith('http://localhost:3000/auth/invite?')).toBe(true)
  })

  it('encodes the email parameter', () => {
    process.env.FRONTEND_URL = 'https://learninfrance.com'
    const url = buildInviteUrl({ token: 't', email: 'foo+bar@baz.com' })
    expect(url).toContain('email=foo%2Bbar%40baz.com')
  })
})
