'use client'

import { useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

import { BrandLogo } from '@/components/branding/brand-logo'

export const publicNavLinks = [
  { href: '/why-france', label: 'Why France' },
  { href: '/your-journey', label: 'Your Journey' },
  { href: '/advisor', label: 'AI Advisor' },
]

function MobileMenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      className="h-5 w-5 text-public-navy"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      {open ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
      )}
    </svg>
  )
}

function Header() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-white/40 bg-public-cream/74 backdrop-blur-xl">
      <div className="public-shell">
        <div className="flex min-h-[84px] items-center justify-between gap-6 py-4">
          <BrandLogo
            href="/"
            variant="inline"
            markClassName="h-14 w-auto shrink-0"
            textClassName="tracking-tight"
          />

          <nav className="hidden items-center gap-1 lg:flex">
            {publicNavLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-public-red font-bold border-b-2 border-public-red'
                      : 'text-public-slate hover:text-public-navy'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link
              href="/auth/login"
              className="rounded-full px-4 py-2 text-sm font-semibold text-public-navy transition-colors hover:bg-white/70"
            >
              Sign in
            </Link>
            <Link href="/auth/register" className="public-button-primary">
              Talk to AI advisor
            </Link>
          </div>

          <button
            type="button"
            className="rounded-full bg-white/80 p-3 shadow-card lg:hidden"
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((value) => !value)}
          >
            <MobileMenuIcon open={mobileOpen} />
          </button>
        </div>

        {mobileOpen && (
          <div className="public-panel mb-6 p-4 lg:hidden">
            <nav className="flex flex-col gap-2">
              {publicNavLinks.map((link) => {
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-public-navy text-white'
                        : 'bg-white/70 text-public-slate'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </nav>
            <div className="mt-4 grid gap-2">
              <Link
                href="/auth/login"
                onClick={() => setMobileOpen(false)}
                className="public-button-secondary text-center"
              >
                Sign in
              </Link>
              <Link
                href="/auth/register"
                onClick={() => setMobileOpen(false)}
                className="public-button-primary text-center"
              >
                Talk to AI advisor
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

function Footer() {
  const footerGroups = [
    {
      title: 'Explore',
      links: [
        { href: '/why-france', label: 'Why France' },
        { href: '/your-journey', label: 'Your Journey' },
        { href: '/advisor', label: 'AI Advisor' },
      ],
    },
    {
      title: 'Get started',
      links: [
        { href: '/auth/register', label: 'Talk to AI advisor' },
        { href: '/auth/login', label: 'Sign in' },
      ],
    },
  ]

  return (
    <footer className="mt-auto overflow-hidden bg-public-navy text-white">
      <div className="public-shell py-16">
        <div className="grid gap-12 lg:grid-cols-[1.6fr_repeat(2,1fr)]">
          <div>
            <BrandLogo
              href="/"
              variant="inline"
              inverse
              markClassName="h-16 w-auto shrink-0"
              subtitleClassName="text-white/55"
              showTagline
            />
            <p className="mt-6 max-w-md text-sm leading-7 text-white/72">
              A specialist agency with a team on the ground in France. We help international
              students find the right program, manage applications and visa, and settle in
              after arrival.
            </p>
            <div className="mt-8 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
              <span className="rounded-full bg-white/8 px-3 py-2">France specialist</span>
              <span className="rounded-full bg-white/8 px-3 py-2">Team in France</span>
              <span className="rounded-full bg-white/8 px-3 py-2">Full journey support</span>
            </div>
          </div>

          {footerGroups.map((group) => (
            <div key={group.title}>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/45">
                {group.title}
              </p>
              <ul className="mt-5 space-y-3">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/74 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/12 pt-6 text-xs text-white/52 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Learn in <span className="text-public-red">France</span>. Built for real student journeys.</p>
          <div className="flex items-center gap-5">
            <Link href="mailto:hello@learninfrance.com" className="transition-colors hover:text-white">
              Contact
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-white">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export function PublicSiteChrome({ children }: { children: ReactNode }) {
  return (
    <div className="public-page min-h-screen">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  )
}
