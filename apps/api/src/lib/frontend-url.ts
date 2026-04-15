/**
 * FRONTEND_URL helpers.
 *
 * FRONTEND_URL is a comma-separated list of allowed CORS origins
 * (e.g. "https://learninfrance.com,https://sturecweb-production.up.railway.app").
 * For user-facing links we need a single canonical public URL —
 * the first entry is treated as primary.
 */

export function getPrimaryFrontendUrl(): string {
  const raw = process.env.FRONTEND_URL || 'http://localhost:3000'
  return raw.split(',')[0].trim().replace(/\/$/, '')
}

/** Build a deep link into the public/internal site. */
export function frontendUrl(path: string): string {
  const base = getPrimaryFrontendUrl()
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${cleanPath}`
}
