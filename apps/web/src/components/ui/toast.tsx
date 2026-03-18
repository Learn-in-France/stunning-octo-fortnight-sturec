'use client'

import { useToast, type ToastType } from '@/providers/toast-provider'

const iconMap: Record<ToastType, string> = {
  success: '✓',
  error: '!',
  info: 'i',
}

const styleMap: Record<ToastType, string> = {
  success: 'bg-emerald-900 text-emerald-50 border-emerald-700',
  error: 'bg-rose-900 text-rose-50 border-rose-700',
  info: 'bg-slate-800 text-slate-50 border-slate-600',
}

const iconBgMap: Record<ToastType, string> = {
  success: 'bg-emerald-500',
  error: 'bg-rose-500',
  info: 'bg-slate-500',
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg
            min-w-[280px] max-w-[400px]
            animate-in slide-in-from-right duration-300
            ${styleMap[toast.type]}
          `}
        >
          <span
            className={`
              flex items-center justify-center w-5 h-5 rounded-full
              text-xs font-bold text-white ${iconBgMap[toast.type]}
            `}
          >
            {iconMap[toast.type]}
          </span>
          <span className="text-sm font-medium flex-1">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-current opacity-50 hover:opacity-100 transition-opacity"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M3 3l8 8M11 3l-8 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}
