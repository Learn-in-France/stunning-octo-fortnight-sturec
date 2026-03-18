'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const CATALOG_TABS = [
  { href: '/catalog/universities', label: 'Universities' },
  { href: '/catalog/programs', label: 'Programs' },
  { href: '/catalog/intakes', label: 'Intakes' },
  { href: '/catalog/visa-requirements', label: 'Visa Requirements' },
  { href: '/catalog/eligibility-rules', label: 'Eligibility Rules' },
  { href: '/catalog/campus-france-prep', label: 'Campus France Prep' },
]

export function CatalogNav() {
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-1 border-b border-border mb-6 overflow-x-auto">
      {CATALOG_TABS.map((tab) => {
        const active = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`
              px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
              ${active
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-text-muted hover:text-text-secondary hover:border-border'}
            `}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
