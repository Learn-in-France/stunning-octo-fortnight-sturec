'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'

import { BrandLogo } from '@/components/branding/brand-logo'

interface AuthShellProps {
  eyebrow: string
  title: ReactNode
  description: ReactNode
  children: ReactNode
  footer?: ReactNode
  sideTitle: string
  sideCopy: string
  sidePoints: string[]
  mode?: 'student' | 'team'
}

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
  sideTitle,
  sideCopy,
  sidePoints,
  mode = 'student',
}: AuthShellProps) {
  const accentClass =
    mode === 'team'
      ? 'bg-[image:var(--gradient-cta)]'
      : 'bg-[image:var(--gradient-cta)]'

  return (
    <div className="public-page min-h-screen">
      <div className="public-shell py-6 sm:py-8">
        <div className="flex items-center justify-between gap-4">
          <BrandLogo href="/" variant="inline" />
          <Link
            href="/"
            className="rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-[var(--color-public-navy)] shadow-[0_10px_26px_rgba(10,22,41,0.06)] transition-colors hover:bg-white"
          >
            Back to site
          </Link>
        </div>
      </div>

      <div className="public-shell pb-10 pt-2 sm:pb-16">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_520px]">
          <section className={`overflow-hidden rounded-[36px] p-8 text-white shadow-[0_28px_90px_rgba(10,22,41,0.22)] sm:p-10 lg:p-12 ${accentClass}`}>
            <span className="inline-flex rounded-full bg-white/12 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/72">
              {eyebrow}
            </span>
            <h1 className="mt-8 max-w-xl font-display text-4xl font-semibold leading-[0.98] tracking-[-0.04em] sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-white/74 sm:text-lg">
              {description}
            </p>

            <div className="mt-10 rounded-[28px] bg-white/8 p-6 backdrop-blur-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/52">
                {sideTitle}
              </p>
              <p className="mt-4 text-sm leading-7 text-white/74">{sideCopy}</p>
              <div className="mt-6 space-y-3">
                {sidePoints.map((point) => (
                  <div key={point} className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-white/70" />
                    <p className="text-sm leading-7 text-white/78">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="public-panel p-6 sm:p-8 lg:p-10">
            {children}
            {footer ? <div className="mt-6">{footer}</div> : null}
          </section>
        </div>
      </div>
    </div>
  )
}
