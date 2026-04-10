'use client'

import { AuthGuard } from '@/lib/guards/auth-guard'
import { RoleGuard } from '@/lib/guards/role-guard'
import { Sidebar } from '@/components/layout/sidebar'
import { SidebarProvider, useSidebar } from '@/components/layout/sidebar-context'
import { Topbar } from '@/components/layout/topbar'

function InternalShell({ children }: { children: React.ReactNode }) {
  const { width } = useSidebar()
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div
        className="internal-app-shell flex-1 min-w-0 transition-[margin] duration-200"
        style={{ marginLeft: width }}
      >
        <Topbar />
        <main className="p-6 min-w-0 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function InternalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <RoleGuard allowed={['admin', 'counsellor']}>
        <SidebarProvider>
          <InternalShell>{children}</InternalShell>
        </SidebarProvider>
      </RoleGuard>
    </AuthGuard>
  )
}
