import type { LeadStatus } from '@sturec/shared'

const statusConfig: Record<string, { label: string; color: string }> = {
  new: { label: 'New', color: 'bg-status-new/10 text-status-new' },
  nurturing: { label: 'Nurturing', color: 'bg-status-nurturing/10 text-status-nurturing' },
  qualified: { label: 'Qualified', color: 'bg-status-qualified/10 text-status-qualified' },
  disqualified: { label: 'Disqualified', color: 'bg-status-disqualified/10 text-status-disqualified' },
  converted: { label: 'Converted', color: 'bg-status-converted/10 text-status-converted' },
}

export function StatusBadge({ status }: { status: LeadStatus }) {
  const c = statusConfig[status] ?? { label: status, color: 'bg-gray-100 text-gray-500' }

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${c.color}`}>
      {c.label}
    </span>
  )
}
