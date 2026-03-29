'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { signInWithEmail, signInWithGoogle } from '@/lib/auth/firebase'
import { useAuth } from '@/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AuthShell } from '@/components/marketing/auth-shell'
import { BrandName } from '@/components/branding/brand-logo'
import api from '@/lib/api/client'

export default function LoginPage() {
  const router = useRouter()
  const { user, firebaseUser, loading, authError, signOut, refreshUser } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Role-aware redirect when authenticated
  useEffect(() => {
    if (loading || !user) return
    if (user.role === 'student') {
      // Hold on /portal — route exists as shell, safe to redirect
      router.replace('/portal')
    } else {
      router.replace('/dashboard')
    }
  }, [user, loading, router])

  // Surface auth provider errors (e.g. Firebase user with no backend account)
  useEffect(() => {
    if (authError === 'USER_NOT_FOUND') {
      setError('NO_ACCOUNT')
    } else if (authError === 'VERIFY_FAILED') {
      setError('Unable to verify your account. Please try again or contact support.')
    }
  }, [authError])

  // If user is already authed, show nothing while redirecting
  if (!loading && user) return null

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await signInWithEmail(email, password)
      // Auth provider will verify and set user, triggering the redirect above.
      // No hardcoded router.push — let role-aware redirect handle it.
    } catch {
      setError('Invalid email or password. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGoogleLogin() {
    setError('')
    setSubmitting(true)
    try {
      await signInWithGoogle()
      // Same as above — auth provider handles role-aware redirect.
    } catch {
      setError('Google sign-in failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSignOutAndRetry() {
    await signOut()
    setError('')
  }

  async function handleCompleteStudentRegistration() {
    if (!firebaseUser) return

    setError('')
    setSubmitting(true)

    try {
      const displayName = firebaseUser.displayName?.trim() ?? ''
      const [firstName = '', ...rest] = displayName.split(/\s+/).filter(Boolean)
      const lastName = rest.join(' ')

      await api.post('/auth/register', {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
      })

      const appUser = await refreshUser()
      if (!appUser) {
        setError('Unable to complete registration. Please try again.')
        return
      }

      router.replace(appUser.role === 'student' ? '/portal' : '/dashboard')
    } catch (err: unknown) {
      const apiError = err as { code?: string }

      if (apiError?.code === 'USE_ACCEPT_INVITE') {
        setError('This email belongs to an invited team member. Use your invitation link instead.')
      } else if (apiError?.code === 'USE_VERIFY') {
        const appUser = await refreshUser()
        if (appUser) {
          router.replace(appUser.role === 'student' ? '/portal' : '/dashboard')
          return
        }
        setError('An account already exists. Try signing in again.')
      } else {
        setError('Unable to complete registration. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Sign in"
      title={<>Return to your <BrandName inverse /> workspace.</>}
      description="Students come back here to continue their plan. Team members use the same sign-in page after accepting an invitation."
      sideTitle="Before you sign in"
      sideCopy="The login page supports two very different paths, and the copy should make that distinction obvious."
      sidePoints={[
        'Students who do not have an account yet should register first.',
        'Internal team members do not self-register; they use an invite link from an admin.',
        'Google sign-in works for existing accounts and invited team members once setup is complete.',
      ]}
    >
      <h2 className="font-display text-3xl font-semibold tracking-[-0.03em] text-text-primary">
        Welcome back
      </h2>
      <p className="mt-3 text-sm leading-7 text-text-secondary">
        Sign in to your workspace
      </p>

      {error && (
        <div className="mt-6 rounded-[20px] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error === 'NO_ACCOUNT' ? (
            <>
              <p>No account found for this email.</p>
              <div className="mt-3 space-y-1 text-xs">
                <p>
                  Student?{' '}
                  {firebaseUser ? (
                    <button
                      type="button"
                      onClick={handleCompleteStudentRegistration}
                      className="font-medium underline hover:no-underline"
                    >
                      Complete student registration
                    </button>
                  ) : (
                    <Link href="/auth/register" className="font-medium underline hover:no-underline">
                      Create a student account
                    </Link>
                  )}
                </p>
                <p>Team member? Ask your admin for an invitation link.</p>
              </div>
            </>
          ) : (
            <p>{error}</p>
          )}
          {authError && (
            <button
              type="button"
              onClick={handleSignOutAndRetry}
              className="mt-3 text-xs text-red-600 underline hover:no-underline"
            >
              Sign out and try a different account
            </button>
          )}
        </div>
      )}

      <div className="mt-8">
        <Button
          variant="secondary"
          size="lg"
          className="w-full rounded-full border-white bg-white py-3 shadow-[0_14px_34px_rgba(10,22,41,0.08)]"
          onClick={handleGoogleLogin}
          disabled={submitting}
          icon={
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M15.68 8.18c0-.567-.05-1.113-.145-1.636H8v3.094h4.305a3.68 3.68 0 01-1.597 2.415v2.007h2.585c1.513-1.393 2.387-3.444 2.387-5.88z" fill="#4285F4" />
              <path d="M8 16c2.16 0 3.97-.716 5.293-1.94l-2.585-2.008c-.716.48-1.633.763-2.708.763-2.083 0-3.846-1.407-4.476-3.298H.852v2.073A7.997 7.997 0 008 16z" fill="#34A853" />
              <path d="M3.524 9.517A4.81 4.81 0 013.273 8c0-.527.09-1.04.251-1.517V4.41H.852A7.997 7.997 0 000 8c0 1.29.31 2.512.852 3.59l2.672-2.073z" fill="#FBBC05" />
              <path d="M8 3.185c1.174 0 2.229.404 3.058 1.196l2.294-2.294C11.966.793 10.157 0 8 0A7.997 7.997 0 00.852 4.41l2.672 2.073C4.154 4.592 5.917 3.185 8 3.185z" fill="#EA4335" />
            </svg>
          }
        >
          Continue with Google
        </Button>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs uppercase tracking-[0.16em] text-text-muted">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
          <Button type="submit" size="lg" className="w-full rounded-full py-3" loading={submitting}>
            Sign in
          </Button>
        </form>
      </div>

      <div className="mt-6 space-y-2 text-center text-xs text-text-muted">
        <p>
          New student?{' '}
          <Link href="/auth/register" className="text-public-blue hover:underline">
            Create an account
          </Link>
        </p>
        <p>Internal team member? Ask your admin for an invitation link.</p>
      </div>
    </AuthShell>
  )
}
