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
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && (
        <div className="mb-4 text-text-muted opacity-40">{icon}</div>
      )}
      <h3 className="text-sm font-semibold text-text-primary font-display mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-xs text-text-muted max-w-sm">{description}</p>
      )}
      {action && (
        <div className="mt-4">
          <Button size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      )}
    </div>
  )
}
