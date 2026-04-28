'use client'

import { useMemo, useState } from 'react'

import { decodeWebinarToken, type WebinarTokenPayload } from '@/lib/webinar-token'
import { WebinarRsvpForm } from './webinar-form'
import { WebinarConfirmation } from './webinar-confirmation'

interface WebinarLandingProps {
  token: string | null
}

export function WebinarLanding({ token }: WebinarLandingProps) {
  const prefilled = useMemo(() => decodeWebinarToken(token), [token])
  const [confirmedFor, setConfirmedFor] = useState<{ firstName: string; email: string } | null>(null)

  return (
    <div className="public-page pb-20">
      <Hero />
      <PanelStrip />

      <section className="py-12 sm:py-16">
        <div className="public-shell">
          <div className="grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:items-start">
            <WhatYouLearn />

            <div className="lg:sticky lg:top-24">
              {confirmedFor ? (
                <WebinarConfirmation firstName={confirmedFor.firstName} email={confirmedFor.email} />
              ) : (
                <WebinarRsvpForm
                  prefilled={prefilled}
                  token={token}
                  onConfirmed={(payload) => setConfirmedFor(payload)}
                />
              )}
            </div>
          </div>
        </div>
      </section>

      <TrustStrip />
      <AboutLif />
    </div>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden pt-12 pb-10 sm:pt-16 sm:pb-12">
      <div className="public-shell">
        <span className="public-label">Live Webinar · Free</span>
        <h1 className="public-heading-section mt-6 !text-4xl leading-[0.98] sm:!text-5xl lg:!text-[4.4rem]">
          From India to France.
          <br />
          <span className="public-accent">Your Master&rsquo;s journey starts here.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-public-slate">
          Hear from current Burgundy School of Business students, an Indian professional living in
          France, and the Learn in France advisory team. 45 minutes of straight talk on programmes,
          scholarships, careers, and life after graduation — plus 20 minutes of live Q&amp;A.
        </p>
        <div className="mt-7 flex flex-col gap-2 text-sm font-medium text-public-navy sm:flex-row sm:items-center sm:gap-6">
          <span className="inline-flex items-center gap-2">
            <span className="material-symbols-rounded text-public-red">event</span>
            Sunday, 11 May 2026
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="material-symbols-rounded text-public-red">schedule</span>
            6:00 PM IST · 45 min + Q&amp;A
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="material-symbols-rounded text-public-red">videocam</span>
            Live on Microsoft Teams
          </span>
        </div>
        <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-public-red">
          <span className="material-symbols-rounded">local_fire_department</span>
          Only 200 seats — RSVP to reserve yours
        </p>
      </div>
    </section>
  )
}

