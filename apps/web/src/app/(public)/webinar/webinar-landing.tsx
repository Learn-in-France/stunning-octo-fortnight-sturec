'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'

import { decodeWebinarToken } from '@/lib/webinar-token'
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
    <section className="relative overflow-hidden pt-10 pb-10 sm:pt-14 sm:pb-14">
      <div className="public-shell">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <span className="public-label">Live Webinar · Free</span>
            <h1 className="public-heading-section mt-5 !text-4xl leading-[0.98] sm:!text-5xl lg:!text-[4.2rem]">
              From India to France.
              <br />
              <span className="public-accent">Your journey begins here.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-public-slate sm:text-lg sm:leading-8">
              Hear from a Burgundy School of Business alumnus, a BSB representative, and a senior
              industry professional with 15+ years building a career in France. 45 minutes of
              straight talk on programmes, scholarships, careers, and life after graduation — plus
              20 minutes of live Q&amp;A, moderated by Learn in France.
            </p>

            <div className="mt-7 flex flex-wrap gap-2.5 text-sm font-medium text-public-navy">
              <MetaChip icon="event" text="Sunday, 11 May 2026" />
              <MetaChip icon="schedule" text="6:00 PM IST · 45 min + Q&A" />
              <MetaChip icon="videocam" text="Live on Microsoft Teams" />
            </div>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-public-red px-4 py-1.5 text-sm font-semibold text-white shadow-[0_8px_24px_-12px_rgba(200,16,46,0.6)]">
              <span className="material-symbols-outlined !text-[1.05rem] !leading-none">local_fire_department</span>
              Only 200 seats — RSVP to reserve yours
            </div>
          </div>

          <PartnershipLockup />
        </div>
      </div>
    </section>
  )
}

function PartnershipLockup() {
  return (
    <div className="relative">
      <div className="overflow-hidden rounded-3xl border border-public-navy/10 bg-white shadow-[0_30px_80px_-40px_rgba(10,22,41,0.35)]">
        <div className="flex flex-col items-center justify-center gap-8 px-6 py-10 text-center sm:px-10 sm:py-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-public-muted">
            A live conversation by
          </p>
          <div className="flex w-full max-w-full flex-col items-center justify-center gap-6 sm:flex-row sm:gap-7">
            <Image
              src="/images/brand-wordmark-square.svg"
              alt="Learn in France"
              width={120}
              height={120}
              className="h-24 w-24 shrink-0 sm:h-28 sm:w-28"
              priority
            />
            <span className="text-2xl font-light text-public-navy/30 sm:text-3xl">×</span>
            <Image
              src="/images/bsb-logo.svg"
              alt="Burgundy School of Business"
              width={300}
              height={46}
              className="h-9 w-auto max-w-[260px] shrink sm:h-11 sm:max-w-[300px]"
              priority
            />
          </div>
          <div className="mt-2 max-w-sm border-t border-public-navy/10 pt-5">
            <p className="text-sm leading-6 text-public-slate">
              Learn in France is a France-based education advisory and an official India partner of
              Burgundy School of Business.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetaChip({ icon, text }: { icon: string; text: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-public-navy/15 bg-white/70 px-3.5 py-1.5">
      <span className="material-symbols-outlined !text-[1.05rem] !leading-none text-public-red">{icon}</span>
      {text}
    </span>
  )
}

function PanelStrip() {
  const panel = [
    { role: 'BSB Alumni', detail: 'Master\'s graduate, BSB Dijon', initials: 'BA' },
    { role: 'Senior Industry Professional', detail: 'India to France · 15+ years senior career', initials: 'SP' },
    { role: 'BSB Representative', detail: 'Burgundy School of Business', initials: 'BR' },
    { role: 'Learn in France', detail: 'Moderator', initials: 'LIF' },
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
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-public-navy/90 text-sm font-bold text-public-cream">
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
      title: 'Inside BSB — alumni perspective',
      body:
        'A recent BSB graduate on what the experience was actually like — admissions, campus life, costs, French bureaucracy, and the things only graduates know.',
    },
    {
      icon: 'apartment',
      title: 'Direct from BSB',
      body:
        'A representative from Burgundy School of Business on programmes, intakes, application paths, and what a strong applicant looks like.',
    },
    {
      icon: 'work',
      title: 'Career outcomes — from a senior who built one',
      body:
        'A senior industry professional with 15+ years in France on language, hiring culture, salary expectations, and how to plan for life after graduation.',
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
        Designed for Indian students and parents exploring graduate and Master&rsquo;s programmes in
        France. Whether you&rsquo;re set on France or still comparing — leave with clarity to decide.
      </p>
      <ul className="mt-8 space-y-5">
        {points.map((p) => (
          <li key={p.title} className="flex gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-public-red/10 text-public-red">
              <span className="material-symbols-outlined !text-[1.4rem] !leading-none">{p.icon}</span>
            </span>
            <div className="min-w-0 pt-1">
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
          Indian students and parents considering a Bachelor&rsquo;s, Master&rsquo;s, MSc, MiM, or
          MBA at a top French business school. Set on France or still exploring — this session
          gives you the clarity to decide.
        </p>
      </div>
    </div>
  )
}

function TrustStrip() {
  const items = [
    { icon: 'verified', label: 'Triple Accredited', sub: 'AACSB · EQUIS · AMBA' },
    { icon: 'trending_up', label: 'Top 50 Worldwide', sub: 'Financial Times' },
    { icon: 'public', label: 'Powered by LIF', sub: 'France based' },
    { icon: 'check_circle', label: '100% Free', sub: 'No obligation' },
  ]
  return (
    <section className="border-y border-public-navy/10 bg-white/60 py-8 sm:py-10">
      <div className="public-shell">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it) => (
            <div key={it.label} className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-public-blue/10 text-public-blue">
                <span className="material-symbols-outlined !text-[1.25rem] !leading-none">{it.icon}</span>
              </span>
              <div className="min-w-0">
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
            A France based education advisory.
          </h3>
          <p className="mt-3 max-w-3xl text-public-slate">
            We guide Indian students through the complete journey — programme selection,
            application, scholarships, Campus France interview prep, visa, accommodation, and
            on-ground arrival support in France. Burgundy School of Business is one of our
            university partners.
          </p>
          <p className="mt-5 text-sm text-public-slate">
            <a
              href="https://www.learninfrance.com"
              className="text-public-navy underline decoration-public-navy/30 decoration-1 underline-offset-4 hover:decoration-public-navy"
            >
              learninfrance.com
            </a>
            <span className="mx-2 text-public-muted">·</span>
            <a
              href="https://cal.com/learninfrance"
              className="text-public-navy underline decoration-public-navy/30 decoration-1 underline-offset-4 hover:decoration-public-navy"
            >
              Free guidance call
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}
