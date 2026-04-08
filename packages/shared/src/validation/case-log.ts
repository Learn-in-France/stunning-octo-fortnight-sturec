import { z } from 'zod'

export const caseLogItemSchema = z.object({
  id: z.string().uuid(),
  kind: z.enum(['meeting_outcome', 'stage_change', 'note', 'activity', 'reminder', 'assignment']),
  title: z.string(),
  summary: z.string().nullable(),
  detail: z.string().nullable(),
  actorName: z.string().nullable(),
  status: z.string().nullable(),
  dueAt: z.string().nullable(),
  createdAt: z.string(),
})
