'use client'

import { useState, useEffect } from 'react'

import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
  useStudentProfile,
  useUpdateProfile,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  type UpdateOwnProfilePayload,
} from '@/features/student-portal/hooks/use-student-portal'
import { useUserProfile, useUpdateUserProfile } from '@/features/settings/hooks/use-settings'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function englishTestLabel(type: string | null): string {
  const map: Record<string, string> = {
    ielts: 'IELTS',
    toefl: 'TOEFL',
    duolingo: 'Duolingo English Test',
    none: 'None',
  }
  return type ? (map[type] ?? type) : 'Not specified'
}

const ENGLISH_TEST_OPTIONS = [
  { value: '', label: 'Not specified' },
  { value: 'ielts', label: 'IELTS' },
  { value: 'toefl', label: 'TOEFL' },
  { value: 'duolingo', label: 'Duolingo English Test' },
  { value: 'none', label: 'None' },
]

export default function ProfilePage() {
  const { data: profile, isLoading: profileLoading } = useStudentProfile()
  const { data: userProfile, isLoading: userLoading } = useUserProfile()
  const [editing, setEditing] = useState(false)

  if (profileLoading || userLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-text-muted">Could not load your profile.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary font-display tracking-tight">
            My Profile
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Your academic and personal information.
          </p>
        </div>
        {!editing && (
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
            Edit Profile
          </Button>
        )}
      </div>

      {editing ? (
        <ProfileEditForm
          profile={profile}
          userProfile={userProfile ?? null}
          onClose={() => setEditing(false)}
        />
      ) : (
        <ProfileReadView profile={profile} />
      )}
    </div>
  )
}

// ─── Read-only view ──────────────────────────────────────────────

function ProfileReadView({ profile }: { profile: NonNullable<ReturnType<typeof useStudentProfile>['data']> }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ProfileField label="Reference Code" value={profile.referenceCode} mono />
          <ProfileField label="Member Since" value={formatDate(profile.createdAt)} />
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Academic Background</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ProfileField label="Degree Level" value={profile.degreeLevel} />
          <ProfileField label="Field of Study" value={profile.bachelorDegree} />
          <ProfileField label="GPA" value={profile.gpa != null ? `${profile.gpa} / 4.0` : null} mono />
          <ProfileField label="Graduation Year" value={profile.graduationYear?.toString()} mono />
          <ProfileField label="English Test" value={englishTestLabel(profile.englishTestType)} />
          <ProfileField label="English Score" value={profile.englishScore?.toString()} mono />
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Study Preferences</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ProfileField label="Preferred City" value={profile.preferredCity} />
          <ProfileField label="Preferred Intake" value={profile.preferredIntake} />
          <ProfileField
            label="Housing Needed"
            value={profile.housingNeeded != null ? (profile.housingNeeded ? 'Yes' : 'No') : null}
          />
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Financial Information</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ProfileField
            label="Budget Range"
            value={
              profile.budgetMin != null && profile.budgetMax != null
                ? `EUR ${profile.budgetMin.toLocaleString()} - ${profile.budgetMax.toLocaleString()}`
                : null
            }
            mono
          />
          <ProfileField label="Funding Route" value={profile.fundingRoute} />
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Communication Preferences</CardTitle>
        </CardHeader>
        <div className="flex flex-wrap gap-3">
          <ConsentBadge label="WhatsApp" granted={profile.whatsappConsent} />
          <ConsentBadge label="Email" granted={profile.emailConsent} />
          <ConsentBadge label="Parent Involvement" granted={profile.parentInvolvement} />
        </div>
      </Card>
    </div>
  )
}

// ─── Edit form ───────────────────────────────────────────────────

interface ProfileEditFormProps {
  profile: NonNullable<ReturnType<typeof useStudentProfile>['data']>
  userProfile: { firstName: string; lastName: string; phone: string | null } | null
  onClose: () => void
}

