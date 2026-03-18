'use client'

import { useState, useRef, useEffect, type ReactNode } from 'react'

interface DropdownItem {
  label: string
  onClick: () => void
  variant?: 'default' | 'danger'
  icon?: ReactNode
}

interface DropdownMenuProps {
  trigger: ReactNode
  items: DropdownItem[]
  align?: 'left' | 'right'
}

export function DropdownMenu({
  trigger,
  items,
  align = 'right',
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative inline-block" ref={ref}>
      <div onClick={() => setOpen(!open)} className="cursor-pointer">
        {trigger}
      </div>
      {open && (
        <div
          className={`
            absolute top-full mt-1 z-50 min-w-[160px]
            bg-surface-raised rounded-lg border border-border shadow-lg py-1
            ${align === 'right' ? 'right-0' : 'left-0'}
          `}
        >
          {items.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                item.onClick()
                setOpen(false)
              }}
              className={`
                w-full flex items-center gap-2 px-3 py-2 text-sm text-left
                transition-colors
                ${
                  item.variant === 'danger'
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-text-primary hover:bg-surface-sunken'
                }
              `}
            >
              {item.icon && <span className="shrink-0 w-4">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
