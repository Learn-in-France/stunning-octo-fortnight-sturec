'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function InternalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[internal] route error:', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md rounded-2xl border border-border bg-surface-raised p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-text-primary">Something went wrong</h1>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          An unexpected error occurred while loading this page. You can retry, or
          head back to the dashboard.
        </p>
        {error.digest && (
          <p className="mt-3 font-mono text-[11px] text-text-muted">
            ref: {error.digest}
          </p>
        )}
        <div className="mt-4 flex gap-2">
          <button
            onClick={reset}
            className="rounded-lg bg-primary-600 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-700"
          >
            Retry
          </button>
          <Link
            href="/dashboard"
            className="rounded-lg border border-border bg-surface-raised px-3 py-2 text-xs font-semibold text-text-primary hover:bg-surface-sunken"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
