import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AuthUserResponse } from '@sturec/shared'
import api from '@/lib/api/client'

// ─── User profile (any authenticated role) ───────────────────────

export function useUserProfile() {
  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: () => api.get('/users/me') as unknown as AuthUserResponse,
  })
}

export interface UpdateUserProfilePayload {
  firstName?: string
  lastName?: string
  phone?: string
}

export function useUpdateUserProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: UpdateUserProfilePayload) =>
      api.patch('/users/me', data) as unknown as AuthUserResponse,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user', 'profile'] })
    },
  })
}
