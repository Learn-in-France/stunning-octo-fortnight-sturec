'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

import { signUpWithEmail } from '@/lib/auth/firebase'
import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/components/branding/brand-logo'
import { Input } from '@/components/ui/input'
import api from '@/lib/api/client'
import type { AuthUserResponse } from '@sturec/shared'

function InviteForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const prefilledEmail = searchParams.get('email') ?? ''

  const [email] = useState(prefilledEmail)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleAcceptInvite(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (!token) {
      setError('Invalid invite link. Please check the URL or request a new invitation.')
      return
    }

    setSubmitting(true)
    try {
      // 1. Create Firebase account
      await signUpWithEmail(email, password)

      // 2. Call backend to accept invite and link the account
      await api.post('/auth/accept-invite', {
        token,
        firstName,
        lastName,
      }) as unknown as AuthUserResponse

      router.push('/dashboard')
    } catch (err: unknown) {
      const apiError = err as { code?: string; message?: string }
      if (apiError?.code === 'INVITE_EXPIRED') {
        setError('This invitation has expired. Please request a new one from your admin.')
      } else if (apiError?.code === 'INVITE_ALREADY_ACCEPTED') {
        setError('This invitation has already been accepted. Try signing in instead.')
      } else {
        setError('Failed to accept invitation. Please try again or contact your admin.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (!token && !prefilledEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-4">
        <div className="w-full max-w-sm text-center">
          <div className="flex items-center justify-center mb-6">
            <BrandLogo href="/" variant="stacked" showTagline markClassName="h-20 w-20" />
          </div>
          <div className="bg-surface-raised rounded-2xl border border-border p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
            <h1 className="text-lg font-bold text-text-primary font-display mb-2">
              Invalid Invitation
            </h1>
            <p className="text-sm text-text-muted mb-4">
              This invite link is missing or malformed. Please check the link from your invitation email or contact your admin.
            </p>
            <Button variant="secondary" size="md" onClick={() => router.push('/auth/login')}>
              Go to Sign In
            </Button>
          </div>
        </div>
      </div>
    )
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
            Accept Your Invitation
          </h1>
          <p className="text-sm text-text-muted text-center mb-6">
            Set up your account to join the Learn in France team.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleAcceptInvite} className="space-y-3">
            <Input
              label="Email"
              type="email"
              value={email}
              disabled
              className="bg-surface-sunken"
            />
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
            <Button
              type="submit"
              size="lg"
              className="w-full"
              loading={submitting}
            >
              Create Account
            </Button>
          </form>
        </div>

        <p className="text-xs text-text-muted text-center mt-6">
          Already have an account?{' '}
          <a href="/auth/login" className="text-primary-600 hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  )
}

export default function InvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <p className="text-sm text-text-muted">Loading...</p>
      </div>
    }>
      <InviteForm />
    </Suspense>
  )
}
