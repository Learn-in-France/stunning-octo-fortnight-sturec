'use client'

/**
 * Experiment funnel — live stage counts per acquisition source.
 * pool → engaged → gate-passed → applied → enrolled (+ disqualified).
 * Cost column intentionally absent until QBR (lead_sources.cost_eur unfilled).
 */

import { PageHeader } from '@/components/layout/page-header'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { useFunnel, type FunnelRow } from '@/features/intelligence/hooks'

function pct(part: number, whole: number): string {
  if (!whole) return '—'
  return `${((part / whole) * 100).toFixed(1)}%`
}

function Row({ row, isTotal }: { row: FunnelRow; isTotal?: boolean }) {
  return (
    <tr className={isTotal ? 'border-t-2 bg-gray-50 font-semibold' : 'border-b last:border-0 hover:bg-gray-50'}>
      <td className="max-w-[280px] truncate px-3 py-2" title={row.source}>{row.source}</td>
      <td className="px-3 py-2 text-right">{row.pool.toLocaleString()}</td>
      <td className="px-3 py-2 text-right">
        {row.engaged.toLocaleString()}
        <span className="ml-1 text-xs text-gray-400">{pct(row.engaged, row.pool)}</span>
      </td>
      <td className="px-3 py-2 text-right">{row.gatePassed.toLocaleString()}</td>
      <td className="px-3 py-2 text-right">{row.applied.toLocaleString()}</td>
      <td className="px-3 py-2 text-right">{row.enrolled.toLocaleString()}</td>
      <td className="px-3 py-2 text-right text-gray-500">{row.disqualified.toLocaleString()}</td>
    </tr>
  )
}

export default function FunnelPage() {
  const { data, isLoading } = useFunnel()

  return (
    <div>
      <PageHeader
        title="Experiment Funnel"
        description="Live stage counts per lead source — the case-study generator"
      />

      {isLoading ? (
        <LoadingSpinner />
      ) : !data || data.sources.length === 0 ? (
        <EmptyState title="No data yet" description="Funnel populates as events and outcomes land." />
      ) : (
        <>
          {/* Hero counters */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { label: 'Pool', value: data.totals.pool },
              { label: 'Engaged', value: data.totals.engaged },
              { label: 'Gate-passed', value: data.totals.gatePassed },
              { label: 'Applied', value: data.totals.applied },
              { label: 'Enrolled', value: data.totals.enrolled },
            ].map((c) => (
              <div key={c.label} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="text-xs uppercase text-gray-500">{c.label}</div>
                <div className="text-2xl font-bold">{c.value.toLocaleString()}</div>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2 text-right">Pool</th>
                  <th className="px-3 py-2 text-right">Engaged</th>
                  <th className="px-3 py-2 text-right">Gate-passed</th>
                  <th className="px-3 py-2 text-right">Applied</th>
                  <th className="px-3 py-2 text-right">Enrolled</th>
                  <th className="px-3 py-2 text-right">DQ / NI</th>
                </tr>
              </thead>
              <tbody>
                {data.sources.map((row) => (
                  <Row key={row.source} row={row} />
                ))}
                <Row row={data.totals} isTotal />
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
