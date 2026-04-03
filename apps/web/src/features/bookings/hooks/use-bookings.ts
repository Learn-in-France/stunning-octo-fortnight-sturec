import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import type { BookingListItem, BookingStatus, AnalyticsOverview } from '@sturec/shared'
import api from '@/lib/api/client'
import { fetchTeamMembers, buildNameMap, resolveName } from '@/features/team/lib/team-cache'

// ─── View model ─────────────────────────────────────────────────

export interface BookingListItemView extends BookingListItem {
  counsellorName: string
}

// ─── List hook ──────────────────────────────────────────────────

interface UseBookingsParams {
  status?: BookingStatus | ''
}

export function useBookings(params: UseBookingsParams = {}) {
  return useQuery({
    queryKey: ['bookings', params],
    queryFn: async (): Promise<BookingListItemView[]> => {
      const [bookings, team] = await Promise.all([
        api.get('/bookings') as unknown as BookingListItem[],
        fetchTeamMembers(),
      ])

      const nameMap = buildNameMap(team)
      let items: BookingListItemView[] = bookings.map((b) => ({
        ...b,
        counsellorName: resolveName(nameMap, b.counsellorId),
      }))

      if (params.status) {
        items = items.filter((b) => b.status === params.status)
      }

      return items
    },
  })
}

// ─── Stats hook ─────────────────────────────────────────────────

export type BookingStats = AnalyticsOverview['data']['bookings']

export function useBookingStats() {
  return useQuery({
    queryKey: ['analytics', 'overview', {}],
    queryFn: () => api.get('/analytics/overview') as unknown as AnalyticsOverview,
    select: (overview) => overview.data.bookings,
  })
}

// ─── Create mutation ────────────────────────────────────────────

interface CreateBookingInput {
  studentId?: string
  leadId?: string
  counsellorId?: string | null
  scheduledAt: string
  notes?: string
  source?: 'chat' | 'portal'
}

export function useCreateBooking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateBookingInput) =>
      api.post('/bookings', data) as unknown as Promise<BookingListItem>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['student-portal', 'bookings'] })
      queryClient.invalidateQueries({ queryKey: ['analytics', 'overview'] })
    },
  })
}

// ─── Update mutation ────────────────────────────────────────────

interface UpdateBookingInput {
  status?: BookingStatus
  counsellorId?: string | null
  notes?: string
  scheduledAt?: string
}

export function useUpdateBooking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateBookingInput & { id: string }) =>
      api.patch(`/bookings/${id}`, data) as unknown as Promise<BookingListItem>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['student-portal', 'bookings'] })
      queryClient.invalidateQueries({ queryKey: ['analytics', 'overview'] })
    },
  })
}
