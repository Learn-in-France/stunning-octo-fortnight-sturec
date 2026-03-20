import * as repo from './repository.js'

export interface InternalNotificationItem {
  id: string
  templateKey: string
  channel: string
  status: string
  readAt: string | null
  sentAt: string | null
  createdAt: string
  data: Record<string, unknown> | null
}

function mapNotification(n: {
  id: string
  templateKey: string
  channel: string
  status: string
  readAt: Date | null
  sentAt: Date | null
  createdAt: Date
  payloadJson: unknown
}): InternalNotificationItem {
  return {
    id: n.id,
    templateKey: n.templateKey,
    channel: n.channel,
    status: n.status,
    readAt: n.readAt?.toISOString() ?? null,
    sentAt: n.sentAt?.toISOString() ?? null,
    createdAt: n.createdAt.toISOString(),
    data: n.payloadJson as Record<string, unknown> | null,
  }
}

export async function getNotifications(userId: string) {
  const [items, unreadCount] = await Promise.all([
    repo.findByUserId(userId, 20),
    repo.countUnread(userId),
  ])
  return {
    items: items.map(mapNotification),
    unreadCount,
  }
}

export async function markRead(id: string, userId: string) {
  await repo.markRead(id, userId)
}

export async function markAllRead(userId: string) {
  await repo.markAllRead(userId)
}
