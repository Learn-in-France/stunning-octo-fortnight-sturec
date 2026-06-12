'use client'

/**
 * Shared lead action strip — the ONE set of actions for acting on a lead
 * (WhatsApp · +WA reply · +Call · Gate · Outcome). Used by the Work Queue
 * rows and the lead detail page, so every door leads to the same write-path
 * ("merge the decisions, not the screens").
 */

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Select } from '@/components/ui/select'
import { useToast } from '@/providers/toast-provider'
import {
  useApplyGate,
  useRecordOutcome,
  useLogManualEvent,
  type GateInput,
  type OutcomeValue,
} from './hooks'

export interface ActionStripLead {
  id: string
  firstName: string
  phone?: string | null
  programmeRequested?: string | null
  programmeInPortfolio?: boolean | null
  intakeYear?: number | null
  fundingSelfPossible?: boolean | null
  franceReal?: boolean | null
  englishReady?: boolean | null
  contactValid?: boolean | null
}

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
      <span className="text-sm text-text-primary">{label}</span>
      <div className="flex gap-1">
        <Button size="sm" variant={value === true ? 'primary' : 'secondary'} onClick={() => onChange(true)}>Yes</Button>
        <Button size="sm" variant={value === false ? 'primary' : 'secondary'} onClick={() => onChange(false)}>No</Button>
        <Button size="sm" variant={value == null ? 'primary' : 'secondary'} onClick={() => onChange(null)}>?</Button>
      </div>
    </div>
  )
}

