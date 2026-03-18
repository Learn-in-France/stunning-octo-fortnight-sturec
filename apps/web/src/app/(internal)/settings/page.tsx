'use client'

import { useState, useEffect } from 'react'

import { PageHeader } from '@/components/layout/page-header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Tabs } from '@/components/ui/tabs'
import { RoleGuard } from '@/lib/guards/role-guard'
import { useUserProfile, useUpdateUserProfile } from '@/features/settings/hooks/use-settings'
import { useIntegrationHealth, type IntegrationCheck } from '@/features/ops/hooks/use-ops'

// ─── Integration status (live from API) ──────────────────────────

const INTEGRATION_META: Record<string, { title: string; description: string }> = {
  mautic: { title: 'Mautic', description: 'CRM sync configuration and webhook settings.' },
  calcom: { title: 'Cal.com', description: 'Booking integration and counsellor calendar connections.' },
  whatsapp: { title: 'WhatsApp', description: 'WhatsApp Business API or Sensy.ai integration settings.' },
  firebase: { title: 'Firebase Auth', description: 'Identity provider for user authentication.' },
  groq: { title: 'Groq AI', description: 'LLM inference backend for AI advisor.' },
  gcs: { title: 'Cloud Storage', description: 'Document upload and signed URL generation.' },
}

function IntegrationCard({ check }: { check: IntegrationCheck }) {
  const meta = INTEGRATION_META[check.name] ?? { title: check.name, description: '' }
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <CardHeader>
            <CardTitle>{meta.title}</CardTitle>
          </CardHeader>
          <p className="text-sm text-text-muted">{meta.description}</p>
          {check.error && (
            <p className="text-xs text-rose-600 mt-1">{check.error}</p>
          )}
          {(check.lastSuccess || check.lastError) && (
            <div className="flex items-center gap-3 mt-2">
              {check.lastSuccess && (
                <span className="text-[10px] text-emerald-600">
                  Last OK: {formatRelativeDate(check.lastSuccess)}
                </span>
              )}
              {check.lastError && (
                <span className="text-[10px] text-rose-600" title={check.lastErrorMessage ?? undefined}>
                  Last fail: {formatRelativeDate(check.lastError)}
                </span>
              )}
            </div>
          )}
        </div>
        <Badge variant={check.status === 'ok' ? 'success' : 'muted'} dot>
          {check.status === 'ok' ? 'Configured' : 'Not configured'}
        </Badge>
      </div>
    </Card>
  )
}

function IntegrationsSection() {
  const { data, isLoading } = useIntegrationHealth()

  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-10">
          <LoadingSpinner size="md" />
        </div>
      </Card>
    )
  }

  // Show only external service integrations (not redis/database — those are infra)
  const serviceChecks = (data?.checks ?? []).filter(
    (c) => c.name !== 'redis' && c.name !== 'database',
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        {data && (
          <Badge variant={data.status === 'healthy' ? 'success' : 'warning'} dot>
            {data.status === 'healthy' ? 'All connected' : 'Some services need configuration'}
          </Badge>
        )}
      </div>
      {serviceChecks.map((check) => (
        <IntegrationCard key={check.name} check={check} />
      ))}
    </div>
  )
}

// ─── Account form ────────────────────────────────────────────────
function AccountSection() {
  const { data: profile, isLoading } = useUserProfile()
  const updateProfile = useUpdateUserProfile()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [dirty, setDirty] = useState(false)

  // Seed form when profile loads
  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName)
      setLastName(profile.lastName)
      setPhone(profile.phone ?? '')
      setDirty(false)
    }
  }, [profile])

  function handleChange(setter: (v: string) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value)
      setDirty(true)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!dirty) return
    await updateProfile.mutateAsync({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim() || undefined,
    })
    setDirty(false)
  }

  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-10">
          <LoadingSpinner size="md" />
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
      </CardHeader>
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldInput label="First Name" value={firstName} onChange={handleChange(setFirstName)} required />
          <FieldInput label="Last Name" value={lastName} onChange={handleChange(setLastName)} required />
        </div>
        <FieldInput label="Phone" value={phone} onChange={handleChange(setPhone)} placeholder="Optional" />

        {/* Read-only fields */}
        {profile && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
            <ReadOnlyField label="Email" value={profile.email} />
            <ReadOnlyField label="Role" value={profile.role} />
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" size="sm" disabled={!dirty} loading={updateProfile.isPending}>
            Save Changes
          </Button>
          {updateProfile.isSuccess && !dirty && (
            <span className="text-xs text-emerald-600 font-medium">Saved</span>
          )}
          {updateProfile.isError && (
            <span className="text-xs text-rose-600 font-medium">Failed to save. Please try again.</span>
          )}
        </div>
      </form>
    </Card>
  )
}

// ─── System info ─────────────────────────────────────────────────
function SystemSection() {
  const { data, isLoading } = useIntegrationHealth()

  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-10">
          <LoadingSpinner size="md" />
        </div>
      </Card>
    )
  }

  const infraChecks = (data?.checks ?? []).filter(
    (c) => c.name === 'redis' || c.name === 'database',
  )

  return (
    <div className="space-y-4">
      {/* Infrastructure health */}
      <Card>
        <CardHeader>
          <CardTitle>Infrastructure</CardTitle>
        </CardHeader>
        <div className="space-y-2">
          {infraChecks.map((check) => {
            const labels: Record<string, string> = {
              redis: 'Redis (Queue Backend)',
              database: 'PostgreSQL (Primary Store)',
            }
            return (
              <div key={check.name} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-surface-sunken">
                <div>
                  <p className="text-sm font-medium text-text-primary">{labels[check.name] ?? check.name}</p>
                  {check.latencyMs !== undefined && (
                    <p className="text-[10px] text-text-muted font-mono">{check.latencyMs}ms latency</p>
                  )}
                </div>
                <Badge variant={check.status === 'ok' ? 'success' : 'danger'} dot>
                  {check.status === 'ok' ? 'Connected' : 'Error'}
                </Badge>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Platform info */}
      <Card>
        <CardHeader>
          <CardTitle>Platform</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-2 gap-4">
          <ReadOnlyField label="Frontend" value="Next.js 15" />
          <ReadOnlyField label="Backend" value="Fastify + Prisma" />
          <ReadOnlyField label="Queue" value="BullMQ + Redis" />
          <ReadOnlyField label="AI" value="Groq (llama-3.3-70b)" />
          <ReadOnlyField label="Auth" value="Firebase Auth" />
          <ReadOnlyField label="Storage" value="Google Cloud Storage" />
        </div>
      </Card>
    </div>
  )
}

// ─── Main settings page ──────────────────────────────────────────
export default function SettingsPage() {
  return (
    <RoleGuard allowed={['admin']}>
      <div>
        <PageHeader
          title="Settings"
          description="Platform configuration and preferences."
        />

        <Tabs
          items={[
            {
              id: 'account',
              label: 'Account',
              content: (
                <div className="space-y-4">
                  <AccountSection />
                </div>
              ),
            },
            {
              id: 'integrations',
              label: 'Integrations',
              content: <IntegrationsSection />,
            },
            {
              id: 'system',
              label: 'System',
              content: <SystemSection />,
            },
          ]}
        />
      </div>
    </RoleGuard>
  )
}

// ─── Input helpers ───────────────────────────────────────────────
function FieldInput({
  label,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      />
    </div>
  )
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-sm text-text-primary font-mono">{value}</p>
    </div>
  )
}

function formatRelativeDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60_000)

  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}
