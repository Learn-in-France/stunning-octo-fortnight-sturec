export type ActivityType =
  | 'call'
  | 'whatsapp'
  | 'email'
  | 'meeting'
  | 'follow_up'
  | 'status_update'
  | 'other'

export type ActivityChannel =
  | 'phone'
  | 'whatsapp'
  | 'email'
  | 'video'
  | 'in_person'
  | 'internal'
  | 'other'

export type ActivityDirection = 'outbound' | 'inbound' | 'internal'

export interface CounsellorActivityLog {
  id: string
  counsellorId: string
  leadId: string | null
  studentId: string | null
  createdByUserId: string
  activityType: ActivityType
  channel: ActivityChannel
  direction: ActivityDirection
  outcome: string | null
  summary: string | null
  nextActionDueAt: string | null
  durationMinutes: number | null
  createdAt: string
  updatedAt: string
}
