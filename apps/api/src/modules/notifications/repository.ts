import prisma from '../../lib/prisma.js'

export function findByUserId(userId: string, limit = 20) {
  return prisma.notificationLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

export function countUnread(userId: string) {
  return prisma.notificationLog.count({
    where: { userId, readAt: null },
  })
}

export function markRead(id: string, userId: string) {
  return prisma.notificationLog.updateMany({
    where: { id, userId },
    data: { readAt: new Date() },
  })
}

export function markAllRead(userId: string) {
  return prisma.notificationLog.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  })
}
