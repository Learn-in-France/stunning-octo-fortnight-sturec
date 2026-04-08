'use client'

import { AuthGuard } from '@/lib/guards/auth-guard'
import { RoleGuard } from '@/lib/guards/role-guard'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'

export default function InternalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <RoleGuard allowed={['admin', 'counsellor']}>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="internal-app-shell ml-[260px] flex-1 min-w-0">
            <Topbar />
            <main className="p-6 min-w-0 overflow-x-hidden">
              {children}
            </main>
          </div>
        </div>
      </RoleGuard>
    </AuthGuard>
  )
}
