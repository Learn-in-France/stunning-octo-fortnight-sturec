'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import { env } from '@/lib/config/env'

interface University {
  id: string
  name: string
  city: string
  country: string
  websiteUrl: string | null
  partnerStatus: string | null
  active: boolean
}

export default function UniversitiesPage() {
  const [universities, setUniversities] = useState<University[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUniversities() {
      try {
        const response = await fetch(`${env.apiUrl}/api/v1/public/universities?limit=100`)
        if (!response.ok) throw new Error('Failed to fetch universities')
        const data = await response.json()
        setUniversities(data.items ?? [])
      } catch {
        setUniversities([])
      } finally {
        setLoading(false)
      }
    }

    fetchUniversities()
  }, [])

  return (
    <div className="public-shell py-10 sm:py-16">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div>
          <span className="public-label">Universities</span>
          <h1 className="mt-6 text-5xl font-semibold leading-[0.96] tracking-[-0.04em] text-[var(--color-public-navy)] sm:text-6xl">
            Institutions students actually ask about.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[color:var(--color-public-slate)]">
            France offers a wide spread of public universities, specialized schools, and private
            institutions. Browse the universities and schools we actively support.
          </p>
        </div>
        <div className="public-panel p-6">
          <p className="text-sm leading-7 text-[color:var(--color-public-slate)]">
            Use this page to explore names and locations. Use the programs catalog when you need a
            real degree shortlist. Use registration when you want advice tailored to your profile.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-[var(--color-public-blue)] border-t-transparent" />
          <p className="mt-4 text-sm text-[color:var(--color-public-muted)]">Loading universities...</p>
        </div>
      ) : universities.length === 0 ? (
        <div className="py-20 text-center text-[color:var(--color-public-muted)]">
          No universities are visible yet.
        </div>
      ) : (
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {universities.map((university) => (
            <div key={university.id} className="public-panel p-6">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--color-public-navy)]">
                  {university.name}
                </h2>
                {university.partnerStatus && (
                  <span className="rounded-full bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-public-red">
                    {university.partnerStatus}
                  </span>
                )}
              </div>
              <p className="mt-4 text-sm leading-7 text-[color:var(--color-public-slate)]">
                {university.city}, {university.country}
              </p>
              <div className="mt-6 flex items-center justify-end gap-4">
                {university.websiteUrl ? (
                  <a
                    href={university.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-[var(--color-public-blue)]"
                  >
                    Visit website
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-14">
        <div className="public-panel p-8 text-center">
          <p className="text-base leading-8 text-[color:var(--color-public-slate)]">
            Need help translating institutions into a shortlist?
          </p>
          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/auth/register" className="public-button-primary">
              Talk to AI advisor
            </Link>
            <Link href="/your-journey" className="public-button-secondary">
              See the journey
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
