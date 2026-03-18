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
          <div className="flex-1 ml-[260px]">
            <Topbar />
            <main className="p-6">
              {children}
            </main>
          </div>
        </div>
      </RoleGuard>
    </AuthGuard>
  )
}
