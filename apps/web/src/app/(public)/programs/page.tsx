'use client'

import { useEffect, useMemo, useState } from 'react'
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
  if (amount < 1000) return `EUR ${amount}/yr`
  return `EUR ${(amount / 1000).toFixed(1).replace(/\\.0$/, '')}k/yr`
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
        const response = await fetch(`${env.apiUrl}/api/v1/public/programs?limit=100`)
        if (!response.ok) throw new Error('Failed to fetch programs')
        const data = await response.json()

        const universityResponse = await fetch(`${env.apiUrl}/api/v1/public/universities?limit=100`)
        const universityData = universityResponse.ok ? await universityResponse.json() : { items: [] }

        const universityMap = new Map<string, UniversityInfo>()
        for (const university of universityData.items ?? []) {
          universityMap.set(university.name, { city: university.city })
        }

        const enrichedPrograms = (data.items ?? []).map((program: Program) => ({
          ...program,
          city: universityMap.get(program.universityName)?.city ?? '',
        }))

        setPrograms(enrichedPrograms)
      } catch {
        setPrograms([])
      } finally {
        setLoading(false)
      }
    }

    fetchPrograms()
  }, [])

  const cities = useMemo(() => {
    const values = new Set(programs.map((program) => program.city).filter(Boolean))
    return ['All', ...Array.from(values).sort()]
  }, [programs])

  const fields = useMemo(() => {
    const values = new Set(programs.map((program) => program.fieldOfStudy).filter(Boolean))
    return ['All', ...Array.from(values).sort()]
  }, [programs])

  const degreeLevels = useMemo(() => {
    const values = new Set(programs.map((program) => program.degreeLevel).filter(Boolean))
    return ['All', ...Array.from(values).sort()]
  }, [programs])

  const filteredPrograms = useMemo(() => {
    return programs.filter((program) => {
      const matchesSearch =
        search === '' ||
        program.name.toLowerCase().includes(search.toLowerCase()) ||
        program.universityName.toLowerCase().includes(search.toLowerCase()) ||
        program.fieldOfStudy.toLowerCase().includes(search.toLowerCase())

      return (
        matchesSearch &&
        (degreeFilter === 'All' || program.degreeLevel === degreeFilter) &&
        (cityFilter === 'All' || program.city === cityFilter) &&
        (fieldFilter === 'All' || program.fieldOfStudy === fieldFilter)
      )
    })
  }, [cityFilter, degreeFilter, fieldFilter, programs, search])

  return (
    <div className="public-shell py-10 sm:py-16">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_360px] lg:items-start">
        <div>
          <span className="public-label">Programs</span>
          <h1 className="mt-6 text-5xl font-semibold leading-[0.96] tracking-[-0.04em] text-[var(--color-public-navy)] sm:text-6xl">
            Find the right program in France.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[color:var(--color-public-slate)]">
            Explore programs across universities and schools in France. Use the filters to
            narrow your shortlist, then create an account when you are ready for personal guidance.
          </p>
        </div>
        <div className="public-panel p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-public-burgundy)]">
            Use the catalog well
          </p>
          <div className="mt-4 space-y-3 text-sm leading-7 text-[color:var(--color-public-slate)]">
            <p>Filter by degree, city, and field before evaluating cost and duration.</p>
            <p>Use the AI advisor when you need help translating interest into a realistic shortlist.</p>
            <p>Create an account when you are ready to save your progress and get personal guidance.</p>
          </div>
        </div>
      </div>

      <div className="public-panel mt-10 p-5 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-public-muted)]">
              Search
            </label>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Programs, universities, or fields"
              className="w-full rounded-2xl bg-white px-4 py-3 text-sm text-[var(--color-public-navy)] outline-none ring-0"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-public-muted)]">
              Degree
            </label>
            <select
              value={degreeFilter}
              onChange={(event) => setDegreeFilter(event.target.value)}
              className="w-full rounded-2xl bg-white px-4 py-3 text-sm text-[var(--color-public-navy)] outline-none"
            >
              {degreeLevels.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-public-muted)]">
              City
            </label>
            <select
              value={cityFilter}
              onChange={(event) => setCityFilter(event.target.value)}
              className="w-full rounded-2xl bg-white px-4 py-3 text-sm text-[var(--color-public-navy)] outline-none"
            >
              {cities.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-public-muted)]">
              Field
            </label>
            <select
              value={fieldFilter}
              onChange={(event) => setFieldFilter(event.target.value)}
              className="w-full rounded-2xl bg-white px-4 py-3 text-sm text-[var(--color-public-navy)] outline-none"
            >
              {fields.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-[var(--color-public-teal)] border-t-transparent" />
          <p className="mt-4 text-sm text-[color:var(--color-public-muted)]">Loading programs...</p>
        </div>
      ) : programs.length === 0 ? (
        <div className="py-20 text-center text-[color:var(--color-public-muted)]">
          No programs are visible yet.
        </div>
      ) : (
        <>
          <p className="mt-10 text-sm font-medium text-[color:var(--color-public-slate)]">
            {filteredPrograms.length} {filteredPrograms.length === 1 ? 'program' : 'programs'} found
          </p>

          {filteredPrograms.length === 0 ? (
            <div className="py-20 text-center text-[color:var(--color-public-muted)]">
              No programs match those filters.
            </div>
          ) : (
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              {filteredPrograms.map((program) => (
                <div key={program.id} className="public-panel p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-public-teal)]">
                        {program.universityName}
                      </p>
                      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[var(--color-public-navy)]">
                        {program.name}
                      </h2>
                    </div>
                    <Badge variant="primary">{program.degreeLevel}</Badge>
                  </div>

                  {program.description && (
                    <p className="mt-4 text-sm leading-7 text-[color:var(--color-public-slate)]">
                      {program.description}
                    </p>
                  )}

                  <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-[color:var(--color-public-slate)]">
                    {program.city && <span className="rounded-full bg-white px-3 py-2">{program.city}</span>}
                    <span className="rounded-full bg-white px-3 py-2">{formatDuration(program.durationMonths)}</span>
                    <span className="rounded-full bg-white px-3 py-2">{program.language}</span>
                    <span className="rounded-full bg-white px-3 py-2">{formatTuition(program.tuitionAmount)}</span>
                  </div>

                  <div className="mt-6 flex items-center justify-between gap-4">
                    <span className="text-sm text-[color:var(--color-public-muted)]">{program.fieldOfStudy}</span>
                    <Link href="/apply" className="text-sm font-semibold text-[var(--color-public-teal)]">
                      Get started
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div className="mt-14">
        <div className="public-panel p-8 text-center">
          <p className="text-base leading-8 text-[color:var(--color-public-slate)]">
            Not sure what belongs on your shortlist yet?
          </p>
          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/chat" className="public-button-primary">
              Ask the AI advisor
            </Link>
            <Link href="/auth/register" className="public-button-secondary">
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
