import Link from 'next/link'
import type { ReactNode } from 'react'

interface HeroAction {
  href: string
  label: string
  variant?: 'primary' | 'secondary'
}

interface MarketingHeroProps {
  label: ReactNode
  title: ReactNode
  description: ReactNode
  actions?: HeroAction[]
  aside?: ReactNode
  footer?: ReactNode
  caption?: ReactNode
}

export function MarketingHero({
  label,
  title,
  description,
  actions = [],
  aside,
  footer,
  caption,
}: MarketingHeroProps) {
  return (
    <section className="relative overflow-hidden pt-12 pb-10 sm:pt-16 sm:pb-14">
      <div className="public-shell">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="relative z-10">
            <span className="public-label">{label}</span>
            <h1 className="public-heading-section mt-6 !text-5xl leading-[0.95] sm:!text-6xl lg:!text-[5.2rem]">
              {title}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-public-slate">
              {description}
            </p>
            {actions.length > 0 && (
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {actions.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className={action.variant === 'secondary' ? 'public-button-secondary' : 'public-button-primary'}
                  >
                    {action.label}
                  </Link>
                ))}
              </div>
            )}
            {caption && (
              <p className="mt-5 text-sm leading-7 text-public-muted">{caption}</p>
            )}
          </div>

          <div className="relative z-10">{aside}</div>
        </div>

        {footer && <div className="mt-8">{footer}</div>}
      </div>
    </section>
  )
}

export function MetricStrip({
  items,
}: {
  items: Array<{ value: string; label: string; note?: string }>
}) {
  return (
    <section className="py-10 sm:py-14 border-y border-public-navy/5">
      <div className="public-shell">
        <div className="flex flex-col gap-10 text-center md:flex-row md:justify-around">
          {items.map((item) => (
            <div key={item.label} className="flex flex-col items-center">
              <p className="public-heading-section !tracking-[-0.04em] sm:!text-6xl">
                {item.value}
              </p>
              <p className="public-phase-label mt-2 !tracking-[0.16em]">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function SectionHeading({
  label,
  title,
  description,
  align = 'left',
}: {
  label: string
  title: string
  description: string
  align?: 'left' | 'center'
}) {
  const alignment = align === 'center' ? 'mx-auto text-center' : ''

  return (
    <div className={`max-w-3xl ${alignment}`}>
      <span className="public-label">{label}</span>
      <h2 className="public-heading-section mt-5">{title}</h2>
      <p className="mt-4 text-lg leading-8 text-public-slate">{description}</p>
    </div>
  )
}

export function EditorialCard({
  title,
  children,
  tone = 'light',
  className = '',
}: {
  title: string
  children: ReactNode
  tone?: 'light' | 'dark' | 'tinted'
  className?: string
}) {
  const toneClass =
    tone === 'dark'
      ? 'public-card-dark'
      : tone === 'tinted'
        ? 'public-card-tinted'
        : 'public-card-light'

  return (
    <div className={`public-card ${toneClass} ${className}`}>
      <h3 className="public-heading-card">{title}</h3>
      <div className={`mt-3 ${tone === 'dark' ? 'public-body-dark' : 'public-body'}`}>{children}</div>
    </div>
  )
}

export function MarketingCTA({
  label,
  title,
  description,
  primary,
  secondary,
}: {
  label: string
  title: string
  description: string
  primary: HeroAction
  secondary?: HeroAction
}) {
  return (
    <section className="py-12 sm:py-16">
      <div className="public-shell">
        <div className="relative overflow-hidden rounded-[var(--radius-cta)] bg-[image:var(--gradient-cta)] px-8 py-12 text-center text-white shadow-cta sm:px-14 sm:py-16">
          <div className="pointer-events-none absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_white,_transparent_60%)]" />
          <span className="relative inline-flex rounded-full bg-white/12 px-3 py-1.5 public-phase-label text-white/78">
            {label}
          </span>
          <h2 className="relative mx-auto mt-6 max-w-4xl font-display text-3xl font-extrabold tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
            {title}
          </h2>
          <p className="relative mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/78">
            {description}
          </p>
          <div className="relative mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href={primary.href} className="rounded-full bg-white px-8 py-4 text-base font-bold text-public-navy transition-transform hover:-translate-y-0.5">
              {primary.label}
            </Link>
            {secondary && (
              <Link
                href={secondary.href}
                className="rounded-full border border-white/22 px-8 py-4 text-base font-bold text-white transition-colors hover:bg-white/10"
              >
                {secondary.label}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
