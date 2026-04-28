export interface WebinarTokenPayload {
  mauticId?: number
  email: string
  firstName: string
  lastName?: string
  phone?: string
  city?: string
  programme?: string
}

const decodeBase64Url = (s: string): string => {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/')
  const padding = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
  if (typeof window !== 'undefined') {
    return decodeURIComponent(escape(window.atob(padded + padding)))
  }
  return Buffer.from(padded + padding, 'base64').toString('utf8')
}

export function decodeWebinarToken(token: string | null | undefined): WebinarTokenPayload | null {
  if (!token) return null
  try {
    const [body] = token.split('.')
    if (!body) return null
    const json = decodeBase64Url(body)
    const payload = JSON.parse(json) as WebinarTokenPayload
    if (!payload.email || !payload.firstName) return null
    return payload
  } catch {
    return null
  }
}
