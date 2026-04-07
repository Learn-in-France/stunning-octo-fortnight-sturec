import Image from 'next/image'
import type { Metadata } from 'next'

import { EditorialCard, MarketingCTA, MarketingHero } from '@/components/marketing/sections'

export const metadata: Metadata = {
  title: 'Your Journey to France — 5-Phase Process from Application to Arrival | Learn in France',
  description: 'From first conversation to first week in France. Our structured 5-phase process covers profile assessment, applications, Campus France, visa, and on-ground arrival support.',
  alternates: { canonical: 'https://learninfrance.com/your-journey' },
  openGraph: {
    title: 'Your Journey to France — 5 Clear Phases',
    description: 'Structured 5-phase process: profile assessment, applications, Campus France, visa preparation, and arrival support with our team on the ground in France.',
    url: 'https://learninfrance.com/your-journey',
  },
}

const phases = [
  {
    icon: 'person_search',
    title: 'Understand your starting point',
    body: 'We look at your academic background, budget, language level, and timeline. The goal is a realistic picture of what\'s possible — not a generic brochure.',
    steps: [
      'Profile and eligibility assessment',
      'Budget and timeline discussion',
      'Initial program shortlisting',
    ],
  },
  {
    icon: 'school',
    title: 'Match to the right program',
    body: 'We connect you with curated programs from our university partners that fit your profile. Then we help you build a strong application — documents, motivation, and counsellor review.',
    steps: [
      'Program matching based on your profile',
      'Document preparation and review',
      'Application submission with counsellor support',
    ],
  },
  {
    icon: 'description',
    title: 'Campus France and admin',
    body: 'For students in CEF countries, Campus France is one of the most important steps. We help with the dossier, timing, and interview so this doesn\'t become a bottleneck.',
    steps: [
      'Etudes en France dossier setup',
      'Interview preparation',
      'Application tracking and follow-up',
    ],
  },
  {
    icon: 'flight_takeoff',
    title: 'Visa, finances, and pre-departure',
    body: 'Visa requirements vary by country, but the pattern is the same: students who prepare in layers instead of scrambling have fewer problems. We help you sequence it right.',
    steps: [
      'Financial evidence and proof of funds',
      'Accommodation planning',
      'Visa application support and pre-departure logistics',
    ],
  },
  {
    icon: 'location_on',
    title: 'Our team in France is waiting for you',
    body: 'Support doesn\'t end at the visa. Our team on the ground helps with housing, administrative registration, orientation, and getting settled in your new city. This is where most agencies disappear. We don\'t.',
    steps: [
      'Housing setup and move-in support',
      'Administrative registration (bank, insurance, CAF)',
      'City orientation and settling in',
    ],
  },
]

export default function YourJourneyPage() {
  return (
    <>
      <MarketingHero
        label="Your journey"
        title={
          <>
            From first question to{' '}
            <span className="public-accent">first week in France.</span>
          </>
        }
        description="We structured the process into five clear phases so nothing falls through the cracks. Our team supports you at every stage — including after you arrive."
        actions={[
          { href: '/auth/register', label: 'Talk to AI advisor' },
          { href: '/auth/login', label: 'Sign in', variant: 'secondary' },
        ]}
        aside={
          <div className="overflow-hidden rounded-[var(--radius-card)] shadow-card rotate-1 transition-transform duration-500 hover:rotate-0">
            <Image
              src="/images/journey-phases.webp"
              alt="Five phases of the student journey: Explore, Apply, Navigate, Prepare, Arrive"
              width={2198}
              height={1920}
              className="w-full object-cover"
              priority
            />
          </div>
        }
        footer={
          <EditorialCard title="What makes this different" tone="dark">
            <p className="text-base leading-8">
              Most agencies help you apply and disappear. We stay with you through Campus France,
              visa, and arrival. Our team in France is there when you land.
            </p>
          </EditorialCard>
        }
      />

      <section className="py-16 sm:py-24">
        <div className="public-shell">
          <div className="mb-14 text-center">
            <h2 className="public-heading-section">
              Five phases. Each one builds on the last.
            </h2>
            <div className="public-divider" />
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-public-slate">
              Students do better when the process is broken into clear stages instead of one overwhelming checklist.
            </p>
          </div>
          <div className="space-y-5">
            {phases.map((phase, index) => {
              const isLast = index === phases.length - 1
              return (
                <div
                  key={phase.title}
                  className={`public-card relative overflow-hidden ${
                    isLast ? 'public-card-dark' : 'public-card-light'
                  }`}
                >
                  <span className="public-watermark">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_1fr] lg:items-start">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className={`material-symbols-outlined ${isLast ? 'public-icon-accent' : 'public-icon'}`}>
                          {phase.icon}
                        </span>
                        <p className="public-phase-label">
                          Phase {String(index + 1).padStart(2, '0')}
                        </p>
                      </div>
                      <h3 className={`public-heading-card mt-4 !text-2xl sm:!text-3xl ${isLast ? 'text-white' : 'text-public-navy'}`}>
                        {phase.title}
                      </h3>
                      <p className={`mt-4 ${isLast ? 'public-body-dark' : 'public-body'}`}>
                        {phase.body}
                      </p>
                    </div>
                    <div className="space-y-3">
                      {phase.steps.map((step) => (
                        <div key={step} className="flex items-start gap-3">
                          <span className={isLast ? 'public-dot-red' : 'public-dot'} />
                          <p className={isLast ? 'public-body-dark' : 'public-body'}>
                            {step}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <MarketingCTA
        label="Ready to start"
        title="The first step is a conversation."
        description="Talk to our AI advisor to understand where you stand, what programs fit, and what the process looks like for your situation."
        primary={{ href: '/auth/register', label: 'Talk to AI advisor' }}
        secondary={{ href: '/auth/login', label: 'Sign in' }}
      />
    </>
  )
}
