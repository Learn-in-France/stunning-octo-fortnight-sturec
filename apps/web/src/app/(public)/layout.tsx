'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

import { BrandLogo } from '@/components/branding/brand-logo'

const navLinks = [
  { href: '/study-in-france', label: 'Study in France' },
  { href: '/programs', label: 'Programs' },
  { href: '/universities', label: 'Universities' },
  { href: '/about', label: 'About' },
]

function Logo() {
  return <BrandLogo href="/" variant="inline" markClassName="h-11 w-11 shrink-0" />
}

function MobileMenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      className="w-6 h-6 text-text-primary"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      {open ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
      )}
    </svg>
  )
}

function Header() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-surface-raised/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Logo />

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-primary-700 bg-primary-50'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-sunken'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/auth/login"
              className="px-3.5 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/apply"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-surface-sunken transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <MobileMenuIcon open={mobileOpen} />
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-border mt-2 pt-4">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-primary-700 bg-primary-50'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-sunken'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </nav>
            <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border">
              <Link
                href="/auth/login"
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary text-center rounded-lg hover:bg-surface-sunken transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/apply"
                onClick={() => setMobileOpen(false)}
                className="px-4 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm text-center"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

const footerSections = [
  {
    title: 'Study in France',
    links: [
      { href: '/programs', label: 'Programs' },
      { href: '/universities', label: 'Universities' },
      { href: '/study-in-france', label: 'Why France?' },
      { href: '/campus-france', label: 'Campus France' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { href: '/visa', label: 'Visa Guide' },
      { href: '/accommodation', label: 'Accommodation' },
      { href: '/book', label: 'Book a Consultation' },
      { href: '/chat', label: 'AI Advisor' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About Us' },
      { href: '/contact', label: 'Contact' },
    ],
  },
]

function Footer() {
  return (
    <footer className="bg-surface-raised border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <BrandLogo href="/" variant="inline" showTagline markClassName="h-11 w-11 shrink-0" />
            <p className="mt-4 text-sm text-text-muted leading-relaxed">
              AI-powered guidance for students pursuing higher education in France.
            </p>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="font-display font-semibold text-sm text-text-primary mb-4">
                {section.title}
              </h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-text-muted hover:text-text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-muted">
            &copy; {new Date().getFullYear()} Learn in France. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/contact" className="text-xs text-text-muted hover:text-text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link href="/contact" className="text-xs text-text-muted hover:text-text-primary transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
