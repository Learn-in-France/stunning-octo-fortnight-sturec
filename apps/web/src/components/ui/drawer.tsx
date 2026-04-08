'use client'

import {
  useCallback,
  useEffect,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  size?: 'sm' | 'md' | 'lg'
  /** Optional sticky footer (e.g. action buttons). */
  footer?: ReactNode
  children: ReactNode
}

const sizeStyles: Record<NonNullable<DrawerProps['size']>, string> = {
  sm: 'sm:max-w-[360px]',
  md: 'sm:max-w-[480px]',
  lg: 'sm:max-w-[640px]',
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/**
 * Right-side slide-over drawer.
 *
 * Used as the single write surface for student detail actions
 * (record outcome, add reminder, change stage, reassign, etc.) so
 * the form lands where the user clicked instead of switching tabs
 * or scrolling the page.
 *
 * - Esc, backdrop click, and the X button all close
 * - Body scroll is locked while open
 * - Focus is trapped inside the drawer; on close, focus returns to
 *   the element that opened it
 * - Mobile: full width. Desktop: width per `size` prop.
 * - Renders into document.body via a portal so parent overflow:hidden
 *   does not clip the slide-in.
 */
export function Drawer({
  open,
  onClose,
  title,
  description,
  size = 'md',
  footer,
  children,
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  // Esc to close + body scroll lock
  useEffect(() => {
    if (!open) return

    previouslyFocused.current = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKey(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('keydown', handleKey)

    // Defer focus to next tick so the panel is mounted
    const focusTimer = window.setTimeout(() => {
      const panel = panelRef.current
      if (!panel) return
      const focusable = panel.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
      if (focusable) {
        focusable.focus()
      } else {
        panel.focus()
      }
    }, 0)

    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = previousOverflow
      window.clearTimeout(focusTimer)
      // Return focus to whatever opened the drawer
      previouslyFocused.current?.focus?.()
    }
  }, [open, onClose])

  // Basic focus trap on Tab / Shift+Tab inside the panel
  const handlePanelKeyDown = useCallback((event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return
    const panel = panelRef.current
    if (!panel) return
    const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    if (focusables.length === 0) {
      event.preventDefault()
      return
    }
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    const active = document.activeElement as HTMLElement | null
    if (event.shiftKey) {
      if (active === first || !panel.contains(active)) {
        event.preventDefault()
        last.focus()
      }
    } else {
      if (active === last) {
        event.preventDefault()
        first.focus()
      }
    }
  }, [])

  if (!open) return null
  if (typeof document === 'undefined') return null

  const content = (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        aria-describedby={description ? 'drawer-description' : undefined}
        tabIndex={-1}
        onKeyDown={handlePanelKeyDown}
        className={`
          relative flex h-full w-full ${sizeStyles[size]} flex-col
          bg-surface-raised border-l border-border shadow-2xl
          motion-safe:animate-in motion-safe:slide-in-from-right motion-safe:duration-200
        `}
      >
        {/* Sticky header */}
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div className="min-w-0">
            <h2
              id="drawer-title"
              className="font-display text-base font-semibold text-text-primary"
            >
              {title}
            </h2>
            {description && (
              <p
                id="drawer-description"
                className="mt-1 text-xs leading-5 text-text-muted"
              >
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="rounded-md p-1 text-text-muted transition-colors hover:bg-surface-sunken hover:text-text-primary cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Sticky footer (optional) */}
        {footer && (
          <div className="border-t border-border bg-surface-raised px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
