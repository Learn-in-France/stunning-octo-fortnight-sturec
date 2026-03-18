import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import api from '@/lib/api/client'
import {
  useStudentProgress,
  useStudentProfile,
  useStudentPortalApplications,
  useStudentPortalDocuments,
  useStudentPortalRequirements,
  useStudentPortalBookings,
  useStudentPortalNotifications,
} from './use-student-portal'

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return createElement(QueryClientProvider, { client: qc }, children)
}

describe('useStudentProgress', () => {
  it('fetches student progress from /students/me/progress', async () => {
    const progress = {
      stage: 'admitted',
      progressPercent: 60,
      applications: { total: 3, offers: 1 },
      documentChecklist: { completed: 5, total: 10 },
      visa: { status: 'not_started' },
      nextActions: ['Upload passport'],
      completedMilestones: ['Profile complete'],
    }
    vi.mocked(api.get).mockResolvedValueOnce(progress)

    const { result } = renderHook(() => useStudentProgress(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.stage).toBe('admitted')
    expect(result.current.data?.progressPercent).toBe(60)
    expect(api.get).toHaveBeenCalledWith('/students/me/progress')
  })
})

describe('useStudentProfile', () => {
  it('fetches student profile from /students/me', async () => {
    const profile = {
      id: 's-1',
      referenceCode: 'STU-001',
      degreeLevel: 'bachelor',
      bachelorDegree: 'Computer Science',
      gpa: 3.5,
      graduationYear: 2024,
      englishTestType: 'ielts',
      englishScore: 7.0,
      preferredCity: 'Paris',
      preferredIntake: 'Fall 2025',
      housingNeeded: true,
      budgetMin: 5000,
      budgetMax: 15000,
      fundingRoute: 'self-funded',
      whatsappConsent: true,
      emailConsent: true,
      parentInvolvement: false,
      createdAt: '2025-01-01',
    }
    vi.mocked(api.get).mockResolvedValueOnce(profile)

    const { result } = renderHook(() => useStudentProfile(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.referenceCode).toBe('STU-001')
    expect(result.current.data?.gpa).toBe(3.5)
    expect(api.get).toHaveBeenCalledWith('/students/me')
  })
})

describe('useStudentPortalApplications', () => {
  it('fetches applications list', async () => {
    const apps = [
      { id: 'app-1', programName: 'MSc CS', universityName: 'Sorbonne', status: 'submitted', intakeName: 'Fall 2025', createdAt: '2025-01-01', submittedAt: '2025-01-02', decisionAt: null },
    ]
    vi.mocked(api.get).mockResolvedValueOnce(apps)

    const { result } = renderHook(() => useStudentPortalApplications(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data?.[0].programName).toBe('MSc CS')
    expect(api.get).toHaveBeenCalledWith('/students/me/applications')
  })
})

describe('useStudentPortalDocuments', () => {
  it('fetches documents list', async () => {
    const docs = [
      { id: 'd-1', type: 'passport', filename: 'passport.pdf', status: 'verified', uploadedAt: '2025-01-01' },
    ]
    vi.mocked(api.get).mockResolvedValueOnce(docs)

    const { result } = renderHook(() => useStudentPortalDocuments(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(api.get).toHaveBeenCalledWith('/students/me/documents')
  })
})

describe('useStudentPortalRequirements', () => {
  it('fetches requirements list', async () => {
    const reqs = [
      { id: 'r-1', documentType: 'Passport', status: 'missing', required: true, requirementSource: 'visa', notes: null, dueDate: null },
    ]
    vi.mocked(api.get).mockResolvedValueOnce(reqs)

    const { result } = renderHook(() => useStudentPortalRequirements(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(api.get).toHaveBeenCalledWith('/students/me/requirements')
  })
})

describe('useStudentPortalBookings', () => {
  it('fetches bookings', async () => {
    vi.mocked(api.get).mockResolvedValueOnce([])

    const { result } = renderHook(() => useStudentPortalBookings(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
    expect(api.get).toHaveBeenCalledWith('/students/me/bookings')
  })
})

describe('useStudentPortalNotifications', () => {
  it('fetches notifications', async () => {
    vi.mocked(api.get).mockResolvedValueOnce([])

    const { result } = renderHook(() => useStudentPortalNotifications(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
    expect(api.get).toHaveBeenCalledWith('/students/me/notifications')
  })
})
