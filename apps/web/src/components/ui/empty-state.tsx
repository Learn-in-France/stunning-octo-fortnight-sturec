import type { ReactNode } from 'react'
import { Button } from './button'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center gap-3 py-6 px-4 text-center">
      {icon && (
        <div className="text-text-muted opacity-30 shrink-0">{icon}</div>
      )}
      <div>
        <p className="text-xs text-text-muted">
          {title}
          {description && <span className="ml-1 text-text-muted/70">{description}</span>}
        </p>
      </div>
      {action && (
        <Button size="sm" variant="secondary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
