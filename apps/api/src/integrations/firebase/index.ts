import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth'

let initialized = false

export function initFirebase() {
  if (initialized || getApps().length > 0) return

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('⚠ Firebase credentials not configured — auth endpoints will fail')
    return
  }

  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
  })

  initialized = true
}

export async function verifyFirebaseToken(idToken: string): Promise<DecodedIdToken> {
  initFirebase()

  try {
    return await getAuth().verifyIdToken(idToken)
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string }
    const code = firebaseError.code || 'unknown'

    if (code === 'auth/id-token-expired') {
      throw new AuthError('Token expired', 'TOKEN_EXPIRED', 401)
    }
    if (code === 'auth/id-token-revoked') {
      throw new AuthError('Token revoked', 'TOKEN_REVOKED', 401)
    }
    if (code === 'auth/invalid-id-token' || code === 'auth/argument-error') {
      throw new AuthError('Invalid token', 'INVALID_TOKEN', 401)
    }
    if (code === 'auth/user-disabled') {
      throw new AuthError('User disabled', 'USER_DISABLED', 403)
    }

    throw new AuthError('Authentication failed', 'AUTH_FAILED', 401)
  }
}

export class AuthError extends Error {
  code: string
  statusCode: number

  constructor(message: string, code: string, statusCode: number) {
    super(message)
    this.name = 'AuthError'
    this.code = code
    this.statusCode = statusCode
  }
}

/**
 * Liveness ping for the ops /integrations endpoint. Attempts to list
 * one user from Firebase Auth — a lightweight authenticated call that
 * proves the service account credentials work and the project is
 * reachable. Returns a graceful error object rather than throwing.
 */
export async function pingFirebase(): Promise<{
  ok: boolean
  latencyMs: number
  error?: string
}> {
  if (
    !process.env.FIREBASE_PROJECT_ID ||
    !process.env.FIREBASE_CLIENT_EMAIL ||
    !process.env.FIREBASE_PRIVATE_KEY
  ) {
    return { ok: false, latencyMs: 0, error: 'Firebase credentials not set' }
  }
  const start = Date.now()
  try {
    initFirebase()
    // listUsers(1) is the cheapest authenticated call that proves the
    // service account creds + project ID are valid.
    await getAuth().listUsers(1)
    return { ok: true, latencyMs: Date.now() - start }
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : 'unknown error',
    }
  }
}
