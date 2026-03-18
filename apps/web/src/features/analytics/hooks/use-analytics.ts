import { useQuery } from '@tanstack/react-query'

import type {
  AnalyticsOverview,
  PipelineMetrics,
  CounsellorAnalyticsItem,
  CounsellorAnalyticsDetail,
  StudentAnalyticsItem,
  StudentAnalyticsDetail,
} from '@sturec/shared'
import api from '@/lib/api/client'

// ─── Overview hook ──────────────────────────────────────────────

interface DateRangeParams {
  from?: string
  to?: string
}

function dateParams(p: DateRangeParams): Record<string, string> {
  const qp: Record<string, string> = {}
  if (p.from) qp.from = p.from
  if (p.to) qp.to = p.to
  return qp
}

export function useAnalyticsOverview(params: DateRangeParams = {}) {
  return useQuery({
    queryKey: ['analytics', 'overview', params],
    queryFn: () =>
      api.get('/analytics/overview', { params: dateParams(params) }) as unknown as AnalyticsOverview,
  })
}

// ─── Pipeline hook ──────────────────────────────────────────────

export function usePipelineMetrics(params: DateRangeParams = {}) {
  return useQuery({
    queryKey: ['analytics', 'pipeline', params],
    queryFn: () =>
      api.get('/analytics/pipeline', { params: dateParams(params) }) as unknown as PipelineMetrics,
  })
}

// ─── Counsellor analytics hooks ─────────────────────────────────

export function useCounsellorAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'counsellors'],
    queryFn: () =>
      api.get('/analytics/counsellors') as unknown as CounsellorAnalyticsItem[],
  })
}

export function useCounsellorAnalyticsDetail(id: string, params: DateRangeParams = {}) {
  return useQuery({
    queryKey: ['analytics', 'counsellors', id, params],
    queryFn: () =>
      api.get(`/analytics/counsellors/${id}`, { params: dateParams(params) }) as unknown as CounsellorAnalyticsDetail,
    enabled: !!id,
  })
}

// ─── Student analytics hooks ────────────────────────────────────

export function useStudentAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'students'],
    queryFn: () =>
      api.get('/analytics/students') as unknown as StudentAnalyticsItem[],
  })
}

export function useStudentAnalyticsDetail(id: string, params: DateRangeParams = {}) {
  return useQuery({
    queryKey: ['analytics', 'students', id, params],
    queryFn: () =>
      api.get(`/analytics/students/${id}`, { params: dateParams(params) }) as unknown as StudentAnalyticsDetail,
    enabled: !!id,
  })
}
