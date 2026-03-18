'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { signInWithEmail, signInWithGoogle } from '@/lib/auth/firebase'
import { useAuth } from '@/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/components/branding/brand-logo'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const router = useRouter()
  const { user, loading, authError, signOut } = useAuth()
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
      setError(
        'No account found. If you are an internal team member, ask your admin to send you an invitation. If you are a student, please register first.'
      )
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <BrandLogo href="/" variant="stacked" showTagline markClassName="h-24 w-24" />
        </div>

        <div className="bg-surface-raised rounded-2xl border border-border p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          <h1 className="text-lg font-bold text-text-primary font-display text-center mb-1">
            Welcome back
          </h1>
          <p className="text-sm text-text-muted text-center mb-6">
            Sign in to your workspace
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              <p>{error}</p>
              {authError && (
                <button
                  type="button"
                  onClick={handleSignOutAndRetry}
                  className="mt-2 text-xs text-red-600 underline hover:no-underline"
                >
                  Sign out and try a different account
                </button>
              )}
            </div>
          )}

          {/* Google */}
          <Button
            variant="secondary"
            size="lg"
            className="w-full mb-4"
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

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-text-muted">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailLogin} className="space-y-3">
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
            <Button
              type="submit"
              size="lg"
              className="w-full"
              loading={submitting}
            >
              Sign in
            </Button>
          </form>
        </div>

        <p className="text-xs text-text-muted text-center mt-6">
          Student? Sign in above to access your portal.
        </p>
      </div>
    </div>
  )
}
