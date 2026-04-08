import prisma from '../../lib/prisma.js'

export async function findUserByFirebaseUid(firebaseUid: string) {
  return prisma.user.findFirst({
    where: { firebaseUid, deletedAt: null },
  })
}

export async function findUserByEmail(email: string) {
  return prisma.user.findFirst({
    where: { email, deletedAt: null },
  })
}

export async function findInvitedUserByEmail(email: string) {
  return prisma.user.findFirst({
    where: { email, status: 'invited', deletedAt: null },
  })
}

export async function findValidInviteByEmailAndTokenHash(email: string, inviteTokenHash: string) {
  return prisma.user.findFirst({
    where: {
      email,
      status: 'invited',
      inviteTokenHash,
      inviteTokenExpiresAt: { gt: new Date() },
      deletedAt: null,
    },
  })
}

export async function createUser(data: {
  firebaseUid: string
  email: string
  firstName: string
  lastName: string
  role?: 'student' | 'counsellor' | 'admin'
}) {
  return prisma.user.create({
    data: {
      firebaseUid: data.firebaseUid,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role || 'student',
      status: 'active',
    },
  })
}

export async function linkFirebaseUidToUser(userId: string, firebaseUid: string) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      firebaseUid,
      status: 'active',
      inviteTokenHash: null,
      inviteTokenExpiresAt: null,
      inviteAcceptedAt: new Date(),
    },
  })
}

export async function acceptInviteForUser(data: {
  userId: string
  firebaseUid: string
  firstName: string
  lastName: string
}) {
  return prisma.user.update({
    where: { id: data.userId },
    data: {
      firebaseUid: data.firebaseUid,
      firstName: data.firstName,
      lastName: data.lastName,
      status: 'active',
      inviteTokenHash: null,
      inviteTokenExpiresAt: null,
      inviteAcceptedAt: new Date(),
    },
  })
}

export async function validateInvite(email: string, inviteTokenHash: string) {
  return prisma.user.findFirst({
    where: {
      email,
      status: 'invited',
      inviteTokenHash,
      inviteTokenExpiresAt: { gt: new Date() },
      deletedAt: null,
    },
    select: {
      email: true,
      role: true,
      firstName: true,
      lastName: true,
      inviteTokenExpiresAt: true,
    },
  })
}

export async function findUserById(id: string) {
  return prisma.user.findFirst({ where: { id, deletedAt: null } })
}

export async function updateUserProfile(
  id: string,
  data: { firstName?: string; lastName?: string; phone?: string },
) {
  return prisma.user.update({
    where: { id },
    data,
  })
}

export async function linkLeadToUser(email: string, userId: string) {
  // Find leads with matching email that don't have a user_id yet
  await prisma.lead.updateMany({
    where: {
      email,
      userId: null,
      deletedAt: null,
    },
    data: {
      userId,
    },
  })
}

export async function findStudentByUserId(userId: string) {
  return prisma.student.findFirst({
    where: { userId, deletedAt: null },
  })
}

export async function findLatestLeadByUserId(userId: string) {
  return prisma.lead.findFirst({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    select: {
      source: true,
      sourcePartner: true,
    },
  })
}

export async function upsertStudentForUser(data: {
  userId: string
  source: string
  sourcePartner?: string | null
}) {
  const year = new Date().getFullYear()
  const referenceCode = `STU-${year}-${Date.now().toString().slice(-5)}`

  return prisma.student.upsert({
    where: { userId: data.userId },
    update: {},
    create: {
      userId: data.userId,
      referenceCode,
      source: data.source,
      sourcePartner: data.sourcePartner ?? null,
      stage: 'lead_created',
      stageUpdatedAt: new Date(),
    },
  })
}