function ProfileEditForm({ profile, userProfile, onClose }: ProfileEditFormProps) {
  const updateProfile = useUpdateProfile()
  const updateUser = useUpdateUserProfile()
  const updateNotifPrefs = useUpdateNotificationPreferences()

  // Account fields (via /users/me)
  const [firstName, setFirstName] = useState(userProfile?.firstName ?? '')
  const [lastName, setLastName] = useState(userProfile?.lastName ?? '')
  const [phone, setPhone] = useState(userProfile?.phone ?? '')

  // Student profile fields (via PATCH /students/me)
  const [degreeLevel, setDegreeLevel] = useState(profile.degreeLevel ?? '')
  const [bachelorDegree, setBachelorDegree] = useState(profile.bachelorDegree ?? '')
  const [gpa, setGpa] = useState(profile.gpa?.toString() ?? '')
  const [graduationYear, setGraduationYear] = useState(profile.graduationYear?.toString() ?? '')
  const [englishTestType, setEnglishTestType] = useState(profile.englishTestType ?? '')
  const [englishScore, setEnglishScore] = useState(profile.englishScore?.toString() ?? '')
  const [preferredCity, setPreferredCity] = useState(profile.preferredCity ?? '')
  const [preferredIntake, setPreferredIntake] = useState(profile.preferredIntake ?? '')
  const [housingNeeded, setHousingNeeded] = useState(profile.housingNeeded ?? false)
  const [budgetMin, setBudgetMin] = useState(profile.budgetMin?.toString() ?? '')
  const [budgetMax, setBudgetMax] = useState(profile.budgetMax?.toString() ?? '')
  const [fundingRoute, setFundingRoute] = useState(profile.fundingRoute ?? '')

  // Notification prefs
  const [whatsappConsent, setWhatsappConsent] = useState(profile.whatsappConsent)
  const [emailConsent, setEmailConsent] = useState(profile.emailConsent)

  const [error, setError] = useState<string | null>(null)
  const saving = updateProfile.isPending || updateUser.isPending || updateNotifPrefs.isPending

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    try {
      // 1. Update account fields via /users/me
      const accountDirty =
        firstName !== (userProfile?.firstName ?? '') ||
        lastName !== (userProfile?.lastName ?? '') ||
        phone !== (userProfile?.phone ?? '')

      if (accountDirty) {
        await updateUser.mutateAsync({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim() || undefined,
        })
      }

      // 2. Update student profile via PATCH /students/me
      const studentData: UpdateOwnProfilePayload = {}
      if (degreeLevel) studentData.degreeLevel = degreeLevel
      if (bachelorDegree) studentData.bachelorDegree = bachelorDegree
      if (gpa) studentData.gpa = parseFloat(gpa)
      if (graduationYear) studentData.graduationYear = parseInt(graduationYear, 10)
      if (englishTestType) studentData.englishTestType = englishTestType as UpdateOwnProfilePayload['englishTestType']
      if (englishScore) studentData.englishScore = parseFloat(englishScore)
      if (preferredCity) studentData.preferredCity = preferredCity
      if (preferredIntake) studentData.preferredIntake = preferredIntake
      studentData.housingNeeded = housingNeeded
      if (budgetMin) studentData.budgetMin = parseInt(budgetMin, 10)
      if (budgetMax) studentData.budgetMax = parseInt(budgetMax, 10)
      if (fundingRoute) studentData.fundingRoute = fundingRoute

      if (Object.keys(studentData).length > 0) {
        await updateProfile.mutateAsync(studentData)
      }

      // 3. Update notification prefs if changed
      if (
        whatsappConsent !== profile.whatsappConsent ||
        emailConsent !== profile.emailConsent
      ) {
        await updateNotifPrefs.mutateAsync({ whatsappConsent, emailConsent })
      }

      onClose()
    } catch {
      setError('Failed to save changes. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Account fields */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldInput label="First Name" value={firstName} onChange={setFirstName} required />
          <FieldInput label="Last Name" value={lastName} onChange={setLastName} required />
          <FieldInput label="Phone" value={phone} onChange={setPhone} placeholder="Optional" />
        </div>
      </Card>

      {/* Academic */}
      <Card>
        <CardHeader>
          <CardTitle>Academic Background</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FieldInput label="Degree Level" value={degreeLevel} onChange={setDegreeLevel} placeholder="e.g. Bachelor" />
          <FieldInput label="Field of Study" value={bachelorDegree} onChange={setBachelorDegree} placeholder="e.g. Computer Science" />
          <FieldInput label="GPA" value={gpa} onChange={setGpa} placeholder="e.g. 3.5" type="number" step="0.01" />
          <FieldInput label="Graduation Year" value={graduationYear} onChange={setGraduationYear} placeholder="e.g. 2024" type="number" />
          <FieldSelect label="English Test" value={englishTestType} onChange={setEnglishTestType} options={ENGLISH_TEST_OPTIONS} />
          <FieldInput label="English Score" value={englishScore} onChange={setEnglishScore} placeholder="e.g. 7.0" type="number" step="0.1" />
        </div>
      </Card>

      {/* Study preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Study Preferences</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FieldInput label="Preferred City" value={preferredCity} onChange={setPreferredCity} placeholder="e.g. Paris" />
          <FieldInput label="Preferred Intake" value={preferredIntake} onChange={setPreferredIntake} placeholder="e.g. Fall 2025" />
          <div>
            <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">
              Housing Needed
            </label>
            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={housingNeeded}
                onChange={(e) => setHousingNeeded(e.target.checked)}
                className="rounded border-border text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-text-primary">I need help finding housing</span>
            </label>
          </div>
        </div>
      </Card>

      {/* Financial */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Information</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FieldInput label="Budget Min (EUR)" value={budgetMin} onChange={setBudgetMin} placeholder="e.g. 5000" type="number" />
          <FieldInput label="Budget Max (EUR)" value={budgetMax} onChange={setBudgetMax} placeholder="e.g. 15000" type="number" />
          <FieldInput label="Funding Route" value={fundingRoute} onChange={setFundingRoute} placeholder="e.g. Scholarship" />
        </div>
      </Card>

      {/* Communication prefs */}
      <Card>
        <CardHeader>
          <CardTitle>Communication Preferences</CardTitle>
        </CardHeader>
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={whatsappConsent}
              onChange={(e) => setWhatsappConsent(e.target.checked)}
              className="rounded border-border text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-text-primary">WhatsApp notifications</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={emailConsent}
              onChange={(e) => setEmailConsent(e.target.checked)}
              className="rounded border-border text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-text-primary">Email notifications</span>
          </label>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" loading={saving}>
          Save Changes
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        {error && <span className="text-xs text-rose-600 font-medium">{error}</span>}
      </div>
    </form>
  )
}

// ─── Shared components ───────────────────────────────────────────

function ProfileField({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-sm text-text-primary ${mono ? 'font-mono' : ''}`}>
        {value ?? <span className="text-text-muted italic">Not provided</span>}
      </p>
    </div>
  )
}

function ConsentBadge({ label, granted }: { label: string; granted: boolean }) {
  return (
    <Badge variant={granted ? 'success' : 'muted'} dot>
      {label}: {granted ? 'Opted in' : 'Opted out'}
    </Badge>
  )
}

function FieldInput({
  label, value, onChange, required, placeholder, type, step,
}: {
  label: string; value: string; onChange: (v: string) => void
  required?: boolean; placeholder?: string; type?: string; step?: string
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">{label}</label>
      <input
        type={type ?? 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        step={step}
        className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      />
    </div>
  )
}

function FieldSelect({
  label, value, onChange, options,
}: {
  label: string; value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}
