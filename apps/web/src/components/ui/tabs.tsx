'use client'

import { useState, type ReactNode } from 'react'

export interface TabItem {
  id: string
  label: string
  count?: number
  content: ReactNode
}

interface TabsProps {
  items: TabItem[]
  defaultTab?: string
}

export function Tabs({ items, defaultTab }: TabsProps) {
  const [active, setActive] = useState(defaultTab ?? items[0]?.id)
  const activeItem = items.find((t) => t.id === active)

  return (
    <div>
      <div className="flex gap-0 border-b border-border overflow-x-auto">
        {items.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`
              relative px-4 py-2.5 text-sm font-medium whitespace-nowrap
              transition-colors duration-150 cursor-pointer
              ${
                active === tab.id
                  ? 'text-primary-700'
                  : 'text-text-muted hover:text-text-secondary'
              }
            `}
          >
            <span className="flex items-center gap-2">
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`
                    text-[10px] px-1.5 py-0.5 rounded-full font-semibold
                    ${
                      active === tab.id
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-gray-100 text-gray-500'
                    }
                  `}
                >
                  {tab.count}
                </span>
              )}
            </span>
            {active === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-t-full" />
            )}
          </button>
        ))}
      </div>
      <div className="mt-4">{activeItem?.content}</div>
    </div>
  )
}
