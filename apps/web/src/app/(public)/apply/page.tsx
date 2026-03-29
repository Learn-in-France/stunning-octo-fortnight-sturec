'use client'

import Link from 'next/link'

import { EditorialCard, MarketingHero } from '@/components/marketing/sections'
import { BrandName } from '@/components/branding/brand-logo'
import { useAuth } from '@/providers/auth-provider'

const benefits = [
  'Get a structured profile instead of scattered notes',
  'Receive guidance on program fit and admissions timing',
  'Track documents, requirements, bookings, and next actions',
  'Get personal guidance tailored to your situation',
]

export default function ApplyPage() {
  const { user, loading } = useAuth()

  if (!loading && user) {
    return (
      <div className="public-shell py-14 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <EditorialCard title={`Welcome back, ${user.firstName}.`} tone="dark">
            <p className="text-base leading-8 text-white/78">
              You already have an account. Continue in your portal to manage progress, speak with
              the AI advisor, or move your application forward.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/portal" className="rounded-full bg-white px-6 py-3 text-center text-sm font-semibold text-[var(--color-public-navy)]">
                Open my portal
              </Link>
              <Link href="/portal/chat" className="rounded-full border border-white/18 px-6 py-3 text-center text-sm font-semibold text-white">
                Open AI advisor
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
        label="Get started"
        title={<>Start with a student account that carries the whole process.</>}
        description={<>Creating an account is where exploration becomes action. Once you register, <BrandName /> can save your progress, guide your next steps, and keep everything visible as you move forward.</>}
        actions={[
          { href: '/auth/register', label: 'Create free account' },
          { href: '/auth/login', label: 'I already have one', variant: 'secondary' },
        ]}
        aside={
          <EditorialCard title="Why register early" tone="tinted">
            <div className="space-y-3">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-public-blue)]" />
                  <p>{benefit}</p>
                </div>
              ))}
            </div>
          </EditorialCard>
        }
      />

      <div className="public-shell pb-20">
        <div className="public-panel max-w-3xl p-8 sm:p-10">
          <p className="text-sm leading-7 text-[color:var(--color-public-slate)]">
            You can register with email and password or Google. Once inside, you will have access
            to the AI advisor, document uploads, and counsellor booking.
          </p>
        </div>
      </div>
    </>
  )
}
