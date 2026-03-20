import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import api from '@/lib/api/client'

interface NotificationItem {
  id: string
  templateKey: string
  channel: string
  status: string
  readAt: string | null
  sentAt: string | null
  createdAt: string
  data: Record<string, unknown> | null
}

interface NotificationsResponse {
  items: NotificationItem[]
  unreadCount: number
}

export function useMyNotifications() {
  return useQuery({
    queryKey: ['my-notifications'],
    queryFn: () => api.get('/users/me/notifications') as unknown as NotificationsResponse,
    refetchInterval: 30_000,
  })
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.patch(`/users/me/notifications/${id}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-notifications'] })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.patch('/users/me/notifications/read-all'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-notifications'] })
    },
  })
}
