import { useQuery } from '@tanstack/react-query'

import type { TeamMemberItem } from '@sturec/shared'
import { fetchTeamMembers } from '@/features/team/lib/team-cache'

// ─── View models ─────────────────────────────────────────────────

/** Team member for list display */
export type TeamMemberView = TeamMemberItem

// ─── Hook ────────────────────────────────────────────────────────

export function useTeamMembers() {
  return useQuery({
    queryKey: ['team', 'members'],
    queryFn: () => fetchTeamMembers(),
  })
}
