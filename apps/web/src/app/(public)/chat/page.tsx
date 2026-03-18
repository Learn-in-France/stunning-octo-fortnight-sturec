'use client'

import Link from 'next/link'
import { useAuth } from '@/providers/auth-provider'

const capabilities = [
  {
    title: 'Program recommendations',
    description: 'Based on your academic background, budget, and career goals.',
  },
  {
    title: 'Eligibility assessment',
    description: 'Understand your chances at different universities and programs.',
  },
  {
    title: 'Application guidance',
    description: 'What documents you need, timelines, and how to strengthen your profile.',
  },
  {
    title: 'Campus France walkthrough',
    description: 'Step-by-step support through the mandatory Campus France procedure.',
  },
  {
    title: 'Visa preparation',
    description: 'What to expect, how to prepare, and common pitfalls to avoid.',
  },
  {
    title: 'Life in France',
    description: 'Accommodation, cost of living, student life, and city comparisons.',
  },
]

export default function ChatPage() {
  const { user, loading } = useAuth()

  // If signed in, redirect to the actual chat
  if (!loading && user) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
        </div>
        <h1 className="font-display text-3xl font-bold text-text-primary tracking-tight">
          Your AI advisor is ready
        </h1>
        <p className="mt-4 text-lg text-text-muted max-w-lg mx-auto">
          Continue to your portal to start or resume your conversation.
        </p>
        <div className="mt-8">
          <Link
            href="/portal/chat"
            className="inline-block px-8 py-3 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors shadow-sm"
          >
            Open AI advisor
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      {/* Hero */}
      <div className="max-w-3xl mx-auto text-center mb-16">
        <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
          </svg>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
          Free personalized guidance from our AI advisor
        </h1>
        <p className="mt-5 text-lg text-text-muted leading-relaxed max-w-2xl mx-auto">
          Our AI advisor is trained on French higher education and is here to help you explore
          your options, understand requirements, and plan your path forward. It is like having a
          knowledgeable friend who knows the French education system inside out.
        </p>
      </div>

      {/* Capabilities grid */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="font-display text-xl font-semibold text-text-primary text-center mb-8">
          What the AI advisor can help with
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {capabilities.map((cap) => (
            <div
              key={cap.title}
              className="bg-surface-raised rounded-xl border border-border p-5"
            >
              <h3 className="text-sm font-semibold text-text-primary mb-1">{cap.title}</h3>
              <p className="text-xs text-text-muted leading-relaxed">{cap.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-lg mx-auto bg-surface-raised rounded-2xl border border-border p-8 sm:p-10 text-center shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
        <h2 className="font-display text-2xl font-bold text-text-primary tracking-tight mb-2">
          Sign in to start your consultation
        </h2>
        <p className="text-sm text-text-muted mb-8">
          Your conversation is private and secure. Create a free account to get started — no
          commitment required.
        </p>

        <Link
          href="/auth/register"
          className="flex items-center justify-center w-full px-6 py-3.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors shadow-sm mb-3"
        >
          Create free account
        </Link>
        <p className="text-sm text-text-muted">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-primary-600 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
