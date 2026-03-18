import type { TeamMemberItem } from '@sturec/shared'
import api from '@/lib/api/client'

let cached: { data: TeamMemberItem[]; ts: number } | null = null
const TTL = 5 * 60 * 1000 // 5 minutes

/** Fetch team members with simple in-memory TTL cache. Safe to call from queryFn. */
export async function fetchTeamMembers(): Promise<TeamMemberItem[]> {
  if (cached && Date.now() - cached.ts < TTL) return cached.data
  const data = await api.get('/team') as unknown as TeamMemberItem[]
  cached = { data, ts: Date.now() }
  return data
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
