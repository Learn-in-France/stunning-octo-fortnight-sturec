'use client'

import { useState } from 'react'

import { Drawer } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
  useStudentCampaigns,
  useCampaignPacks,
  useStartCampaign,
  usePauseCampaign,
  useResumeCampaign,
  useUpdateCampaignMode,
} from '@/features/campaigns/hooks/use-campaigns'

interface CampaignDrawerProps {
  open: boolean
  onClose: () => void
  studentId: string
}

/**
 * Single drawer that handles all state-changing campaign decisions:
 * starting a new pack, pausing/resuming an active campaign, and
 * toggling auto/manual mode.
 *
 * Per-step "Send" and "Send all due" stay as inline buttons in the
 * read view because they're row-local execution actions, not
 * state-management decisions.
 */
export function CampaignDrawer({ open, onClose, studentId }: CampaignDrawerProps) {
  const { data: campaigns, isLoading } = useStudentCampaigns(studentId)
  const { data: packs } = useCampaignPacks()
  const startCampaign = useStartCampaign()
  const pauseCampaign = usePauseCampaign()
  const resumeCampaign = useResumeCampaign()
  const updateMode = useUpdateCampaignMode()
  const [selectedPack, setSelectedPack] = useState('')

  const campaignPacks = Array.isArray(packs) ? packs : []
  const studentCampaigns = Array.isArray(campaigns) ? campaigns : []

  const handleStart = () => {
    if (!selectedPack) return
    startCampaign.mutate(
      { studentId, packId: selectedPack },
      { onSuccess: () => setSelectedPack('') },
    )
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Manage Campaigns"
      description="Start a new pack or manage how an active campaign runs. Sending individual steps stays in the campaigns list below the page."
      size="md"
      footer={
        <div className="flex items-center justify-end">
          <Button size="sm" variant="secondary" onClick={onClose}>
            Done
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Start a new pack */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
            Start a new pack
          </h3>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Select
                label="Pack"
                value={selectedPack}
                onChange={(e) => setSelectedPack(e.target.value)}
                options={[
                  { value: '', label: 'Select a pack…' },
                  ...campaignPacks.map((p) => ({
                    value: p.id,
                    label: `${p.name} (${p.phaseKey}) — ${
                      Array.isArray(p.steps) ? p.steps.length : 0
                    } steps`,
                  })),
                ]}
              />
            </div>
            <Button
              size="sm"
              disabled={!selectedPack || startCampaign.isPending}
              loading={startCampaign.isPending}
              onClick={handleStart}
            >
              Start pack
            </Button>
          </div>
        </section>

        {/* Manage active campaigns */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
            Active campaigns
          </h3>
          {isLoading ? (
            <div className="mt-4 flex justify-center">
              <LoadingSpinner size="md" />
            </div>
          ) : studentCampaigns.length === 0 ? (
            <div className="mt-3">
              <EmptyState
                title="No active campaigns"
                description="Once a pack is started, you'll be able to pause it or change how it runs from here."
              />
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {studentCampaigns.map((campaign) => {
                const isPaused = campaign.status === 'paused'
                const isActive = campaign.status === 'active'
                return (
                  <div
                    key={campaign.id}
                    className="rounded-2xl border border-border bg-surface-sunken/35 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-text-primary">
                          {campaign.pack?.name ?? 'Campaign pack unavailable'}
                        </p>
                        <p className="mt-1 text-xs text-text-muted">
                          {campaign.phaseKey} · {campaign.mode}
                        </p>
                      </div>
                      <Badge
                        variant={
                          isActive
                            ? 'success'
                            : isPaused
                              ? 'warning'
                              : campaign.status === 'completed'
                                ? 'primary'
                                : 'muted'
                        }
                        dot
                      >
                        {campaign.status}
                      </Badge>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {isActive && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            pauseCampaign.mutate({ studentId, campaignId: campaign.id })
                          }
                          disabled={pauseCampaign.isPending}
                        >
                          Pause
                        </Button>
                      )}
                      {isPaused && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            resumeCampaign.mutate({ studentId, campaignId: campaign.id })
                          }
                          disabled={resumeCampaign.isPending}
                        >
                          Resume
                        </Button>
                      )}
                      {(isActive || isPaused) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            updateMode.mutate({
                              studentId,
                              campaignId: campaign.id,
                              mode: campaign.mode === 'manual' ? 'automated' : 'manual',
                            })
                          }
                          disabled={updateMode.isPending}
                        >
                          {campaign.mode === 'manual' ? 'Switch to automated' : 'Switch to manual'}
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </Drawer>
  )
}
