'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { signUpWithEmail } from '@/lib/auth/firebase'
import { useAuth } from '@/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/components/branding/brand-logo'
import { Input } from '@/components/ui/input'
import api from '@/lib/api/client'

export default function RegisterPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

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

  async function handleRegister(e: React.FormEvent) {
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

    setSubmitting(true)
    try {
      // 1. Create Firebase account
      await signUpWithEmail(email, password)

      // 2. Register student on backend
      await api.post('/auth/register', {
        firstName,
        lastName,
      })

      // 3. Redirect to student portal
      router.push('/portal')
    } catch (err: unknown) {
      const apiError = err as { code?: string; message?: string }
      if (apiError?.code === 'auth/email-already-in-use' || apiError?.code === 'EMAIL_EXISTS') {
        setError('An account with this email already exists. Try signing in instead.')
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <BrandLogo href="/" variant="stacked" showTagline markClassName="h-24 w-24" />
        </div>

        <div className="bg-surface-raised rounded-2xl border border-border p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          <h1 className="text-lg font-bold text-text-primary font-display text-center mb-1">
            Create your student account
          </h1>
          <p className="text-sm text-text-muted text-center mb-6">
            Start your journey to studying in France.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-3">
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
            <Button
              type="submit"
              size="lg"
              className="w-full"
              loading={submitting}
            >
              Create account
            </Button>
          </form>

          <p className="text-xs text-text-muted text-center mt-4 leading-relaxed">
            By creating an account you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>

        <p className="text-xs text-text-muted text-center mt-6">
          Already have an account?{' '}
          <a href="/auth/login" className="text-primary-600 hover:underline">
            Sign in
          </a>
        </p>

        <p className="text-xs text-text-muted text-center mt-2">
          Internal team member?{' '}
          <span className="text-text-secondary">
            Ask your admin for an invitation link.
          </span>
        </p>
      </div>
    </div>
  )
}
