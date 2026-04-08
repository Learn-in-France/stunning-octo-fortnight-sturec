import type { TeamMemberItem } from '@sturec/shared'
import { createHash, randomBytes } from 'node:crypto'

import * as repo from './repository.js'
import { mapUserToTeamMember } from '../../lib/mappers/index.js'
import { getNotificationsQueue } from '../../lib/queue/index.js'

export async function listTeamMembers(): Promise<TeamMemberItem[]> {
  const members = await repo.findTeamMembers()
  return members.map(mapUserToTeamMember)
}

export async function inviteTeamMember(
  data: { email: string; firstName: string; lastName: string; role: string },
  invitedBy: string,
): Promise<TeamMemberItem> {
  const inviteToken = randomBytes(32).toString('hex')
  const inviteTokenHash = hashInviteToken(inviteToken)
  const inviteTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  const user = await repo.createInvitedUser({
    ...data,
    invitedBy,
    inviteTokenHash,
    inviteTokenExpiresAt,
  })

  const inviteUrl = buildInviteUrl({
    token: inviteToken,
    email: user.email,
  })

  getNotificationsQueue().add('team-invite', {
    recipientId: user.id,
    channel: 'email',
    templateKey: 'team_invite',
    data: {
      inviteUrl,
      invitedRole: user.role,
      inviteExpiresAt: inviteTokenExpiresAt.toISOString(),
      triggeringActionId: user.id,
    },
  }).catch((err) => console.error('[team] Failed to enqueue invite email:', err))

  return mapUserToTeamMember(user)
}

export async function updateTeamMember(
  id: string,
  data: { role?: string; status?: string },
): Promise<TeamMemberItem | null> {
  const existing = await repo.findUserById(id)
  if (!existing) return null

  const updated = await repo.updateTeamMember(id, data)
  return mapUserToTeamMember(updated)
}

export async function getCounsellorAssignments(counsellorId: string) {
  return repo.findCounsellorAssignments(counsellorId)
}

function hashInviteToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function buildInviteUrl(data: { token: string; email: string }) {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
  const params = new URLSearchParams({
    token: data.token,
    email: data.email,
  })
  return `${baseUrl.replace(/\/$/, '')}/auth/invite?${params.toString()}`
}
