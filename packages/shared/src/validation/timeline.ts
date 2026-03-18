import { z } from 'zod'
import { studentStageSchema } from './students'

export const timelineItemSchema = z.object({
  id: z.string().uuid(),
  fromStage: studentStageSchema.nullable(),
  toStage: studentStageSchema,
  changedByType: z.enum(['user', 'system', 'automation']),
  changedByUserId: z.string().uuid().nullable(),
  reasonCode: z.string().nullable(),
  reasonNote: z.string().nullable(),
  createdAt: z.string(),
})

export const stageChangeSchema = z.object({
  toStage: studentStageSchema,
  reasonCode: z.string().optional(),
  reasonNote: z.string().optional(),
})
