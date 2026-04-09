import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import api from '@/lib/api/client'
import { useUserProfile, useUpdateUserProfile } from './use-settings'

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } })
  return createElement(QueryClientProvider, { client: qc }, children)
}

describe('useUserProfile', () => {
  it('fetches user profile from /users/me', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      id: 'u-1',
      email: 'admin@sturec.com',
      emailVerified: true,
      role: 'admin',
      firstName: 'Jane',
      lastName: 'Admin',
      phone: null,
      avatarUrl: null,
      status: 'active',
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    })

    const { result } = renderHook(() => useUserProfile(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.firstName).toBe('Jane')
    expect(api.get).toHaveBeenCalledWith('/users/me')
  })
})

describe('useUpdateUserProfile', () => {
  it('patches user profile via /users/me', async () => {
    vi.mocked(api.patch).mockResolvedValueOnce({
      id: 'u-1',
      email: 'admin@sturec.com',
      emailVerified: true,
      role: 'admin',
      firstName: 'Janet',
      lastName: 'Admin',
      phone: '+33600000000',
      avatarUrl: null,
      status: 'active',
      createdAt: '2025-01-01',
      updatedAt: '2025-01-02',
    })

    const { result } = renderHook(() => useUpdateUserProfile(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({
        firstName: 'Janet',
        phone: '+33600000000',
      })
    })

    expect(api.patch).toHaveBeenCalledWith('/users/me', {
      firstName: 'Janet',
      phone: '+33600000000',
    })
  })
})