function PanelStrip() {
  const panel = [
    {
      role: 'BSB Student Ambassador',
      detail: 'Current Master\'s student, Dijon',
      initials: 'BS',
    },
    {
      role: 'BSB Student Ambassador',
      detail: 'Current Master\'s student, Dijon',
      initials: 'BS',
    },
    {
      role: 'Indian Professional in France',
      detail: '14 years living & working in France',
      initials: 'IP',
    },
    {
      role: 'Learn in France',
      detail: 'Founder · Moderator',
      initials: 'PK',
    },
  ]

  return (
    <section className="border-y border-public-navy/10 bg-public-mist/40 py-8 sm:py-10">
      <div className="public-shell">
        <p className="public-phase-label !tracking-[0.18em]">Meet the panel</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {panel.map((p, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-2xl border border-public-navy/10 bg-white/70 p-4 backdrop-blur"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-public-navy/90 text-sm font-bold text-public-cream">
                {p.initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-public-navy">{p.role}</p>
                <p className="truncate text-xs text-public-muted">{p.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function WhatYouLearn() {
  const points = [
    {
      icon: 'travel_explore',
      title: 'Why France, why Dijon, why BSB',
      body:
        '2-year post-study work visa, ~40% lower cost than UK, triple-accredited school in the top 50 globally. The case for France in plain numbers.',
    },
    {
      icon: 'school',
      title: 'Student Q&A — the honest version',
      body:
        'Two BSB students share what nobody else tells you: admissions, campus life, costs, French bureaucracy, and the surprises in year one.',
    },
    {
      icon: 'work',
      title: 'Career outcomes from someone who lived it',
      body:
        'An Indian professional with 14 years in France on language, hiring culture, salary expectations, and how to plan for life after graduation.',
    },
    {
      icon: 'paid',
      title: 'BSB scholarships through Learn in France',
      body:
        'How we determine your scholarship band, what the merit criteria are, and how to position your application to qualify.',
    },
    {
      icon: 'forum',
      title: '20 minutes of live Q&A',
      body:
        'Open mic. Ask the panel anything — admissions, visas, jobs, life. We answer until the timer runs out.',
    },
  ]

  return (
    <div>
      <span className="public-label">What you&rsquo;ll get</span>
      <h2 className="public-heading-section mt-4 !text-3xl sm:!text-4xl">
        45 minutes that save you weeks of research
      </h2>
      <p className="mt-4 max-w-xl text-public-slate">
        Designed for Indian students and parents exploring Master&rsquo;s programmes in France.
        Whether you&rsquo;re set on France or still comparing — leave with clarity to decide.
      </p>
      <ul className="mt-8 space-y-5">
        {points.map((p) => (
          <li key={p.title} className="flex gap-4">
            <span className="material-symbols-rounded mt-0.5 text-public-red">{p.icon}</span>
            <div>
              <p className="text-base font-semibold text-public-navy">{p.title}</p>
              <p className="mt-1 text-sm leading-6 text-public-slate">{p.body}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-8 rounded-2xl border border-public-navy/10 bg-public-cream/60 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-public-blue">
          Who is this for
        </p>
        <p className="mt-2 text-sm leading-6 text-public-slate">
          Indian students (and parents) considering a Master&rsquo;s, MSc, or MiM at a top French
          business school. Set on France or still exploring — this session gives you the clarity to
          decide.
        </p>
      </div>
    </div>
  )
}

function TrustStrip() {
  const items = [
    { icon: 'verified', label: 'Triple Accredited', sub: 'AACSB · EQUIS · AMBA' },
    { icon: 'trending_up', label: 'Top 50 Worldwide', sub: 'Financial Times' },
    { icon: 'public', label: 'Powered by LIF', sub: 'France & India based' },
    { icon: 'check_circle', label: '100% Free', sub: 'No obligation' },
  ]
  return (
    <section className="border-y border-public-navy/10 bg-white/60 py-8">
      <div className="public-shell">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it) => (
            <div key={it.label} className="flex items-center gap-3">
              <span className="material-symbols-rounded text-public-blue">{it.icon}</span>
              <div>
                <p className="text-sm font-semibold text-public-navy">{it.label}</p>
                <p className="text-xs text-public-muted">{it.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function AboutLif() {
  return (
    <section className="py-12">
      <div className="public-shell">
        <div className="rounded-3xl border border-public-navy/10 bg-public-cream/60 p-8 sm:p-10">
          <p className="public-phase-label !tracking-[0.18em]">About Learn in France</p>
          <h3 className="public-heading-card mt-3 !text-2xl">
            A France &amp; India based education advisory.
          </h3>
          <p className="mt-3 max-w-3xl text-public-slate">
            We guide Indian students through the complete journey — programme selection,
            application, scholarships, Campus France interview prep, visa, accommodation, and
            on-ground arrival support in France. Burgundy School of Business is one of our
            university partners.
          </p>
          <p className="mt-4 text-sm text-public-muted">
            <a href="https://www.learninfrance.com" className="underline hover:text-public-navy">
              learninfrance.com
            </a>
            {' · '}
            <a
              href="https://cal.com/learninfrance"
              className="underline hover:text-public-navy"
            >
              Free guidance call
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}
