import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type {
  LeadListItem,
  LeadDetail,
  AiAssessmentSummary,
  ActivityLogItem,
  PaginatedResponse,
  PriorityLevel,
  LeadStatus,
  LeadSource,
  AnalyticsOverview,
} from '@sturec/shared'
import api from '@/lib/api/client'
import { fetchTeamMembers, buildNameMap, resolveName } from '@/features/team/lib/team-cache'

// ─── View models (display extensions not in the API response) ────

/** List item with resolved counsellor display name */
export interface LeadListItemView extends LeadListItem {
  isPartnerHotLead: boolean
  needsIntakeCompletion: boolean
  counsellorName: string
}

/** Timeline item shape consumed by the lead detail page */
export interface TimelineItem {
  id: string
  type: 'stage_change' | 'assignment' | 'assessment' | 'activity' | 'note' | 'document'
  title: string
  description?: string
  timestamp: string
  actor?: string
}

/** Detail view model — combines LeadDetail + assessment + timeline for the UI */
export interface LeadDetailView extends LeadDetail {
  isPartnerHotLead: boolean
  needsIntakeCompletion: boolean
  counsellorName: string
  /** Latest assessment summary from GET /leads/:id/ai-assessments */
  latestAssessment: AiAssessmentSummary | null
  timeline: TimelineItem[]
}

// ─── Hook params ─────────────────────────────────────────────────

interface UseLeadsParams {
  page?: number
  limit?: number
  search?: string
  status?: LeadStatus | ''
  source?: LeadSource | ''
  priority?: PriorityLevel | ''
  counsellorId?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

interface LeadImportRow {
  email: string
  firstName?: string
  first_name?: string
  lastName?: string
  last_name?: string
  phone?: string
  sourcePartner?: string
  notes?: string
}

// ─── List hook ───────────────────────────────────────────────────

export function useLeads(params: UseLeadsParams = {}, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['leads', params],
    enabled: options.enabled ?? true,
    queryFn: async () => {
      const apiParams: Record<string, unknown> = {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
      }
      if (params.sortBy) apiParams.sortBy = params.sortBy
      if (params.sortOrder) apiParams.sortOrder = params.sortOrder
      if (params.search) apiParams.search = params.search
      if (params.status) apiParams.status = params.status
      if (params.source) apiParams.source = params.source
      if (params.priority) apiParams.priorityLevel = params.priority
      if (params.counsellorId) apiParams.assignedCounsellorId = params.counsellorId

      const [response, team] = await Promise.all([
        api.get('/leads', { params: apiParams }) as unknown as PaginatedResponse<LeadListItem>,
        fetchTeamMembers(),
      ])

      const nameMap = buildNameMap(team)
      const items: LeadListItemView[] = response.items.map((l) => ({
        ...l,
        counsellorName: resolveName(nameMap, l.assignedCounsellorId),
      }))

      return { ...response, items }
    },
  })
}

// ─── Detail hook ─────────────────────────────────────────────────

export function useLead(id: string) {
  return useQuery({
    queryKey: ['leads', id],
    queryFn: async (): Promise<LeadDetailView> => {
      const [lead, assessmentsRes, activitiesRes, team] = await Promise.all([
        api.get(`/leads/${id}`) as unknown as LeadDetail,
        // Assessment endpoint returns a raw array, not paginated.
        api.get(`/leads/${id}/ai-assessments`, {
          params: { limit: 1, sortBy: 'created_at', sortOrder: 'desc' },
        }) as unknown as AiAssessmentSummary[] | PaginatedResponse<AiAssessmentSummary>,
        api.get(`/leads/${id}/activities`, {
          params: { limit: 50, sortBy: 'created_at', sortOrder: 'desc' },
        }) as unknown as PaginatedResponse<ActivityLogItem>,
        fetchTeamMembers(),
      ])

      const nameMap = buildNameMap(team)
      const assessments = Array.isArray(assessmentsRes) ? assessmentsRes : assessmentsRes.items ?? []
      const activities = Array.isArray(activitiesRes) ? activitiesRes : activitiesRes.items ?? []

      return {
        ...lead,
        counsellorName: resolveName(nameMap, lead.assignedCounsellorId),
        latestAssessment: assessments[0] ?? null,
        timeline: activities.map(activityToTimeline),
      }
    },
    enabled: !!id,
  })
}

function activityToTimeline(item: ActivityLogItem): TimelineItem {
  const typeMap: Record<string, TimelineItem['type']> = {
    status_update: 'stage_change',
  }
  return {
    id: item.id,
    type: typeMap[item.activityType] ?? 'activity',
    title: item.summary ?? `${capitalize(item.activityType.replace(/_/g, ' '))} via ${item.channel}`,
    description: item.outcome ?? undefined,
    timestamp: item.createdAt,
    actor: item.createdBy?.name ?? 'System',
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// ─── Stats hook (dashboard — backed by GET /analytics/overview) ──

export type LeadStats = AnalyticsOverview['data']['leads']

type OverviewEndpoint = '/analytics/overview' | '/analytics/my-overview'

export function useLeadStats(options: { enabled?: boolean; endpoint?: OverviewEndpoint } = {}) {
  const endpoint = options.endpoint ?? '/analytics/overview'
  const scope: 'overview' | 'my-overview' =
    endpoint === '/analytics/my-overview' ? 'my-overview' : 'overview'
  return useQuery({
    queryKey: ['analytics', scope, {}],
    queryFn: () => api.get(endpoint) as unknown as AnalyticsOverview,
    select: (overview) => overview.data.leads,
    enabled: options.enabled ?? true,
  })
}

export function useImportLeads() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (rows: LeadImportRow[]) =>
      api.post('/leads/import', { rows }) as unknown as Promise<{
        batchId: string
        rowCount: number
        status: 'queued'
      }>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}

// ─── Lead action mutations ──────────────────────────────────

export function useConvertLead(leadId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.post(`/leads/${leadId}/convert`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}

export function useDisqualifyLead(leadId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (reason: string) => api.post(`/leads/${leadId}/disqualify`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}

export function useReassessLead(leadId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.post(`/leads/${leadId}/activities`, {
      activityType: 'status_update',
      channel: 'internal',
      direction: 'internal',
      summary: 'Manual AI re-assessment requested',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', leadId] })
    },
  })
}

export function useCreateLeadActivity(leadId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      activityType: string
      channel: string
      direction: string
      outcome?: string
      summary?: string
    }) => api.post(`/leads/${leadId}/activities`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', leadId] })
    },
  })
}
