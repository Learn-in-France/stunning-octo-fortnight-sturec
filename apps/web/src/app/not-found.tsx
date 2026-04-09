import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page not found — Learn in France',
  description:
    "The page you're looking for doesn't exist. Head back to the Learn in France home page or talk to our AI advisor.",
}

/**
 * Explicit 404 page. Having this file here (rather than relying on
 * Next's auto-generated `_not-found` page) stabilizes the production
 * build's trace-collection step, which can intermittently race on
 * `.next/server/app/_not-found/page.js.nft.json` for this app layout.
 */
export default function NotFound() {
  return (
    <div className="public-page flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl rounded-[28px] border border-white/60 bg-white/85 p-10 text-center shadow-[0_24px_72px_rgba(10,22,41,0.10)] backdrop-blur">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
          404 · Not found
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-[-0.02em] text-text-primary">
          We can&apos;t find that page.
        </h1>
        <p className="mt-4 text-sm leading-7 text-text-secondary">
          The link may be broken or the page may have moved. You can head back to
          the Learn in France home page or talk to our AI advisor for guidance.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-public-navy px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(10,22,41,0.18)] transition-colors hover:bg-primary-700"
          >
            Back to home
          </Link>
          <Link
            href="/auth/register"
            className="rounded-full border border-public-navy/25 bg-white/80 px-5 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:bg-white"
          >
            Talk to the AI advisor
          </Link>
        </div>
      </div>
    </div>
  )
}
