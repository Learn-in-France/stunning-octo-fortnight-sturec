import axios from 'axios'

import { env } from '@/lib/config/env'
import { getIdToken } from '@/lib/auth/firebase'

const api = axios.create({
  baseURL: `${env.apiUrl}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(async (config) => {
  const token = await getIdToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status
    const data = error.response?.data

    // Only force-redirect on 401 if NOT already on an auth page and NOT a verify/invite call.
    // Auth provider handles USER_NOT_FOUND without redirect loops.
    if (status === 401 && typeof window !== 'undefined') {
      const path = window.location.pathname
      const isAuthPage = path.startsWith('/auth/')
      const isVerifyCall = error.config?.url?.includes('/auth/verify')
      const isInviteCall = error.config?.url?.includes('/auth/accept-invite')
      if (!isAuthPage && !isVerifyCall && !isInviteCall) {
        window.location.href = '/auth/login'
      }
    }

    return Promise.reject(data ?? { error: error.message, code: 'NETWORK_ERROR' })
  },
)

export default api
