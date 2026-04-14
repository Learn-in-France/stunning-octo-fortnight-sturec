import { useQuery } from '@tanstack/react-query'

import type {
  PaginatedResponse,
  PaginationParams,
  ApplicationListItem,
  ApplicationStatus,
  AnalyticsOverview,
} from '@sturec/shared'
import api from '@/lib/api/client'

// ─── Hook params ─────────────────────────────────────────────────

interface UseApplicationsParams extends PaginationParams {
  status?: ApplicationStatus | ''
  programId?: string
  universityId?: string
  studentId?: string
  intakeId?: string
}

interface ApplicationHookOptions {
  enabled?: boolean
}

// ─── Global list (admin) ─────────────────────────────────────────

export function useApplications(
  params: UseApplicationsParams = {},
  options: ApplicationHookOptions = {},
) {
  return useQuery({
    queryKey: ['applications', params],
    queryFn: async () => {
      const apiParams: Record<string, unknown> = {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
      }
      if (params.sortBy) apiParams.sortBy = params.sortBy
      if (params.sortOrder) apiParams.sortOrder = params.sortOrder
      if (params.status) apiParams.status = params.status
      if (params.programId) apiParams.programId = params.programId
      if (params.universityId) apiParams.universityId = params.universityId
      if (params.studentId) apiParams.studentId = params.studentId
      if (params.intakeId) apiParams.intakeId = params.intakeId

      return api.get('/applications', { params: apiParams }) as unknown as PaginatedResponse<ApplicationListItem>
    },
    enabled: options.enabled ?? true,
  })
}

// ─── Stats hook ─────────────────────────────────────────────────

export type ApplicationStats = AnalyticsOverview['data']['applications']

type OverviewEndpoint = '/analytics/overview' | '/analytics/my-overview'

export function useApplicationStats(options: ApplicationHookOptions & { endpoint?: OverviewEndpoint } = {}) {
  const endpoint = options.endpoint ?? '/analytics/overview'
  return useQuery({
    queryKey: ['analytics', endpoint, {}],
    queryFn: () => api.get(endpoint) as unknown as AnalyticsOverview,
    select: (overview) => overview.data.applications,
    enabled: options.enabled ?? true,
  })
}

// ─── Student-scoped list ─────────────────────────────────────────

export function useStudentApplications(studentId: string) {
  return useQuery({
    queryKey: ['students', studentId, 'applications'],
    queryFn: () =>
      api.get(`/students/${studentId}/applications`) as unknown as PaginatedResponse<ApplicationListItem>,
    enabled: !!studentId,
  })
}
