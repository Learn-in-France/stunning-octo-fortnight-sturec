import prisma from '../../lib/prisma.js'
import type { UserRole, UserStatus } from '@prisma/client'

export function findTeamMembers() {
  return prisma.user.findMany({
    where: {
      role: { in: ['admin', 'counsellor'] },
      deletedAt: null,
    },
    orderBy: { createdAt: 'desc' },
  })
}

export function findUserById(id: string) {
  return prisma.user.findFirst({
    where: { id, deletedAt: null },
  })
}

export function createInvitedUser(data: {
  email: string
  firstName: string
  lastName: string
  role: string
  invitedBy: string
  inviteTokenHash: string
  inviteTokenExpiresAt: Date
}) {
  return prisma.user.create({
    data: {
      firebaseUid: `pending_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role as UserRole,
      status: 'invited',
      invitedBy: data.invitedBy,
      invitedAt: new Date(),
      inviteTokenHash: data.inviteTokenHash,
      inviteTokenExpiresAt: data.inviteTokenExpiresAt,
    },
  })
}

export function updateTeamMember(id: string, data: {
  role?: string
  status?: string
}) {
  return prisma.user.update({
    where: { id },
    data: {
      ...(data.role && { role: data.role as UserRole }),
      ...(data.status && { status: data.status as UserStatus }),
    },
  })
}

export function findCounsellorAssignments(counsellorId: string) {
  return prisma.studentAssignment.findMany({
    where: { counsellorId },
    orderBy: { assignedAt: 'desc' },
    include: {
      student: {
        select: {
          id: true,
          referenceCode: true,
          user: { select: { firstName: true, lastName: true } },
        },
      },
    },
  })
}
