'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { env } from '@/lib/config/env'

interface Program {
  id: string
  universityName: string
  name: string
  degreeLevel: string
  fieldOfStudy: string
  language: string
  durationMonths: number
  tuitionAmount: number
  tuitionCurrency: string
  description: string | null
}

interface UniversityInfo {
  city: string
}

function formatTuition(amount: number): string {
  if (amount < 1000) return `€${amount}/yr`
  return `€${(amount / 1000).toFixed(1).replace(/\.0$/, '')}k/yr`
}

function formatDuration(months: number): string {
  if (months % 12 === 0) {
    const years = months / 12
    return `${years} year${years > 1 ? 's' : ''}`
  }
  return `${months} months`
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<(Program & { city?: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [degreeFilter, setDegreeFilter] = useState('All')
  const [cityFilter, setCityFilter] = useState('All')
  const [fieldFilter, setFieldFilter] = useState('All')

  useEffect(() => {
    async function fetchPrograms() {
      try {
        const res = await fetch(`${env.apiUrl}/api/v1/public/programs?limit=100`)
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        // Also fetch universities to get cities
        const uniRes = await fetch(`${env.apiUrl}/api/v1/public/universities?limit=100`)
        const uniData = uniRes.ok ? await uniRes.json() : { items: [] }
        const uniMap = new Map<string, UniversityInfo>()
        for (const u of uniData.items ?? []) {
          uniMap.set(u.name, { city: u.city })
        }
        const enriched = (data.items ?? []).map((p: Program) => ({
          ...p,
          city: uniMap.get(p.universityName)?.city ?? '',
        }))
        setPrograms(enriched)
      } catch {
        // API unavailable — leave empty
      } finally {
        setLoading(false)
      }
    }
    fetchPrograms()
  }, [])

  const cities = useMemo(() => {
    const set = new Set(programs.map((p) => p.city).filter(Boolean))
    return ['All', ...Array.from(set).sort()]
  }, [programs])

  const fields = useMemo(() => {
    const set = new Set(programs.map((p) => p.fieldOfStudy).filter(Boolean))
    return ['All', ...Array.from(set).sort()]
  }, [programs])

  const degreeLevels = useMemo(() => {
    const set = new Set(programs.map((p) => p.degreeLevel).filter(Boolean))
    return ['All', ...Array.from(set).sort()]
  }, [programs])

  const filtered = useMemo(() => {
    return programs.filter((p) => {
      const matchesSearch =
        search === '' ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.universityName.toLowerCase().includes(search.toLowerCase()) ||
        p.fieldOfStudy.toLowerCase().includes(search.toLowerCase())

      const matchesDegree = degreeFilter === 'All' || p.degreeLevel === degreeFilter
      const matchesCity = cityFilter === 'All' || p.city === cityFilter
      const matchesField = fieldFilter === 'All' || p.fieldOfStudy === fieldFilter

      return matchesSearch && matchesDegree && matchesCity && matchesField
    })
  }, [programs, search, degreeFilter, cityFilter, fieldFilter])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
          Explore programs in France
        </h1>
        <p className="mt-3 text-lg text-text-muted max-w-2xl">
          Browse programs across top French universities. Filter by degree level, city, or field
          of study to find your ideal match.
        </p>
      </div>

      {/* Search and filters */}
      <div className="bg-surface-raised rounded-2xl border border-border p-4 sm:p-6 mb-8">
        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search programs, universities, or fields..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-surface border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
            />
          </div>

          {/* Filter row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Degree Level</label>
              <select
                value={degreeFilter}
                onChange={(e) => setDegreeFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
              >
                {degreeLevels.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-text-secondary mb-1.5">City</label>
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
              >
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Field of Study</label>
              <select
                value={fieldFilter}
                onChange={(e) => setFieldFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
              >
                {fields.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-text-muted mt-3">Loading programs...</p>
        </div>
      ) : programs.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-text-muted">No programs available yet. Check back soon.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-text-muted mb-6">
            {filtered.length} {filtered.length === 1 ? 'program' : 'programs'} found
          </p>

          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-text-muted">No programs match your filters. Try broadening your search.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {filtered.map((program) => (
                <div
                  key={program.id}
                  className="bg-surface-raised rounded-2xl border border-border p-6 hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <p className="text-xs font-semibold text-primary-600 uppercase tracking-wide">
                        {program.universityName}
                      </p>
                      <h3 className="mt-1 font-display text-lg font-semibold text-text-primary">
                        {program.name}
                      </h3>
                    </div>
                    <Badge variant="primary">{program.degreeLevel}</Badge>
                  </div>

                  {program.description && (
                    <p className="text-sm text-text-muted leading-relaxed mb-4">
                      {program.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3 text-xs text-text-secondary">
                    {program.city && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                        {program.city}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatDuration(program.durationMonths)}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364V3" />
                      </svg>
                      {program.language}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-text-primary">
                      {formatTuition(program.tuitionAmount)}
                    </span>
                  </div>

                  <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-text-muted">{program.fieldOfStudy}</span>
                    <Link
                      href="/apply"
                      className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                    >
                      Learn more &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* CTA */}
      <div className="mt-16 text-center">
        <p className="text-text-muted mb-4">
          Not sure which program is right for you?
        </p>
        <Link
          href="/chat"
          className="inline-block px-6 py-3 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors shadow-sm"
        >
          Get personalized recommendations
        </Link>
      </div>
    </div>
  )
}
