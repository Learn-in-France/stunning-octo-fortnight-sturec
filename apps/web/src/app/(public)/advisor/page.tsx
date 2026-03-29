'use client'

import Link from 'next/link'
import Image from 'next/image'

import { EditorialCard, MarketingCTA, MarketingHero } from '@/components/marketing/sections'
import { useAuth } from '@/providers/auth-provider'

const capabilities = [
  'Program discovery by degree, field, and budget',
  'Eligibility and profile assessment',
  'Campus France and visa process questions',
  'Timeline planning and next steps',
]

const steps = [
  {
    icon: 'login',
    title: 'Sign in',
    description: 'Create a free account with Google or email. Takes 30 seconds.',
  },
  {
    icon: 'chat',
    title: 'Chat',
    description: 'Tell the advisor about your background, goals, and questions. It responds with relevant programs, eligibility info, and next steps.',
  },
  {
    icon: 'handshake',
    title: 'Connect',
    description: 'When you\'re ready for deeper support — applications, strategy, or visa — a human counsellor takes over with your full context.',
  },
]

export default function AdvisorPage() {
  const { user, loading } = useAuth()

  if (!loading && user) {
    return (
      <div className="public-shell py-16 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <EditorialCard title="Your AI advisor is already available." tone="dark">
            <p className="text-base leading-8">
              Continue to the student portal to start a new session or resume an existing one.
            </p>
            <div className="mt-8">
              <Link href="/portal/chat" className="public-button-secondary !bg-white !text-public-navy">
                Open advisor
              </Link>
            </div>
          </EditorialCard>
        </div>
      </div>
    )
  }

  return (
    <>
      <MarketingHero
        label="AI advisor"
        title={
          <>
            Start with a conversation.{' '}
            <span className="public-accent">No commitment needed.</span>
          </>
        }
        description="Our AI advisor helps you explore programs, check eligibility, and understand the process. When you're ready for deeper support, a human counsellor takes over."
        actions={[
          { href: '/auth/register', label: 'Create free account' },
          { href: '/auth/login', label: 'Sign in', variant: 'secondary' },
        ]}
        aside={
          <div className="public-hero-image rotate-1 transition-transform duration-500 hover:rotate-0">
            <Image src="/images/hero-chat.webp" alt="Student chatting with AI advisor on laptop" width={1600} height={900} priority />
          </div>
        }
        footer={
          <EditorialCard title="What the advisor helps with" tone="tinted">
            <div className="space-y-3">
              {capabilities.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="public-dot" />
                  <p className="text-base">{item}</p>
                </div>
              ))}
            </div>
          </EditorialCard>
        }
      />

      <section className="py-16 sm:py-24">
        <div className="public-shell">
          <div className="mb-14 text-center">
            <h2 className="public-heading-section">Three steps to clarity.</h2>
            <div className="public-divider" />
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-public-slate">
              No forms, no pressure. Just a conversation that gets you answers.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className={`public-card public-card-lg relative overflow-hidden ${
                  index === 2 ? 'public-card-dark' : 'public-card-light'
                }`}
              >
                <span className="public-watermark">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className={`material-symbols-outlined ${index === 2 ? 'public-icon-accent' : 'public-icon'}`}>
                  {step.icon}
                </span>
                <h3 className="public-heading-card mt-6">{step.title}</h3>
                <p className={`mt-4 ${index === 2 ? 'public-body-dark' : 'public-body'}`}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-6 sm:py-10">
        <div className="public-shell">
          <div className="mx-auto max-w-3xl">
            <EditorialCard title="What stays private" tone="dark">
              <p className="text-base leading-8">
                Your conversations with the AI advisor are private. Counsellors never see your
                chat transcripts. They receive only a structured profile summary to provide
                better guidance. Your honesty helps us help you.
              </p>
            </EditorialCard>
          </div>
        </div>
      </section>

      <MarketingCTA
        label="Get started"
        title="Your future in France starts with one question."
        description="Create a free account and talk to our AI advisor. No pressure, no forms — just answers about programs, eligibility, and the path ahead."
        primary={{ href: '/auth/register', label: 'Create free account' }}
        secondary={{ href: '/auth/login', label: 'Sign in' }}
      />
    </>
  )
}