export function GateModal({ lead, open, onClose, onSaved }: {
  lead: ActionStripLead
  open: boolean
  onClose: () => void
  onSaved?: () => void
}) {
  const { addToast } = useToast()
  const applyGate = useApplyGate()
  const [gate, setGate] = useState<GateInput>({})
  const [seeded, setSeeded] = useState(false)

  if (open && !seeded) {
    setGate({
      programmeRequested: lead.programmeRequested,
      programmeInPortfolio: lead.programmeInPortfolio,
      intakeYear: lead.intakeYear,
      fundingSelfPossible: lead.fundingSelfPossible,
      franceReal: lead.franceReal,
      englishReady: lead.englishReady,
      contactValid: lead.contactValid,
    })
    setSeeded(true)
  }
  if (!open && seeded) setSeeded(false)

  async function submitGate() {
    try {
      await applyGate.mutateAsync({ leadId: lead.id, gate })
      addToast('success', 'Gate saved')
      onClose()
      onSaved?.()
    } catch {
      addToast('error', 'Failed to save gate')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Qualification gate — ${lead.firstName}`}>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-text-primary">Programme requested</label>
        <Input
          value={gate.programmeRequested ?? ''}
          onChange={(e) => setGate((g) => ({ ...g, programmeRequested: e.target.value || null }))}
          placeholder="e.g. MSc - Artificial Intelligence & Digital Strategy Management"
        />
        <label className="block text-sm font-medium text-text-primary">Intake year</label>
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
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submitGate} disabled={applyGate.isPending}>Save gate</Button>
        </div>
      </div>
    </Modal>
  )
}

export function ActionStrip({ lead, onChanged }: { lead: ActionStripLead; onChanged?: () => void }) {
  const { addToast } = useToast()
  const [gateOpen, setGateOpen] = useState(false)
  const [outcomeOpen, setOutcomeOpen] = useState(false)
  const [outcome, setOutcome] = useState<OutcomeValue>('not_interested')
  const [reason, setReason] = useState('')

  const recordOutcome = useRecordOutcome()
  const logEvent = useLogManualEvent()

  async function submitOutcome() {
    try {
      await recordOutcome.mutateAsync({ leadId: lead.id, outcome, reason: reason || undefined })
      addToast(
        'success',
        outcome === 'applied'
          ? 'Recorded: applied. Open the lead to convert to student when ready.'
          : 'Outcome recorded',
      )
      setOutcomeOpen(false)
      setReason('')
      onChanged?.()
    } catch {
      addToast('error', 'Failed to record outcome')
    }
  }

  async function quickLog(eventType: 'wa_reply' | 'call_logged') {
    try {
      await logEvent.mutateAsync({ leadId: lead.id, eventType })
      addToast('success', eventType === 'wa_reply' ? 'WA reply logged' : 'Call logged')
      onChanged?.()
    } catch {
      addToast('error', 'Failed to log event')
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1" onClick={(e) => e.stopPropagation()}>
      {lead.phone && (
        <a
          href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700"
        >
          WhatsApp
        </a>
      )}
      <Button size="sm" variant="secondary" onClick={() => quickLog('wa_reply')}>+WA reply</Button>
      <Button size="sm" variant="secondary" onClick={() => quickLog('call_logged')}>+Call</Button>
      <Button size="sm" variant="secondary" onClick={() => setGateOpen(true)}>Gate</Button>
      <Button size="sm" variant="secondary" onClick={() => { setOutcome('not_interested'); setOutcomeOpen(true) }}>Outcome</Button>

      <GateModal lead={lead} open={gateOpen} onClose={() => setGateOpen(false)} onSaved={onChanged} />

      {/* Outcome modal — the single close action; status follows server-side */}
      <Modal open={outcomeOpen} onClose={() => setOutcomeOpen(false)} title={`Outcome — ${lead.firstName}`}>
        <div className="space-y-3">
          <Select
            value={outcome}
            onChange={(e) => setOutcome(e.target.value as OutcomeValue)}
            options={OUTCOME_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional but valuable)" />
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={() => setOutcomeOpen(false)}>Cancel</Button>
            <Button onClick={submitOutcome} disabled={recordOutcome.isPending}>Record outcome</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

/** Yes/No/unanswered chip for the gate card. */
function GateAnswer({ label, value, invert }: { label: string; value: boolean | null | undefined; invert?: boolean }) {
  const good = invert ? value === false : value === true
  const bad = invert ? value === true : value === false
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <span className="text-xs text-text-secondary">{label}</span>
      <span className={`text-xs font-semibold ${good ? 'text-score-high' : bad ? 'text-score-low' : 'text-text-muted'}`}>
        {value == null ? 'unanswered' : good ? 'Yes' : 'No'}
      </span>
    </div>
  )
}

/**
 * Qualification Gate card — the counsellor-recordable qualification for
 * event/import leads (replaces the AI scorecard when no chat happened).
 */
export function GateCard({ lead }: { lead: ActionStripLead }) {
  const [open, setOpen] = useState(false)
  return (
    <Card>
      <CardHeader>
        <CardTitle>Qualification Gate</CardTitle>
        <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>Edit gate</Button>
      </CardHeader>
      <div className="space-y-0.5">
        <div className="flex items-center justify-between gap-2 py-1">
          <span className="text-xs text-text-secondary">Programme requested</span>
          <span className="max-w-[200px] truncate text-xs font-medium text-text-primary" title={lead.programmeRequested ?? undefined}>
            {lead.programmeRequested ?? <span className="text-text-muted">unanswered</span>}
          </span>
        </div>
        <GateAnswer label="Programme offered by BSB?" value={lead.programmeInPortfolio} />
        <div className="flex items-center justify-between gap-2 py-1">
          <span className="text-xs text-text-secondary">Intake year</span>
          <span className="text-xs font-medium text-text-primary">{lead.intakeYear ?? <span className="text-text-muted">unanswered</span>}</span>
        </div>
        <GateAnswer label="Can self-fund beyond partial scholarship?" value={lead.fundingSelfPossible} />
        <GateAnswer label="France is a real choice?" value={lead.franceReal} />
        <GateAnswer label="Comfortable in English?" value={lead.englishReady} />
        <GateAnswer label="Contact number works?" value={lead.contactValid} />
      </div>
      <p className="mt-3 text-[11px] text-text-muted">
        These six answers decide if the lead is workable. Unanswered = ask on the next contact.
      </p>
      <GateModal lead={lead} open={open} onClose={() => setOpen(false)} />
    </Card>
  )
}
