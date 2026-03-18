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
