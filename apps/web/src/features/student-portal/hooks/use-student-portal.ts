import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  StudentOwnProfile,
  StudentProgress,
  ApplicationListItem,
  DocumentListItem,
  DocumentRequirementItem,
  BookingListItem,
  NotificationItem,
  SupportRequestResponse,
} from '@sturec/shared'
import api from '@/lib/api/client'

export function useStudentProgress() {
  return useQuery({
    queryKey: ['student-portal', 'progress'],
    queryFn: () => api.get('/students/me/progress') as unknown as StudentProgress,
  })
}

export function useStudentProfile() {
  return useQuery({
    queryKey: ['student-portal', 'profile'],
    queryFn: () => api.get('/students/me') as unknown as StudentOwnProfile,
  })
}

export function useStudentPortalApplications() {
  return useQuery({
    queryKey: ['student-portal', 'applications'],
    queryFn: () => api.get('/students/me/applications') as unknown as ApplicationListItem[],
  })
}

export function useStudentPortalDocuments() {
  return useQuery({
    queryKey: ['student-portal', 'documents'],
    queryFn: () => api.get('/students/me/documents') as unknown as DocumentListItem[],
  })
}

export function useStudentPortalRequirements() {
  return useQuery({
    queryKey: ['student-portal', 'requirements'],
    queryFn: () => api.get('/students/me/requirements') as unknown as DocumentRequirementItem[],
  })
}

export function useStudentPortalBookings() {
  return useQuery({
    queryKey: ['student-portal', 'bookings'],
    queryFn: () => api.get('/students/me/bookings') as unknown as BookingListItem[],
  })
}

export function useStudentPortalNotifications() {
  return useQuery({
    queryKey: ['student-portal', 'notifications'],
    queryFn: () => api.get('/students/me/notifications') as unknown as NotificationItem[],
  })
}

// ─── Application detail ──────────────────────────────────────────

export function useStudentPortalApplication(id: string) {
  return useQuery({
    queryKey: ['student-portal', 'applications', id],
    queryFn: () => api.get(`/students/me/applications/${id}`) as unknown as ApplicationListItem,
    enabled: !!id,
  })
}

// ─── Profile update ──────────────────────────────────────────────

export interface UpdateOwnProfilePayload {
  degreeLevel?: string
  bachelorDegree?: string
  gpa?: number
  graduationYear?: number
  workExperienceYears?: number
  studyGapYears?: number
  englishTestType?: 'ielts' | 'toefl' | 'duolingo' | 'none'
  englishScore?: number
  budgetMin?: number
  budgetMax?: number
  fundingRoute?: string
  preferredCity?: string
  preferredIntake?: string
  housingNeeded?: boolean
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: UpdateOwnProfilePayload) =>
      api.patch('/students/me', data) as unknown as StudentOwnProfile,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student-portal', 'profile'] })
      qc.invalidateQueries({ queryKey: ['student-portal', 'progress'] })
    },
  })
}

// ─── Notification preferences ────────────────────────────────────

export interface NotificationPreferences {
  whatsappConsent: boolean
  emailConsent: boolean
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: ['student-portal', 'notification-preferences'],
    queryFn: () =>
      api.get('/students/me/notification-preferences') as unknown as NotificationPreferences,
  })
}

export function useUpdateNotificationPreferences() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<NotificationPreferences>) =>
      api.patch('/students/me/notification-preferences', data) as unknown as NotificationPreferences,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student-portal', 'notification-preferences'] })
      qc.invalidateQueries({ queryKey: ['student-portal', 'profile'] })
    },
  })
}

// ─── Support request ─────────────────────────────────────────────

export interface CreateSupportRequest {
  subject: string
  message: string
  category?: 'general' | 'documents' | 'application' | 'visa' | 'payment' | 'technical'
}

export function useSubmitSupportRequest() {
  return useMutation({
    mutationFn: async (data: CreateSupportRequest) =>
      api.post('/students/me/support', data) as unknown as SupportRequestResponse,
  })
}
