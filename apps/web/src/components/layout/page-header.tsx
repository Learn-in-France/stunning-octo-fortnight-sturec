import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  badge?: ReactNode
}

export function PageHeader({ title, description, actions, badge }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-text-primary font-display tracking-tight">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="mt-1 text-sm text-text-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
