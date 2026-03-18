'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

import type { UserRole } from '@sturec/shared'
import { useAuth } from '@/providers/auth-provider'
import { LoadingScreen } from '@/components/ui/loading-spinner'

interface RoleGuardProps {
  children: ReactNode
  allowed: UserRole[]
  redirectTo?: string
}

export function RoleGuard({
  children,
  allowed,
  redirectTo,
}: RoleGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user && !allowed.includes(user.role)) {
      const fallback =
        redirectTo ??
        (user.role === 'student' ? '/portal' : '/dashboard')
      router.replace(fallback)
    }
  }, [user, loading, allowed, redirectTo, router])

  if (loading) return <LoadingScreen />
  if (!user) return null
  if (!allowed.includes(user.role)) return null

  return <>{children}</>
}
