/**
 * Name formatting helpers.
 *
 * User first/last name columns sometimes contain leading, trailing,
 * or embedded whitespace (imports from CSVs, old seed data, etc.).
 * Template-literal joins like `${first} ${last}` surface that as
 * "Learn in  France" (double space) or " John Doe" (leading space).
 *
 * Always route display names through `joinFullName` so the rendered
 * subject lines and greetings stay clean.
 */

export function joinFullName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  fallback = '',
): string {
  const combined = `${firstName ?? ''} ${lastName ?? ''}`
  const normalized = combined.replace(/\s+/g, ' ').trim()
  return normalized || fallback
}
