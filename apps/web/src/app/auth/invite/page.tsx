'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'

import { signUpWithEmail } from '@/lib/auth/firebase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AuthShell } from '@/components/marketing/auth-shell'
import { BrandName } from '@/components/branding/brand-logo'
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
  const [validatingInvite, setValidatingInvite] = useState(true)
  const [inviteValid, setInviteValid] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function validateInviteLink() {
      if (!token || !prefilledEmail) {
        setValidatingInvite(false)
        setInviteValid(false)
        return
      }

      try {
        await api.post('/auth/validate-invite', { token, email: prefilledEmail })
        if (!cancelled) {
          setInviteValid(true)
          setError('')
        }
      } catch (err: unknown) {
        const apiError = err as { code?: string }
        if (!cancelled) {
          setInviteValid(false)
          setError(
            apiError?.code === 'INVITE_INVALID'
              ? 'This invitation link is invalid or expired. Please request a new one from your admin.'
              : 'Could not validate this invite link. Please try again or contact your admin.',
          )
        }
      } finally {
        if (!cancelled) setValidatingInvite(false)
      }
    }

    validateInviteLink()

    return () => {
      cancelled = true
    }
  }, [prefilledEmail, token])

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

    if (!inviteValid) {
      setError('This invitation link is invalid or expired. Please request a new one from your admin.')
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

  if (!token || !prefilledEmail) {
    return (
      <AuthShell
        eyebrow="Invite"
        title="This invitation link is not usable."
        description="The link is missing required information or has been opened incorrectly."
        sideTitle="What to do next"
        sideCopy="Invitation acceptance is only for pre-created internal users."
        sidePoints={[
          'Check the original email from your admin.',
          'Request a new invite if the link has expired.',
          'Use sign-in instead if your account has already been created.',
        ]}
        mode="team"
      >
        <h2 className="font-display text-3xl font-semibold tracking-[-0.03em] text-text-primary">
          Invalid invitation
        </h2>
        <p className="mt-3 text-sm leading-7 text-text-secondary">
          This invite link is missing or malformed. Please check the link from your invitation email or contact your admin.
        </p>
        <div className="mt-8">
          <Button variant="secondary" size="lg" className="rounded-full px-6" onClick={() => router.push('/auth/login')}>
            Go to sign in
          </Button>
        </div>
      </AuthShell>
    )
  }

  if (validatingInvite) {
    return (
      <AuthShell
        eyebrow="Team invite"
        title={<>Checking your invitation to the <BrandName inverse /> workspace.</>}
        description="Please wait while we validate your invite link."
        sideTitle="Internal access"
        sideCopy="Only invited internal users can continue through this page."
        sidePoints={[
          'Invite links are time-limited.',
          'The invited email must match the account you create.',
          'If this fails, ask your admin to send a new invite.',
        ]}
        mode="team"
      >
        <div className="py-12 flex justify-center">
          <LoadingInvite />
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      eyebrow="Team invite"
      title={<>Accept your invitation to the <BrandName inverse /> workspace.</>}
      description="This flow is only for invited internal users. Students should use the public registration path instead."
      sideTitle="Internal access"
      sideCopy="Invite acceptance links a pre-created team user to a Firebase account and sends the user into the internal workspace."
      sidePoints={[
        'The invite email decides who can use this link.',
        'A valid token is required before the account can be linked.',
        'Once complete, future sign-ins happen through the normal login page.',
      ]}
      mode="team"
    >
      <h2 className="font-display text-3xl font-semibold tracking-[-0.03em] text-text-primary">
        Accept your invitation
      </h2>
      <p className="mt-3 text-sm leading-7 text-text-secondary">
        Set up your account to join the <BrandName /> team.
      </p>

      {error && (
        <div className="mt-6 rounded-[20px] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleAcceptInvite} className="mt-8 space-y-4">
        <Input label="Email" type="email" value={email} disabled className="bg-surface-sunken" />
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
        <Button type="submit" size="lg" className="w-full rounded-full py-3" loading={submitting}>
          Create Account
        </Button>
      </form>

      <div className="mt-6 text-center text-xs text-text-muted">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-primary-700 hover:underline">
          Sign in
        </Link>
      </div>
    </AuthShell>
  )
}

function LoadingInvite() {
  return (
    <p className="rounded-full bg-white/85 px-5 py-3 text-sm font-medium text-text-secondary shadow-[0_12px_28px_rgba(10,22,41,0.06)]">
      Validating invitation...
    </p>
  )
}

export default function InvitePage() {
  return (
    <Suspense fallback={
      <div className="public-page min-h-screen flex items-center justify-center">
        <p className="rounded-full bg-white/85 px-5 py-3 text-sm font-medium text-text-secondary shadow-[0_12px_28px_rgba(10,22,41,0.06)]">
          Loading...
        </p>
      </div>
    }>
      <InviteForm />
    </Suspense>
  )
}
