'use client'

import { useState, useEffect } from 'react'
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
        const res = await fetch(`${env.apiUrl}/api/v1/public/universities?limit=100`)
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setUniversities(data.items ?? [])
      } catch {
        // API unavailable — leave empty
      } finally {
        setLoading(false)
      }
    }
    fetchUniversities()
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      <div className="mb-12">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
          Universities in France
        </h1>
        <p className="mt-4 text-lg text-text-muted max-w-2xl">
          France has over 3,500 higher education institutions. Here are the
          universities and Grandes Ecoles we partner with.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-text-muted mt-3">Loading universities...</p>
        </div>
      ) : universities.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-text-muted">No universities listed yet. Check back soon.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {universities.map((uni) => (
            <div
              key={uni.id}
              className="bg-surface-raised rounded-xl border border-border p-6 hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-shadow"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <h2 className="font-display text-lg font-semibold text-text-primary">
                  {uni.name}
                </h2>
                {uni.partnerStatus && (
                  <span className="px-2.5 py-0.5 text-xs font-semibold text-primary-700 bg-primary-50 rounded-full ring-1 ring-inset ring-primary-200 whitespace-nowrap">
                    {uni.partnerStatus}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-text-muted mt-3">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  {uni.city}, {uni.country}
                </span>
                {uni.websiteUrl && (
                  <a
                    href={uni.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline"
                  >
                    Website
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-16 text-center">
        <p className="text-text-muted mb-4">
          Looking for a specific university or program?
        </p>
        <Link
          href="/programs"
          className="inline-block px-6 py-3 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors shadow-sm"
        >
          Search programs
        </Link>
      </div>
    </div>
  )
}
