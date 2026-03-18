'use client'

import Link from 'next/link'
import { useAuth } from '@/providers/auth-provider'

const benefits = [
  {
    title: 'Free profile assessment',
    description: 'Get an honest evaluation of your eligibility for French programs.',
  },
  {
    title: 'Personalized program shortlist',
    description: 'Receive recommendations matched to your academic background and goals.',
  },
  {
    title: 'Step-by-step application support',
    description: 'From Campus France to visa interview, we guide you through every step.',
  },
  {
    title: 'Dedicated counsellor',
    description: 'A real person who follows your journey and is always available to help.',
  },
]

export default function ApplyPage() {
  const { user, loading } = useAuth()

  // Authenticated: redirect-style view
  if (!loading && user) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="font-display text-3xl font-bold text-text-primary tracking-tight">
          Welcome back, {user.firstName}
        </h1>
        <p className="mt-4 text-lg text-text-muted max-w-lg mx-auto">
          You are signed in. Head to your portal to continue your application or chat with our AI advisor.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/portal"
            className="w-full sm:w-auto px-8 py-3 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors shadow-sm"
          >
            Go to my portal
          </Link>
          <Link
            href="/portal/chat"
            className="w-full sm:w-auto px-8 py-3 text-sm font-semibold text-text-primary bg-surface-raised hover:bg-surface-sunken border border-border rounded-xl transition-colors"
          >
            Chat with AI advisor
          </Link>
        </div>
      </div>
    )
  }

  // Unauthenticated: value prop + sign in/register CTAs
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        {/* Left: value prop */}
        <div>
          <p className="text-sm font-semibold text-primary-600 tracking-wide uppercase mb-4">
            Start your journey
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-text-primary tracking-tight leading-tight">
            Your path to studying in France begins with a free consultation
          </h1>
          <p className="mt-5 text-lg text-text-muted leading-relaxed">
            Create your account to get matched with programs, receive a personalized assessment,
            and connect with a dedicated counsellor — all at no cost to start.
          </p>

          <div className="mt-10 space-y-6">
            {benefits.map((benefit, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="mt-0.5 w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">{benefit.title}</h3>
                  <p className="text-sm text-text-muted mt-0.5">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: CTA card */}
        <div className="bg-surface-raised rounded-2xl border border-border p-8 sm:p-10 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          <h2 className="font-display text-2xl font-bold text-text-primary tracking-tight mb-2">
            Get started for free
          </h2>
          <p className="text-sm text-text-muted mb-8">
            Create your student account and access personalized guidance within minutes.
          </p>

          <Link
            href="/auth/register"
            className="flex items-center justify-center w-full px-6 py-3.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors shadow-sm mb-4"
          >
            Create your account
          </Link>

          <p className="text-center text-sm text-text-muted">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>

          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-xs text-text-muted leading-relaxed">
              By creating an account you agree to our Terms of Service and Privacy Policy.
              Your data is handled securely and never shared with third parties without your consent.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
