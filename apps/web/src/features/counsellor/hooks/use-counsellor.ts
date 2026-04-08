import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api/client'

// ─── Agenda ─────────────────────────────────────────────────

export function useCounsellorAgenda() {
  return useQuery({
    queryKey: ['counsellor', 'agenda'],
    queryFn: () => api.get('/counsellor/agenda') as Promise<{
      todayMeetings: Array<{
        id: string
        scheduledAt: string
        status: string
        student: { id: string; userId: string } | null
      }>
      overdueReminders: Array<{
        id: string
        title: string
        dueAt: string
        student: { id: string; userId: string } | null
      }>
      upcomingReminders: Array<{
        id: string
        title: string
        dueAt: string
        student: { id: string; userId: string } | null
      }>
      docsWaitingReview: Array<{
        id: string
        filename: string
        type: string
        studentId: string
        sharedAt: string | null
      }>
      staleStudents: Array<{
        id: string
        userId: string
        stage: string
        updatedAt: string
      }>
    }>,
    staleTime: 60_000,
  })
}

// ─── Reminders ──────────────────────────────────────────────

export function useCounsellorReminders(status?: string) {
  return useQuery({
    queryKey: ['counsellor', 'reminders', status],
    queryFn: () => api.get(`/counsellor/reminders${status ? `?status=${status}` : ''}`) as Promise<Array<{
      id: string
      title: string
      dueAt: string
      status: string
      source: string
      student: { id: string; userId: string } | null
    }>>,
  })
}

export function useCreateReminder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { studentId: string; title: string; dueAt: string }) =>
      api.post('/counsellor/reminders', data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['counsellor', 'reminders'] })
      qc.invalidateQueries({ queryKey: ['counsellor', 'agenda'] })
      qc.invalidateQueries({ queryKey: ['students', vars.studentId, 'case-log'] })
    },
  })
}

export function useCompleteReminder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/counsellor/reminders/${id}/complete`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['counsellor', 'reminders'] })
      qc.invalidateQueries({ queryKey: ['counsellor', 'agenda'] })
    },
  })
}

export function useDismissReminder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/counsellor/reminders/${id}/dismiss`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['counsellor', 'reminders'] })
      qc.invalidateQueries({ queryKey: ['counsellor', 'agenda'] })
    },
  })
}

// ─── Meeting Outcomes ───────────────────────────────────────

export function useMeetingOutcomes(studentId: string) {
  return useQuery({
    queryKey: ['students', studentId, 'meeting-outcomes'],
    queryFn: () => api.get(`/students/${studentId}/meeting-outcomes`) as Promise<Array<{
      id: string
      bookingId: string
      outcome: string
      nextAction: string
      followUpDueAt: string | null
      privateNote: string | null
      stageAfter: string | null
      createdAt: string
    }>>,
  })
}

export function useRecordMeetingOutcome() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      studentId: string
      bookingId: string
      outcome: string
      nextAction: string
      followUpDueAt?: string
      privateNote?: string
      stageAfter?: string
    }) => api.post(`/students/${data.studentId}/meeting-outcome`, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['students', vars.studentId] })
      qc.invalidateQueries({ queryKey: ['students', vars.studentId, 'meeting-outcomes'] })
      qc.invalidateQueries({ queryKey: ['students', vars.studentId, 'case-log'] })
      qc.invalidateQueries({ queryKey: ['counsellor', 'agenda'] })
      qc.invalidateQueries({ queryKey: ['counsellor', 'reminders'] })
      qc.invalidateQueries({ queryKey: ['bookings'] })
    },
  })
}
