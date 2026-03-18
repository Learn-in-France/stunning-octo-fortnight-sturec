'use client'

import { QueryProvider } from './query-provider'
import { AuthProvider } from './auth-provider'
import { ToastProvider } from './toast-provider'
import { ToastContainer } from '@/components/ui/toast'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <ToastProvider>
          {children}
          <ToastContainer />
        </ToastProvider>
      </AuthProvider>
    </QueryProvider>
  )
}
