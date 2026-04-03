import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api/client'

// ─── Admin: Templates ───────────────────────────────────────

export function useCampaignTemplates(phaseKey?: string) {
  return useQuery({
    queryKey: ['campaign-templates', phaseKey],
    queryFn: () => api.get(`/campaign-templates${phaseKey ? `?phaseKey=${phaseKey}` : ''}`) as Promise<Array<{
      id: string
      name: string
      phaseKey: string
      channel: string
      deliveryMode: string
      templateKey: string
      subject: string | null
      description: string | null
      defaultDelayDays: number
      active: boolean
    }>>,
  })
}

export function useCreateCampaignTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      name: string
      phaseKey: string
      channel: string
      deliveryMode?: string
      templateKey: string
      subject?: string
      description?: string
      defaultDelayDays?: number
    }) => api.post('/campaign-templates', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaign-templates'] }),
  })
}

// ─── Admin: Packs ───────────────────────────────────────────

export function useCampaignPacks(phaseKey?: string) {
  return useQuery({
    queryKey: ['campaign-packs', phaseKey],
    queryFn: () => api.get(`/campaign-packs${phaseKey ? `?phaseKey=${phaseKey}` : ''}`) as Promise<Array<{
      id: string
      name: string
      phaseKey: string
      description: string | null
      steps: Array<{
        id: string
        orderIndex: number
        delayDays: number
        template: { id: string; name: string; channel: string; templateKey: string }
      }>
    }>>,
  })
}

export function useCreateCampaignPack() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      name: string
      phaseKey: string
      description?: string
      steps: Array<{ templateId: string; orderIndex: number; delayDays?: number }>
    }) => api.post('/campaign-packs', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaign-packs'] }),
  })
}

// ─── Counsellor: Student Campaigns ──────────────────────────

export function useStudentCampaigns(studentId: string) {
  return useQuery({
    queryKey: ['students', studentId, 'campaigns'],
    queryFn: () => api.get(`/students/${studentId}/campaigns`) as Promise<Array<{
      id: string
      phaseKey: string
      mode: string
      status: string
      startedAt: string | null
      pack: { id: string; name: string }
      steps: Array<{
        id: string
        orderIndex: number
        status: string
        scheduledFor: string | null
        sentAt: string | null
        template: { id: string; name: string; channel: string }
      }>
    }>>,
  })
}

export function useStartCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { studentId: string; packId: string }) =>
      api.post(`/students/${data.studentId}/campaigns/start`, { packId: data.packId }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['students', vars.studentId, 'campaigns'] })
    },
  })
}

export function useSendStep() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { studentId: string; campaignId: string; stepId: string }) =>
      api.post(`/students/${data.studentId}/campaigns/${data.campaignId}/send-step`, { stepId: data.stepId }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['students', vars.studentId, 'campaigns'] })
    },
  })
}

export function useSendAll() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { studentId: string; campaignId: string }) =>
      api.post(`/students/${data.studentId}/campaigns/${data.campaignId}/send-all`, {}),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['students', vars.studentId, 'campaigns'] })
    },
  })
}

export function usePauseCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { studentId: string; campaignId: string }) =>
      api.post(`/students/${data.studentId}/campaigns/${data.campaignId}/pause`, {}),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['students', vars.studentId, 'campaigns'] })
    },
  })
}

export function useResumeCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { studentId: string; campaignId: string }) =>
      api.post(`/students/${data.studentId}/campaigns/${data.campaignId}/resume`, {}),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['students', vars.studentId, 'campaigns'] })
    },
  })
}

export function useUpdateCampaignMode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { studentId: string; campaignId: string; mode: string }) =>
      api.patch(`/students/${data.studentId}/campaigns/${data.campaignId}/mode`, { mode: data.mode }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['students', vars.studentId, 'campaigns'] })
    },
  })
}

// ─── History ────────────────────────────────────────────────

export function useCampaignHistory(studentId: string) {
  return useQuery({
    queryKey: ['students', studentId, 'campaign-history'],
    queryFn: () => api.get(`/students/${studentId}/campaign-history`) as Promise<Array<{
      id: string
      templateKey: string
      channel: string
      status: string
      recipient: string
      sentAt: string | null
      createdAt: string
    }>>,
  })
}
