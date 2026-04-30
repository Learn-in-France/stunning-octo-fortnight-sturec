/**
 * Mautic integration — downstream CRM sync.
 *
 * Mautic is NEVER the source of truth. Data flows one way:
 * STUREC → Mautic. This integration pushes contacts and triggers
 * campaigns. Mautic webhooks feed back campaign event results.
 */

export interface MauticContact {
  email: string
  firstname?: string
  lastname?: string
  phone?: string
  city?: string
  tags?: string[]
  // Custom fields mapped to Mautic contact fields
  sturec_student_id?: string
  sturec_lead_id?: string
  sturec_stage?: string
  sturec_priority_level?: string
  sturec_qualification_score?: number
  webinar_url?: string
  webinar_join_url?: string
}

interface MauticApiResponse {
  contact?: { id: number }
  errors?: Array<{ message: string }>
}

const getMauticConfig = () => ({
  baseUrl: process.env.MAUTIC_API_URL || '',
  username: process.env.MAUTIC_API_USER || '',
  password: process.env.MAUTIC_API_PASSWORD || '',
})

function getAuthHeader(): string {
  const { username, password } = getMauticConfig()
  return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
}

async function mauticFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const { baseUrl } = getMauticConfig()
  if (!baseUrl) throw new Error('MAUTIC_API_URL is not set')

  return fetch(`${baseUrl}/api${path}`, {
    ...options,
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
}

/**
 * Create a new contact in Mautic. Returns the Mautic contact ID.
 */
export async function createContact(data: MauticContact): Promise<number> {
  const response = await mauticFetch('/contacts/new', {
    method: 'POST',
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Mautic createContact error ${response.status}: ${body}`)
  }

  const result = (await response.json()) as MauticApiResponse
  if (!result.contact?.id) throw new Error('Mautic did not return a contact ID')
  return result.contact.id
}

/**
 * Update an existing Mautic contact by ID.
 */
export async function updateContact(
  mauticContactId: number,
  data: Partial<MauticContact>,
): Promise<void> {
  const response = await mauticFetch(`/contacts/${mauticContactId}/edit`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Mautic updateContact error ${response.status}: ${body}`)
  }
}

/**
 * Add a contact to a campaign segment.
 */
export async function addContactToSegment(
  mauticContactId: number,
  segmentId: number,
): Promise<void> {
  const response = await mauticFetch(
    `/segments/${segmentId}/contact/${mauticContactId}/add`,
    { method: 'POST' },
  )

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Mautic addToSegment error ${response.status}: ${body}`)
  }
}

/**
 * Trigger a campaign for a specific contact.
 */
export async function triggerCampaign(
  campaignId: number,
  mauticContactId: number,
): Promise<void> {
  const response = await mauticFetch(
    `/campaigns/${campaignId}/contact/${mauticContactId}/add`,
    { method: 'POST' },
  )

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Mautic triggerCampaign error ${response.status}: ${body}`)
  }
}

/**
 * Get contact by email (for dedup before create).
 */
export async function findContactByEmail(
  email: string,
): Promise<{ id: number } | null> {
  const response = await mauticFetch(
    `/contacts?search=email:${encodeURIComponent(email)}&limit=1`,
  )

  if (!response.ok) return null

  const result = (await response.json()) as { contacts?: Record<string, { id: number }> }
  const contacts = result.contacts ? Object.values(result.contacts) : []
  return contacts.length > 0 ? { id: contacts[0].id } : null
}
