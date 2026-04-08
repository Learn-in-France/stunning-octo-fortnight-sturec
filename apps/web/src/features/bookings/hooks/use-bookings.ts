import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import type { BookingListItem, BookingStatus, AnalyticsOverview } from '@sturec/shared'
import api from '@/lib/api/client'
import {
  fetchTeamMembers,
  buildNameMap,
  resolveCounsellorName,
} from '@/features/team/lib/team-cache'

// ─── View model ─────────────────────────────────────────────────

export interface BookingListItemView extends BookingListItem {
  counsellorName: string
}

// ─── List hook ──────────────────────────────────────────────────

interface UseBookingsParams {
  status?: BookingStatus | ''
}

interface BookingHookOptions {
  resolveCounsellorNames?: boolean
  currentUserId?: string
  enabled?: boolean
}

export function useBookings(params: UseBookingsParams = {}, options: BookingHookOptions = {}) {
  return useQuery({
    queryKey: ['bookings', params, options],
    queryFn: async (): Promise<BookingListItemView[]> => {
      const bookings = await api.get('/bookings') as unknown as BookingListItem[]
      const team = options.resolveCounsellorNames === false ? [] : await fetchTeamMembers()

      const nameMap = buildNameMap(team)
      let items: BookingListItemView[] = bookings.map((b) => ({
        ...b,
        counsellorName: resolveCounsellorName(nameMap, b.counsellorId, {
          currentUserId: options.currentUserId,
        }),
      }))

      if (params.status) {
        items = items.filter((b) => b.status === params.status)
      }

      return items
    },
    enabled: options.enabled ?? true,
  })
}

// ─── Stats hook ─────────────────────────────────────────────────

export type BookingStats = AnalyticsOverview['data']['bookings']

export function useBookingStats(options: Pick<BookingHookOptions, 'enabled'> = {}) {
  return useQuery({
    queryKey: ['analytics', 'overview', {}],
    queryFn: () => api.get('/analytics/overview') as unknown as AnalyticsOverview,
    select: (overview) => overview.data.bookings,
    enabled: options.enabled ?? true,
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
