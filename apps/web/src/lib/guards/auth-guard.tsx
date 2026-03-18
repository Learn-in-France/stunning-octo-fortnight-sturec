'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

import { useAuth } from '@/providers/auth-provider'
import { LoadingScreen } from '@/components/ui/loading-spinner'

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading, authError } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    // No user and no pending resolution — redirect to login
    if (!user) {
      router.replace('/auth/login')
    }
  }, [user, loading, authError, router])

  if (loading) return <LoadingScreen />
  if (!user) return null

  return <>{children}</>
}
