import { z } from 'zod'

export const analyticsOverviewSchema = z.object({
  period: z.object({ from: z.string(), to: z.string() }),
  data: z.object({
    leads: z.object({
      total: z.number(),
      new: z.number(),
      qualified: z.number(),
      converted: z.number(),
      disqualified: z.number(),
    }),
    students: z.object({
      total: z.number(),
      active: z.number(),
      byStage: z.record(z.string(), z.number()),
    }),
    applications: z.object({
      total: z.number(),
      submitted: z.number(),
      offers: z.number(),
      enrolled: z.number(),
    }),
    documents: z.object({
      pending: z.number(),
      verified: z.number(),
      rejected: z.number(),
    }),
    bookings: z.object({
      scheduled: z.number(),
      completed: z.number(),
    }),
  }),
})

export const pipelineMetricsSchema = z.object({
  period: z.object({ from: z.string(), to: z.string() }),
  data: z.object({
    funnel: z.array(z.object({ stage: z.string(), count: z.number() })),
    conversionRate: z.number().nullable(),
    averageDaysInStage: z.record(z.string(), z.number()),
  }),
})

export const counsellorAnalyticsItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  assignedLeads: z.number(),
  assignedStudents: z.number(),
  activityCount: z.number(),
  conversionRate: z.number().nullable(),
  overdueActions: z.number(),
})

export const counsellorAnalyticsDetailSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  period: z.object({ from: z.string(), to: z.string() }),
  caseload: z.object({ leads: z.number(), students: z.number() }),
  activityByType: z.record(z.string(), z.number()),
  activityByChannel: z.record(z.string(), z.number()),
  recentActivities: z.array(z.object({
    id: z.string().uuid(),
    activityType: z.string(),
    channel: z.string(),
    summary: z.string().nullable(),
    createdAt: z.string(),
  })),
  studentStages: z.record(z.string(), z.number()),
})

export const studentAnalyticsItemSchema = z.object({
  id: z.string().uuid(),
  referenceCode: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  stage: z.string(),
  daysInStage: z.number(),
  documentProgress: z.object({ completed: z.number(), total: z.number() }),
  applicationCount: z.number(),
  lastCounsellorTouchpoint: z.string().nullable(),
})

export const studentAnalyticsDetailSchema = z.object({
  id: z.string().uuid(),
  referenceCode: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  stage: z.string(),
  daysInStage: z.number(),
  period: z.object({ from: z.string(), to: z.string() }),
  documentProgress: z.object({ completed: z.number(), total: z.number() }),
  applications: z.object({ total: z.number(), offers: z.number(), enrolled: z.number() }),
  stageHistory: z.array(z.object({ stage: z.string(), enteredAt: z.string(), daysInStage: z.number() })),
  lastCounsellorTouchpoint: z.string().nullable(),
})
