import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import type {
  StudentListItem,
  StudentDetail,
  PaginatedResponse,
  StudentStage,
  VisaRisk,
  AnalyticsOverview,
  AiAssessmentSummary,
  TimelineItem,
  NoteItem,
  ActivityLogItem,
  ContactItem,
  CaseLogItem,
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

// ─── AI Assessments hook ──────────────────────────────────────────

export function useStudentAssessments(studentId: string) {
  return useQuery({
    queryKey: ['students', studentId, 'ai-assessments'],
    queryFn: () =>
      api.get(`/students/${studentId}/ai-assessments`) as unknown as AiAssessmentSummary[],
    enabled: !!studentId,
  })
}

// ─── Timeline hook ────────────────────────────────────────────────

export function useStudentTimeline(studentId: string) {
  return useQuery({
    queryKey: ['students', studentId, 'timeline'],
    queryFn: () =>
      api.get(`/students/${studentId}/timeline`) as unknown as TimelineItem[],
    enabled: !!studentId,
  })
}

export function useStudentCaseLog(studentId: string) {
  return useQuery({
    queryKey: ['students', studentId, 'case-log'],
    queryFn: () =>
      api.get(`/students/${studentId}/case-log`) as unknown as CaseLogItem[],
    enabled: !!studentId,
  })
}

export function useChangeStudentStage(studentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { toStage: StudentStage; reasonCode?: string; reasonNote?: string }) =>
      api.post(`/students/${studentId}/stage`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students', studentId] })
      queryClient.invalidateQueries({ queryKey: ['students', studentId, 'timeline'] })
      queryClient.invalidateQueries({ queryKey: ['students', studentId, 'case-log'] })
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['analytics', 'overview'] })
    },
  })
}

export function useAssignStudentCounsellor(studentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { counsellorId: string; reason?: string }) =>
      api.post(`/students/${studentId}/assign`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students', studentId] })
      queryClient.invalidateQueries({ queryKey: ['students', studentId, 'case-log'] })
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['analytics', 'overview'] })
      queryClient.invalidateQueries({ queryKey: ['analytics', 'counsellors'] })
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
  })
}

// ─── Notes hook ───────────────────────────────────────────────────

export function useStudentNotes(studentId: string, page = 1) {
  return useQuery({
    queryKey: ['students', studentId, 'notes', { page }],
    queryFn: () =>
      api.get(`/students/${studentId}/notes`, { params: { page, limit: 20 } }) as unknown as PaginatedResponse<NoteItem>,
    enabled: !!studentId,
  })
}

export function useCreateNote(studentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { noteType: string; content: string }) =>
      api.post(`/students/${studentId}/notes`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students', studentId, 'notes'] })
      queryClient.invalidateQueries({ queryKey: ['students', studentId, 'case-log'] })
    },
  })
}

// ─── Activities hook ──────────────────────────────────────────────

export function useStudentActivities(studentId: string, page = 1) {
  return useQuery({
    queryKey: ['students', studentId, 'activities', { page }],
    queryFn: () =>
      api.get(`/students/${studentId}/activities`, { params: { page, limit: 20 } }) as unknown as PaginatedResponse<ActivityLogItem>,
    enabled: !!studentId,
  })
}

export function useCreateActivity(studentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      activityType: string
      channel: string
      direction: string
      outcome?: string
      summary?: string
    }) => api.post(`/students/${studentId}/activities`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students', studentId, 'activities'] })
      queryClient.invalidateQueries({ queryKey: ['students', studentId, 'case-log'] })
    },
  })
}

// ─── Contacts hook ────────────────────────────────────────────────

export function useStudentContacts(studentId: string) {
  return useQuery({
    queryKey: ['students', studentId, 'contacts'],
    queryFn: () =>
      api.get(`/students/${studentId}/contacts`) as unknown as ContactItem[],
    enabled: !!studentId,
  })
}

export function useCreateContact(studentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      contactType: string
      name: string
      relation: string
      phone?: string
      email?: string
      isPrimary?: boolean
    }) => api.post(`/students/${studentId}/contacts`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students', studentId, 'contacts'] })
    },
  })
}
