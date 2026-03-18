import prisma from '../../lib/prisma.js'
import type { Prisma, ApplicationStatus } from '@prisma/client'

const applicationInclude = {
  program: {
    select: { name: true, university: { select: { name: true } } },
  },
  intake: { select: { intakeName: true } },
} as const

export function findStudentApplications(studentId: string) {
  return prisma.application.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
    include: applicationInclude,
  })
}

export function findAllApplications(args: {
  skip: number
  take: number
  orderBy: Record<string, 'asc' | 'desc'>
  where?: Prisma.ApplicationWhereInput
}) {
  return prisma.application.findMany({
    where: args.where,
    skip: args.skip,
    take: args.take,
    orderBy: args.orderBy,
    include: applicationInclude,
  })
}

export function countApplications(where?: Prisma.ApplicationWhereInput) {
  return prisma.application.count({ where })
}

export function findApplicationById(id: string) {
  return prisma.application.findUnique({
    where: { id },
    include: applicationInclude,
  })
}

export function createApplication(data: {
  studentId: string
  programId: string
  intakeId?: string
  notes?: string
  createdBy: string
}) {
  return prisma.application.create({
    data: {
      studentId: data.studentId,
      programId: data.programId,
      intakeId: data.intakeId,
      notes: data.notes,
      createdBy: data.createdBy,
    },
    include: applicationInclude,
  })
}

export function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
  updatedBy: string,
) {
  const data: Prisma.ApplicationUncheckedUpdateInput = {
    status,
    updatedBy,
  }

  if (status === 'submitted') data.submittedAt = new Date()
  if (status === 'offer' || status === 'rejected') data.decisionAt = new Date()

  return prisma.application.update({
    where: { id },
    data,
    include: applicationInclude,
  })
}

export function buildApplicationWhere(filters: {
  programId?: string
  universityId?: string
  status?: string
  intakeId?: string
  studentId?: string
}): Prisma.ApplicationWhereInput {
  const where: Prisma.ApplicationWhereInput = {}

  if (filters.programId) where.programId = filters.programId
  if (filters.status) where.status = filters.status as ApplicationStatus
  if (filters.intakeId) where.intakeId = filters.intakeId
  if (filters.studentId) where.studentId = filters.studentId
  if (filters.universityId) {
    where.program = { universityId: filters.universityId }
  }

  return where
}
