import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import api from '@/lib/api/client'
import {
  useUpdateProfile,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  useSubmitSupportRequest,
  useStudentPortalApplication,
} from './use-student-portal'

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } })
  return createElement(QueryClientProvider, { client: qc }, children)
}

describe('useUpdateProfile', () => {
  it('patches student profile via /students/me', async () => {
    vi.mocked(api.patch).mockResolvedValueOnce({
      id: 's-1',
      referenceCode: 'STU-001',
      degreeLevel: 'master',
      gpa: 3.9,
      preferredCity: 'Lyon',
    })

    const { result } = renderHook(() => useUpdateProfile(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({
        degreeLevel: 'master',
        gpa: 3.9,
        preferredCity: 'Lyon',
      })
    })

    expect(api.patch).toHaveBeenCalledWith('/students/me', {
      degreeLevel: 'master',
      gpa: 3.9,
      preferredCity: 'Lyon',
    })
  })
})

describe('useNotificationPreferences', () => {
  it('fetches notification prefs from /students/me/notification-preferences', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      whatsappConsent: true,
      emailConsent: false,
    })

    const { result } = renderHook(() => useNotificationPreferences(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.whatsappConsent).toBe(true)
    expect(result.current.data?.emailConsent).toBe(false)
    expect(api.get).toHaveBeenCalledWith('/students/me/notification-preferences')
  })
})

describe('useUpdateNotificationPreferences', () => {
  it('patches notification prefs', async () => {
    vi.mocked(api.patch).mockResolvedValueOnce({
      whatsappConsent: false,
      emailConsent: true,
    })

    const { result } = renderHook(() => useUpdateNotificationPreferences(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({ whatsappConsent: false, emailConsent: true })
    })

    expect(api.patch).toHaveBeenCalledWith('/students/me/notification-preferences', {
      whatsappConsent: false,
      emailConsent: true,
    })
  })
})

describe('useSubmitSupportRequest', () => {
  it('posts support request to /students/me/support', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      id: 'sr-1',
      status: 'received',
      message: 'Your request has been received.',
    })

    const { result } = renderHook(() => useSubmitSupportRequest(), { wrapper })

    await act(async () => {
      const res = await result.current.mutateAsync({
        subject: 'Visa question',
        message: 'When should I apply for my visa?',
        category: 'visa',
      })
      expect(res.status).toBe('received')
    })

    expect(api.post).toHaveBeenCalledWith('/students/me/support', {
      subject: 'Visa question',
      message: 'When should I apply for my visa?',
      category: 'visa',
    })
  })
})

describe('useStudentPortalApplication', () => {
  it('fetches single application by ID', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      id: 'app-1',
      programName: 'MSc Data Science',
      universityName: 'Sorbonne',
      status: 'submitted',
      intakeName: 'Fall 2025',
      createdAt: '2025-01-01',
      submittedAt: '2025-01-05',
      decisionAt: null,
    })

    const { result } = renderHook(() => useStudentPortalApplication('app-1'), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.programName).toBe('MSc Data Science')
    expect(api.get).toHaveBeenCalledWith('/students/me/applications/app-1')
  })

  it('does not fetch when id is empty', () => {
    renderHook(() => useStudentPortalApplication(''), { wrapper })
    expect(api.get).not.toHaveBeenCalled()
  })
})
