'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { AuthGuard } from '@/lib/guards/auth-guard'
import { RoleGuard } from '@/lib/guards/role-guard'
import { useAuth } from '@/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
  useCompleteOnboarding,
  useStudentProfile,
} from '@/features/student-portal/hooks/use-student-portal'

// A short curated list of dial codes — the markets that actually
// matter for Learn in France right now. We default to one of these
// based on existing student data or browser locale.
const COUNTRY_OPTIONS: Array<{ code: string; label: string; locale?: string }> = [
  { code: '91', label: 'India (+91)', locale: 'en-IN' },
  { code: '33', label: 'France (+33)', locale: 'fr' },
  { code: '1', label: 'United States / Canada (+1)' },
  { code: '44', label: 'United Kingdom (+44)', locale: 'en-GB' },
  { code: '971', label: 'United Arab Emirates (+971)' },
  { code: '966', label: 'Saudi Arabia (+966)' },
  { code: '20', label: 'Egypt (+20)' },
  { code: '212', label: 'Morocco (+212)' },
  { code: '234', label: 'Nigeria (+234)' },
  { code: '255', label: 'Tanzania (+255)' },
  { code: '880', label: 'Bangladesh (+880)' },
  { code: '92', label: 'Pakistan (+92)' },
  { code: '977', label: 'Nepal (+977)' },
  { code: '94', label: 'Sri Lanka (+94)' },
  { code: '82', label: 'South Korea (+82)' },
  { code: '86', label: 'China (+86)' },
  { code: '49', label: 'Germany (+49)' },
  { code: '34', label: 'Spain (+34)' },
  { code: '39', label: 'Italy (+39)' },
  { code: '7', label: 'Russia (+7)' },
]

/** Pick the best default country code: existing phone → browser locale → +91. */
function pickDefaultCountryCode(existingPhone: string | null): string {
  if (existingPhone) {
    const match = COUNTRY_OPTIONS.find((c) => existingPhone.startsWith(`+${c.code}`))
    if (match) return match.code
  }
  if (typeof navigator !== 'undefined') {
    const lang = navigator.language?.toLowerCase() ?? ''
    const localeMatch = COUNTRY_OPTIONS.find((c) => c.locale && lang.startsWith(c.locale.toLowerCase()))
    if (localeMatch) return localeMatch.code
  }
  return '91'
}

/** Strip the country code from an existing E.164 phone, returning the local part only. */
function extractLocalPart(existingPhone: string | null, dialCode: string): string {
  if (!existingPhone) return ''
  const prefix = `+${dialCode}`
  if (existingPhone.startsWith(prefix)) return existingPhone.slice(prefix.length)
  return ''
}

export default function StudentOnboardingPage() {
  return (
    <AuthGuard>
      <RoleGuard allowed={['student']}>
        <OnboardingForm />
      </RoleGuard>
    </AuthGuard>
  )
}

function OnboardingForm() {
  const router = useRouter()
  const { user } = useAuth()
  const { data: profile, isLoading } = useStudentProfile()
  const completeOnboarding = useCompleteOnboarding()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [countryDialCode, setCountryDialCode] = useState('91')
  const [phoneLocal, setPhoneLocal] = useState('')
  // Tri-state: null = no choice yet (blocks submit), boolean = explicit decision
  const [whatsappConsent, setWhatsappConsent] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  // If the student is already onboarded (e.g. they navigated here directly),
  // bounce them back to the portal home.
  useEffect(() => {
    if (profile?.onboardingCompletedAt) {
      router.replace('/portal')
    }
  }, [profile?.onboardingCompletedAt, router])

  // Prefill from the API profile (preferred) or the auth user as a fallback.
  // Effect runs once when the profile lands so we don't fight the user's edits.
  const initialDial = useMemo(
    () => pickDefaultCountryCode(profile?.phone ?? null),
    [profile?.phone],
  )
  useEffect(() => {
    if (!profile) return
    setFirstName((prev) => prev || profile.firstName || user?.firstName || '')
    setLastName((prev) => prev || profile.lastName || user?.lastName || '')
    setCountryDialCode((prev) => (prev === '91' ? initialDial : prev))
    setPhoneLocal((prev) => prev || extractLocalPart(profile.phone, initialDial))
    // intentionally narrow deps to first profile arrival
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  if (isLoading) {
    return (
      <div className="public-page flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const canSubmit =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    phoneLocal.replace(/\D/g, '').length >= 6 &&
    whatsappConsent !== null &&
    !completeOnboarding.isPending

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || whatsappConsent === null) return
    setError(null)
    try {
      await completeOnboarding.mutateAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        countryDialCode,
        phoneLocal: phoneLocal.trim(),
        whatsappConsent,
      })
      router.replace('/portal')
    } catch (err: unknown) {
      const apiError = err as { code?: string; message?: string }
      if (apiError?.code === 'INVALID_PHONE') {
        setError("That phone number doesn't look right. Please check the country code and try again.")
      } else {
        setError('Something went wrong. Please try again.')
      }
    }
  }

  return (
    <div className="public-page min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg rounded-[28px] border border-white/60 bg-white/85 p-8 shadow-[0_24px_72px_rgba(10,22,41,0.10)] backdrop-blur">
        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
            Welcome
          </p>
          <h1 className="mt-2 font-display text-2xl font-semibold tracking-[-0.02em] text-text-primary">
            Please complete your profile
          </h1>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            Just a few quick details to get you set up.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="As it appears on your passport"
              required
            />
            <Input
              label="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Family name"
              required
            />
          </div>

          <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-3">
            <Select
              label="Country code"
              value={countryDialCode}
              onChange={(e) => setCountryDialCode(e.target.value)}
              options={COUNTRY_OPTIONS.map((c) => ({ value: c.code, label: c.label }))}
            />
            <Input
              label="Phone number"
              type="tel"
              inputMode="tel"
              value={phoneLocal}
              onChange={(e) => setPhoneLocal(e.target.value)}
              placeholder="98765 43210"
              required
            />
          </div>

          <fieldset className="rounded-2xl border border-border bg-surface-sunken/35 p-4">
            <legend className="px-2 text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
              WhatsApp
            </legend>
            <p className="mt-1 text-sm leading-6 text-text-secondary">
              Can we reach you on WhatsApp?
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="whatsapp-consent"
                  checked={whatsappConsent === true}
                  onChange={() => setWhatsappConsent(true)}
                />
                <span>Yes</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="whatsapp-consent"
                  checked={whatsappConsent === false}
                  onChange={() => setWhatsappConsent(false)}
                />
                <span>No</span>
              </label>
            </div>
          </fieldset>

          <Button
            type="submit"
            size="lg"
            className="w-full rounded-full"
            loading={completeOnboarding.isPending}
            disabled={!canSubmit}
          >
            Continue to my dashboard
          </Button>
        </form>
      </div>
    </div>
  )
}
