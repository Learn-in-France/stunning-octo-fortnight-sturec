'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { useAuth } from '@/providers/auth-provider'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

/**
 * Role-aware analytics landing.
 * Counsellors → pipeline view, Admins → overview.
 */
export default function AnalyticsLandingPage() {
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return
    if (user.role === 'admin') {
      router.replace('/analytics/overview')
    } else {
      router.replace('/analytics/pipeline')
    }
  }, [user, router])

  return (
    <div className="flex items-center justify-center py-20">
      <LoadingSpinner size="lg" />
    </div>
  )
}
