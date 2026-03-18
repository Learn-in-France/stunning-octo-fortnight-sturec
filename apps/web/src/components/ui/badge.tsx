import type { ReactNode } from 'react'

type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'muted'

interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
  className?: string
  dot?: boolean
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700 ring-gray-200',
  primary: 'bg-primary-50 text-primary-700 ring-primary-200',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-700 ring-amber-200',
  danger: 'bg-rose-50 text-rose-700 ring-rose-200',
  info: 'bg-sky-50 text-sky-700 ring-sky-200',
  muted: 'bg-slate-100 text-slate-500 ring-slate-200',
}

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-gray-500',
  primary: 'bg-primary-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  info: 'bg-sky-500',
  muted: 'bg-slate-400',
}

export function Badge({
  variant = 'default',
  children,
  className = '',
  dot = false,
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5
        text-xs font-semibold tracking-wide ring-1 ring-inset
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${dotColors[variant]}`}
        />
      )}
      {children}
    </span>
  )
}
