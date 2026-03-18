import type { CounsellorActivityLog } from '@sturec/shared'

export interface TimelineItem {
  id: string
  type: 'stage_change' | 'assignment' | 'note' | 'activity' | 'assessment' | 'document'
  title: string
  description?: string
  timestamp: string
  actor?: string
}

export const MOCK_LEAD_TIMELINE: Record<string, TimelineItem[]> = {
  lead_01: [
    {
      id: 'tl_01',
      type: 'assessment',
      title: 'AI assessment completed',
      description: 'Qualification score: 85 (P1). Recommended: assign counsellor.',
      timestamp: '2026-03-15T14:30:00Z',
    },
    {
      id: 'tl_02',
      type: 'assignment',
      title: 'Assigned to Marc Dupont',
      description: 'Auto-assigned based on counsellor workload.',
      timestamp: '2026-03-15T15:00:00Z',
      actor: 'System',
    },
    {
      id: 'tl_03',
      type: 'stage_change',
      title: 'Status changed to Qualified',
      timestamp: '2026-03-15T14:30:00Z',
      actor: 'System',
    },
    {
      id: 'tl_04',
      type: 'activity',
      title: 'Initial contact call',
      description: 'Discussed program options. Student is interested in AI/ML masters at Paris-Saclay or Polytechnique.',
      timestamp: '2026-03-16T10:00:00Z',
      actor: 'Marc Dupont',
    },
  ],
  lead_02: [
    {
      id: 'tl_05',
      type: 'assessment',
      title: 'AI assessment completed',
      description: 'Qualification score: 68 (P2). Needs financial clarity.',
      timestamp: '2026-03-14T11:00:00Z',
    },
    {
      id: 'tl_06',
      type: 'stage_change',
      title: 'Status changed to Nurturing',
      timestamp: '2026-03-14T11:00:00Z',
      actor: 'System',
    },
  ],
  lead_04: [
    {
      id: 'tl_07',
      type: 'assessment',
      title: 'AI assessment completed',
      description: 'Qualification score: 82 (P1). Strong engineering profile.',
      timestamp: '2026-03-16T08:00:00Z',
    },
    {
      id: 'tl_08',
      type: 'assignment',
      title: 'Assigned to Amina Fall',
      timestamp: '2026-03-16T09:00:00Z',
      actor: 'Sarah Martin',
    },
    {
      id: 'tl_09',
      type: 'stage_change',
      title: 'Status changed to Qualified',
      timestamp: '2026-03-16T08:00:00Z',
      actor: 'System',
    },
  ],
}

export const MOCK_ACTIVITIES: CounsellorActivityLog[] = [
  {
    id: 'act_01',
    counsellorId: 'usr_counsel_01',
    leadId: 'lead_01',
    studentId: null,
    createdByUserId: 'usr_counsel_01',
    activityType: 'call',
    channel: 'phone',
    direction: 'outbound',
    outcome: 'Connected — discussed program preferences',
    summary: 'Discussed AI/ML masters options. Student prefers Paris. Has strong academic profile. Will send program shortlist.',
    nextActionDueAt: '2026-03-18T10:00:00Z',
    durationMinutes: 15,
    createdAt: '2026-03-16T10:00:00Z',
    updatedAt: '2026-03-16T10:00:00Z',
  },
  {
    id: 'act_02',
    counsellorId: 'usr_counsel_01',
    leadId: 'lead_01',
    studentId: null,
    createdByUserId: 'usr_counsel_01',
    activityType: 'email',
    channel: 'email',
    direction: 'outbound',
    outcome: 'Sent program shortlist',
    summary: 'Sent curated list of 5 AI/ML master programs with deadlines and requirements.',
    nextActionDueAt: '2026-03-20T10:00:00Z',
    durationMinutes: null,
    createdAt: '2026-03-16T14:00:00Z',
    updatedAt: '2026-03-16T14:00:00Z',
  },
]
