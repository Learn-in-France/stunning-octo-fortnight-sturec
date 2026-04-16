import type { TeamMemberItem } from '@sturec/shared'
import api from '@/lib/api/client'

let cached: { data: TeamMemberItem[]; ts: number } | null = null
const TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Fetch team members with simple in-memory TTL cache. Safe to call
 * from queryFn. Returns an empty array if the caller lacks permission
 * (counsellors can't access GET /team) so downstream name resolution
 * falls back to generic labels instead of crashing the page.
 */
export async function fetchTeamMembers(): Promise<TeamMemberItem[]> {
  if (cached && Date.now() - cached.ts < TTL) return cached.data
  try {
    const data = await api.get('/team') as unknown as TeamMemberItem[]
    cached = { data, ts: Date.now() }
    return data
  } catch {
    return []
  }
}

/** Build id→name lookup from team member array. */
export function buildNameMap(members: TeamMemberItem[]): Map<string, string> {
  return new Map(members.map((m) => [m.id, `${m.firstName} ${m.lastName}`]))
}

/** Resolve counsellor display name from a name map. */
export function resolveName(nameMap: Map<string, string>, id: string | null): string {
  if (!id) return 'Unassigned'
  return nameMap.get(id) ?? 'Unknown'
}

interface ResolveCounsellorNameOptions {
  currentUserId?: string
}

/**
 * Resolve counsellor labels for role-limited screens.
 * When the viewer cannot access /team, fall back to "You" or a generic label
 * instead of forcing an admin-only lookup that will 403.
 */
export function resolveCounsellorName(
  nameMap: Map<string, string>,
  id: string | null,
  options: ResolveCounsellorNameOptions = {},
): string {
  if (!id) return 'Unassigned'
  if (options.currentUserId && id === options.currentUserId) return 'You'
  return nameMap.get(id) ?? 'Assigned counsellor'
}
