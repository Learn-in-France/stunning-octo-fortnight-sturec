'use client'

import Link from 'next/link'

import { EditorialCard, MarketingHero, SectionHeading } from '@/components/marketing/sections'
import { useAuth } from '@/providers/auth-provider'

const capabilities = [
  'Program discovery by degree, field, language, and city',
  'Eligibility and profile-strength discussions',
  'Campus France and visa process questions',
  'Document and timeline guidance',
  'Living in France: housing, cost, and city tradeoffs',
  'A smooth handoff into the student portal once registered',
]

export default function ChatPage() {
  const { user, loading } = useAuth()

  if (!loading && user) {
    return (
      <div className="public-shell py-14 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <EditorialCard title="Your AI advisor is already available." tone="dark">
            <p className="text-base leading-8 text-white/78">
              Continue to the student portal to start a new session or resume an existing one.
            </p>
            <div className="mt-8">
              <Link href="/portal/chat" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[var(--color-public-navy)]">
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
        title={<>Start the conversation before you know every answer.</>}
        description="The AI advisor is built for the early and middle parts of the journey: comparing options, clarifying requirements, understanding timelines, and helping students translate uncertainty into concrete next steps."
        actions={[
          { href: '/auth/register', label: 'Create free account' },
          { href: '/auth/login', label: 'Sign in', variant: 'secondary' },
        ]}
        aside={
          <EditorialCard title="Best used for" tone="tinted">
            <div className="space-y-3">
              {capabilities.slice(0, 4).map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-public-teal)]" />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </EditorialCard>
        }
      />

      <section className="py-12 sm:py-18">
        <div className="public-shell">
          <SectionHeading
            label="Capabilities"
            title="Useful when you need clarity fast."
            description="The advisor is strongest when it helps a student orient themselves, narrow the search space, and prepare better questions for the human team."
            align="center"
          />
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((capability, index) => (
              <EditorialCard key={capability} title={`0${index + 1}`} tone={index === 2 ? 'dark' : 'light'}>
                <p>{capability}</p>
              </EditorialCard>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
