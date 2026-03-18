'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { LoadingSpinner } from '@/components/ui/loading-spinner'

/** Catalog landing redirects to universities (first subroute). */
export default function CatalogLandingPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/catalog/universities')
  }, [router])

  return (
    <div className="flex items-center justify-center py-20">
      <LoadingSpinner size="lg" />
    </div>
  )
}
