'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { BrandLogo } from '@/components/branding/brand-logo'
import { useAuth } from '@/providers/auth-provider'

interface NavItem {
  label: string
  href: string
  icon: ReactNode
  roles?: ('admin' | 'counsellor')[]
  badge?: string
}

const NAV_SECTIONS: { label?: string; items: NavItem[] }[] = [
  {
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="1" y="1" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <rect x="10" y="1" width="7" height="4" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <rect x="1" y="10" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <rect x="10" y="7" width="7" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        ),
      },
    ],
  },
  {
    label: 'Pipeline',
    items: [
      {
        label: 'Leads',
        href: '/leads',
        roles: ['admin'],
        icon: (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 1.5L16.5 5.25V12.75L9 16.5L1.5 12.75V5.25L9 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M9 9V16.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M1.5 5.25L9 9L16.5 5.25" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        ),
      },
      {
        label: 'Students',
        href: '/students',
        icon: (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="5.5" r="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M2 15.5C2 12.186 4.686 9.5 8 9.5H10C13.314 9.5 16 12.186 16 15.5V16.5H2V15.5Z" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        ),
      },
      {
        label: 'Applications',
        href: '/applications',
        roles: ['admin'],
        icon: (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="2" y="1.5" width="14" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M5.5 6H12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M5.5 9H12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M5.5 12H9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        label: 'Bookings',
        href: '/bookings',
        icon: (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="1.5" y="3" width="15" height="13.5" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M1.5 7.5H16.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M5.25 1.5V4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M12.75 1.5V4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ),
      },
    ],
  },
  {
    label: 'Insights',
    items: [
      {
        label: 'Analytics',
        href: '/analytics',
        roles: ['admin'],
        icon: (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 14.5L6.5 10L9.5 13L16 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12.5 6.5H16V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
      },
    ],
  },
  {
    label: 'Manage',
    items: [
      {
        label: 'Catalog',
        href: '/catalog',
        roles: ['admin'],
        icon: (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 3.5H6.5L9 5.5H16V14.5H2V3.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        ),
      },
      {
        label: 'Team',
        href: '/team',
        icon: (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="6.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="12.5" cy="6.5" r="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M1 15C1 12.239 3.239 10 6 10H7C9.761 10 12 12.239 12 15V16H1V15Z" stroke="currentColor" strokeWidth="1.5" />
            <path d="M13 10.5C14.657 10.5 16 12.067 16 14V16H13" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        ),
        roles: ['admin'],
      },
      {
        label: 'Automations',
        href: '/automations',
        icon: (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M3 3h12v3H3V3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M9 6v3m0 0l-4 3m4-3l4 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="2" y="12" width="5" height="3" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <rect x="11" y="12" width="5" height="3" rx="1" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        ),
        roles: ['admin'],
      },
      {
        label: 'Settings',
        href: '/settings',
        icon: (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M9 1.5V3.5M9 14.5V16.5M1.5 9H3.5M14.5 9H16.5M3.4 3.4L4.8 4.8M13.2 13.2L14.6 14.6M3.4 14.6L4.8 13.2M13.2 4.8L14.6 3.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ),
        roles: ['admin'],
      },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const userRole = user?.role as 'admin' | 'counsellor' | undefined

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <aside className="fixed top-0 left-0 bottom-0 z-30 flex w-[260px] flex-col bg-sidebar shadow-[16px_0_48px_rgba(10,22,41,0.22)]">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <BrandLogo href="/dashboard" variant="compact" inverse />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {NAV_SECTIONS.map((section, sIdx) => (
          <div key={sIdx}>
            {section.label && (
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-text/50">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items
                .filter((item) => !item.roles || (userRole && item.roles.includes(userRole)))
                .map((item) => {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                    className={`
                        group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium
                        transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-accent
                        ${
                          active
                            ? 'bg-[linear-gradient(135deg,rgba(23,48,80,1),rgba(26,58,122,0.4))] text-sidebar-text-active shadow-[0_16px_30px_rgba(0,0,0,0.18)]'
                            : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active'
                        }
                      `}
                    >
                      <span
                        className={`shrink-0 transition-colors ${
                          active ? 'text-sidebar-accent' : 'text-sidebar-text group-hover:text-sidebar-text-active'
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto text-[10px] font-mono font-semibold bg-sidebar-accent/20 text-sidebar-accent px-1.5 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-accent" />}
                    </Link>
                  )
                })}
            </div>
          </div>
        ))}
      </nav>

      {/* User card */}
      {user && (
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 rounded-2xl bg-white/4 p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-hover text-xs font-semibold text-sidebar-text-active">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-text-active truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-[11px] text-sidebar-text truncate capitalize">
                {user.role}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
