'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { deleteCurrentUser, signInWithGoogle, signUpWithEmail } from '@/lib/auth/firebase'
import { useAuth } from '@/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AuthShell } from '@/components/marketing/auth-shell'
import api from '@/lib/api/client'

export default function RegisterPage() {
  const router = useRouter()
  const { user, loading, signOut, refreshUser } = useAuth()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // If already authenticated as a student, redirect to portal
  useEffect(() => {
    if (loading || !user) return
    if (user.role === 'student') {
      router.replace('/portal')
    } else {
      router.replace('/dashboard')
    }
  }, [user, loading, router])

  if (!loading && user) return null

  async function registerOnBackend(data?: { firstName?: string; lastName?: string }) {
    await api.post('/auth/register', data ?? {})
  }

  async function finishRegistration(data?: { firstName?: string; lastName?: string }) {
    await registerOnBackend(data)
    const appUser = await refreshUser()

    if (!appUser) {
      throw { code: 'VERIFY_FAILED' }
    }

    router.replace(appUser.role === 'student' ? '/portal' : '/dashboard')
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    let createdFirebaseAccount = false

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      // 1. Create Firebase account
      await signUpWithEmail(email, password)
      createdFirebaseAccount = true

      // 2. Register student on backend
      await finishRegistration({
        firstName,
        lastName,
      })
    } catch (err: unknown) {
      if (createdFirebaseAccount) {
        try {
          await deleteCurrentUser()
        } catch {
          await signOut()
        }
      }

      const apiError = err as { code?: string; message?: string }
      if (apiError?.code === 'auth/email-already-in-use' || apiError?.code === 'EMAIL_EXISTS') {
        setError('An account with this email already exists. Try signing in instead.')
      } else if (apiError?.code === 'USE_VERIFY') {
        setError('An account with this email already exists. Try signing in instead.')
      } else if (apiError?.code === 'USE_ACCEPT_INVITE') {
        setError('This email belongs to an invited team member. Use your invitation link instead.')
      } else if (apiError?.code === 'auth/weak-password') {
        setError('Password is too weak. Please use at least 8 characters.')
      } else if (apiError?.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.')
      } else {
        setError('Registration failed. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGoogleRegister() {
    setError('')
    setSubmitting(true)

    try {
      const result = await signInWithGoogle()
      const displayName = result.user.displayName?.trim() ?? ''
      const [googleFirstName = '', ...rest] = displayName.split(/\s+/).filter(Boolean)
      const googleLastName = rest.join(' ')

      await finishRegistration({
        firstName: googleFirstName || undefined,
        lastName: googleLastName || undefined,
      })
    } catch (err: unknown) {
      await signOut()

      const apiError = err as { code?: string }
      if (apiError?.code === 'auth/popup-closed-by-user') {
        setError('Google sign-up was cancelled.')
      } else if (apiError?.code === 'auth/account-exists-with-different-credential') {
        setError('An account already exists with this email. Try signing in instead.')
      } else if (apiError?.code === 'USE_VERIFY') {
        setError('An account with this email already exists. Try signing in instead.')
      } else if (apiError?.code === 'USE_ACCEPT_INVITE') {
        setError('This email belongs to an invited team member. Use your invitation link instead.')
      } else {
        setError('Google sign-up failed. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Register"
      title="Create a student account that can carry the whole process."
      description="Once you create an account, Learn in France can save your progress, guide your next steps, and keep everything organised as you move forward."
      sideTitle="What you unlock"
      sideCopy="Your student account is more than a login. It connects your profile, documents, and conversations into one place so nothing gets lost."
      sidePoints={[
        'Save program research and return to it later.',
        'Talk to the AI advisor with your own context attached.',
        'Track applications, documents, visa readiness, and support in one place.',
      ]}
    >
      <h2 className="font-display text-3xl font-semibold tracking-[-0.03em] text-text-primary">
        Create your student account
      </h2>
      <p className="mt-3 text-sm leading-7 text-text-secondary">
        Start your journey to studying in France.
      </p>

      {error && (
        <div className="mt-6 rounded-[20px] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-8">
        <Button
          variant="secondary"
          size="lg"
          className="mb-4 w-full rounded-full border-white bg-white py-3 shadow-[0_14px_34px_rgba(10,22,41,0.08)]"
          onClick={handleGoogleRegister}
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

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
              required
            />
            <Input
              label="Last Name"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
              required
            />
          </div>
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
            placeholder="At least 8 characters"
            required
          />
          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            required
          />
          <Button type="submit" size="lg" className="w-full rounded-full py-3" loading={submitting}>
            Create account
          </Button>
        </form>
      </div>
    </AuthShell>
  )
}
