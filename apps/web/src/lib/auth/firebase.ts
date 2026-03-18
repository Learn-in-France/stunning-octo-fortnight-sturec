import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type Auth,
  type User,
} from 'firebase/auth'

import { env } from '@/lib/config/env'

const firebaseConfig = {
  apiKey: env.firebase.apiKey,
  authDomain: env.firebase.authDomain,
  projectId: env.firebase.projectId,
}

const isConfigured = !!firebaseConfig.apiKey

let app: FirebaseApp | null = null
let auth: Auth | null = null

if (isConfigured && typeof window !== 'undefined') {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  auth = getAuth(app)
}

export { auth, onAuthStateChanged }
export type { User as FirebaseUser }

const googleProvider = isConfigured ? new GoogleAuthProvider() : null

export async function signInWithGoogle() {
  if (!auth || !googleProvider) throw new Error('Firebase not configured')
  return signInWithPopup(auth, googleProvider)
}

export async function signInWithEmail(email: string, password: string) {
  if (!auth) throw new Error('Firebase not configured')
  return signInWithEmailAndPassword(auth, email, password)
}

export async function signUpWithEmail(email: string, password: string) {
  if (!auth) throw new Error('Firebase not configured')
  return createUserWithEmailAndPassword(auth, email, password)
}

export async function signOut() {
  if (!auth) return
  return firebaseSignOut(auth)
}

export async function getIdToken(): Promise<string | null> {
  if (!auth) return null
  const user = auth.currentUser
  if (!user) return null
  return user.getIdToken()
}
