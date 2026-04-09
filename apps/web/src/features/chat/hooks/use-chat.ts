import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  ChatSessionItem,
  ChatMessageItem,
  ChatMessageResponse,
  ChatIntakeCheckResponse,
} from '@sturec/shared'
import api from '@/lib/api/client'

export function useChatSessions() {
  return useQuery({
    queryKey: ['chat', 'sessions'],
    queryFn: () => api.get('/chat/sessions') as unknown as Promise<ChatSessionItem[]>,
  })
}

export function useChatMessages(sessionId: string | null) {
  return useQuery({
    queryKey: ['chat', 'messages', sessionId],
    queryFn: () => api.get(`/chat/sessions/${sessionId}/messages`) as unknown as Promise<ChatMessageItem[]>,
    enabled: !!sessionId,
  })
}

export function useChatIntakeCheck(sessionId?: string | null) {
  return useQuery({
    queryKey: ['chat', 'intake-check', sessionId ?? null],
    queryFn: () =>
      api.post('/chat/intake-check', sessionId ? { sessionId } : {}) as unknown as Promise<ChatIntakeCheckResponse>,
  })
}

export function useStartSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () =>
      api.post('/chat/sessions') as unknown as ChatSessionItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chat', 'sessions'] })
      qc.invalidateQueries({ queryKey: ['chat', 'intake-check'] })
    },
  })
}

export function useSendMessage(sessionId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (content: string) =>
      api.post(`/chat/sessions/${sessionId}/messages`, { content }) as unknown as ChatMessageResponse,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chat', 'messages', sessionId] })
      qc.invalidateQueries({ queryKey: ['chat', 'intake-check'] })
    },
  })
}

export function useEndSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (sessionId: string) =>
      api.post(`/chat/sessions/${sessionId}/end`) as unknown as ChatSessionItem,
    onSuccess: (_, sessionId) => {
      qc.invalidateQueries({ queryKey: ['chat', 'sessions'] })
      qc.invalidateQueries({ queryKey: ['chat', 'sessions', sessionId] })
      qc.invalidateQueries({ queryKey: ['chat', 'intake-check'] })
    },
  })
}
