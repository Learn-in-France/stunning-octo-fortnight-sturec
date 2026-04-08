import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  badge?: ReactNode
}

export function PageHeader({ title, description, actions, badge }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0 max-w-3xl">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-semibold tracking-[-0.04em] text-text-primary sm:text-4xl">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="mt-3 max-w-2xl text-sm leading-7 text-text-secondary sm:text-base">{description}</p>
        )}
      </div>
      {actions && <div className="min-w-0 w-full lg:w-auto">{actions}</div>}
    </div>
  )
}
