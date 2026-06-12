/**
 * Lead-intelligence experiment hooks — work queue, 6Q gate, outcomes, funnel.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api/client'

// ─── Types (mirror apps/api/src/modules/intelligence) ────────────

export interface WorkQueueItem {
  id: string
  firstName: string
  lastName: string | null
  email: string
  phone: string | null
  intentScore: number | null
  programmeRequested: string | null
  programmeInPortfolio: boolean | null
  intakeYear: number | null
  dqTags: string[]
  sourcePartner: string | null
  assignedCounsellor: { id: string; firstName: string; lastName: string } | null
  latestAiAssessment: {
    leadHeat: string | null
    programmeLevel: string | null
    fieldsCollected: Record<string, string> | null
  } | null
}

export interface WorkQueueResponse {
  items: WorkQueueItem[]
  total: number
  limit: number
  offset: number
}

export interface GateInput {
  programmeRequested?: string | null
  programmeInPortfolio?: boolean | null
  intakeYear?: number | null
  fundingSelfPossible?: boolean | null
  franceReal?: boolean | null
  englishReady?: boolean | null
  contactValid?: boolean | null
}

export type OutcomeValue =
  | 'applied'
  | 'enrolled'
  | 'deferred_next_cycle'
  | 'disqualified'
  | 'not_interested'
  | 'unreachable'

export interface FunnelRow {
  source: string
  pool: number
  engaged: number
  gatePassed: number
  applied: number
  enrolled: number
  disqualified: number
}

export interface FunnelResponse {
  sources: FunnelRow[]
  totals: FunnelRow
}

// ─── Hooks ───────────────────────────────────────────────────────

export function useWorkQueue(params: { limit?: number; offset?: number }) {
  return useQuery<WorkQueueResponse>({
    queryKey: ['intelligence', 'work-queue', params],
    queryFn: () =>
      api.get('/intelligence/work-queue', {
        params: { limit: params.limit ?? 50, offset: params.offset ?? 0 },
      }) as Promise<WorkQueueResponse>,
  })
}

export function useApplyGate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ leadId, gate }: { leadId: string; gate: GateInput }) =>
      api.post(`/intelligence/leads/${leadId}/gate`, gate),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['intelligence'] })
      qc.invalidateQueries({ queryKey: ['leads'] })
      qc.invalidateQueries({ queryKey: ['lead'] })
    },
  })
}

export function useRecordOutcome() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ leadId, outcome, reason }: { leadId: string; outcome: OutcomeValue; reason?: string }) =>
      api.post(`/intelligence/leads/${leadId}/outcome`, { outcome, reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['intelligence'] })
      qc.invalidateQueries({ queryKey: ['leads'] })
      qc.invalidateQueries({ queryKey: ['lead'] })
    },
  })
}

export function useLogManualEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ leadId, eventType, note }: { leadId: string; eventType: 'wa_reply' | 'call_logged' | 'webinar_attend'; note?: string }) =>
      api.post(`/intelligence/leads/${leadId}/events`, { eventType, note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['intelligence'] })
      qc.invalidateQueries({ queryKey: ['leads'] })
      qc.invalidateQueries({ queryKey: ['lead'] })
    },
  })
}

export interface LeadEventItem {
  id: string
  eventType: string
  origin: string
  linkCategory: string | null
  occurredAt: string
  weight: number
}

export function useLeadTimeline(leadId: string | undefined) {
  return useQuery<{ events: LeadEventItem[] }>({
    queryKey: ['intelligence', 'timeline', leadId],
    queryFn: () => api.get(`/intelligence/leads/${leadId}/timeline`) as Promise<{ events: LeadEventItem[] }>,
    enabled: !!leadId,
  })
}

export function useFunnel() {
  return useQuery<FunnelResponse>({
    queryKey: ['intelligence', 'funnel'],
    queryFn: () => api.get('/intelligence/funnel') as Promise<FunnelResponse>,
  })
}
