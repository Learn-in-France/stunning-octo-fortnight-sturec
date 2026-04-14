'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function StudentError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[student] route error:', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md rounded-2xl border border-border bg-surface-raised p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-text-primary">Something went wrong</h1>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          We couldn't load this page. Please retry. If the problem persists,
          contact your advisor.
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
            href="/portal"
            className="rounded-lg border border-border bg-surface-raised px-3 py-2 text-xs font-semibold text-text-primary hover:bg-surface-sunken"
          >
            Back to portal
          </Link>
        </div>
      </div>
    </div>
  )
}
