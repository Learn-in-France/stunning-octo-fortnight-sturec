'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'

import type { UserRole } from '@sturec/shared'

import {
  auth,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  type FirebaseUser,
} from '@/lib/auth/firebase'
import api from '@/lib/api/client'

export interface AppUser {
  id: string
  email: string
  role: UserRole
  firstName: string
  lastName: string
  phone: string | null
  avatarUrl: string | null
  status: string
}

/**
 * Auth error codes surfaced to consuming components.
 * - USER_NOT_FOUND: Firebase user exists but no backend account.
 *   Internal users must accept an invite first.
 *   Students must register via the public registration flow.
 * - VERIFY_FAILED: Backend returned an unexpected error.
 */
export type AuthErrorCode = 'USER_NOT_FOUND' | 'VERIFY_FAILED' | null

interface AuthContextType {
  user: AppUser | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  authError: AuthErrorCode
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  authError: null,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<AuthErrorCode>(null)

  useEffect(() => {
    // If Firebase is not configured, stop loading immediately
    if (!auth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setUser(null)
        setFirebaseUser(null)
        setAuthError(null)
        setLoading(false)
        return
      }

      setFirebaseUser(fbUser)
      setAuthError(null)

      try {
        // Verify Firebase token against backend — returns the backend user if it exists.
        // This is the ONLY auto-resolution path. No automatic registration.
        const appUser = await api.post('/auth/verify') as unknown as AppUser
        setUser(appUser)
      } catch (err: unknown) {
        const error = err as { code?: string }
        if (error?.code === 'USER_NOT_FOUND') {
          // Firebase account exists but no backend user.
          // Do NOT auto-register — internal users must accept-invite,
          // students must use the explicit /auth/register flow.
          setAuthError('USER_NOT_FOUND')
        } else {
          setAuthError('VERIFY_FAILED')
        }
        setUser(null)
      }

      setLoading(false)
    })

    return unsubscribe
  }, [])

  const handleSignOut = useCallback(async () => {
    await firebaseSignOut()
    setUser(null)
    setFirebaseUser(null)
    setAuthError(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, firebaseUser, loading, authError, signOut: handleSignOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
