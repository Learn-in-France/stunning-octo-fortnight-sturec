import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import type {
  PaginatedResponse,
  DocumentListItem,
  DocumentRequirementItem,
} from '@sturec/shared'
import api from '@/lib/api/client'

// ─── Student documents ──────────────────────────────────────────

export function useStudentDocuments(studentId: string) {
  return useQuery({
    queryKey: ['students', studentId, 'documents'],
    queryFn: () =>
      api.get(`/students/${studentId}/documents`) as unknown as PaginatedResponse<DocumentListItem>,
    enabled: !!studentId,
  })
}

// ─── Student document requirements ──────────────────────────────

export function useStudentRequirements(studentId: string) {
  return useQuery({
    queryKey: ['students', studentId, 'document-requirements'],
    queryFn: () =>
      api.get(`/students/${studentId}/document-requirements`) as unknown as PaginatedResponse<DocumentRequirementItem>,
    enabled: !!studentId,
  })
}

// ─── Document actions ───────────────────────────────────────────

export function useVerifyDocument(studentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ documentId, notes }: { documentId: string; notes?: string }) =>
      api.post(`/documents/${documentId}/verify`, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students', studentId, 'documents'] })
    },
  })
}

export function useRejectDocument(studentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ documentId, notes }: { documentId: string; notes?: string }) =>
      api.post(`/documents/${documentId}/reject`, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students', studentId, 'documents'] })
    },
  })
}
