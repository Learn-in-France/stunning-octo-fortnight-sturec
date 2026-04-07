import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import api from '@/lib/api/client'
import { useLeads, useLead, useLeadStats } from './use-leads'

// Mock team-cache so leads hooks don't hit a second endpoint
// Use stable plain functions (not vi.fn) to survive restoreMocks: true
vi.mock('@/features/team/lib/team-cache', () => ({
  fetchTeamMembers: () => Promise.resolve([
    { id: 'c-1', firstName: 'Jane', lastName: 'Doe', role: 'counsellor', email: 'j@t.com', status: 'active' },
  ]),
  buildNameMap: () => new Map([['c-1', 'Jane Doe']]),
  resolveName: (map: Map<string, string>, id: string | null) =>
    id ? map.get(id) ?? 'Unknown' : 'Unassigned',
}))

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return createElement(QueryClientProvider, { client: qc }, children)
}

describe('useLeads', () => {
  it('fetches paginated leads and resolves counsellor names', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      items: [
        {
          id: 'l-1',
          firstName: 'Alice',
          lastName: 'Smith',
          email: 'a@s.com',
          status: 'new',
          source: 'manual',
          sourcePartner: null,
          qualificationScore: 72,
          priorityLevel: 'p2',
          assignedCounsellorId: 'c-1',
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
          profileCompleteness: 0.6,
          isPartnerHotLead: false,
          needsIntakeCompletion: false,
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
    })

    const { result } = renderHook(() => useLeads(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.items).toHaveLength(1)
    expect(result.current.data?.items[0].counsellorName).toBe('Jane Doe')
    expect(api.get).toHaveBeenCalledWith('/leads', expect.objectContaining({
      params: expect.objectContaining({ page: 1, limit: 20 }),
    }))
  })
})

describe('useLead', () => {
  it('fetches lead detail with assessment and timeline', async () => {
    const lead = {
      id: 'l-1',
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'a@s.com',
      status: 'qualified',
      source: 'manual',
      sourcePartner: null,
      qualificationScore: 85,
      priorityLevel: 'p1',
      profileCompleteness: 0.8,
      isPartnerHotLead: false,
      needsIntakeCompletion: false,
      assignedCounsellorId: 'c-1',
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
      userId: null,
      notes: null,
      mauticContactId: null,
      convertedStudentId: null,
      qualifiedAt: null,
      priorityUpdatedAt: null,
      createdByUserId: null,
      qualification: null,
    }

    vi.mocked(api.get)
      .mockResolvedValueOnce(lead) // lead detail
      .mockResolvedValueOnce({ items: [{ id: 'a-1', overallReadinessScore: 85, summaryForTeam: 'Strong' }], total: 1 }) // assessments
      .mockResolvedValueOnce({
        items: [{
          id: 'act-1',
          activityType: 'status_update',
          channel: 'system',
          summary: 'Stage changed',
          outcome: null,
          createdAt: '2025-01-02',
          createdBy: { id: 'u-1', name: 'System' },
        }],
        total: 1,
      }) // activities

    const { result } = renderHook(() => useLead('l-1'), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.latestAssessment?.overallReadinessScore).toBe(85)
    expect(result.current.data?.timeline).toHaveLength(1)
    expect(result.current.data?.timeline[0].type).toBe('stage_change')
    expect(result.current.data?.counsellorName).toBe('Jane Doe')
  })
})

describe('useLeadStats', () => {
  it('selects leads data from analytics overview', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        leads: { total: 50, new: 10, qualified: 20, converted: 15, disqualified: 5 },
        students: { active: 30, byStage: {} },
        applications: { total: 20, submitted: 10, offers: 5, enrolled: 3 },
        documents: { total: 100, pending: 8 },
      },
      period: { from: '2025-01-01', to: '2025-02-01' },
    })

    const { result } = renderHook(() => useLeadStats(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.total).toBe(50)
    expect(result.current.data?.qualified).toBe(20)
  })
})
