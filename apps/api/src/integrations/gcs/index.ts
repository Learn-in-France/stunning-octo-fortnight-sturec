/**
 * Google Cloud Storage integration.
 *
 * Generates signed URLs for document uploads and downloads.
 * Uses the GCS JSON API with service account credentials.
 */

import crypto from 'node:crypto'

const GCS_BUCKET = process.env.GCS_BUCKET || 'sturec-uploads'
const GCS_PROJECT_ID = process.env.GCS_PROJECT_ID

interface ServiceAccountKey {
  client_email: string
  private_key: string
}

let _serviceAccount: ServiceAccountKey | null = null

function getServiceAccount(): ServiceAccountKey {
  if (_serviceAccount) return _serviceAccount

  const keyJson = process.env.GCS_SERVICE_ACCOUNT_KEY
  if (!keyJson) {
    throw new Error('GCS_SERVICE_ACCOUNT_KEY is not set')
  }

  _serviceAccount = JSON.parse(keyJson) as ServiceAccountKey
  return _serviceAccount
}

/**
 * Create a base64url-encoded string (RFC 4648 §5).
 */
function base64url(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : input
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Sign a string with the service account private key (RS256).
 */
function signWithServiceAccount(input: string): string {
  const sa = getServiceAccount()
  const sign = crypto.createSign('RSA-SHA256')
  sign.update(input)
  return sign.sign(sa.private_key, 'base64')
}

/**
 * Generate a V4 signed URL for uploading a file to GCS.
 *
 * Returns a URL the client can PUT to directly.
 * Expires in 15 minutes by default.
 */
export function generateSignedUploadUrl(
  gcsPath: string,
  contentType: string = 'application/octet-stream',
  expiresInSeconds: number = 900,
): string {
  const sa = getServiceAccount()
  const now = new Date()
  const expiration = new Date(now.getTime() + expiresInSeconds * 1000)

  const timestamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')
  const datestamp = timestamp.slice(0, 8)
  const credentialScope = `${datestamp}/auto/storage/goog4_request`
  const credential = `${sa.client_email}/${credentialScope}`

  const canonicalHeaders = [
    `content-type:${contentType}`,
    `host:storage.googleapis.com`,
    `x-goog-content-sha256:UNSIGNED-PAYLOAD`,
  ].join('\n')

  const signedHeaders = 'content-type;host;x-goog-content-sha256'

  const queryParams = new URLSearchParams({
    'X-Goog-Algorithm': 'GOOG4-RSA-SHA256',
    'X-Goog-Credential': credential,
    'X-Goog-Date': timestamp,
    'X-Goog-Expires': String(expiresInSeconds),
    'X-Goog-SignedHeaders': signedHeaders,
  })

  const canonicalRequest = [
    'PUT',
    `/${GCS_BUCKET}/${gcsPath}`,
    queryParams.toString(),
    canonicalHeaders + '\n',
    signedHeaders,
    'UNSIGNED-PAYLOAD',
  ].join('\n')

  const stringToSign = [
    'GOOG4-RSA-SHA256',
    timestamp,
    credentialScope,
    crypto.createHash('sha256').update(canonicalRequest).digest('hex'),
  ].join('\n')

  const signature = signWithServiceAccount(stringToSign)
  const hexSignature = Buffer.from(signature, 'base64').toString('hex')

  queryParams.set('X-Goog-Signature', hexSignature)

  return `https://storage.googleapis.com/${GCS_BUCKET}/${gcsPath}?${queryParams.toString()}`
}

/**
 * Generate a V4 signed URL for downloading a file from GCS.
 *
 * Returns a URL the client can GET.
 * Expires in 1 hour by default.
 */
export function generateSignedDownloadUrl(
  gcsPath: string,
  expiresInSeconds: number = 3600,
): string {
  const sa = getServiceAccount()
  const now = new Date()
  const timestamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')
  const datestamp = timestamp.slice(0, 8)
  const credentialScope = `${datestamp}/auto/storage/goog4_request`
  const credential = `${sa.client_email}/${credentialScope}`

  const canonicalHeaders = `host:storage.googleapis.com`
  const signedHeaders = 'host'

  const queryParams = new URLSearchParams({
    'X-Goog-Algorithm': 'GOOG4-RSA-SHA256',
    'X-Goog-Credential': credential,
    'X-Goog-Date': timestamp,
    'X-Goog-Expires': String(expiresInSeconds),
    'X-Goog-SignedHeaders': signedHeaders,
  })

  const canonicalRequest = [
    'GET',
    `/${GCS_BUCKET}/${gcsPath}`,
    queryParams.toString(),
    canonicalHeaders + '\n',
    signedHeaders,
    'UNSIGNED-PAYLOAD',
  ].join('\n')

  const stringToSign = [
    'GOOG4-RSA-SHA256',
    timestamp,
    credentialScope,
    crypto.createHash('sha256').update(canonicalRequest).digest('hex'),
  ].join('\n')

  const signature = signWithServiceAccount(stringToSign)
  const hexSignature = Buffer.from(signature, 'base64').toString('hex')

  queryParams.set('X-Goog-Signature', hexSignature)

  return `https://storage.googleapis.com/${GCS_BUCKET}/${gcsPath}?${queryParams.toString()}`
}

/**
 * Check if a file exists in GCS and return its metadata.
 * Used during completeUpload to verify the file was actually uploaded.
 */
export async function getObjectMetadata(
  gcsPath: string,
): Promise<{ size: number; contentType: string } | null> {
  try {
    const response = await fetch(
      `https://storage.googleapis.com/storage/v1/b/${GCS_BUCKET}/o/${encodeURIComponent(gcsPath)}`,
      {
        headers: {
          Authorization: `Bearer ${await getAccessToken()}`,
        },
      },
    )
    if (!response.ok) return null

    const data = (await response.json()) as { size: string; contentType: string }
    return {
      size: parseInt(data.size, 10),
      contentType: data.contentType,
    }
  } catch {
    return null
  }
}

/**
 * Liveness ping for the ops /integrations endpoint. Fetches the
 * bucket metadata — the lightest authenticated GCS JSON API call —
 * and reports success + latency. Returns a graceful error object
 * if the service account isn't configured or the call fails.
 */
export async function pingGcs(): Promise<{
  ok: boolean
  latencyMs: number
  error?: string
}> {
  if (!process.env.GCS_SERVICE_ACCOUNT_PATH && !process.env.GCS_SERVICE_ACCOUNT_JSON) {
    return { ok: false, latencyMs: 0, error: 'GCS service account not configured' }
  }
  const start = Date.now()
  try {
    const token = await getAccessToken()
    const response = await fetch(
      `https://storage.googleapis.com/storage/v1/b/${GCS_BUCKET}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(5000),
      },
    )
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

/**
 * Get an OAuth2 access token using the service account for API calls.
 */
async function getAccessToken(): Promise<string> {
  const sa = getServiceAccount()
  const now = Math.floor(Date.now() / 1000)

  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = base64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/devstorage.read_only',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    }),
  )

  const signatureInput = `${header}.${payload}`
  const signature = signWithServiceAccount(signatureInput)
  const jwt = `${header}.${payload}.${base64url(Buffer.from(signature, 'base64'))}`

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:2.0:jwt-bearer',
      assertion: jwt,
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to get GCS access token: ${response.status}`)
  }

  const data = (await response.json()) as { access_token: string }
  return data.access_token
}
