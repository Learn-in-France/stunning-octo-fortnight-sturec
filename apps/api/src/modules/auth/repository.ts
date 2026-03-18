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
