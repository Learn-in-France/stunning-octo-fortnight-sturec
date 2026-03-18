import { useQuery } from '@tanstack/react-query'

import type {
  StudentListItem,
  StudentDetail,
  PaginatedResponse,
  StudentStage,
  VisaRisk,
  AnalyticsOverview,
} from '@sturec/shared'
import api from '@/lib/api/client'
import { fetchTeamMembers, buildNameMap, resolveName } from '@/features/team/lib/team-cache'

// ─── View models (display extensions not in the API response) ────

/** List item with resolved counsellor display name */
export interface StudentListItemView extends StudentListItem {
  counsellorName: string
}

/** Detail view model — adds display properties the UI needs */
export interface StudentDetailView extends StudentDetail {
  counsellorName: string
  fullName: string
}

// ─── Hook params ─────────────────────────────────────────────────

interface UseStudentsParams {
  page?: number
  limit?: number
  search?: string
  stage?: StudentStage | ''
  visaRisk?: VisaRisk | ''
  counsellorId?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// ─── List hook ───────────────────────────────────────────────────

export function useStudents(params: UseStudentsParams = {}) {
  return useQuery({
    queryKey: ['students', params],
    queryFn: async () => {
      const apiParams: Record<string, unknown> = {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
      }
      if (params.sortBy) apiParams.sortBy = params.sortBy
      if (params.sortOrder) apiParams.sortOrder = params.sortOrder
      if (params.search) apiParams.search = params.search
      if (params.stage) apiParams.stage = params.stage
      if (params.visaRisk) apiParams.visaRisk = params.visaRisk
      if (params.counsellorId) apiParams.assignedCounsellorId = params.counsellorId

      const [response, team] = await Promise.all([
        api.get('/students', { params: apiParams }) as unknown as PaginatedResponse<StudentListItem>,
        fetchTeamMembers(),
      ])

      const nameMap = buildNameMap(team)
      const items: StudentListItemView[] = response.items.map((s) => ({
        ...s,
        counsellorName: resolveName(nameMap, s.assignedCounsellorId),
      }))

      return { ...response, items }
    },
  })
}

// ─── Detail hook ─────────────────────────────────────────────────

export function useStudent(id: string) {
  return useQuery({
    queryKey: ['students', id],
    queryFn: async (): Promise<StudentDetailView> => {
      const [student, team] = await Promise.all([
        api.get(`/students/${id}`) as unknown as StudentDetail,
        fetchTeamMembers(),
      ])

      const nameMap = buildNameMap(team)

      return {
        ...student,
        counsellorName: resolveName(nameMap, student.assignedCounsellorId),
        fullName: `${student.firstName} ${student.lastName}`,
      }
    },
    enabled: !!id,
  })
}

// ─── Stats hook (dashboard — backed by GET /analytics/overview) ──

export type StudentStats = AnalyticsOverview['data']['students']

export function useStudentStats() {
  return useQuery({
    queryKey: ['analytics', 'overview', {}],
    queryFn: () => api.get('/analytics/overview') as unknown as AnalyticsOverview,
    select: (overview) => overview.data.students,
  })
}
