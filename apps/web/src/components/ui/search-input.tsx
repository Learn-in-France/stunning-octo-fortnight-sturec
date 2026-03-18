'use client'

import { useRef, useEffect, useState } from 'react'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  debounceMs?: number
  className?: string
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  debounceMs = 300,
  className = '',
}: SearchInputProps) {
  const [local, setLocal] = useState(value)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    setLocal(value)
  }, [value])

  function handleChange(newValue: string) {
    setLocal(newValue)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onChange(newValue), debounceMs)
  }

  return (
    <div className={`relative ${className}`}>
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
        width="15"
        height="15"
        viewBox="0 0 15 15"
        fill="none"
      >
        <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M10.5 10.5L13.5 13.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <input
        type="text"
        value={local}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className={`
          w-full pl-9 pr-3 py-2 rounded-lg border border-border
          bg-surface-raised text-sm text-text-primary placeholder:text-text-muted
          transition-colors duration-150
          focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
        `}
      />
      {local && (
        <button
          onClick={() => handleChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-text-muted hover:text-text-primary transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M3 3l6 6M9 3l-6 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  )
}
