'use client'

/**
 * Work Queue — the morning screen for the lead-intelligence experiment.
 * Ranked by intent (behavioral), filtered to no-disqualifier + current cycle.
 * Row actions: WhatsApp deep-link · log WA reply / call · 6Q gate · outcome.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Modal } from '@/components/ui/modal'
import { Pagination } from '@/components/ui/pagination'
import { Select } from '@/components/ui/select'
import { useToast } from '@/providers/toast-provider'
import {
  useWorkQueue,
  useApplyGate,
  useRecordOutcome,
  useLogManualEvent,
  type WorkQueueItem,
  type GateInput,
  type OutcomeValue,
} from '@/features/intelligence/hooks'

const PAGE_SIZE = 25

const OUTCOME_OPTIONS: Array<{ value: OutcomeValue; label: string }> = [
  { value: 'applied', label: 'Applied' },
  { value: 'enrolled', label: 'Enrolled' },
  { value: 'deferred_next_cycle', label: 'Deferred to next cycle' },
  { value: 'disqualified', label: 'Disqualified' },
  { value: 'not_interested', label: 'Not interested' },
  { value: 'unreachable', label: 'Unreachable' },
]

function TriToggle({ label, value, onChange }: {
  label: string
  value: boolean | null | undefined
  onChange: (v: boolean | null) => void
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <span className="text-sm">{label}</span>
      <div className="flex gap-1">
        <Button size="sm" variant={value === true ? 'primary' : 'secondary'} onClick={() => onChange(true)}>Yes</Button>
        <Button size="sm" variant={value === false ? 'primary' : 'secondary'} onClick={() => onChange(false)}>No</Button>
        <Button size="sm" variant={value == null ? 'primary' : 'secondary'} onClick={() => onChange(null)}>?</Button>
      </div>
    </div>
  )
}

export default function WorkQueuePage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [page, setPage] = useState(1)
  const { data, isLoading } = useWorkQueue({ limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE })

  const [gateLead, setGateLead] = useState<WorkQueueItem | null>(null)
  const [gate, setGate] = useState<GateInput>({})
  const [outcomeLead, setOutcomeLead] = useState<WorkQueueItem | null>(null)
  const [outcome, setOutcome] = useState<OutcomeValue>('not_interested')
  const [reason, setReason] = useState('')

  const applyGate = useApplyGate()
  const recordOutcome = useRecordOutcome()
  const logEvent = useLogManualEvent()

  function openGate(item: WorkQueueItem) {
    setGate({
      programmeRequested: item.programmeRequested,
      programmeInPortfolio: item.programmeInPortfolio,
      intakeYear: item.intakeYear,
    })
    setGateLead(item)
  }

  async function submitGate() {
    if (!gateLead) return
    try {
      await applyGate.mutateAsync({ leadId: gateLead.id, gate })
      addToast('success', 'Gate saved')
      setGateLead(null)
    } catch {
      addToast('error', 'Failed to save gate')
    }
  }

  async function submitOutcome() {
    if (!outcomeLead) return
    try {
      await recordOutcome.mutateAsync({ leadId: outcomeLead.id, outcome, reason: reason || undefined })
      addToast('success', 'Outcome recorded')
      setOutcomeLead(null)
      setReason('')
    } catch {
      addToast('error', 'Failed to record outcome')
    }
  }

  async function quickLog(item: WorkQueueItem, eventType: 'wa_reply' | 'call_logged') {
    try {
      await logEvent.mutateAsync({ leadId: item.id, eventType })
      addToast('success', eventType === 'wa_reply' ? 'WA reply logged' : 'Call logged')
    } catch {
      addToast('error', 'Failed to log event')
    }
  }

  const items = data?.items ?? []
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1

  return (
    <div>
      <PageHeader
        title="Work Queue"
        description={`Ranked by intent · no disqualifiers · current cycle${data ? ` · ${data.total} leads` : ''}`}
      />

      {isLoading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <EmptyState title="Queue is clear" description="No gated, current-cycle leads waiting." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Lead</th>
                <th className="px-3 py-2">Intent</th>
                <th className="px-3 py-2">Programme</th>
                <th className="px-3 py-2">Intake</th>
                <th className="px-3 py-2">Source</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-400">{(page - 1) * PAGE_SIZE + i + 1}</td>
                  <td className="px-3 py-2">
                    <button
                      className="font-medium text-blue-700 hover:underline"
                      onClick={() => router.push(`/leads/${item.id}`)}
                    >
                      {item.firstName} {item.lastName ?? ''}
                    </button>
                    <div className="text-xs text-gray-500">{item.email}</div>
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant={(item.intentScore ?? 0) >= 10 ? 'success' : (item.intentScore ?? 0) > 0 ? 'warning' : 'default'}>
                      {item.intentScore ?? 0}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 max-w-[220px] truncate" title={item.programmeRequested ?? undefined}>
                    {item.programmeRequested ?? <span className="text-gray-400">unknown</span>}
                  </td>
                  <td className="px-3 py-2">{item.intakeYear ?? '—'}</td>
                  <td className="px-3 py-2 max-w-[160px] truncate text-xs text-gray-500" title={item.sourcePartner ?? undefined}>
                    {item.sourcePartner ?? '—'}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap items-center gap-1">
                      {item.phone && (
                        <a
                          href={`https://wa.me/${item.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700"
                        >
                          WhatsApp
                        </a>
                      )}
                      <Button size="sm" variant="secondary" onClick={() => quickLog(item, 'wa_reply')}>+WA reply</Button>
                      <Button size="sm" variant="secondary" onClick={() => quickLog(item, 'call_logged')}>+Call</Button>
                      <Button size="sm" variant="secondary" onClick={() => openGate(item)}>Gate</Button>
                      <Button size="sm" variant="secondary" onClick={() => { setOutcomeLead(item); setOutcome('not_interested') }}>Outcome</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination page={page} limit={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />
        </div>
      )}

      {/* 6Q gate modal */}
      <Modal open={!!gateLead} onClose={() => setGateLead(null)} title={`Qualification gate — ${gateLead?.firstName ?? ''}`}>
        <div className="space-y-2">
          <label className="block text-sm font-medium">Programme requested</label>
          <Input
            value={gate.programmeRequested ?? ''}
            onChange={(e) => setGate((g) => ({ ...g, programmeRequested: e.target.value || null }))}
            placeholder="e.g. MSc - Artificial Intelligence & Digital Strategy Management"
          />
          <label className="block text-sm font-medium">Intake year</label>
          <Input
            type="number"
            value={gate.intakeYear ?? ''}
            onChange={(e) => setGate((g) => ({ ...g, intakeYear: e.target.value ? Number(e.target.value) : null }))}
            placeholder="2026"
          />
          <div className="pt-2">
            <TriToggle label="Programme offered by BSB?" value={gate.programmeInPortfolio} onChange={(v) => setGate((g) => ({ ...g, programmeInPortfolio: v }))} />
            <TriToggle label="Can self-fund beyond partial scholarship?" value={gate.fundingSelfPossible} onChange={(v) => setGate((g) => ({ ...g, fundingSelfPossible: v }))} />
            <TriToggle label="France is a real choice?" value={gate.franceReal} onChange={(v) => setGate((g) => ({ ...g, franceReal: v }))} />
            <TriToggle label="Comfortable in English?" value={gate.englishReady} onChange={(v) => setGate((g) => ({ ...g, englishReady: v }))} />
            <TriToggle label="Contact number works?" value={gate.contactValid} onChange={(v) => setGate((g) => ({ ...g, contactValid: v }))} />
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <Button variant="secondary" onClick={() => setGateLead(null)}>Cancel</Button>
            <Button onClick={submitGate} disabled={applyGate.isPending}>Save gate</Button>
          </div>
        </div>
      </Modal>

      {/* Outcome modal */}
      <Modal open={!!outcomeLead} onClose={() => setOutcomeLead(null)} title={`Outcome — ${outcomeLead?.firstName ?? ''}`}>
        <div className="space-y-3">
          <Select
            value={outcome}
            onChange={(e) => setOutcome(e.target.value as OutcomeValue)}
            options={OUTCOME_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional but valuable)" />
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={() => setOutcomeLead(null)}>Cancel</Button>
            <Button onClick={submitOutcome} disabled={recordOutcome.isPending}>Record outcome</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
