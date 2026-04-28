'use client'

import { useState } from 'react'

import type { WebinarTokenPayload } from '@/lib/webinar-token'
import { env } from '@/lib/config/env'

const PROGRAMMES = [
  'Master in Management — Grande Ecole',
  'MSc — Artificial Intelligence & Digital Strategy Management',
  'MSc — Data Science & Organisational Behaviour',
  'MSc — Corporate Finance & Investment Banking',
  'MSc — International Business Development',
  'MSc — Sustainable Strategy Management & Environmental Change',
  'MSc — Arts & Cultural Management',
  'MSc — Media, Culture & Communication',
  'MBA',
  'Not sure yet',
] as const

const INTAKE_OPTIONS = [
  { value: 'sept_2026', label: 'September 2026 (next intake)' },
  { value: 'jan_2027', label: 'January 2027' },
  { value: 'sept_2027', label: 'September 2027' },
  { value: 'undecided', label: 'Still deciding' },
] as const

interface WebinarRsvpFormProps {
  prefilled: WebinarTokenPayload | null
  token: string | null
  onConfirmed: (payload: { firstName: string; email: string }) => void
}

export function WebinarRsvpForm({ prefilled, token, onConfirmed }: WebinarRsvpFormProps) {
  const [firstName, setFirstName] = useState(prefilled?.firstName ?? '')
  const [lastName, setLastName] = useState(prefilled?.lastName ?? '')
  const [email, setEmail] = useState(prefilled?.email ?? '')
  const [phone, setPhone] = useState(prefilled?.phone ?? '')
  const [city, setCity] = useState(prefilled?.city ?? '')
  const [programme, setProgramme] = useState(prefilled?.programme ?? '')
  const [intake, setIntake] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isPersonalised = Boolean(prefilled)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!firstName.trim() || !email.trim() || !intake) {
      setError('Please fill in name, email, and intake.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`${env.apiUrl}/api/v1/webinar/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          firstName: firstName.trim(),
          lastName: lastName.trim() || undefined,
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          city: city.trim() || undefined,
          programme: programme || undefined,
          intake,
          mauticId: prefilled?.mauticId,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Could not save your RSVP. Please try again.')
      }

      onConfirmed({ firstName: firstName.trim(), email: email.trim() })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-public-navy/15 bg-white p-6 shadow-[0_30px_60px_-30px_rgba(10,22,41,0.25)] sm:p-8"
      noValidate
    >
      <p className="public-phase-label !tracking-[0.18em] text-public-red">Reserve your seat</p>
      <h3 className="mt-2 text-2xl font-semibold tracking-tight text-public-navy">
        {isPersonalised ? `Hi ${firstName.split(' ')[0]}, you're almost in.` : 'Hi! Reserve your seat.'}
      </h3>
      <p className="mt-2 text-sm text-public-slate">
        {isPersonalised
          ? 'We pulled your details from our records. Edit anything if it changed, then pick your intake.'
          : 'Fill the details below and we’ll send your Microsoft Teams join link 24 hours before the session.'}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field
          label="First name"
          required
          value={firstName}
          onChange={setFirstName}
          autoComplete="given-name"
        />
        <Field
          label="Last name"
          value={lastName}
          onChange={setLastName}
          autoComplete="family-name"
        />
        <Field
          label="Email"
          type="email"
          required
          value={email}
          onChange={setEmail}
          autoComplete="email"
          className="sm:col-span-2"
        />
        <Field
          label="WhatsApp number"
          value={phone}
          onChange={setPhone}
          placeholder="+91 99999 99999"
          autoComplete="tel"
        />
        <Field label="City" value={city} onChange={setCity} autoComplete="address-level2" />

        <div className="sm:col-span-2">
          <label className="block text-xs font-medium uppercase tracking-[0.12em] text-public-blue">
            Programme of interest
          </label>
          <select
            value={programme}
            onChange={(e) => setProgramme(e.target.value)}
            className="mt-1.5 block w-full rounded-lg border border-public-navy/20 bg-white px-3 py-2.5 text-sm text-public-navy focus:border-public-blue focus:outline-none focus:ring-2 focus:ring-public-blue/20"
          >
            <option value="">Pick a programme (or leave blank)</option>
            {PROGRAMMES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-public-red/30 bg-public-red/5 p-4">
        <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-public-red">
          When do you plan to start your Master&rsquo;s? *
        </label>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {INTAKE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                intake === opt.value
                  ? 'border-public-red bg-white text-public-navy ring-2 ring-public-red/30'
                  : 'border-public-navy/15 bg-white/50 text-public-slate hover:bg-white'
              }`}
            >
              <input
                type="radio"
                name="intake"
                value={opt.value}
                checked={intake === opt.value}
                onChange={() => setIntake(opt.value)}
                className="h-4 w-4 accent-public-red"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-public-red/10 px-3 py-2 text-sm text-public-red">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="public-button-primary mt-6 w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'Confirming…' : 'Confirm my seat'}
      </button>

      <p className="mt-4 text-xs leading-5 text-public-muted">
        We&rsquo;ll send the Microsoft Teams join link to your email and WhatsApp 24 hours before
        the session. By submitting, you agree to receive event-related email and WhatsApp messages
        from Learn in France. Unsubscribe anytime.
      </p>
    </form>
  )
}

interface FieldProps {
  label: string
  required?: boolean
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  autoComplete?: string
  className?: string
}

function Field({
  label,
  required,
  value,
  onChange,
  type = 'text',
  placeholder,
  autoComplete,
  className = '',
}: FieldProps) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium uppercase tracking-[0.12em] text-public-blue">
        {label}
        {required && <span className="ml-1 text-public-red">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className="mt-1.5 block w-full rounded-lg border border-public-navy/20 bg-white px-3 py-2.5 text-sm text-public-navy placeholder:text-public-muted focus:border-public-blue focus:outline-none focus:ring-2 focus:ring-public-blue/20"
      />
    </div>
  )
}
