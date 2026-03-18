'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

interface Program {
  id: string
  university: string
  name: string
  degreeLevel: string
  field: string
  city: string
  tuitionEur: number
  language: string
  duration: string
  description: string
}

const programs: Program[] = [
  {
    id: 'sorbonne-llm',
    university: 'Sorbonne University',
    name: 'Master in Applied Linguistics',
    degreeLevel: 'Master',
    field: 'Humanities',
    city: 'Paris',
    tuitionEur: 243,
    language: 'French & English',
    duration: '2 years',
    description:
      'A research-driven program combining computational and applied linguistics with opportunities in NLP and language education.',
  },
  {
    id: 'sciencespo-ia',
    university: 'Sciences Po',
    name: 'Master in International Affairs',
    degreeLevel: 'Master',
    field: 'Political Science',
    city: 'Paris',
    tuitionEur: 14700,
    language: 'English',
    duration: '2 years',
    description:
      'Prepare for careers in diplomacy, international organizations, and global policy with a multidisciplinary curriculum.',
  },
  {
    id: 'essec-mba',
    university: 'ESSEC Business School',
    name: 'Global BBA',
    degreeLevel: 'Bachelor',
    field: 'Business',
    city: 'Paris',
    tuitionEur: 16200,
    language: 'English',
    duration: '4 years',
    description:
      'An international undergraduate business program with mandatory exchange semesters and professional internships.',
  },
  {
    id: 'hec-mim',
    university: 'HEC Paris',
    name: 'Master in Management',
    degreeLevel: 'Master',
    field: 'Business',
    city: 'Paris',
    tuitionEur: 20900,
    language: 'English',
    duration: '2 years',
    description:
      'Consistently ranked among the top global MiM programs. Combines academic rigor with extensive corporate partnerships.',
  },
  {
    id: 'psl-ds',
    university: 'Universite PSL',
    name: 'Master in Data Science',
    degreeLevel: 'Master',
    field: 'Computer Science',
    city: 'Paris',
    tuitionEur: 243,
    language: 'English',
    duration: '2 years',
    description:
      'A selective program at the crossroads of mathematics, computer science, and statistics, hosted across PSL member institutions.',
  },
  {
    id: 'insa-lyon-eng',
    university: 'INSA Lyon',
    name: 'Engineering Diploma — Computer Science',
    degreeLevel: 'Bachelor + Master',
    field: 'Engineering',
    city: 'Lyon',
    tuitionEur: 601,
    language: 'French',
    duration: '5 years',
    description:
      'A prestigious five-year integrated engineering program covering fundamentals through to specialization in computer science.',
  },
  {
    id: 'toulouse-aero',
    university: 'ISAE-SUPAERO',
    name: 'Master in Aerospace Engineering',
    degreeLevel: 'Master',
    field: 'Engineering',
    city: 'Toulouse',
    tuitionEur: 4500,
    language: 'English',
    duration: '2 years',
    description:
      'Located in the heart of the European aerospace capital, this program offers unmatched industry exposure with Airbus, Thales, and CNES.',
  },
  {
    id: 'bordeaux-wine',
    university: 'Universite de Bordeaux',
    name: 'Master in Wine and Vine Sciences',
    degreeLevel: 'Master',
    field: 'Sciences',
    city: 'Bordeaux',
    tuitionEur: 243,
    language: 'French & English',
    duration: '2 years',
    description:
      'A unique interdisciplinary program combining biology, chemistry, and agronomy in the world capital of wine.',
  },
]

const degreeLevels = ['All', 'Bachelor', 'Master', 'Bachelor + Master']
const cities = ['All', 'Paris', 'Lyon', 'Toulouse', 'Bordeaux']
const fields = ['All', 'Business', 'Engineering', 'Computer Science', 'Humanities', 'Political Science', 'Sciences']

function formatTuition(amount: number): string {
  if (amount < 1000) return `${amount}/yr`
  return `${(amount / 1000).toFixed(1).replace(/\.0$/, '')}k/yr`
}

export default function ProgramsPage() {
  const [search, setSearch] = useState('')
  const [degreeFilter, setDegreeFilter] = useState('All')
  const [cityFilter, setCityFilter] = useState('All')
  const [fieldFilter, setFieldFilter] = useState('All')

  const filtered = useMemo(() => {
    return programs.filter((p) => {
      const matchesSearch =
        search === '' ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.university.toLowerCase().includes(search.toLowerCase()) ||
        p.field.toLowerCase().includes(search.toLowerCase())

      const matchesDegree = degreeFilter === 'All' || p.degreeLevel === degreeFilter
      const matchesCity = cityFilter === 'All' || p.city === cityFilter
      const matchesField = fieldFilter === 'All' || p.field === fieldFilter

      return matchesSearch && matchesDegree && matchesCity && matchesField
    })
  }, [search, degreeFilter, cityFilter, fieldFilter])

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

      {/* Results count */}
      <p className="text-sm text-text-muted mb-6">
        {filtered.length} {filtered.length === 1 ? 'program' : 'programs'} found
      </p>

      {/* Program cards */}
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
                    {program.university}
                  </p>
                  <h3 className="mt-1 font-display text-lg font-semibold text-text-primary">
                    {program.name}
                  </h3>
                </div>
                <Badge variant="primary">{program.degreeLevel}</Badge>
              </div>

              <p className="text-sm text-text-muted leading-relaxed mb-4">
                {program.description}
              </p>

              <div className="flex flex-wrap gap-3 text-xs text-text-secondary">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  {program.city}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {program.duration}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364V3" />
                  </svg>
                  {program.language}
                </span>
                <span className="flex items-center gap-1 font-semibold text-text-primary">
                  &euro;{formatTuition(program.tuitionEur)}
                </span>
              </div>

              <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                <span className="text-xs text-text-muted">{program.field}</span>
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
