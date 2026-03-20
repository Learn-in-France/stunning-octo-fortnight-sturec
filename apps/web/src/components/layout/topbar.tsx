'use client'

import { useRouter } from 'next/navigation'

import { useAuth } from '@/providers/auth-provider'
import { DropdownMenu } from '@/components/ui/dropdown-menu'

export function Topbar() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/45 bg-[rgba(255,250,243,0.78)] px-6 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        {/* Breadcrumb slot — pages inject via PageHeader */}
        <span className="hidden rounded-full bg-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-700 lg:inline-flex">
          Learn in France workspace
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* User menu */}
        {user && (
          <DropdownMenu
            trigger={
              <div className="flex cursor-pointer items-center gap-2.5 rounded-full bg-white/78 py-1.5 pl-3 pr-2 transition-colors hover:bg-white">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </div>
                <span className="text-sm font-medium text-text-primary max-w-[120px] truncate">
                  {user.firstName}
                </span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-text-muted">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            }
            items={[
              {
                label: 'Settings',
                onClick: () => router.push('/settings'),
                icon: (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M7 1V2.5M7 11.5V13M1 7H2.5M11.5 7H13M2.6 2.6L3.7 3.7M10.3 10.3L11.4 11.4M2.6 11.4L3.7 10.3M10.3 3.7L11.4 2.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                ),
              },
              {
                label: 'Sign out',
                variant: 'danger',
                onClick: async () => {
                  await signOut()
                  router.push('/auth/login')
                },
                icon: (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M5 1.5H3C2.172 1.5 1.5 2.172 1.5 3V11C1.5 11.828 2.172 12.5 3 12.5H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    <path d="M9.5 9.5L12.5 7L9.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M5 7H12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                ),
              },
            ]}
          />
        )}
      </div>
    </header>
  )
}
