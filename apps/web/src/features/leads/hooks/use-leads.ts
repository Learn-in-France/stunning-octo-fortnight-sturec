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

export function useLeads(params: UseLeadsParams = {}) {
  return useQuery({
    queryKey: ['leads', params],
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
        api.get(`/leads/${id}/ai-assessments`, {
          params: { limit: 1, sortBy: 'created_at', sortOrder: 'desc' },
        }) as unknown as PaginatedResponse<AiAssessmentSummary>,
        api.get(`/leads/${id}/activities`, {
          params: { limit: 50, sortBy: 'created_at', sortOrder: 'desc' },
        }) as unknown as PaginatedResponse<ActivityLogItem>,
        fetchTeamMembers(),
      ])

      const nameMap = buildNameMap(team)

      return {
        ...lead,
        counsellorName: resolveName(nameMap, lead.assignedCounsellorId),
        latestAssessment: assessmentsRes.items[0] ?? null,
        timeline: activitiesRes.items.map(activityToTimeline),
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
    actor: item.createdBy.name,
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// ─── Stats hook (dashboard — backed by GET /analytics/overview) ──

export type LeadStats = AnalyticsOverview['data']['leads']

export function useLeadStats(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['analytics', 'overview', {}],
    queryFn: () => api.get('/analytics/overview') as unknown as AnalyticsOverview,
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
      queryClient.invalidateQueries({ queryKey: ['analytics', 'overview'] })
    },
  })
}
