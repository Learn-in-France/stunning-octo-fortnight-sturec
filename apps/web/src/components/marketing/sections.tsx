import Link from 'next/link'
import type { ReactNode } from 'react'

interface HeroAction {
  href: string
  label: string
  variant?: 'primary' | 'secondary'
}

interface MarketingHeroProps {
  label: string
  title: ReactNode
  description: string
  actions?: HeroAction[]
  aside?: ReactNode
  caption?: string
}

export function MarketingHero({
  label,
  title,
  description,
  actions = [],
  aside,
  caption,
}: MarketingHeroProps) {
  return (
    <section className="relative overflow-hidden">
      <div className="public-shell grid gap-12 pb-14 pt-10 lg:grid-cols-[minmax(0,1.1fr)_420px] lg:items-center lg:gap-16 lg:pb-20 lg:pt-16">
        <div className="relative z-10">
          <span className="public-label">{label}</span>
          <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[0.96] tracking-[-0.04em] text-[var(--color-public-navy)] sm:text-6xl lg:text-7xl">
            {title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[color:var(--color-public-slate)] sm:text-xl">
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
            <p className="mt-6 text-sm leading-7 text-[color:var(--color-public-muted)]">{caption}</p>
          )}
        </div>

        <div className="relative z-10">{aside}</div>
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
    <section className="pb-10">
      <div className="public-shell">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => (
            <div key={item.label} className="public-panel p-6">
              <p className="text-3xl font-semibold tracking-[-0.04em] text-[var(--color-public-navy)]">
                {item.value}
              </p>
              <p className="mt-2 text-sm font-medium text-[color:var(--color-public-slate)]">{item.label}</p>
              {item.note && (
                <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[color:var(--color-public-muted)]">
                  {item.note}
                </p>
              )}
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
      <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-[var(--color-public-navy)] sm:text-5xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-8 text-[color:var(--color-public-slate)] sm:text-lg">
        {description}
      </p>
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
  const toneClasses =
    tone === 'dark'
      ? 'bg-[linear-gradient(140deg,rgba(10,22,41,1),rgba(24,39,64,0.96))] text-white shadow-[0_28px_80px_rgba(10,22,41,0.24)]'
      : tone === 'tinted'
        ? 'bg-[linear-gradient(140deg,rgba(255,255,255,0.9),rgba(228,238,235,0.88))] text-[var(--color-public-navy)] shadow-[0_20px_60px_rgba(10,22,41,0.08)]'
        : 'bg-white/88 text-[var(--color-public-navy)] shadow-[0_20px_60px_rgba(10,22,41,0.08)]'

  return (
    <div className={`rounded-[28px] p-7 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_28px_70px_rgba(10,22,41,0.12)] ${toneClasses} ${className}`}>
      <h3 className="text-2xl font-semibold tracking-[-0.03em]">{title}</h3>
      <div className="mt-4 text-sm leading-7 text-inherit/80">{children}</div>
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
    <section className="py-20">
      <div className="public-shell">
        <div className="overflow-hidden rounded-[36px] bg-[linear-gradient(140deg,rgba(10,22,41,1),rgba(0,106,98,0.92),rgba(91,30,38,0.92))] px-8 py-10 text-white shadow-[0_28px_90px_rgba(10,22,41,0.28)] sm:px-12 sm:py-14">
          <span className="inline-flex rounded-full bg-white/12 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/78">
            {label}
          </span>
          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">{title}</h2>
              <p className="mt-4 text-base leading-8 text-white/78 sm:text-lg">{description}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link href={primary.href} className="rounded-full bg-white px-6 py-3 text-center text-sm font-semibold text-[var(--color-public-navy)] transition-transform hover:-translate-y-0.5">
                {primary.label}
              </Link>
              {secondary && (
                <Link
                  href={secondary.href}
                  className="rounded-full border border-white/22 px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  {secondary.label}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
