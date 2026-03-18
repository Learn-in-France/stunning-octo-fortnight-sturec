import type { TeamMemberItem } from '@sturec/shared'

import * as repo from './repository.js'
import { mapUserToTeamMember } from '../../lib/mappers/index.js'

export async function listTeamMembers(): Promise<TeamMemberItem[]> {
  const members = await repo.findTeamMembers()
  return members.map(mapUserToTeamMember)
}

export async function inviteTeamMember(
  data: { email: string; firstName: string; lastName: string; role: string },
  invitedBy: string,
): Promise<TeamMemberItem> {
  const user = await repo.createInvitedUser({ ...data, invitedBy })
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
